import { NextResponse, type NextRequest } from "next/server";

import { requireAdminUser } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AdminDashboardMetrics } from "@/types/admin";

function toDateKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

type MetricsRange = "7d" | "30d" | "90d";

function buildRangeBuckets(days: number) {
  const now = new Date();
  const buckets: Array<{ date: string; signups: number; sales: number }> = [];

  for (let i = days - 1; i >= 0; i -= 1) {
    const day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    day.setUTCDate(day.getUTCDate() - i);
    buckets.push({ date: toDateKey(day), signups: 0, sales: 0 });
  }

  return buckets;
}

function calcDeltaPercent(current: number, previous: number) {
  if (!Number.isFinite(previous) || previous === 0) {
    return null;
  }

  return Number((((current - previous) / previous) * 100).toFixed(2));
}

function resolveRange(value: string | null): MetricsRange {
  if (value === "30d") return "30d";
  if (value === "90d") return "90d";
  return "7d";
}

export async function GET(request: NextRequest) {
  const { isAdmin } = await requireAdminUser();

  if (!isAdmin) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const range = resolveRange(request.nextUrl.searchParams.get("range"));
  const days = range === "90d" ? 90 : range === "30d" ? 30 : 7;

  const admin = createAdminClient();
  const buckets = buildRangeBuckets(days);
  const signupMap = new Map(buckets.map((item) => [item.date, item]));
  const salesMap = new Map(buckets.map((item) => [item.date, item]));
  const currentStartDate = buckets[0]?.date;

  const startBoundary = new Date(`${currentStartDate}T00:00:00.000Z`);
  const endBoundary = new Date();
  endBoundary.setUTCHours(0, 0, 0, 0);
  endBoundary.setUTCDate(endBoundary.getUTCDate() + 1);

  const previousStartBoundary = new Date(startBoundary);
  previousStartBoundary.setUTCDate(previousStartBoundary.getUTCDate() - days);

  const [purchaseRowsRes, profilesRes, signupsRes, creditRowsRes] = await Promise.all([
    admin
      .from("credit_transactions")
      .select("amount, type, created_at")
      .eq("type", "purchase")
      .gte("created_at", previousStartBoundary.toISOString())
      .lt("created_at", endBoundary.toISOString()),
    admin.from("profiles").select("credits"),
    admin
      .from("user_profiles")
      .select("created_at")
      .gte("created_at", startBoundary.toISOString())
      .lt("created_at", endBoundary.toISOString()),
    admin
      .from("credit_transactions")
      .select("amount, created_at")
      .gte("created_at", startBoundary.toISOString())
      .lt("created_at", endBoundary.toISOString()),
  ]);

  if (purchaseRowsRes.error || profilesRes.error || signupsRes.error || creditRowsRes.error) {
    return NextResponse.json({ error: "Falha ao carregar indicadores do dashboard." }, { status: 500 });
  }

  const purchaseRows = purchaseRowsRes.data ?? [];
  const profilesRows = profilesRes.data ?? [];
  const signupsRows = signupsRes.data ?? [];
  const creditRows = creditRowsRes.data ?? [];

  const grossRevenue = purchaseRows
    .filter((row) => new Date(row.created_at) >= startBoundary)
    .reduce((sum, row) => sum + (row.amount ?? 0), 0);

  const salesVolume = purchaseRows.filter((row) => new Date(row.created_at) >= startBoundary).length;
  const creditsInCirculation = profilesRows.reduce((sum, row) => sum + (row.credits ?? 0), 0);

  const previousRevenue = purchaseRows
    .filter((row) => {
      const dt = new Date(row.created_at);
      return dt >= previousStartBoundary && dt < startBoundary;
    })
    .reduce((sum, row) => sum + (row.amount ?? 0), 0);

  const previousSalesVolume = purchaseRows.filter((row) => {
    const dt = new Date(row.created_at);
    return dt >= previousStartBoundary && dt < startBoundary;
  }).length;

  for (const row of signupsRows) {
    const key = toDateKey(new Date(row.created_at));
    const bucket = signupMap.get(key);

    if (bucket) {
      bucket.signups += 1;
    }
  }

  for (const row of purchaseRows) {
    const key = toDateKey(new Date(row.created_at));
    const bucket = salesMap.get(key);

    if (bucket && new Date(row.created_at) >= startBoundary) {
      bucket.sales += 1;
    }
  }

  const netCreditChange = creditRows.reduce((sum, row) => sum + (row.amount ?? 0), 0);
  const previousCreditsEstimate = creditsInCirculation - netCreditChange;

  const payload: AdminDashboardMetrics = {
    grossRevenue,
    salesVolume,
    creditsInCirculation,
    range,
    signupSeries: buckets.map((item) => ({ date: item.date, count: item.signups })),
    salesSeries: buckets.map((item) => ({ date: item.date, count: item.sales })),
    deltas: {
      revenuePercent: calcDeltaPercent(grossRevenue, previousRevenue),
      salesPercent: calcDeltaPercent(salesVolume, previousSalesVolume),
      creditsPercent: calcDeltaPercent(creditsInCirculation, previousCreditsEstimate),
    },
  };

  return NextResponse.json(payload);
}
