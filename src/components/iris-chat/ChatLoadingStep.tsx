"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const NARRATIVE_MESSAGES = [
  "Mapeando as coordenadas do seu nascimento...",
  "Calculando trânsitos planetários de longo prazo...",
  "O Motor Iris está localizando os gatilhos exatos...",
  "Sincronizando efemérides com o seu mapa natal...",
];

interface ChatLoadingStepProps {
  onCancel?: () => void;
}

export function ChatLoadingStep({ onCancel }: ChatLoadingStepProps) {
  const [messageIndex, setMessageIndex] = useState(0);

  const particles = useMemo(
    () =>
      Array.from({ length: 16 }, (_, index) => ({
        x: (index * 17) % 100,
        y: (index * 29) % 100,
        delay: (index % 6) * 0.7,
        duration: 8 + (index % 5) * 2.2,
        size: 1.2 + (index % 4) * 0.9,
      })),
    [],
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % NARRATIVE_MESSAGES.length);
    }, 2500);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="relative flex min-h-[320px] items-center justify-center overflow-hidden rounded-2xl border border-border bg-card">
      <div className="pointer-events-none absolute inset-0 opacity-50">
        {particles.map((particle, index) => (
          <motion.span
            key={`particle-${index}`}
            className="absolute rounded-full bg-iris/40"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
            }}
            animate={{ y: [0, -10, 0, 8, 0], opacity: [0.2, 0.75, 0.35, 0.9, 0.2] }}
            transition={{ duration: particle.duration, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: particle.delay }}
          />
        ))}
      </div>

      <div className="relative flex w-full max-w-md flex-col items-center gap-8 px-6 py-10 text-center">
        <div className="relative flex h-44 w-44 items-center justify-center">
          <motion.div
            className="absolute h-[160px] w-[160px] rounded-full border border-border"
            animate={{ rotate: 360 }}
            transition={{ duration: 22, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          />
          <motion.div
            className="absolute h-[110px] w-[110px] rounded-full border border-iris/30"
            animate={{ rotate: -360 }}
            transition={{ duration: 14, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          />
          <motion.span
            className="size-5 rounded-full bg-iris"
            animate={{ scale: [0.9, 1.15, 0.9], opacity: [0.75, 1, 0.75] }}
            transition={{ duration: 2.2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          />
        </div>

        <div className="space-y-3">
          <p className="font-mono-iris text-[0.65rem] tracking-[0.2em] text-muted-foreground uppercase">Sincronia Cosmológica</p>
          <AnimatePresence mode="wait">
            <motion.p
              key={NARRATIVE_MESSAGES[messageIndex]}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mx-auto max-w-sm font-sans text-sm leading-relaxed text-muted-foreground"
            >
              {NARRATIVE_MESSAGES[messageIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        {onCancel ? (
          <button type="button" onClick={onCancel} className="text-xs text-muted-foreground transition-colors hover:text-foreground">
            Cancelar
          </button>
        ) : null}
      </div>
    </div>
  );
}
