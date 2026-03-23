import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { requireAdminUser } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AdminUserRow } from "@/types/admin";

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function GET(request: NextRequest) {
  const { isAdmin } = await requireAdminUser();

  if (!isAdmin) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const admin = createAdminClient();
  const page = Math.max(1, Number(request.nextUrl.searchParams.get("page") ?? "1"));
  const pageSize = Math.min(100, Math.max(5, Number(request.nextUrl.searchParams.get("pageSize") ?? "20")));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const startDate = request.nextUrl.searchParams.get("startDate") ?? "";
  const endDate = request.nextUrl.searchParams.get("endDate") ?? "";
  const hasDateFilter = isIsoDate(startDate) && isIsoDate(endDate);

  let profilesQuery = admin
    .from("profiles")
    .select("id, full_name, credits, birth_date, birth_timezone, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (hasDateFilter) {
    const endDateBoundary = new Date(`${endDate}T00:00:00.000Z`);
    endDateBoundary.setUTCDate(endDateBoundary.getUTCDate() + 1);
    profilesQuery = profilesQuery.gte("created_at", `${startDate}T00:00:00.000Z`).lt("created_at", endDateBoundary.toISOString());
  }

  const [profilesRes, usersRes] = await Promise.all([
    profilesQuery,
    admin.from("user_profiles").select("id, role, active"),
  ]);

  if (profilesRes.error || usersRes.error) {
    return NextResponse.json({ error: "Falha ao carregar usuarios." }, { status: 500 });
  }

  const rolesMap = new Map(
    (usersRes.data ?? []).map((row) => [row.id, { role: row.role === "admin" ? "admin" : "user", active: row.active !== false }] as const),
  );

  const payload: AdminUserRow[] = (profilesRes.data ?? []).map((row) => ({
    id: row.id,
    fullName: row.full_name,
    email: row.id,
    role: rolesMap.get(row.id)?.role ?? "user",
    active: rolesMap.get(row.id)?.active ?? true,
    credits: row.credits ?? 0,
    birthDate: row.birth_date,
    birthTimezone: row.birth_timezone,
    createdAt: row.created_at,
  }));

  return NextResponse.json({
    items: payload,
    page,
    pageSize,
    total: profilesRes.count ?? payload.length,
  });
}
