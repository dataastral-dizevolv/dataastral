import { NextResponse, type NextRequest } from "next/server";

import { requireAdminUser } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import type { EngineAuditLogItem } from "@/types/admin";

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function GET(request: NextRequest) {
  const { isAdmin } = await requireAdminUser();

  if (!isAdmin) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const page = Math.max(1, Number(request.nextUrl.searchParams.get("page") ?? "1"));
  const pageSize = Math.min(100, Math.max(5, Number(request.nextUrl.searchParams.get("pageSize") ?? "20")));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const startDate = request.nextUrl.searchParams.get("startDate") ?? "";
  const endDate = request.nextUrl.searchParams.get("endDate") ?? "";
  const hasDateFilter = isIsoDate(startDate) && isIsoDate(endDate);

  const admin = createAdminClient();
  let query = admin
    .from("engine_audit_logs")
    .select("id, user_id, theme, question, success, engine_code, execution_time_ms, technical_details, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (hasDateFilter) {
    const endDateBoundary = new Date(`${endDate}T00:00:00.000Z`);
    endDateBoundary.setUTCDate(endDateBoundary.getUTCDate() + 1);
    query = query.gte("created_at", `${startDate}T00:00:00.000Z`).lt("created_at", endDateBoundary.toISOString());
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: "Falha ao carregar logs do motor." }, { status: 500 });
  }

  const items: EngineAuditLogItem[] = (data ?? []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    theme: row.theme,
    question: row.question,
    success: row.success,
    engineCode: row.engine_code,
    executionTimeMs: row.execution_time_ms,
    technicalDetails: (row.technical_details as Record<string, unknown> | null) ?? null,
    createdAt: row.created_at,
  }));

  return NextResponse.json({
    items,
    page,
    pageSize,
    total: count ?? items.length,
  });
}
