"use client";

import Link from "next/link";

import { CreditPackageCard } from "@/components/payments/CreditPackageCard";
import type { CreditPackageItem } from "@/types/credits";

interface PricingCatalogProps {
  packages: CreditPackageItem[] | undefined;
  isLoading: boolean;
  error: boolean;
  selectedPackageId: string | null;
  authPending: boolean;
  onSelect: (packageId: string) => void;
  onPay: (packageId: string) => void;
}

export function PricingCatalog({
  packages,
  isLoading,
  error,
  selectedPackageId,
  authPending,
  onSelect,
  onPay,
}: PricingCatalogProps) {
  return (
    <>
      <div className="text-center">
        <p className="mb-3 font-ubuntu text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Data Iris</p>
        <h1 className="font-ubuntu text-3xl font-black tracking-tight text-foreground sm:text-5xl">
          Planos e Créditos
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground">
          As primeiras perguntas são gratuitas. Depois, use créditos para continuar perguntando ao céu com datas reais.
        </p>
      </div>

      <section className="mt-12">
        <div className="mb-6 text-center">
          <p className="font-ubuntu text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Serviços avulsos · sem assinatura
          </p>
          <h2 className="mt-2 font-jakarta text-2xl font-black text-foreground">Crédito por Serviço</h2>
        </div>

        {/*
          Não vamos portar (Lovable Precos.tsx):
          - Assinaturas trimestral/anual (iris_trimestral / iris_anual) e tabela subscriptions
          - Seletor multi-moeda BRL/USD/EUR (cobrança no Next é sempre o Price Stripe em BRL)
          - Quantidade 1–10 com desconto 25%/30% sobre unidade avulsa
          Este app vende apenas pacotes ativos em credit_packages, em BRL, via Stripe.
        */}

        {isLoading ? (
          <p className="border-b border-border py-8 text-sm text-muted-foreground">Carregando pacotes…</p>
        ) : null}

        {error ? (
          <p className="border-b border-border py-8 text-sm text-muted-foreground">
            Pacotes dinâmicos indisponíveis agora. Entre em{" "}
            <Link href="/financeiro" className="font-medium text-iris-accent underline-offset-4 hover:underline">
              Financeiro
            </Link>{" "}
            após o login, ou{" "}
            <Link href="/cadastro" className="font-medium text-iris-accent underline-offset-4 hover:underline">
              crie sua conta
            </Link>
            .
          </p>
        ) : null}

        {!isLoading && !error && (packages?.length ?? 0) === 0 ? (
          <p className="border-b border-border py-8 text-sm text-muted-foreground">
            Nenhum pacote ativo no momento.
          </p>
        ) : null}

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-3">
          {(packages ?? []).map((pkg) => (
            <CreditPackageCard
              key={pkg.id}
              pkg={pkg}
              selected={selectedPackageId === pkg.id}
              authPending={authPending}
              onSelect={() => onSelect(pkg.id)}
              onPay={() => onPay(pkg.id)}
            />
          ))}
        </div>
      </section>

      <p className="mt-10 text-center text-xs text-muted-foreground">
        Pagamentos seguros via Stripe · 7 dias para reembolso conforme CDC. Veja a política em{" "}
        <Link href="/reembolso" className="text-iris-accent underline-offset-4 hover:underline">
          /reembolso
        </Link>
        .
      </p>
    </>
  );
}
