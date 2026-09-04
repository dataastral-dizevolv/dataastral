"use client";

import { X } from "lucide-react";

import { StripeEmbeddedCheckout } from "@/components/payments/StripeEmbeddedCheckout";

interface CheckoutOverlayProps {
  packageId: string;
  onClose: () => void;
  onFatalError?: (message: string, code?: string) => void;
}

export function CheckoutOverlay({ packageId, onClose, onFatalError }: CheckoutOverlayProps) {
  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-background"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-overlay-title"
    >
      <div className="mx-auto max-w-2xl p-4 sm:p-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p
            id="checkout-overlay-title"
            className="font-ubuntu text-[10px] uppercase tracking-[0.22em] text-muted-foreground"
          >
            Checkout seguro
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar checkout"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border transition-colors hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <StripeEmbeddedCheckout key={packageId} packageId={packageId} onFatalError={onFatalError} />
      </div>
    </div>
  );
}
