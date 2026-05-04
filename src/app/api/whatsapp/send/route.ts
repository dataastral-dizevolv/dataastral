import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

interface WhatsAppSendBody {
  predictionId?: string;
  phone?: string;
  text?: string;
}

interface UserPredictionRow {
  id: string;
  theme: string;
  question: string;
  prediction_text: string;
}

function normalizePredictionId(value: string) {
  const safe = value.trim().toLowerCase();
  if (/^[a-f0-9-]{8,64}$/.test(safe)) {
    return safe;
  }
  return "";
}

function normalizePhone(value: string) {
  return value.replace(/[^0-9]/g, "").slice(0, 20);
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as WhatsAppSendBody;
  const predictionIdRaw = body.predictionId?.trim() ?? "";
  const textRaw = body.text?.trim() ?? "";
  const phoneRaw = body.phone?.trim() ?? "";

  if (!predictionIdRaw && !textRaw) {
    return NextResponse.json(
      { error: "Informe predictionId ou text para montar o envio do WhatsApp.", code: "INVALID_WHATSAPP_INPUT" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado.", code: "AUTH_REQUIRED" }, { status: 401 });
  }

  const predictionId = predictionIdRaw ? normalizePredictionId(predictionIdRaw) : "";

  if (predictionIdRaw && !predictionId) {
    return NextResponse.json(
      { error: "predictionId inválido.", code: "INVALID_PREDICTION_ID" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  let sourcePrediction: UserPredictionRow | null = null;

  if (predictionId) {
    const { data, error } = await admin
      .from("user_predictions")
      .select("id, theme, question, prediction_text")
      .eq("id", predictionId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: "Falha ao carregar previsão para WhatsApp.", code: "WHATSAPP_PREDICTION_LOOKUP_FAILED" },
        { status: 500 },
      );
    }

    sourcePrediction = (data as UserPredictionRow | null) ?? null;

    if (!sourcePrediction) {
      return NextResponse.json(
        { error: "Previsão não encontrada para envio.", code: "PREDICTION_NOT_FOUND" },
        { status: 404 },
      );
    }
  }

  const messageText = (textRaw || sourcePrediction?.prediction_text || "").trim();
  if (!messageText) {
    return NextResponse.json(
      { error: "Mensagem vazia para WhatsApp.", code: "EMPTY_WHATSAPP_MESSAGE" },
      { status: 400 },
    );
  }

  const normalizedPhone = phoneRaw ? normalizePhone(phoneRaw) : null;

  const { error: logError } = await admin.from("engine_audit_logs").insert({
    user_id: user.id,
    theme: sourcePrediction?.theme ?? null,
    question: sourcePrediction?.question ?? null,
    success: true,
    engine_code: "WHATSAPP_READY",
    technical_details: {
      provider: "zapi_mock",
      status: "Pronta para envio",
      predictionId: sourcePrediction?.id ?? null,
      phone: normalizedPhone,
      messagePreview: messageText.slice(0, 280),
      messageLength: messageText.length,
    },
  });

  if (logError) {
    return NextResponse.json(
      { error: "Falha ao registrar preparação do WhatsApp.", code: "WHATSAPP_AUDIT_LOG_FAILED" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    status: "ready",
    code: "WHATSAPP_READY",
    provider: "zapi_mock",
    predictionId: sourcePrediction?.id ?? null,
    phone: normalizedPhone,
    message: "Mensagem pronta para envio",
  });
}
