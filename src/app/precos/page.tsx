"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { toast } from "sonner";

import Footer from "@/components/landing/Footer";
import Header from "@/components/landing/Header";
import { CheckoutOverlay } from "@/components/payments/CheckoutOverlay";
import { PaymentTestModeBanner } from "@/components/payments/PaymentTestModeBanner";
import { PricingCatalog } from "@/components/payments/PricingCatalog";
import { useAuthUserId } from "@/hooks/useAuthUserId";
import { isStripePublishableConfigured } from "@/lib/stripe/client";
import type { CreditPackageItem } from "@/types/credits";

const fetcher = async (url: string): Promise<CreditPackageItem[]> => {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    throw new Error("Falha ao carregar pacotes");
  }
  return (await res.json()) as CreditPackageItem[];
};

function PrecosPageContent() {
  const searchParams = useSearchParams();
  const buyFromQuery = searchParams.get("buy")?.trim().toLowerCase() || null;
  const userId = useAuthUserId();
  const { data: packages, error, isLoading } = useSWR("/api/credits/packages", fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [checkoutPackageId, setCheckoutPackageId] = useState<string | null>(null);
  const [autoBuyHandled, setAutoBuyHandled] = useState(false);

  function openCheckout(packageId: string) {
    if (!isStripePublishableConfigured()) {
      toast.error("Pagamentos indisponíveis no momento. Tente novamente em instantes.");
      return;
    }
    setCheckoutPackageId(packageId);
  }

  useEffect(() => {
    if (autoBuyHandled || !buyFromQuery || userId === undefined) {
      return;
    }
    setAutoBuyHandled(true);
    if (!userId) {
      window.location.assign(`/login?next=${encodeURIComponent(`/precos?buy=${buyFromQuery}`)}`);
      return;
    }
    setSelectedPackageId(buyFromQuery);
    openCheckout(buyFromQuery);
  }, [autoBuyHandled, buyFromQuery, userId]);

  function handleSelect(packageId: string) {
    if (userId === undefined) {
      return;
    }
    if (!userId) {
      window.location.assign(`/login?next=${encodeURIComponent(`/precos?buy=${packageId}`)}`);
      return;
    }
    setSelectedPackageId(packageId);
  }

  function handlePay(packageId: string) {
    if (userId === undefined) {
      return;
    }
    if (!userId) {
      window.location.assign(`/login?next=${encodeURIComponent(`/precos?buy=${packageId}`)}`);
      return;
    }
    openCheckout(packageId);
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-11 md:pt-14">
        <PaymentTestModeBanner />
      </div>
      <main className="mx-auto max-w-5xl px-6 pt-8 pb-20 md:pt-10">
        <PricingCatalog
          packages={packages}
          isLoading={isLoading}
          error={Boolean(error)}
          selectedPackageId={selectedPackageId}
          authPending={userId === undefined}
          onSelect={handleSelect}
          onPay={handlePay}
        />
      </main>
      <Footer />

      {checkoutPackageId ? (
        <CheckoutOverlay
          packageId={checkoutPackageId}
          onClose={() => setCheckoutPackageId(null)}
          onFatalError={(message, code) => {
            toast.error(message);
            if (code === "STRIPE_PRICE_MISSING") {
              setCheckoutPackageId(null);
            }
          }}
        />
      ) : null}
    </div>
  );
}

export default function PrecosPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background">
          <Header />
          <main className="mx-auto max-w-5xl px-6 pt-20 pb-20 md:pt-24">
            <p className="text-sm text-muted-foreground">Carregando…</p>
          </main>
          <Footer />
        </div>
      }
    >
      <PrecosPageContent />
    </Suspense>
  );
}
