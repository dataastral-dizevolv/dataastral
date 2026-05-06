"use client";

import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";

interface CreditosWidgetProps {
  credits: number;
  loading?: boolean;
  actions?: ReactNode;
}

export function CreditosWidget({ credits, loading = false, actions }: CreditosWidgetProps) {
  return (
    <div className="border-b border-border/70 py-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono-iris text-[0.65rem] uppercase tracking-widest text-muted-foreground">Créditos</p>
        <div className="flex items-center gap-2">
          {actions}
          <Sparkles className="size-3.5 text-iris-accent" />
        </div>
      </div>
      {loading ? (
        <div className="mt-2 h-7 w-16 animate-pulse rounded bg-muted" />
      ) : (
        <p className="mt-1 font-display text-2xl tracking-tight text-foreground">{credits}</p>
      )}
    </div>
  );
}
