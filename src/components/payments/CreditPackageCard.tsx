"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { CreditPackageItem } from "@/types/credits";

export const CREDIT_PACKAGE_HOW_IT_WORKS = [
  "Cada crédito equivale a uma pergunta no Data Iris. Você escolhe a pergunta e o app calcula, no seu mapa, a próxima e melhor data para o que você pede.",
  "Essas datas são a posição dos astros que favorecem seus planejamentos. O resultado depende de cada pessoa. Não é adivinhação: são os melhores momentos para planejar a vida e os objetivos.",
  "As primeiras perguntas são gratuitas para você conhecer. Reembolsos ocorrem apenas dentro de 7 dias corridos após a compra, para créditos não utilizados.",
].join("\n\n");

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

interface CreditPackageCardProps {
  pkg: CreditPackageItem;
  selected: boolean;
  authPending: boolean;
  onSelect: () => void;
  onPay: () => void;
}

export function CreditPackageCard({ pkg, selected, authPending, onSelect, onPay }: CreditPackageCardProps) {
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);

  return (
    <article className="flex flex-col rounded-2xl border border-border bg-card p-5">
      <div className="flex-1">
        {pkg.badge ? (
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-iris-accent">{pkg.badge}</p>
        ) : null}
        <p className="font-ubuntu text-[28px] font-extrabold leading-none tracking-tight text-foreground sm:text-[34px]">
          {pkg.label}
        </p>
        <p className="mt-3 text-sm text-muted-foreground">{pkg.credits} crédito{pkg.credits === 1 ? "" : "s"}</p>
        <button
          type="button"
          onClick={() => setHowItWorksOpen((open) => !open)}
          className="mt-2 text-[11px] font-medium text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-foreground"
        >
          Como funciona
        </button>
      </div>

      <div className="mt-5">
        <p className="font-jakarta text-3xl font-extrabold text-foreground">{formatBRL(pkg.priceCents)}</p>
        <Button
          type="button"
          variant={selected ? "default" : "outline"}
          className="mt-6 h-10 w-full rounded-full font-jakarta text-sm font-bold"
          disabled={authPending}
          aria-pressed={selected}
          onClick={() => {
            if (selected) {
              onPay();
              return;
            }
            onSelect();
          }}
        >
          {authPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              …
            </>
          ) : selected ? (
            <>
              <Check className="h-4 w-4" />
              Pagar
            </>
          ) : (
            "Comprar"
          )}
        </Button>
      </div>

      {howItWorksOpen ? (
        <div className="mt-4 border-t border-border pt-4">
          {CREDIT_PACKAGE_HOW_IT_WORKS.split("\n\n").map((paragraph) => (
            <p key={paragraph.slice(0, 24)} className="mb-2.5 text-[12px] leading-[1.6] text-muted-foreground last:mb-0">
              {paragraph}
            </p>
          ))}
        </div>
      ) : null}
    </article>
  );
}
