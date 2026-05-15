"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const NARRATIVE_MESSAGES = [
  "Mapeando as coordenadas do seu nascimento...",
  "Calculando trânsitos planetários de longo prazo...",
  "O Motor Iris está localizando os gatilhos exatos...",
  "Sincronizando efemérides com o seu mapa natal...",
];

export function StepLoading() {
  const [messageIndex, setMessageIndex] = useState(0);

  const particles = useMemo(
    () =>
      Array.from({ length: 22 }, (_, index) => {
        const x = (index * 17) % 100;
        const y = (index * 29) % 100;
        const delay = (index % 6) * 0.7;
        const duration = 8 + (index % 5) * 2.2;
        const size = 1.2 + (index % 4) * 0.9;

        return { x, y, delay, duration, size };
      }),
    [],
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % NARRATIVE_MESSAGES.length);
    }, 2500);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  return (
    <motion.div
      key="loading"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative flex min-h-[360px] items-center justify-center overflow-hidden rounded-md border border-iris bg-background"
    >
      <div className="pointer-events-none absolute inset-0 opacity-50">
        {particles.map((particle, index) => (
          <motion.span
            key={`particle-${index}`}
            className="absolute rounded-full bg-foreground/60"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
            }}
            animate={{
              y: [0, -10, 0, 8, 0],
              x: [0, 5, -3, 4, 0],
              opacity: [0.2, 0.75, 0.35, 0.9, 0.2],
            }}
            transition={{
              duration: particle.duration,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: particle.delay,
            }}
          />
        ))}
      </div>

      <div className="relative flex w-full max-w-md flex-col items-center gap-9 px-6 py-10 text-center">
        <div className="relative flex h-52 w-52 items-center justify-center">
          <motion.div
            className="absolute h-[190px] w-[190px] rounded-full border border-foreground/20"
            animate={{ rotate: 360 }}
            transition={{ duration: 22, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          />
          <motion.div
            className="absolute h-[142px] w-[142px] rounded-full border border-foreground/30"
            animate={{ rotate: -360 }}
            transition={{ duration: 14, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          />
          <motion.div
            className="absolute h-[96px] w-[96px] rounded-full border border-foreground/40"
            animate={{ rotate: 360 }}
            transition={{ duration: 9, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          />

          <motion.span
            className="absolute h-3 w-3 rounded-full bg-foreground/80"
            style={{ top: "16%", left: "74%" }}
            animate={{ scale: [0.7, 1.15, 0.7], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          />
          <motion.span
            className="absolute h-2.5 w-2.5 rounded-full bg-foreground/70"
            style={{ top: "66%", left: "17%" }}
            animate={{ scale: [1.1, 0.75, 1.1], opacity: [0.8, 0.35, 0.8] }}
            transition={{ duration: 2.8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          />
          <motion.span
            className="h-5 w-5 rounded-full bg-foreground"
            animate={{ scale: [0.9, 1.2, 0.9], opacity: [0.75, 1, 0.75] }}
            transition={{ duration: 2.2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          />
        </div>

        <div className="space-y-3">
          <p className="font-mono-iris text-[0.65rem] uppercase tracking-[0.2em] text-iris-secondary">Sincronia Cosmológica</p>
          <AnimatePresence mode="wait">
            <motion.p
              key={NARRATIVE_MESSAGES[messageIndex]}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.45, ease: "easeInOut" }}
              className="mx-auto max-w-sm font-body text-sm leading-relaxed text-iris-secondary"
            >
              {NARRATIVE_MESSAGES[messageIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
