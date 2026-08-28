import { NextResponse, type NextRequest } from "next/server";

import { tryCreateClient } from "@/lib/supabase/server";
import { normalizeQuestionOptions } from "@/lib/calculator-questions";
import { isCalculatorCategory } from "@/lib/calculator-categories";
import type { CalculatorQuestion } from "@/types/calculator";

export async function GET(request: NextRequest) {
  const categoryParam = (request.nextUrl.searchParams.get("category") ?? "").trim().toLowerCase();
  const kindParam = (request.nextUrl.searchParams.get("kind") ?? "").trim().toLowerCase();
  const category = categoryParam.length > 0 ? categoryParam : null;

  if (category && !isCalculatorCategory(category)) {
    return NextResponse.json({ error: "Categoria inválida." }, { status: 400 });
  }

  // Public endpoint always serves the same safe subset.
  // Unsupported kinds are ignored to keep backward compatibility with current frontend calls.
  if (kindParam && !["dynamic", "prompt", "all"].includes(kindParam)) {
    return NextResponse.json({ error: "Tipo de pergunta inválido." }, { status: 400 });
  }

  const supabase = await tryCreateClient();
  if (!supabase) {
    return NextResponse.json({ items: [] });
  }

  let query = supabase
    .from("calculator_questions")
    .select("id, category, label, field_name, type, options, order, is_required")
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("order", { ascending: true })
    .order("id", { ascending: true });

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: "Falha ao carregar perguntas da calculadora." }, { status: 500 });
  }

  const items: CalculatorQuestion[] = (data ?? [])
    .filter(
      (row): row is {
        id: number;
        category: CalculatorQuestion["category"];
        label: string;
        field_name: string;
        type: CalculatorQuestion["type"];
        options: unknown;
        order: number;
        is_required: boolean;
      } =>
        typeof row.id === "number" &&
        isCalculatorCategory(row.category) &&
        typeof row.label === "string" &&
        typeof row.field_name === "string" &&
        ["select", "text", "checkbox"].includes(String(row.type)) &&
        typeof row.order === "number" &&
        typeof row.is_required === "boolean",
    )
    .map((row) => ({
      id: row.id,
      category: row.category,
      label: row.label,
      fieldName: row.field_name,
      type: row.type,
      options: normalizeQuestionOptions(row.options),
      order: row.order,
      isRequired: row.is_required,
    }));

  return NextResponse.json({
    items,
  });
}
