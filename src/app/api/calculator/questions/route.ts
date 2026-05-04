import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { mapQuestionRow } from "@/lib/calculator-questions";
import { isCalculatorCategory } from "@/lib/calculator-categories";

export async function GET(request: NextRequest) {
  const categoryParam = (request.nextUrl.searchParams.get("category") ?? "").trim().toLowerCase();
  const kindParam = (request.nextUrl.searchParams.get("kind") ?? "dynamic").trim().toLowerCase();
  const category = categoryParam.length > 0 ? categoryParam : null;
  const kind = kindParam.length > 0 ? kindParam : "dynamic";

  if (category && !isCalculatorCategory(category)) {
    return NextResponse.json({ error: "Categoria inválida." }, { status: 400 });
  }

  if (!["dynamic", "prompt", "all"].includes(kind)) {
    return NextResponse.json({ error: "Tipo de pergunta inválido." }, { status: 400 });
  }

  const admin = createAdminClient();
  let query = admin
    .from("calculator_questions")
    .select("id, category, label, field_name, type, options, order, is_required, is_active, created_at, updated_at, deleted_at")
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("order", { ascending: true })
    .order("id", { ascending: true });

  if (category) {
    query = query.eq("category", category);
  }

  if (kind === "prompt") {
    query = query.like("field_name", "prompt_%");
  }

  if (kind === "dynamic") {
    query = query.not("field_name", "like", "prompt_%");
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: "Falha ao carregar perguntas da calculadora." }, { status: 500 });
  }

  return NextResponse.json({
    items: (data ?? []).map(mapQuestionRow),
  });
}
