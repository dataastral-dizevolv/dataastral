import { NextResponse, type NextRequest } from "next/server";

import { requireAdminUser } from "@/lib/auth/admin";
import { RATE_LIMITS, consumeRateLimit, rateLimitJson } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminAddCreditsBodySchema } from "@/lib/validation/credits";
import { parseApiBody } from "@/lib/validation/parse-body";

export async function POST(request: NextRequest) {
  const { user, isAdmin } = await requireAdminUser();

  if (!isAdmin || !user) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  if (
    !(await consumeRateLimit(`admin-credits:user:${user.id}`, RATE_LIMITS.adminMutation.max, RATE_LIMITS.adminMutation.windowMs))
  ) {
    return rateLimitJson("RATE_LIMIT_EXCEEDED");
  }

  const parsed = parseApiBody(adminAddCreditsBodySchema, await request.json().catch(() => ({})));
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error, code: parsed.code }, { status: 400 });
  }

  const userId = parsed.data.userId;
  const amount = parsed.data.amount;

  const admin = createAdminClient();
  const { data: targetUser } = await admin.from("user_profiles").select("active").eq("id", userId).maybeSingle();

  if (targetUser?.active === false) {
    return NextResponse.json({ error: "Usuário desativado não pode receber créditos." }, { status: 400 });
  }

  const { data: updatedCredits, error } = await admin.rpc("add_profile_credits", {
    p_user_id: userId,
    p_amount: Math.trunc(amount),
    p_type: "bonus",
    p_description: `Bônus administrativo: +${Math.trunc(amount)} crédito(s)`,
  });

  if (error || updatedCredits === null) {
    return NextResponse.json({ error: "Falha ao adicionar créditos." }, { status: 500 });
  }

  return NextResponse.json({ success: true, credits: updatedCredits });
}
