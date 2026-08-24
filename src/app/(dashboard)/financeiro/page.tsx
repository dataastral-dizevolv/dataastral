"use client";

import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Coins, Loader2 } from "lucide-react";
import useSWR from "swr";
import { toast } from "sonner";

import { useDashboardUser } from "@/components/dashboard/DashboardUserContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { BuyCreditsResponse, CreditPackageItem, CreditTransactionItem } from "@/types/credits";

const CREDIT_TRANSACTIONS_KEY = "/api/credits/transactions?limit=30";
const CREDIT_PACKAGES_KEY = "/api/credits/packages";

const fetcher = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url, { credentials: "include" });

  if (!response.ok) {
    throw new Error("Falha ao carregar financeiro.");
  }

  return (await response.json()) as T;
};

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

function formatTransactionType(type: CreditTransactionItem["type"]) {
  if (type === "purchase") return "Compra";
  if (type === "usage") return "Uso";
  return "Bônus";
}

export default function FinanceiroPage() {
  const { user } = useDashboardUser();
  const [buyingPackageId, setBuyingPackageId] = useState<string | null>(null);

  const { data: transactions, isLoading } = useSWR<CreditTransactionItem[]>(CREDIT_TRANSACTIONS_KEY, fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  });
  const { data: creditPackages, isLoading: loadingPackages } = useSWR<CreditPackageItem[]>(CREDIT_PACKAGES_KEY, fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 10000,
  });

  async function handleBuy(packageId: string) {
    setBuyingPackageId(packageId);

    try {
      const response = await fetch("/api/credits/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId }),
      });

      const payload = (await response.json()) as BuyCreditsResponse | { error?: string; code?: string };

      if (!response.ok) {
        if ((payload as { code?: string }).code === "STRIPE_PRICE_MISSING") {
          toast.error("Pacote sem Price ID — configure no admin.");
          return;
        }
        toast.error((payload as { error?: string }).error ?? "Falha ao iniciar compra.");
        return;
      }

      const checkoutUrl = (payload as BuyCreditsResponse).checkoutUrl;
      if (!checkoutUrl) {
        toast.error("Checkout indisponível no momento.");
        return;
      }

      window.location.assign(checkoutUrl);
    } catch {
      toast.error("Falha de conexão ao processar compra.");
    } finally {
      setBuyingPackageId(null);
    }
  }

  return (
    <main className="bg-background px-4 py-6 md:px-8 md:py-8">
      <div className="w-full space-y-8">
        <section className="space-y-2 border-b border-border/70 pb-4">
            <p className="font-mono-iris text-[0.65rem] uppercase tracking-widest text-iris-accent">Módulo</p>
            <h1 className="font-display text-3xl tracking-tight">Financeiro</h1>
            <p className="text-sm text-muted-foreground">
              Saldo atual: <span className="font-semibold text-foreground">{user.credits} crédito(s)</span>
            </p>
        </section>

        <section className="grid grid-cols-1 gap-4 border-b border-border/70 pb-6 md:grid-cols-3">
          {(creditPackages ?? []).map((item) => {
            const normalizedId = item.id.toLowerCase();
            const isPopular = normalizedId === "popular";
            const isBestValue = normalizedId === "value";
            const disabled = buyingPackageId !== null;

            return (
              <section
                key={item.id}
                className={`space-y-4 border-b pb-4 md:pb-5 ${
                  isBestValue ? "border-emerald-500/50" : isPopular ? "border-iris-accent/50" : "border-border/70"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-mono-iris text-[0.65rem] uppercase tracking-widest text-muted-foreground">Pacote</p>
                    {item.badge ? (
                      <Badge className={isBestValue ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600" : ""}>
                        {item.badge}
                      </Badge>
                      ) : null}
                  </div>
                  <h2 className="font-display text-3xl tracking-tight">{item.credits} Crédito{item.credits > 1 ? "s" : ""}</h2>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                </div>
                <div className="space-y-4">
                  <p className="text-2xl font-semibold text-foreground">{formatCurrency(item.priceCents)}</p>
                  <Button
                    type="button"
                    className="w-full"
                    variant={isBestValue ? "default" : "outline"}
                    onClick={() => void handleBuy(item.id)}
                    disabled={disabled}
                  >
                    {buyingPackageId === item.id ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Processando...
                      </>
                    ) : "Comprar"}
                  </Button>
                </div>
              </section>
            );
          })}

          {!loadingPackages && (creditPackages?.length ?? 0) === 0 ? (
            <div className="border-b border-border/70 py-4 text-sm text-muted-foreground md:col-span-3">Nenhum pacote ativo no momento.</div>
          ) : null}
        </section>

        <section className="space-y-4">
          <header className="border-b border-border/70 pb-3">
            <h2 className="font-display text-2xl tracking-tight">Histórico de Créditos</h2>
            <p className="text-sm text-muted-foreground">Últimas movimentações de compra, uso e bônus.</p>
          </header>
          <div className="space-y-3">
            {isLoading ? <div className="h-20 animate-pulse bg-muted/30" /> : null}

            {!isLoading && (transactions?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma movimentação registrada ainda.</p>
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
                        {formatTransactionType(item.type)} - {new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.createdAt))}
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
    </main>
  );
}
