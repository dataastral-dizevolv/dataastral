import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import type { CreditTransactionItem } from "@/types/credits";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const limitParam = Number(request.nextUrl.searchParams.get("limit") ?? "20");
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 100) : 20;

  const { data, error } = await supabase
    .from("credit_transactions")
    .select("id, amount, type, description, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: "Falha ao carregar extrato de créditos." }, { status: 500 });
  }

  const payload: CreditTransactionItem[] = (data ?? []).map((item) => ({
    id: item.id,
    amount: item.amount,
    type: item.type,
    description: item.description,
    createdAt: item.created_at,
  }));

  return NextResponse.json(payload);
}
