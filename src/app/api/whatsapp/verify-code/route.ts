import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hashVerificationCode, normalizePredictionId, recordWhatsAppReady, toE164Brazil } from "@/lib/whatsapp";

export const runtime = "nodejs";

const MAX_ATTEMPTS = 5;

interface VerifyCodeBody {
  phone?: string;
  code?: string;
  message?: string;
  predictionId?: string;
}

interface VerificationRow {
  id: number;
  code_hash: string;
  attempts: number;
  expires_at: string;
  verified_at: string | null;
}

interface UserPredictionRow {
  id: string;
  theme: string;
  question: string;
  prediction_text: string;
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Não autenticado.", code: "AUTH_REQUIRED" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as VerifyCodeBody;
  const phone = toE164Brazil(body.phone ?? "");
  const code = (body.code ?? "").replace(/\D/g, "").slice(0, 6);
  const messageRaw = (body.message ?? "").trim();
  const predictionIdRaw = (body.predictionId ?? "").trim();

  if (!phone) {
    return NextResponse.json({ success: false, error: "Número inválido. Use DDD + número.", code: "INVALID_PHONE" }, { status: 400 });
  }

  if (code.length !== 6) {
    return NextResponse.json({ success: false, error: "O código tem 6 dígitos.", code: "INVALID_CODE" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("whatsapp_verifications")
    .select("id, code_hash, attempts, expires_at, verified_at")
    .eq("user_id", user.id)
    .eq("phone", phone)
    .is("verified_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ success: false, error: "Falha ao verificar o código.", code: "VERIFY_LOOKUP_FAILED" }, { status: 500 });
  }

  const row = data as VerificationRow | null;
  if (!row) {
    return NextResponse.json({ success: false, error: "Código expirado. Solicite outro.", code: "CODE_NOT_FOUND" }, { status: 400 });
  }

  if (new Date(row.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ success: false, error: "Código expirado. Solicite outro.", code: "CODE_EXPIRED" }, { status: 400 });
  }

  if (row.attempts >= MAX_ATTEMPTS) {
    return NextResponse.json({ success: false, error: "Muitas tentativas. Solicite um novo código.", code: "TOO_MANY_ATTEMPTS" }, { status: 429 });
  }

  const matches = row.code_hash === hashVerificationCode(code);
  if (!matches) {
    await admin.from("whatsapp_verifications").update({ attempts: row.attempts + 1 }).eq("id", row.id);
    return NextResponse.json({ success: false, error: "Código inválido.", code: "CODE_MISMATCH" }, { status: 400 });
  }

  await admin.from("whatsapp_verifications").update({ verified_at: new Date().toISOString() }).eq("id", row.id);

  return completeSend({
    userId: user.id,
    requestId,
    phone,
    messageRaw,
    predictionIdRaw,
    admin,
  });
}

async function completeSend({
  userId,
  requestId,
  phone,
  messageRaw,
  predictionIdRaw,
  admin,
}: {
  userId: string;
  requestId: string;
  phone: string;
  messageRaw: string;
  predictionIdRaw: string;
  admin: ReturnType<typeof createAdminClient>;
}) {
  const predictionId = predictionIdRaw ? normalizePredictionId(predictionIdRaw) : "";
  let sourcePrediction: UserPredictionRow | null = null;

  if (predictionIdRaw && !predictionId) {
    return NextResponse.json({ success: false, error: "predictionId inválido.", code: "INVALID_PREDICTION_ID" }, { status: 400 });
  }

  if (predictionId) {
    const { data, error } = await admin
      .from("user_predictions")
      .select("id, theme, question, prediction_text")
      .eq("id", predictionId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ success: false, error: "Falha ao carregar previsão.", code: "WHATSAPP_PREDICTION_LOOKUP_FAILED" }, { status: 500 });
    }

    sourcePrediction = (data as UserPredictionRow | null) ?? null;
    if (!sourcePrediction) {
      return NextResponse.json({ success: false, error: "Previsão não encontrada para envio.", code: "PREDICTION_NOT_FOUND" }, { status: 404 });
    }
  }

  const messageText = (messageRaw || sourcePrediction?.prediction_text || "").trim();
  if (!messageText) {
    return NextResponse.json({ success: false, error: "Mensagem vazia para WhatsApp.", code: "EMPTY_WHATSAPP_MESSAGE" }, { status: 400 });
  }

  const logError = await recordWhatsAppReady({
    userId,
    requestId,
    phone,
    messageText,
    predictionId: sourcePrediction?.id ?? null,
    theme: sourcePrediction?.theme ?? null,
    question: sourcePrediction?.question ?? null,
  });

  if (logError) {
    return NextResponse.json({ success: false, error: "Falha ao registrar o envio.", code: "WHATSAPP_AUDIT_LOG_FAILED" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    status: "ready",
    code: "WHATSAPP_READY",
    message: "Previsão enviada para o seu WhatsApp!",
  });
}
