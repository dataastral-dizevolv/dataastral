import { createAdminClient } from "@/lib/supabase/admin";

export const REFERRAL_COOKIE = "da_ref";
export const REFERRAL_POINTS_PER_SIGNUP = 1;

export type AttributeReferralReason =
  | "attributed"
  | "already_attributed"
  | "missing_referred"
  | "missing_code"
  | "invalid_code"
  | "self_referral"
  | "error";

export interface AttributeReferralResult {
  ok: boolean;
  reason: AttributeReferralReason;
  pointsAwarded: number;
}

function normalizeReferralCode(raw: string | null | undefined) {
  if (!raw) {
    return "";
  }

  return raw.trim().toUpperCase();
}

export function isValidReferralCodeFormat(code: string) {
  return /^[A-Z0-9]{6,12}$/.test(code);
}

export async function attributeReferralForUser(
  referredUserId: string,
  referralCode: string | null | undefined,
): Promise<AttributeReferralResult> {
  const code = normalizeReferralCode(referralCode);

  if (!code) {
    return { ok: false, reason: "missing_code", pointsAwarded: 0 };
  }

  if (!isValidReferralCodeFormat(code)) {
    return { ok: false, reason: "invalid_code", pointsAwarded: 0 };
  }

  let admin: ReturnType<typeof createAdminClient>;

  try {
    admin = createAdminClient();
  } catch {
    return { ok: false, reason: "error", pointsAwarded: 0 };
  }

  const { data, error } = await admin.rpc("attribute_referral", {
    p_referred_id: referredUserId,
    p_referral_code: code,
  });

  if (error) {
    return { ok: false, reason: "error", pointsAwarded: 0 };
  }

  const payload = (data ?? {}) as { ok?: boolean; reason?: string; points_awarded?: number };
  const reason = (payload.reason ?? "error") as AttributeReferralReason;

  return {
    ok: Boolean(payload.ok),
    reason,
    pointsAwarded: typeof payload.points_awarded === "number" ? payload.points_awarded : 0,
  };
}
