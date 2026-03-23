"use client";

import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Coins } from "lucide-react";
import useSWR, { useSWRConfig } from "swr";
import { toast } from "sonner";

import { DASHBOARD_ME_KEY, useDashboardUser } from "@/components/dashboard/DashboardUserContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CREDIT_PACKAGES } from "@/lib/credits/packages";
import type { BuyCreditsResponse, CreditTransactionItem } from "@/types/credits";

const CREDIT_TRANSACTIONS_KEY = "/api/credits/transactions?limit=30";

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
  const { mutate } = useSWRConfig();
  const [buyingPackageId, setBuyingPackageId] = useState<string | null>(null);

  const { data: transactions, isLoading } = useSWR<CreditTransactionItem[]>(CREDIT_TRANSACTIONS_KEY, fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  });

  async function handleBuy(packageId: string) {
    setBuyingPackageId(packageId);

    try {
      const response = await fetch("/api/credits/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId }),
      });

      const payload = (await response.json()) as BuyCreditsResponse | { error?: string };

      if (!response.ok) {
        toast.error((payload as { error?: string }).error ?? "Falha ao simular compra.");
        return;
      }

      await Promise.all([
        mutate(DASHBOARD_ME_KEY),
        mutate(CREDIT_TRANSACTIONS_KEY),
      ]);

      toast.success(`Compra simulada: +${(payload as BuyCreditsResponse).addedCredits} crédito(s).`);
    } catch {
      toast.error("Falha de conexão ao processar compra.");
    } finally {
      setBuyingPackageId(null);
    }
  }

  return (
    <main className="bg-background px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <Card className="border border-border py-0 shadow-none">
          <CardHeader className="space-y-2 p-6">
            <p className="font-mono-iris text-[0.65rem] uppercase tracking-widest text-iris-accent">Módulo</p>
            <CardTitle className="font-display text-3xl tracking-tight">Financeiro</CardTitle>
            <CardDescription>
              Saldo atual: <span className="font-semibold text-foreground">{user.credits} crédito(s)</span>
            </CardDescription>
          </CardHeader>
        </Card>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {CREDIT_PACKAGES.map((item) => {
            const isPopular = item.id === "popular";
            const isBestValue = item.id === "value";
            const disabled = buyingPackageId !== null;

            return (
              <Card
                key={item.id}
                className={`relative border py-0 shadow-none ${
                  isBestValue ? "border-emerald-500/50" : isPopular ? "border-iris-accent/50" : "border-border"
                }`}
              >
                <CardHeader className="space-y-2 p-6">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-mono-iris text-[0.65rem] uppercase tracking-widest text-muted-foreground">Pacote</p>
                    {item.badge ? (
                      <Badge className={isBestValue ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600" : ""}>
                        {item.badge}
                      </Badge>
                    ) : null}
                  </div>
                  <CardTitle className="font-display text-3xl tracking-tight">{item.credits} Crédito{item.credits > 1 ? "s" : ""}</CardTitle>
                  <CardDescription>{item.savingsLabel ?? "Preço base"}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-6 pt-0">
                  <p className="text-2xl font-semibold text-foreground">{formatCurrency(item.priceCents)}</p>
                  <Button
                    type="button"
                    className="w-full"
                    variant={isBestValue ? "default" : "outline"}
                    onClick={() => void handleBuy(item.id)}
                    disabled={disabled}
                  >
                    {buyingPackageId === item.id ? "Processando..." : "Comprar"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <Card className="border border-border py-0 shadow-none">
          <CardHeader className="p-6">
            <CardTitle className="font-display text-2xl tracking-tight">Histórico de Créditos</CardTitle>
            <CardDescription>Últimas movimentações de compra, uso e bônus.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-6 pt-0">
            {isLoading ? <div className="h-20 animate-pulse rounded-lg bg-muted" /> : null}

            {!isLoading && (transactions?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma movimentação registrada ainda.</p>
            ) : null}

            {(transactions ?? []).map((item) => {
              const positive = item.amount > 0;

              return (
                <div key={item.id} className="flex items-start justify-between gap-3 rounded-xl border border-border p-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className={`mt-0.5 rounded-full p-1.5 ${positive ? "bg-emerald-500/10" : "bg-iris-accent/10"}`}>
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
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
