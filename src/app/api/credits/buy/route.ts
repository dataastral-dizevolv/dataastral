import { NextResponse, type NextRequest } from "next/server";
import Stripe from "stripe";

import { getCreditPackageById } from "@/lib/credits/packages";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { BuyCreditsResponse } from "@/types/credits";

export const runtime = "nodejs";

interface BuyCreditsRequestBody {
  packageId?: string;
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!stripeSecretKey) {
    return NextResponse.json({ error: "Servidor sem configuração de pagamento (Stripe)." }, { status: 500 });
  }

  const stripe = new Stripe(stripeSecretKey);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as BuyCreditsRequestBody;
  const packageId = typeof body.packageId === "string" ? body.packageId.trim().toLowerCase() : "";
  let selectedPackage;
  try {
    selectedPackage = await getCreditPackageById(packageId, { onlyActive: true });
  } catch {
    return NextResponse.json({ error: "Falha ao carregar pacotes de créditos." }, { status: 500 });
  }

  if (!selectedPackage) {
    return NextResponse.json({ error: "Pacote de créditos inválido ou inativo." }, { status: 400 });
  }

  const stripePriceId = selectedPackage.stripePriceId?.trim();
  if (!stripePriceId) {
    return NextResponse.json({ error: "Pacote sem stripe_price_id configurado." }, { status: 400 });
  }

  let adminClient: ReturnType<typeof createAdminClient>;

  try {
    adminClient = createAdminClient();
  } catch {
    return NextResponse.json({ error: "Servidor sem configuração de compra." }, { status: 500 });
  }

  const requestOrigin = request.nextUrl.origin;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || process.env.APP_URL?.trim() || requestOrigin;
  const successUrl = `${appUrl}/financeiro?purchase=success`;
  const cancelUrl = `${appUrl}/financeiro?purchase=cancelled`;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: user.email ?? undefined,
      line_items: [
        {
          quantity: 1,
          price: stripePriceId,
        },
      ],
      metadata: {
        userId: user.id,
        packageId: selectedPackage.id,
      },
    });

    if (!session.url) {
      await adminClient.from("engine_audit_logs").insert({
        user_id: user.id,
        theme: "financas",
        question: "Compra de créditos",
        success: false,
        engine_code: "STRIPE_CHECKOUT_CREATE_FAILED",
        technical_details: {
          operation: "stripe_checkout_create",
          provider: "stripe",
          code: "STRIPE_CHECKOUT_CREATE_FAILED",
          status: 500,
          requestId,
          packageId: selectedPackage.id,
          sessionCreated: false,
        },
      });

      return NextResponse.json({ error: "Não foi possível iniciar o checkout." }, { status: 500 });
    }

    await adminClient.from("engine_audit_logs").insert({
      user_id: user.id,
      theme: "financas",
      question: "Compra de créditos",
      success: true,
      engine_code: "STRIPE_CHECKOUT_CREATED",
      technical_details: {
        operation: "stripe_checkout_create",
        provider: "stripe",
        code: "STRIPE_CHECKOUT_CREATED",
        status: 200,
        requestId,
        packageId: selectedPackage.id,
        sessionCreated: true,
      },
    });

    const payload: BuyCreditsResponse = {
      packageId: selectedPackage.id,
      checkoutUrl: session.url,
    };

    return NextResponse.json(payload);
  } catch (error) {
    const stripeErrorCode =
      error && typeof error === "object" && "code" in error && typeof (error as { code?: unknown }).code === "string"
        ? (error as { code: string }).code
        : "STRIPE_ERROR";

    await adminClient.from("engine_audit_logs").insert({
      user_id: user.id,
      theme: "financas",
      question: "Compra de créditos",
      success: false,
      engine_code: "STRIPE_CHECKOUT_CREATE_FAILED",
      technical_details: {
        operation: "stripe_checkout_create",
        provider: "stripe",
        code: stripeErrorCode,
        status: 500,
        requestId,
        packageId: selectedPackage.id,
        sessionCreated: false,
      },
    });

    return NextResponse.json({ error: "Falha ao iniciar checkout de créditos." }, { status: 500 });
  }
}
