"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, Coins } from "lucide-react";
import useSWR from "swr";
import { toast } from "sonner";

import { useDashboardUser } from "@/components/dashboard/DashboardUserContext";
import { CheckoutOverlay } from "@/components/payments/CheckoutOverlay";
import { CreditPackageCard } from "@/components/payments/CreditPackageCard";
import { PaymentTestModeBanner } from "@/components/payments/PaymentTestModeBanner";
import { isStripePublishableConfigured } from "@/lib/stripe/client";
import type { CreditPackageItem, CreditTransactionItem } from "@/types/credits";

const CREDIT_TRANSACTIONS_KEY = "/api/credits/transactions?limit=30";
const CREDIT_PACKAGES_KEY = "/api/credits/packages";

const fetcher = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url, { credentials: "include" });

  if (!response.ok) {
    throw new Error("Falha ao carregar financeiro.");
  }

  return (await response.json()) as T;
};

function formatTransactionType(type: CreditTransactionItem["type"]) {
  if (type === "purchase") return "Compra";
  if (type === "usage") return "Uso";
  return "Bônus";
}

export default function FinanceiroPage() {
  const { user } = useDashboardUser();
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [checkoutPackageId, setCheckoutPackageId] = useState<string | null>(null);

  const { data: transactions, isLoading } = useSWR<CreditTransactionItem[]>(CREDIT_TRANSACTIONS_KEY, fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  });
  const {
    data: creditPackages,
    isLoading: loadingPackages,
    error: packagesError,
  } = useSWR<CreditPackageItem[]>(CREDIT_PACKAGES_KEY, fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 10000,
  });

  function openCheckout(packageId: string) {
    if (!isStripePublishableConfigured()) {
      toast.error("Stripe ainda não configurado (faltam chaves).");
      return;
    }
    setCheckoutPackageId(packageId);
  }

  return (
    <main className="bg-background px-4 py-6 md:px-8 md:py-8">
      <PaymentTestModeBanner />
      <div className="w-full max-w-5xl space-y-10">
        <section className="space-y-2 border-b border-border/70 pb-5">
          <p className="font-ubuntu text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Financeiro</p>
          <h1 className="font-ubuntu text-3xl font-black tracking-tight text-foreground sm:text-4xl">Créditos</h1>
          <p className="text-sm text-muted-foreground">
            Saldo atual: <span className="font-semibold text-foreground">{user.credits} crédito(s)</span>
          </p>
        </section>

        <section className="space-y-6">
          <div className="text-center sm:text-left">
            <p className="font-ubuntu text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              Serviços avulsos · sem assinatura
            </p>
            <h2 className="mt-2 font-jakarta text-2xl font-black text-foreground">Crédito por Serviço</h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Selecione um pacote e confirme o pagamento com checkout embutido seguro via Stripe.
            </p>
          </div>

          {loadingPackages ? (
            <p className="border-b border-border py-8 text-sm text-muted-foreground">Carregando pacotes…</p>
          ) : null}

          {packagesError ? (
            <p className="border-b border-border py-8 text-sm text-muted-foreground">
              Não foi possível carregar os pacotes agora. Tente novamente em instantes.
            </p>
          ) : null}

          {!loadingPackages && !packagesError && (creditPackages?.length ?? 0) === 0 ? (
            <p className="border-b border-border py-8 text-sm text-muted-foreground">Nenhum pacote ativo no momento.</p>
          ) : null}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {(creditPackages ?? []).map((pkg) => (
              <CreditPackageCard
                key={pkg.id}
                pkg={pkg}
                selected={selectedPackageId === pkg.id}
                authPending={false}
                onSelect={() => setSelectedPackageId(pkg.id)}
                onPay={() => openCheckout(pkg.id)}
              />
            ))}
          </div>

          <p className="text-center text-xs text-muted-foreground sm:text-left">
            Pagamentos seguros via Stripe · 7 dias para reembolso conforme CDC. Veja a política em{" "}
            <Link href="/reembolso" className="text-iris-accent underline-offset-4 hover:underline">
              /reembolso
            </Link>
            .
          </p>
        </section>

        <section className="space-y-4">
          <header className="border-b border-border/70 pb-3">
            <h2 className="font-ubuntu text-2xl font-black tracking-tight text-foreground">Histórico de Créditos</h2>
            <p className="text-sm text-muted-foreground">Últimas movimentações de compra, uso e bônus.</p>
          </header>
          <div className="space-y-0">
            {isLoading ? <div className="h-20 animate-pulse bg-muted/30" /> : null}

            {!isLoading && (transactions?.length ?? 0) === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">Nenhuma movimentação registrada ainda.</p>
            ) : null}

            {(transactions ?? []).map((item) => {
              const positive = item.amount > 0;

              return (
                <div key={item.id} className="flex items-start justify-between gap-3 border-b border-border/70 py-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className={`mt-0.5 p-1.5 ${positive ? "bg-emerald-500/10" : "bg-iris-accent/10"}`}>
                      {positive ? (
                        <ArrowDownLeft className="size-4 text-emerald-600" />
                      ) : (
                        <ArrowUpRight className="size-4 text-iris-accent" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-foreground">{item.description ?? formatTransactionType(item.type)}</p>
                      <p className="font-mono-iris text-[0.65rem] uppercase tracking-widest text-muted-foreground">
                        {formatTransactionType(item.type)} -{" "}
                        {new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(
                          new Date(item.createdAt),
                        )}
                      </p>
                    </div>
                  </div>
                  <p className={`whitespace-nowrap font-semibold ${positive ? "text-emerald-600" : "text-foreground"}`}>
                    {positive ? "+" : ""}
                    {item.amount} <Coins className="mb-0.5 ml-1 inline-block size-3.5" />
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </div>

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
    </main>
  );
}
