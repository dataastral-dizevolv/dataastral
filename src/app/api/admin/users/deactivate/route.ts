import { NextResponse, type NextRequest } from "next/server";

import { requireAdminUser } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";

interface DeactivateBody {
  userId?: string;
}

export async function POST(request: NextRequest) {
  const { user, isAdmin } = await requireAdminUser();

  if (!isAdmin || !user) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as DeactivateBody;
  const userId = body.userId?.trim() ?? "";

  if (!userId) {
    return NextResponse.json({ error: "Usuário inválido." }, { status: 400 });
  }

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
