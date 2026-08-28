"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

interface QuestionItem {
  id: string;
  title: string;
}

interface QuestionsLoopCarouselProps {
  items: QuestionItem[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  /** Auto-advance interval (ms). Default: 5000. */
  intervalMs?: number;
}

export function QuestionsLoopCarousel({
  items,
  selectedId,
  onSelect,
  intervalMs = 5000,
}: QuestionsLoopCarouselProps) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const pauseTimer = useRef<number | null>(null);

  const total = items.length;
  const current = items[index];

  useEffect(() => {
    if (!selectedId) return;
    const next = items.findIndex((q) => q.id === selectedId);
    if (next >= 0 && next !== index) setIndex(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to external selection
  }, [selectedId, items]);

  useEffect(() => {
    if (paused || total <= 1) return;
    const timer = window.setInterval(() => {
      setDirection(1);
      setIndex((currentIndex) => (currentIndex + 1) % total);
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [paused, total, intervalMs]);

  const pauseBriefly = () => {
    setPaused(true);
    if (pauseTimer.current) window.clearTimeout(pauseTimer.current);
    pauseTimer.current = window.setTimeout(() => setPaused(false), 8000);
  };

  const next = () => {
    pauseBriefly();
    setDirection(1);
    setIndex((currentIndex) => (currentIndex + 1) % total);
  };

  const prev = () => {
    pauseBriefly();
    setDirection(-1);
    setIndex((currentIndex) => (currentIndex - 1 + total) % total);
  };

  if (!current) return null;
  const isSelected = selectedId === current.id;

  return (
    <div className="flex items-stretch justify-center gap-1 sm:gap-2 md:gap-3">
      <button
        type="button"
        onClick={prev}
        aria-label="Pergunta anterior"
        className="flex size-8 shrink-0 self-center items-center justify-center rounded-full border border-border bg-background text-foreground/70 transition-colors hover:border-foreground/50 hover:text-foreground sm:size-9"
      >
        <ChevronLeft className="size-4" />
      </button>

      <div className="relative h-[220px] min-w-0 flex-1 overflow-hidden sm:h-[320px] md:h-[400px] lg:h-[480px]">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.button
            key={current.id}
            type="button"
            onClick={() => {
              pauseBriefly();
              onSelect(current.id);
            }}
            custom={direction}
            initial={{ opacity: 0, x: direction * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -direction * 40 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "absolute inset-0 flex items-center overflow-hidden rounded-2xl border px-4 py-5 text-left transition-colors sm:px-7 sm:py-8 md:px-9 md:py-10",
              isSelected
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-background text-foreground hover:border-foreground/40",
            )}
          >
            <p className="font-jakarta text-[22px] leading-[1.08] font-black tracking-[-0.02em] sm:text-[36px] md:text-[52px] lg:text-[72px]">
              {current.title}
            </p>
            {isSelected ? (
              <motion.span
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 380, damping: 22 }}
                className="absolute top-3 right-3 flex size-7 items-center justify-center rounded-full bg-neon-blue text-primary-foreground shadow-[0_4px_16px_-4px_hsl(var(--neon-blue)/0.6)]"
              >
                <Check className="size-4" strokeWidth={3} />
              </motion.span>
            ) : null}

            <div className="absolute right-0 bottom-0 left-0 h-[2px] overflow-hidden">
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{
                  duration: 2.5,
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatType: "loop",
                  repeatDelay: 0.3,
                }}
                className={cn("h-full w-1/3 rounded-full", isSelected ? "bg-background/80" : "bg-foreground/40")}
              />
            </div>
          </motion.button>
        </AnimatePresence>
      </div>

      <button
        type="button"
        onClick={next}
        aria-label="Próxima pergunta"
        className="flex size-8 shrink-0 self-center items-center justify-center rounded-full border border-border bg-background text-foreground/70 transition-colors hover:border-foreground/50 hover:text-foreground sm:size-9"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
