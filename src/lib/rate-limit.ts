import { NextResponse } from "next/server";

import { consumeMemoryRateLimit } from "@/lib/rate-limit-memory";
import { createAdminClient } from "@/lib/supabase/admin";

export const RATE_LIMITS = {
  predictPublic: { max: 12, windowMs: 10 * 60 * 1000 },
  predict: { max: 12, windowMs: 10 * 60 * 1000 },
  whatsappSendCode: { max: 5, windowMs: 10 * 60 * 1000 },
  creditsBuy: { max: 8, windowMs: 10 * 60 * 1000 },
  adminMutation: { max: 20, windowMs: 10 * 60 * 1000 },
} as const;

export { consumeMemoryRateLimit };

export async function consumeRateLimit(key: string, max: number, windowMs: number) {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("consume_rate_limit", {
      p_key: key,
      p_max: max,
      p_window_seconds: Math.ceil(windowMs / 1000),
    });

    if (!error && typeof data === "boolean") {
      return data;
    }
  } catch {
    // Sem service role ou RPC ainda não aplicada: cai no Map local.
  }

  return consumeMemoryRateLimit(key, max, windowMs);
}

export function rateLimitJson(code: "RATE_LIMIT_EXCEEDED" | "RATE_LIMITED", requestId?: string) {
  return NextResponse.json(
    {
      error: "Muitas tentativas em pouco tempo. Aguarde alguns minutos.",
      code,
      ...(requestId ? { requestId } : {}),
    },
    { status: 429 },
  );
}
