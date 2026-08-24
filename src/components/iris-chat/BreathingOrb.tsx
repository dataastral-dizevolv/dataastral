"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { cn } from "@/lib/utils";

interface BreathingOrbProps {
  cycles?: number;
  onComplete?: () => void;
  className?: string;
  inhaleMs?: number;
  exhaleMs?: number;
}

export function BreathingOrb({
  cycles = 1,
  onComplete,
  className = "",
  inhaleMs = 1600,
  exhaleMs = 2200,
}: BreathingOrbProps) {
  const [phase, setPhase] = useState<"inhale" | "exhale">("inhale");
  const [cycleCount, setCycleCount] = useState(0);

  useEffect(() => {
    const duration = phase === "inhale" ? inhaleMs : exhaleMs;
    const timer = window.setTimeout(() => {
      if (phase === "inhale") {
        setPhase("exhale");
        return;
      }

      const next = cycleCount + 1;
      setCycleCount(next);
      if (cycles && next >= cycles) {
        onComplete?.();
        return;
      }
      setPhase("inhale");
    }, duration);

    return () => window.clearTimeout(timer);
  }, [phase, cycleCount, cycles, onComplete, inhaleMs, exhaleMs]);

  const targetScale = phase === "inhale" ? 0.55 : 1;
  const duration = (phase === "inhale" ? inhaleMs : exhaleMs) / 1000;

  return (
    <div className={cn("relative flex select-none flex-col items-center justify-center", className)}>
      <div className="relative flex h-[220px] w-[220px] items-center justify-center sm:h-[280px] sm:w-[280px]">
        <div className="absolute inset-0 rounded-full bg-powder-blue/80" />
        <motion.div
          className="absolute inset-0 rounded-full bg-iris/70"
          animate={{ scale: targetScale }}
          transition={{ duration, ease: [0.45, 0, 0.55, 1] }}
        />
      </div>
      <div className="mt-4 flex h-10 items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={phase}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="text-center font-jakarta text-lg font-black tracking-[0.01em] text-foreground sm:text-[22px]"
          >
            {phase === "inhale" ? "Respira profundo…" : "e solte devagar…"}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
