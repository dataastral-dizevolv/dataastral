"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";

import { USER_MESSAGES, toUserFacingMessage } from "@/lib/errors/user-facing";
import { getStripe, isStripePublishableConfigured } from "@/lib/stripe/client";

interface Props {
  packageId: string;
  onFatalError?: (message: string, code?: string) => void;
}

export function StripeEmbeddedCheckout({ packageId, onFatalError }: Props) {
  if (!isStripePublishableConfigured()) {
    return (
      <div className="rounded-2xl border border-border bg-muted/40 p-6 text-sm text-muted-foreground">
        Pagamentos indisponíveis no momento. Tente novamente em instantes.
      </div>
    );
  }

  return <StripeEmbeddedCheckoutReady packageId={packageId} onFatalError={onFatalError} />;
}

function StripeEmbeddedCheckoutReady({
  packageId,
  onFatalError,
}: {
  packageId: string;
  onFatalError?: (message: string, code?: string) => void;
}) {
  const stripePromise = getStripe();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const onFatalErrorRef = useRef(onFatalError);

  useEffect(() => {
    onFatalErrorRef.current = onFatalError;
  }, [onFatalError]);

  const fetchClientSecret = useCallback(async () => {
    // Real Next checkout: POST /api/credits/buy with uiMode=embedded (not Lovable create-checkout).
    const response = await fetch("/api/credits/buy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ packageId, uiMode: "embedded" }),
    });

    const payload = (await response.json().catch(() => ({}))) as {
      clientSecret?: string;
      error?: string;
      code?: string;
    };

    if (!response.ok || !payload.clientSecret) {
      const message = toUserFacingMessage(payload, USER_MESSAGES.checkoutFailed);
      setErrorMessage(message);
      onFatalErrorRef.current?.(message, payload.code);
      throw new Error(message);
    }

    return payload.clientSecret;
  }, [packageId]);

  if (!stripePromise) {
    return (
      <div className="rounded-2xl border border-border bg-muted/40 p-6 text-sm text-muted-foreground">
        Pagamentos indisponíveis no momento. Tente novamente em instantes.
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="rounded-2xl border border-border bg-muted/40 p-6 text-sm text-muted-foreground">
        {errorMessage}
      </div>
    );
  }

  return (
    <div id="checkout" className="min-h-[420px]">
      <EmbeddedCheckoutProvider stripe={stripePromise} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
