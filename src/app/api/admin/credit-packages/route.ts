import { NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AdminCreditPackage } from "@/types/admin";

export const runtime = "nodejs";

export async function GET() {
  const { isAdmin } = await requireAdminUser();

  if (!isAdmin) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("credit_packages")
    .select("id, label, credits, price_cents, stripe_price_id, badge, is_active, order")
    .order("order", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Falha ao carregar pacotes de créditos." }, { status: 500 });
  }

  const payload: AdminCreditPackage[] = (data ?? []).map((row) => ({
    id: row.id,
    label: row.label,
    credits: row.credits,
    priceCents: row.price_cents,
    stripePriceId: row.stripe_price_id,
    badge: row.badge,
    isActive: row.is_active,
    order: row.order,
  }));

  return NextResponse.json({ items: payload });
}
