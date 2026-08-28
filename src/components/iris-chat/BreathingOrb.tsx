"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { cn } from "@/lib/utils";

interface BreathingOrbProps {
  cycles?: number;
  onComplete?: () => void;
  className?: string;
}

const INHALE_MS = 4000;
const EXHALE_MS = 8000;

export function BreathingOrb({ cycles, onComplete, className = "" }: BreathingOrbProps) {
  const [phase, setPhase] = useState<"inhale" | "exhale">("inhale");
  const [cycleCount, setCycleCount] = useState(0);

  useEffect(() => {
    const duration = phase === "inhale" ? INHALE_MS : EXHALE_MS;
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
  }, [phase, cycleCount, cycles, onComplete]);

  const targetScale = phase === "inhale" ? 0.55 : 1;
  const duration = (phase === "inhale" ? INHALE_MS : EXHALE_MS) / 1000;

  return (
    <div className={cn("relative flex select-none flex-col items-center justify-center", className)}>
      <div className="relative flex h-[260px] w-[260px] items-center justify-center sm:h-[320px] sm:w-[320px]">
        <div className="absolute inset-0 rounded-full bg-[hsl(210_70%_78%)] opacity-85" />
        <motion.div
          className="absolute inset-0 rounded-full bg-[hsl(250_60%_55%)] opacity-75 mix-blend-multiply"
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
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-center font-jakarta text-[18px] font-black tracking-[0.01em] text-iris-blue-graphite sm:text-[22px]"
          >
            {phase === "inhale" ? "Respira profundo…" : "e solte devagar…"}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
