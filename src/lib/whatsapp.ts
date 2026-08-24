import { createHash } from "crypto";

import { createAdminClient } from "@/lib/supabase/admin";

export interface WhatsAppReadyInput {
  userId: string;
  requestId: string;
  phone: string | null;
  messageText: string;
  predictionId?: string | null;
  theme?: string | null;
  question?: string | null;
}

export function hashVerificationCode(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

export function generateVerificationCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function digitsOnly(value: string) {
  return value.replace(/\D/g, "").slice(0, 20);
}

export function toE164Brazil(value: string) {
  const digits = digitsOnly(value);
  if (digits.length < 10) {
    return null;
  }

  const withCountry = digits.startsWith("55") ? digits : `55${digits}`;
  if (withCountry.length < 12 || withCountry.length > 15) {
    return null;
  }

  return `+${withCountry}`;
}

export function maskPhone(value: string | null) {
  if (!value) return null;
  const suffix = value.slice(-4);
  return suffix ? `***${suffix}` : "***";
}

export function normalizePredictionId(value: string) {
  const safe = value.trim().toLowerCase();
  if (/^[a-f0-9-]{8,64}$/.test(safe)) {
    return safe;
  }
  return "";
}

export async function recordWhatsAppReady(input: WhatsAppReadyInput) {
  const admin = createAdminClient();
  const { error } = await admin.from("engine_audit_logs").insert({
    user_id: input.userId,
    theme: input.theme ?? null,
    question: input.question ?? null,
    success: true,
    engine_code: "WHATSAPP_READY",
    technical_details: {
      provider: process.env.TWILIO_ACCOUNT_SID ? "twilio" : "zapi_mock",
      status: "Pronta para envio",
      requestId: input.requestId,
      predictionId: input.predictionId ?? null,
      hasPhone: Boolean(input.phone),
      phoneMasked: maskPhone(input.phone),
      messageLength: input.messageText.length,
    },
  });

  return error;
}
