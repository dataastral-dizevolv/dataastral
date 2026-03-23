import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import type { PredictionHistoryItem } from "@/types/dashboard";

interface PredictionHistoryResponse {
  items: PredictionHistoryItem[];
  total: number;
}

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

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
  const withCount = request.nextUrl.searchParams.get("withCount") === "1";
  const startDate = request.nextUrl.searchParams.get("startDate") ?? "";
  const endDate = request.nextUrl.searchParams.get("endDate") ?? "";

  const hasDateFilter = isIsoDate(startDate) && isIsoDate(endDate);

  let query = supabase
    .from("user_prediction_history")
    .select("id, theme, question, prediction, event_date, created_at", { count: withCount ? "exact" : undefined })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (hasDateFilter) {
    const endDateBoundary = new Date(`${endDate}T00:00:00.000Z`);
    endDateBoundary.setUTCDate(endDateBoundary.getUTCDate() + 1);
    const endDateExclusive = endDateBoundary.toISOString().slice(0, 10);
    query = query.gte("event_date", startDate).lt("event_date", endDateExclusive);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: "Falha ao carregar histórico." }, { status: 500 });
  }

  const payload: PredictionHistoryItem[] = (data ?? []).map((item) => ({
    id: item.id,
    theme: item.theme,
    question: item.question,
    prediction: item.prediction,
    eventDateIso: item.event_date,
    createdAt: item.created_at,
  }));

  if (withCount) {
    const response: PredictionHistoryResponse = {
      items: payload,
      total: count ?? payload.length,
    };

    return NextResponse.json(response);
  }

  return NextResponse.json(payload);
}
