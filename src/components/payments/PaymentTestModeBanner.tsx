"use client";

import { getStripePublishableKey } from "@/lib/stripe/client";

export function PaymentTestModeBanner() {
  const key = getStripePublishableKey();

  if (!key) {
    return (
      <div className="border-b border-border bg-muted px-4 py-2 text-center text-sm text-foreground">
        Checkout ainda não está configurado. Defina as chaves do Stripe para aceitar pagamentos.
      </div>
    );
  }

  if (key.startsWith("pk_test_")) {
    return (
      <div className="border-b border-border bg-muted px-4 py-2 text-center text-xs text-muted-foreground">
        Pagamentos em modo de teste. Use o cartão 4242 4242 4242 4242.
      </div>
    );
  }

  return null;
}
