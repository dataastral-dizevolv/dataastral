import { NextResponse, type NextRequest } from "next/server";

import { requireAdminUser } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCalculatorCategory } from "@/lib/calculator-categories";
import { buildUniqueFieldName, mapQuestionRow, normalizeCategory, normalizeQuestionOptions, normalizeQuestionType } from "@/lib/calculator-questions";

interface UpsertCalculatorQuestionBody {
  category?: unknown;
  label?: unknown;
  type?: unknown;
  options?: unknown;
  order?: unknown;
  isRequired?: unknown;
  isActive?: unknown;
}

function toPositiveInt(value: unknown, fallback = 100) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.trunc(parsed));
}

export async function GET(request: NextRequest) {
  const { isAdmin } = await requireAdminUser();

  if (!isAdmin) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const categoryParam = (request.nextUrl.searchParams.get("category") ?? "").trim().toLowerCase();
  const category = categoryParam.length > 0 ? categoryParam : null;

  if (category && !isCalculatorCategory(category)) {
    return NextResponse.json({ error: "Categoria inválida." }, { status: 400 });
  }

  const admin = createAdminClient();
  let query = admin
    .from("calculator_questions")
    .select("id, category, label, field_name, type, options, order, is_required, is_active, created_at, updated_at, deleted_at")
    .is("deleted_at", null)
    .order("order", { ascending: true })
    .order("id", { ascending: true });

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: "Falha ao carregar perguntas." }, { status: 500 });
  }

  return NextResponse.json({ items: (data ?? []).map(mapQuestionRow) });
}

export async function POST(request: NextRequest) {
  const { isAdmin } = await requireAdminUser();

  if (!isAdmin) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as UpsertCalculatorQuestionBody;
  const category = normalizeCategory(body.category);
  const label = typeof body.label === "string" ? body.label.trim() : "";
  const type = normalizeQuestionType(body.type);
  const options = normalizeQuestionOptions(body.options);
  const order = toPositiveInt(body.order);
  const isRequired = body.isRequired === true;
  const isActive = body.isActive !== false;

  if (!category) {
    return NextResponse.json({ error: "Selecione uma categoria válida." }, { status: 400 });
  }

  if (!label) {
    return NextResponse.json({ error: "Informe o texto da pergunta." }, { status: 400 });
  }

  if (!type) {
    return NextResponse.json({ error: "Tipo inválido." }, { status: 400 });
  }

  if ((type === "select" || type === "checkbox") && options.length === 0) {
    return NextResponse.json({ error: "Perguntas de seleção precisam de opções válidas." }, { status: 400 });
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data: existingFieldsRows, error: existingFieldsError } = await admin
      .from("calculator_questions")
      .select("field_name")
      .is("deleted_at", null);

    if (existingFieldsError) {
      return NextResponse.json({ error: "Falha ao validar identificador interno." }, { status: 500 });
    }

    const existingFieldNames = (existingFieldsRows ?? []).map((row) => row.field_name);
    const fieldName = buildUniqueFieldName(label, existingFieldNames);

    const { data, error } = await admin
      .from("calculator_questions")
      .insert({
        category,
        label,
        field_name: fieldName,
        type,
        options,
        order,
        is_required: isRequired,
        is_active: isActive,
        updated_at: now,
        deleted_at: null,
      })
      .select("id, category, label, field_name, type, options, order, is_required, is_active, created_at, updated_at, deleted_at")
      .single();

    if (!error) {
      return NextResponse.json({ item: mapQuestionRow(data) });
    }

    if (error.code !== "23505") {
      return NextResponse.json({ error: "Falha ao criar pergunta." }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Não foi possível gerar identificador único para a pergunta." }, { status: 409 });
}
