import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { CreateRefundRequestBody, CreateRefundResponse, RefundRequestItem, RefundsMeResponse } from "@/types/refunds";

export const runtime = "nodejs";

const STATUSES = new Set(["pending", "approved", "rejected"]);

function mapRequest(row: {
  id: string;
  amount: number;
  reason: string | null;
  status: string;
  created_at: string;
}): RefundRequestItem {
  return {
    id: row.id,
    amount: row.amount,
    reason: row.reason,
    status: STATUSES.has(row.status) ? (row.status as RefundRequestItem["status"]) : "pending",
    createdAt: row.created_at,
  };
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const [{ data: profile }, { data: requests, error: requestsError }] = await Promise.all([
    supabase.from("profiles").select("credits").eq("id", user.id).maybeSingle(),
    supabase
      .from("refund_requests")
      .select("id, amount, reason, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  if (requestsError) {
    return NextResponse.json({ error: "Falha ao carregar pedidos de reembolso." }, { status: 500 });
  }

  const payload: RefundsMeResponse = {
    credits: profile?.credits ?? 0,
    requests: (requests ?? []).map(mapRequest),
  };

  return NextResponse.json(payload, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as CreateRefundRequestBody;
  const requestedAmount = Number(body.amount);
  const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 1000) : "";

  if (!Number.isFinite(requestedAmount) || requestedAmount < 1) {
    return NextResponse.json({ error: "Informe uma quantidade válida de créditos." }, { status: 400 });
  }

  const amount = Math.trunc(requestedAmount);

  const { data: profile } = await supabase.from("profiles").select("credits").eq("id", user.id).maybeSingle();
  const available = profile?.credits ?? 0;

  if (available <= 0) {
    return NextResponse.json({ error: "Não há créditos disponíveis para reembolso.", code: "NO_CREDITS" }, { status: 400 });
  }

  if (amount > available) {
    return NextResponse.json({ error: "A quantidade não pode ser maior que o saldo disponível." }, { status: 400 });
  }

  const reqAmount = amount;

  const { data, error } = await supabase
    .from("refund_requests")
    .insert({
      user_id: user.id,
      amount: reqAmount,
      reason: reason.length > 0 ? reason : null,
      status: "pending",
    })
    .select("id, amount, reason, status, created_at")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Falha ao registrar o pedido de reembolso." }, { status: 500 });
  }

  try {
    const admin = createAdminClient();
    await admin.from("engine_audit_logs").insert({
      user_id: user.id,
      theme: "financas",
      question: "Pedido de reembolso",
      success: true,
      engine_code: "REFUND_REQUEST_CREATED",
      technical_details: {
        operation: "refund_request_create",
        amount: reqAmount,
        requestId: data.id,
      },
    });
  } catch {
    // Auditoria não deve bloquear o pedido.
  }

  const payload: CreateRefundResponse = {
    ok: true,
    request: mapRequest(data),
  };

  return NextResponse.json(payload);
}
