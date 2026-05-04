import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export interface CreditPackage {
  id: string;
  label: string;
  credits: number;
  priceCents: number;
  stripePriceId: string | null;
  badge: string | null;
  isActive: boolean;
  order: number;
}

interface CreditPackageRow {
  id: string;
  label: string;
  credits: number;
  price_cents: number;
  stripe_price_id: string | null;
  badge: string | null;
  is_active: boolean;
  order: number;
}

function mapRowToCreditPackage(row: CreditPackageRow): CreditPackage {
  return {
    id: row.id,
    label: row.label,
    credits: row.credits,
    priceCents: row.price_cents,
    stripePriceId: row.stripe_price_id,
    badge: row.badge,
    isActive: row.is_active,
    order: row.order,
  };
}

export async function getCreditPackages(options?: { onlyActive?: boolean }) {
  const onlyActive = options?.onlyActive ?? false;
  const admin = createAdminClient();
  let query = admin
    .from("credit_packages")
    .select("id, label, credits, price_cents, stripe_price_id, badge, is_active, order")
    .order("order", { ascending: true })
    .order("id", { ascending: true });

  if (onlyActive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`CREDIT_PACKAGES_QUERY_FAILED: ${error.code ?? "NO_CODE"} ${error.message}`);
  }

  return (data ?? []).map((row) => mapRowToCreditPackage(row as CreditPackageRow));
}

export async function getCreditPackageById(id: string, options?: { onlyActive?: boolean }) {
  const normalizedId = id.trim().toLowerCase();
  if (!normalizedId) {
    return null;
  }

  const onlyActive = options?.onlyActive ?? false;
  const admin = createAdminClient();
  let query = admin
    .from("credit_packages")
    .select("id, label, credits, price_cents, stripe_price_id, badge, is_active, order")
    .eq("id", normalizedId)
    .limit(1);

  if (onlyActive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query.maybeSingle();
  if (error) {
    throw new Error(`CREDIT_PACKAGE_BY_ID_FAILED: ${error.code ?? "NO_CODE"} ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return mapRowToCreditPackage(data as CreditPackageRow);
}
