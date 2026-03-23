import { NextResponse, type NextRequest } from "next/server";

import { requireAdminUser } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";

interface AddCreditsBody {
  userId?: string;
  amount?: number;
}

export async function POST(request: NextRequest) {
  const { isAdmin } = await requireAdminUser();

  if (!isAdmin) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as AddCreditsBody;
  const userId = body.userId?.trim() ?? "";
  const amount = Number(body.amount ?? 0);

  if (!userId || !Number.isFinite(amount) || amount <= 0 || amount > 1000) {
    return NextResponse.json({ error: "Parâmetros inválidos para crédito." }, { status: 400 });
  }

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
