import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { generateVerificationCode, hashVerificationCode, toE164Brazil } from "@/lib/whatsapp";

export const runtime = "nodejs";

const CODE_TTL_MS = 10 * 60 * 1000;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const sendAttempts = new Map<string, number[]>();

interface SendCodeBody {
  phone?: string;
}

function pruneAttempts(userId: string) {
  const now = Date.now();
  const current = (sendAttempts.get(userId) ?? []).filter((stamp) => now - stamp < RATE_LIMIT_WINDOW_MS);
  sendAttempts.set(userId, current);
  return current;
}

async function sendTwilioWhatsApp(phone: string, code: string) {
  const accountSid = (process.env.TWILIO_ACCOUNT_SID ?? "").trim();
  const authToken = (process.env.TWILIO_AUTH_TOKEN ?? "").trim();
  const from = (process.env.TWILIO_WHATSAPP_FROM ?? "").trim();

  if (!accountSid || !authToken || !from) {
    return { sent: false as const };
  }

  const body = new URLSearchParams({
    To: `whatsapp:${phone}`,
    From: from.startsWith("whatsapp:") ? from : `whatsapp:${from}`,
    Body: `Data Astral · seu código de verificação é ${code}. Expira em 10 minutos.`,
  });

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    return { sent: false as const, error: "Falha ao enviar o código pelo WhatsApp." };
  }

  return { sent: true as const };
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Não autenticado.", code: "AUTH_REQUIRED" }, { status: 401 });
  }

  const attempts = pruneAttempts(user.id);
  if (attempts.length >= RATE_LIMIT_MAX) {
    return NextResponse.json(
      { success: false, error: "Muitas tentativas. Aguarde alguns minutos.", code: "RATE_LIMITED" },
      { status: 429 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as SendCodeBody;
  const phone = toE164Brazil(body.phone ?? "");
  if (!phone) {
    return NextResponse.json({ success: false, error: "Número inválido. Use DDD + número.", code: "INVALID_PHONE" }, { status: 400 });
  }

  const code = generateVerificationCode();
  const codeHash = hashVerificationCode(code);
  const expiresAt = new Date(Date.now() + CODE_TTL_MS).toISOString();
  const admin = createAdminClient();

  const { error: cleanupError } = await admin
    .from("whatsapp_verifications")
    .delete()
    .eq("user_id", user.id)
    .eq("phone", phone)
    .is("verified_at", null);

  const tableMissing =
    cleanupError?.message?.toLowerCase().includes("whatsapp_verifications") ||
    cleanupError?.code === "42P01" ||
    cleanupError?.message?.toLowerCase().includes("does not exist");

  if (!tableMissing) {
    const { error: insertError } = await admin.from("whatsapp_verifications").insert({
      user_id: user.id,
      phone,
      code_hash: codeHash,
      expires_at: expiresAt,
    });

    if (insertError && !insertError.message?.toLowerCase().includes("does not exist")) {
      return NextResponse.json(
        { success: false, error: "Não foi possível gerar o código agora.", code: "VERIFY_STORE_FAILED" },
        { status: 500 },
      );
    }
  }

  sendAttempts.set(user.id, [...attempts, Date.now()]);
  const twilio = await sendTwilioWhatsApp(phone, code);

  if (twilio.error) {
    return NextResponse.json({ success: false, error: twilio.error, code: "TWILIO_SEND_FAILED" }, { status: 502 });
  }

  return NextResponse.json({
    success: true,
    delivery: twilio.sent ? "whatsapp" : "mock",
  });
}
