import { NextResponse, type NextRequest } from "next/server";

import { requireAdminUser } from "@/lib/auth/admin";
import { RATE_LIMITS, consumeRateLimit, rateLimitJson } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminDeactivateBodySchema } from "@/lib/validation/credits";
import { parseApiBody } from "@/lib/validation/parse-body";

export async function POST(request: NextRequest) {
  const { user, isAdmin } = await requireAdminUser();

  if (!isAdmin || !user) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  if (
    !(await consumeRateLimit(
      `admin-deactivate:user:${user.id}`,
      RATE_LIMITS.adminMutation.max,
      RATE_LIMITS.adminMutation.windowMs,
    ))
  ) {
    return rateLimitJson("RATE_LIMIT_EXCEEDED");
  }

  const parsed = parseApiBody(adminDeactivateBodySchema, await request.json().catch(() => ({})));
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error, code: parsed.code }, { status: 400 });
  }

  const userId = parsed.data.userId;

  if (userId === user.id) {
    return NextResponse.json({ error: "Você não pode desativar seu próprio acesso admin." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("user_profiles").update({ active: false }).eq("id", userId);

  if (error) {
    return NextResponse.json({ error: "Falha ao desativar usuário." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
