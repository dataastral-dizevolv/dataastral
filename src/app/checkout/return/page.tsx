import { Suspense } from "react";
import Link from "next/link";

import Footer from "@/components/landing/Footer";
import Header from "@/components/landing/Header";
import { Button } from "@/components/ui/button";
import { CheckoutReturnDetails } from "@/components/payments/CheckoutReturnDetails";

export default function CheckoutReturnPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto flex max-w-lg flex-col items-center px-6 pt-24 pb-20 text-center md:pt-28">
        <p className="mb-3 font-ubuntu text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          Pagamento
        </p>
        <h1 className="font-ubuntu text-3xl font-black tracking-tight text-foreground sm:text-4xl">Pronto!</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Se o pagamento foi confirmado, seus créditos serão liberados em instantes pelo webhook do Stripe.
        </p>

        <Suspense fallback={null}>
          <CheckoutReturnDetails />
        </Suspense>

        <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild className="h-10 rounded-full font-jakarta text-sm font-bold">
            <Link href="/calculadora">Ir para a calculadora</Link>
          </Button>
          <Button asChild variant="outline" className="h-10 rounded-full font-jakarta text-sm font-bold">
            <Link href="/financeiro">Ver financeiro</Link>
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
