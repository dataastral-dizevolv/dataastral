"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Check } from "lucide-react";

import { cn } from "@/lib/utils";

interface ChatConfirmRowProps {
  onBack: () => void;
  onConfirm: () => void;
  disabled?: boolean;
  confirmLabel?: string;
}

export function ChatConfirmRow({ onBack, onConfirm, disabled, confirmLabel = "Continuar" }: ChatConfirmRowProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex items-center gap-2 pl-2"
    >
      <button
        type="button"
        onClick={onBack}
        aria-label="Voltar"
        className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border text-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
      </button>
      <button
        type="button"
        onClick={onConfirm}
        disabled={disabled}
        aria-label={confirmLabel}
        className={cn(
          "flex h-9 flex-1 items-center justify-center gap-2 rounded-full px-3 transition-all",
          disabled
            ? "cursor-not-allowed bg-muted text-muted-foreground"
            : "bg-neon-blue text-primary-foreground shadow-[0_6px_20px_-6px_hsl(var(--neon-blue)/0.55)] animate-neon-pulse-once hover:opacity-90",
        )}
      >
        {confirmLabel ? <span className="text-xs font-medium tracking-wider uppercase">{confirmLabel}</span> : null}
        <Check className="size-4" strokeWidth={3} />
      </button>
    </motion.div>
  );
}
