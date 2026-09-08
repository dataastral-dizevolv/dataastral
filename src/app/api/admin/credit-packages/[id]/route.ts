import { NextResponse, type NextRequest } from "next/server";
import Stripe from "stripe";

import { requireAdminUser } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AdminCreditPackage } from "@/types/admin";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

interface UpdateCreditPackageBody {
  priceCents?: unknown;
  isActive?: unknown;
}

function toPriceCents(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  const integer = Math.trunc(parsed);
  if (integer <= 0) {
    return null;
  }
  return integer;
}

function resolveStripeProductId(packageId: string) {
  const perPackageKey = `STRIPE_PRODUCT_ID_${packageId.replace(/[^a-z0-9]/gi, "_").toUpperCase()}`;
  const perPackageValue = process.env[perPackageKey]?.trim();
  if (perPackageValue) {
    return perPackageValue;
  }

  const generic = process.env.STRIPE_PRODUCT_ID?.trim();
  return generic || "";
}

export async function PATCH(request: NextRequest, context: RouteParams) {
  const { user, isAdmin } = await requireAdminUser();

  if (!isAdmin) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const { id: rawId } = await context.params;
  const packageId = rawId.trim().toLowerCase();

  if (!packageId) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  const body = (await request.json().catch(() => ({}))) as UpdateCreditPackageBody;
  const priceCents = toPriceCents(body.priceCents);
  if (priceCents === null) {
    return NextResponse.json({ error: "Informe um valor válido em reais." }, { status: 400 });
  }

  const isActive = body.isActive === true;

  const admin = createAdminClient();
  const { data: currentPackage, error: currentPackageError } = await admin
    .from("credit_packages")
    .select("id, label, credits, price_cents, stripe_price_id, badge, is_active, order")
    .eq("id", packageId)
    .maybeSingle();

  if (currentPackageError) {
    return NextResponse.json({ error: "Falha ao carregar pacote para edição." }, { status: 500 });
  }

  if (!currentPackage) {
    return NextResponse.json({ error: "Pacote não encontrado." }, { status: 404 });
  }

  const priceChanged = currentPackage.price_cents !== priceCents;
  let stripePriceId = currentPackage.stripe_price_id;
  let createdStripePriceId: string | null = null;

  if (priceChanged) {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();
    const productId = resolveStripeProductId(packageId);

    if (!stripeSecretKey || !productId) {
      await admin.from("engine_audit_logs").insert({
        user_id: user?.id,
        theme: "financas",
        question: "Admin update credit package",
        success: false,
        engine_code: "CREDIT_PACKAGE_STRIPE_SYNC_FAILED",
        technical_details: {
          packageId,
          reason: "missing_stripe_env",
          hasStripeSecretKey: Boolean(stripeSecretKey),
          hasStripeProductId: Boolean(productId),
        },
      });

      return NextResponse.json({ error: "Integração Stripe não configurada para sincronizar preços." }, { status: 500 });
    }

    try {
      const stripe = new Stripe(stripeSecretKey);
      const createdPrice = await stripe.prices.create({
        unit_amount: priceCents,
        currency: "brl",
        product: productId,
        metadata: {
          packageId,
          source: "admin_credit_packages_patch",
        },
      });

      createdStripePriceId = createdPrice.id;
      stripePriceId = createdPrice.id;
    } catch (error) {
      await admin.from("engine_audit_logs").insert({
        user_id: user?.id,
        theme: "financas",
        question: "Admin update credit package",
        success: false,
        engine_code: "CREDIT_PACKAGE_STRIPE_SYNC_FAILED",
        technical_details: {
          packageId,
          oldPriceCents: currentPackage.price_cents,
          newPriceCents: priceCents,
          details: error instanceof Error ? error.message : String(error),
        },
      });

      return NextResponse.json({ error: "Falha ao sincronizar novo preço no Stripe." }, { status: 502 });
    }
  }

  const { data, error } = await admin
    .from("credit_packages")
    .update({
      price_cents: priceCents,
      is_active: isActive,
      stripe_price_id: stripePriceId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", packageId)
    .select("id, label, credits, price_cents, stripe_price_id, badge, is_active, order")
    .single();

  if (error) {
    await admin.from("engine_audit_logs").insert({
      user_id: user?.id,
      theme: "financas",
      question: "Admin update credit package",
      success: false,
      engine_code: "CREDIT_PACKAGE_UPDATE_FAILED",
      technical_details: {
        packageId,
        oldPriceCents: currentPackage.price_cents,
        newPriceCents: priceCents,
        stripePriceId,
        createdStripePriceId,
        details: `${error.code ?? "NO_CODE"} ${error.message}`,
      },
    });

    return NextResponse.json({ error: "Falha ao atualizar pacote." }, { status: 500 });
  }

  await admin.from("engine_audit_logs").insert({
    user_id: user?.id,
    theme: "financas",
    question: "Admin update credit package",
    success: true,
    engine_code: "CREDIT_PACKAGE_UPDATED",
    technical_details: {
      packageId,
      priceChanged,
      oldPriceCents: currentPackage.price_cents,
      newPriceCents: priceCents,
      oldStripePriceId: currentPackage.stripe_price_id,
      newStripePriceId: data.stripe_price_id,
      isActive,
    },
  });

  const item: AdminCreditPackage = {
    id: data.id,
    label: data.label,
    credits: data.credits,
    priceCents: data.price_cents,
    stripePriceId: data.stripe_price_id,
    badge: data.badge,
    isActive: data.is_active,
    order: data.order,
  };

  return NextResponse.json({ item });
}
