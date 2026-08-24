import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function ensureProfile(userId: string) {
  const admin = createAdminClient();
  const { error } = await admin.from("profiles").upsert(
    { id: userId, updated_at: new Date().toISOString() },
    { onConflict: "id" },
  );
  if (error) {
    throw error;
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  if (!user.email) {
    return NextResponse.json({ error: "Nenhum e-mail cadastrado para confirmação." }, { status: 400 });
  }

  try {
    await ensureProfile(user.id);
  } catch {
    return NextResponse.json({ error: "Falha ao preparar exclusão da conta." }, { status: 500 });
  }

  const scheduled = new Date();
  scheduled.setDate(scheduled.getDate() + 7);
  const token = crypto.randomUUID();

  const admin = createAdminClient();
  const { error } = await admin.from("pending_deletions").upsert(
    {
      user_id: user.id,
      requested_at: new Date().toISOString(),
      scheduled_for: scheduled.toISOString(),
      cancellation_token: token,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    return NextResponse.json({ error: "Não foi possível registrar o pedido de exclusão." }, { status: 500 });
  }

  const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const redirectTo = origin ? `${origin}/perfil?confirmar-exclusao=1` : undefined;

  const { error: mailError } = await supabase.auth.signInWithOtp({
    email: user.email,
    options: redirectTo ? { emailRedirectTo: redirectTo } : undefined,
  });

  if (mailError) {
    return NextResponse.json(
      {
        error: "Pedido registrado, mas o e-mail de confirmação não pôde ser enviado agora.",
        scheduledFor: scheduled.toISOString(),
      },
      { status: 202 },
    );
  }

  return NextResponse.json({
    success: true,
    scheduledFor: scheduled.toISOString(),
  });
}

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { error } = await supabase.from("pending_deletions").delete().eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: "Não foi possível cancelar a exclusão." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
