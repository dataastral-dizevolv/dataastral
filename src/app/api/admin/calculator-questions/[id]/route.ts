import { NextResponse, type NextRequest } from "next/server";

import { requireAdminUser } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapQuestionRow, normalizeCategory, normalizeQuestionOptions, normalizeQuestionType } from "@/lib/calculator-questions";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

interface UpdateCalculatorQuestionBody {
  category?: unknown;
  label?: unknown;
  type?: unknown;
  options?: unknown;
  order?: unknown;
  isRequired?: unknown;
  isActive?: unknown;
}

function toQuestionId(rawId: string) {
  const parsed = Number(rawId);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function toPositiveInt(value: unknown, fallback = 100) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.trunc(parsed));
}

export async function PATCH(request: NextRequest, context: RouteParams) {
  const { isAdmin } = await requireAdminUser();

  if (!isAdmin) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const { id: rawId } = await context.params;
  const questionId = toQuestionId(rawId);

  if (!questionId) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  const body = (await request.json().catch(() => ({}))) as UpdateCalculatorQuestionBody;
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
  const { data, error } = await admin
    .from("calculator_questions")
    .update({
      category,
      label,
      type,
      options,
      order,
      is_required: isRequired,
      is_active: isActive,
      updated_at: now,
    })
    .eq("id", questionId)
    .is("deleted_at", null)
    .select("id, category, label, field_name, type, options, order, is_required, is_active, created_at, updated_at, deleted_at")
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ error: "Pergunta não encontrada." }, { status: 404 });
    }

    return NextResponse.json({ error: "Falha ao atualizar pergunta." }, { status: 500 });
  }

  return NextResponse.json({ item: mapQuestionRow(data) });
}

export async function DELETE(_request: NextRequest, context: RouteParams) {
  const { isAdmin } = await requireAdminUser();

  if (!isAdmin) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const { id: rawId } = await context.params;
  const questionId = toQuestionId(rawId);

  if (!questionId) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { error } = await admin
    .from("calculator_questions")
    .update({
      is_active: false,
      deleted_at: now,
      updated_at: now,
    })
    .eq("id", questionId)
    .is("deleted_at", null);

  if (error) {
    return NextResponse.json({ error: "Falha ao remover pergunta." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
