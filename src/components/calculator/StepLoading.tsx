"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const NARRATIVE_MESSAGES = [
  "Mapeando as coordenadas do seu nascimento...",
  "Calculando transitos planetarios de longo prazo...",
  "O Motor Iris esta localizando os gatilhos exatos...",
  "Sincronizando efemerides com o seu mapa natal...",
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
      className="relative flex min-h-[360px] items-center justify-center overflow-hidden rounded-2xl border border-iris bg-background/70"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--iris-accent)/0.2),transparent_46%),radial-gradient(circle_at_75%_75%,hsl(var(--iris-accent)/0.15),transparent_42%)]" />

      <div className="pointer-events-none absolute inset-0 opacity-70">
        {particles.map((particle, index) => (
          <motion.span
            key={`particle-${index}`}
            className="absolute rounded-full bg-iris-accent"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              boxShadow: "0 0 10px hsl(var(--iris-accent) / 0.55)",
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
            className="absolute h-[190px] w-[190px] rounded-full border border-iris-accent/40"
            style={{ boxShadow: "0 0 30px hsl(var(--iris-accent) / 0.35), inset 0 0 24px hsl(var(--iris-accent) / 0.18)" }}
            animate={{ rotate: 360 }}
            transition={{ duration: 22, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          />
          <motion.div
            className="absolute h-[142px] w-[142px] rounded-full border border-iris-accent/55"
            style={{ boxShadow: "0 0 24px hsl(var(--iris-accent) / 0.45), inset 0 0 20px hsl(var(--iris-accent) / 0.22)" }}
            animate={{ rotate: -360 }}
            transition={{ duration: 14, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          />
          <motion.div
            className="absolute h-[96px] w-[96px] rounded-full border border-iris-accent/70"
            style={{ boxShadow: "0 0 20px hsl(var(--iris-accent) / 0.52), inset 0 0 16px hsl(var(--iris-accent) / 0.28)" }}
            animate={{ rotate: 360 }}
            transition={{ duration: 9, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          />

          <motion.span
            className="absolute h-3 w-3 rounded-full bg-iris-accent"
            style={{ top: "16%", left: "74%", boxShadow: "0 0 18px hsl(var(--iris-accent) / 0.7)" }}
            animate={{ scale: [0.7, 1.15, 0.7], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          />
          <motion.span
            className="absolute h-2.5 w-2.5 rounded-full bg-iris-accent"
            style={{ top: "66%", left: "17%", boxShadow: "0 0 14px hsl(var(--iris-accent) / 0.6)" }}
            animate={{ scale: [1.1, 0.75, 1.1], opacity: [0.8, 0.35, 0.8] }}
            transition={{ duration: 2.8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          />
          <motion.span
            className="h-5 w-5 rounded-full bg-iris-accent"
            style={{ boxShadow: "0 0 24px hsl(var(--iris-accent) / 0.8), 0 0 42px hsl(var(--iris-accent) / 0.5)" }}
            animate={{ scale: [0.9, 1.2, 0.9], opacity: [0.75, 1, 0.75] }}
            transition={{ duration: 2.2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          />
        </div>

        <div className="space-y-3">
          <p className="font-mono-iris text-[0.65rem] uppercase tracking-[0.2em] text-iris-accent/85">Sincronia Cosmologica</p>
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
