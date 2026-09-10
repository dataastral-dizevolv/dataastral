import { NextResponse, type NextRequest } from "next/server";
import Stripe from "stripe";

import { getCreditPackageById } from "@/lib/credits/packages";
import { RATE_LIMITS, consumeRateLimit, rateLimitJson } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { parseApiBody } from "@/lib/validation/parse-body";
import { buyCreditsBodySchema } from "@/lib/validation/credits";
import type { BuyCreditsResponse, CheckoutUiMode } from "@/types/credits";

export const runtime = "nodejs";

function resolveUiMode(request: NextRequest, uiMode?: CheckoutUiMode): CheckoutUiMode {
  const queryMode = request.nextUrl.searchParams.get("mode")?.trim().toLowerCase();
  if (queryMode === "embedded" || queryMode === "hosted") {
    return queryMode;
  }

  if (uiMode === "embedded" || uiMode === "hosted") {
    return uiMode;
  }

  return "hosted";
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!stripeSecretKey) {
    return NextResponse.json(
      { error: "Pagamentos indisponíveis no momento. Tente novamente em instantes.", code: "STRIPE_SECRET_MISSING" },
      { status: 503 },
    );
  }

  const stripe = new Stripe(stripeSecretKey);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado.", code: "UNAUTHENTICATED" }, { status: 401 });
  }

  if (!(await consumeRateLimit(`credits-buy:user:${user.id}`, RATE_LIMITS.creditsBuy.max, RATE_LIMITS.creditsBuy.windowMs))) {
    return rateLimitJson("RATE_LIMIT_EXCEEDED", requestId);
  }

  const parsed = parseApiBody(buyCreditsBodySchema, await request.json().catch(() => ({})));
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error, code: parsed.code }, { status: 400 });
  }

  const uiMode = resolveUiMode(request, parsed.data.uiMode);
  const packageId = parsed.data.packageId;
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
    return NextResponse.json(
      {
        error: "Este pacote não está disponível para compra agora.",
        code: "STRIPE_PRICE_MISSING",
      },
      { status: 400 },
    );
  }

  let adminClient: ReturnType<typeof createAdminClient>;

  try {
    adminClient = createAdminClient();
  } catch {
    return NextResponse.json({ error: "Servidor sem configuração de compra." }, { status: 500 });
  }

  const requestOrigin = request.nextUrl.origin;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || process.env.APP_URL?.trim() || requestOrigin;
  // Hosted (dashboard /financeiro) still redirects to success/cancel URLs.
  // Embedded (/precos overlay) returns to /checkout/return with the session id.
  const successUrl = `${appUrl}/financeiro?purchase=success`;
  const cancelUrl = `${appUrl}/financeiro?purchase=cancelled`;
  const returnUrl = `${appUrl}/checkout/return?session_id={CHECKOUT_SESSION_ID}`;

  try {
    const session =
      uiMode === "embedded"
        ? await stripe.checkout.sessions.create({
            mode: "payment",
            ui_mode: "embedded_page",
            return_url: returnUrl,
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
          })
        : await stripe.checkout.sessions.create({
            mode: "payment",
            ui_mode: "hosted_page",
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

    if (uiMode === "embedded") {
      if (!session.client_secret) {
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
            uiMode,
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
          uiMode,
          sessionCreated: true,
        },
      });

      const payload: BuyCreditsResponse = {
        packageId: selectedPackage.id,
        uiMode: "embedded",
        clientSecret: session.client_secret,
      };

      return NextResponse.json(payload);
    }

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
          uiMode,
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
        uiMode,
        sessionCreated: true,
      },
    });

    const payload: BuyCreditsResponse = {
      packageId: selectedPackage.id,
      uiMode: "hosted",
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
        uiMode,
        sessionCreated: false,
      },
    });

    return NextResponse.json({ error: "Falha ao iniciar checkout de créditos." }, { status: 500 });
  }
}
