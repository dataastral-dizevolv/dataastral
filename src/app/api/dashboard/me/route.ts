import { NextResponse } from "next/server";

import { fetchDashboardUser } from "@/lib/auth/user";
import { tryCreateClient } from "@/lib/supabase/server";
import type { DashboardMeResponse } from "@/types/dashboard";

export async function GET() {
  const supabase = await tryCreateClient();
  if (!supabase) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const payload: DashboardMeResponse = await fetchDashboardUser(supabase, user);

  return NextResponse.json(payload);
}
