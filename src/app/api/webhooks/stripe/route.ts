import { headers } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import Stripe from "stripe";

import { getCreditPackageById } from "@/lib/credits/packages";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function POST(request: NextRequest) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  if (!stripeSecretKey || !webhookSecret) {
    return NextResponse.json({ error: "Webhook Stripe não configurado." }, { status: 500 });
  }

  const stripe = new Stripe(stripeSecretKey);
  const rawBody = await request.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Assinatura Stripe ausente." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    return NextResponse.json(
      { error: `Assinatura inválida: ${error instanceof Error ? error.message : String(error)}` },
      { status: 400 },
    );
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true, ignored: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const paymentStatus = session.payment_status;
  const userId = String(session.metadata?.userId ?? "").trim();
  const packageId = String(session.metadata?.packageId ?? "").trim().toLowerCase();
  let selectedPackage = null;
  try {
    selectedPackage = await getCreditPackageById(packageId);
  } catch {
    selectedPackage = null;
  }

  const admin = createAdminClient();
  const hasValidUserId = isUuid(userId);
  const baseAudit = {
    user_id: userId,
    theme: "financas",
    question: "Compra de créditos",
  };

  if (!hasValidUserId || !selectedPackage) {
    if (hasValidUserId) {
      await admin.from("engine_audit_logs").insert({
        ...baseAudit,
        success: false,
        engine_code: "STRIPE_WEBHOOK_INVALID_METADATA",
        technical_details: {
          eventId: event.id,
          sessionId: session.id,
          paymentStatus,
          userId,
          packageId,
        },
      });
    }

    return NextResponse.json({ received: true, ignored: true });
  }

  if (paymentStatus !== "paid") {
    await admin.from("engine_audit_logs").insert({
      ...baseAudit,
      success: false,
      engine_code: "STRIPE_WEBHOOK_NOT_PAID",
      technical_details: {
        eventId: event.id,
        sessionId: session.id,
        paymentStatus,
        packageId: selectedPackage.id,
      },
    });

    return NextResponse.json({ received: true, ignored: true });
  }

  const creditDescription = `Stripe checkout ${session.id} pacote ${selectedPackage.id}`;
  const { data: existingPurchase } = await admin
    .from("credit_transactions")
    .select("id")
    .eq("user_id", userId)
    .eq("type", "purchase")
    .eq("description", creditDescription)
    .maybeSingle();

  if (existingPurchase?.id) {
    await admin.from("engine_audit_logs").insert({
      ...baseAudit,
      success: true,
      engine_code: "STRIPE_WEBHOOK_DUPLICATE_IGNORED",
      technical_details: {
        eventId: event.id,
        sessionId: session.id,
        packageId: selectedPackage.id,
        transactionId: existingPurchase.id,
      },
    });

    return NextResponse.json({ received: true, duplicated: true });
  }

  const { data: updatedCredits, error: creditError } = await admin.rpc("add_profile_credits", {
    p_user_id: userId,
    p_amount: selectedPackage.credits,
    p_type: "purchase",
    p_description: creditDescription,
  });

  if (creditError || updatedCredits === null) {
    await admin.from("engine_audit_logs").insert({
      ...baseAudit,
      success: false,
      engine_code: "STRIPE_CREDIT_DELIVERY_FAILED",
      technical_details: {
        eventId: event.id,
        sessionId: session.id,
        packageId: selectedPackage.id,
        details: `${creditError?.code ?? "NO_CODE"} ${creditError?.message ?? "unknown"}`,
      },
    });

    return NextResponse.json({ error: "Falha ao entregar créditos." }, { status: 500 });
  }

  await admin.from("engine_audit_logs").insert({
    ...baseAudit,
    success: true,
    engine_code: "STRIPE_CREDIT_DELIVERED",
    technical_details: {
      eventId: event.id,
      sessionId: session.id,
      packageId: selectedPackage.id,
      creditsAdded: selectedPackage.credits,
      creditsAfter: updatedCredits,
      amountTotal: session.amount_total,
      currency: session.currency,
      paymentStatus,
    },
  });

  return NextResponse.json({ received: true, delivered: true });
}
