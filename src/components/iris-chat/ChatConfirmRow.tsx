"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="flex items-center gap-3"
    >
      <button
        type="button"
        onClick={onBack}
        aria-label="Voltar"
        className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
      </button>
      <Button
        type="button"
        onClick={onConfirm}
        disabled={disabled}
        className={cn("h-11 flex-1 font-sans text-xs uppercase tracking-wider")}
      >
        {confirmLabel}
        <Check className="size-4" strokeWidth={3} />
      </Button>
    </motion.div>
  );
}
