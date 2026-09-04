"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { Activity, Briefcase, Check, ChevronLeft, ChevronRight, Coins, Heart, Home, Plane, type LucideIcon } from "lucide-react";

import { THEMES } from "@/lib/calculator-data";
import { cn } from "@/lib/utils";
import type { ThemeId } from "@/types/calculator";

const CALIBRATION_THEME_IDS = new Set<ThemeId>(["carreira", "saude", "familia", "viagens"]);

const THEME_ICONS: Record<ThemeId, LucideIcon> = {
  amor: Heart,
  carreira: Briefcase,
  financas: Coins,
  saude: Activity,
  familia: Home,
  viagens: Plane,
};

/** Soft blue scale mapped to iris-blue tokens (Lovable tone ladder). */
const TONES = [
  { bg: "var(--color-iris-blue-mist)", fg: "var(--color-iris-blue-graphite)", icon: "var(--color-iris-blue-steel)" },
  { bg: "var(--color-iris-blue-crystal)", fg: "var(--color-iris-blue-graphite)", icon: "var(--color-iris-blue-deep)" },
  { bg: "var(--color-iris-blue-chambray)", fg: "var(--color-iris-blue-graphite)", icon: "var(--color-iris-blue-ink)" },
  { bg: "var(--color-iris-blue-steel)", fg: "hsl(var(--primary-foreground))", icon: "var(--color-iris-blue-mist)" },
  { bg: "var(--color-iris-blue-ink)", fg: "hsl(var(--primary-foreground))", icon: "var(--color-iris-blue-chambray)" },
  { bg: "var(--color-iris-blue-graphite)", fg: "hsl(var(--primary-foreground))", icon: "var(--color-iris-blue-crystal)" },
];

interface ThemeCardsCarouselProps {
  selected: ThemeId | null;
  onSelect: (theme: ThemeId) => void;
}

export function ThemeCardsCarousel({ selected, onSelect }: ThemeCardsCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    const element = scrollRef.current;
    if (!element) return;
    const card = element.querySelector<HTMLElement>("[data-theme-card]")?.offsetWidth ?? 64;
    element.scrollBy({ left: direction === "left" ? -card - 6 : card + 6, behavior: "smooth" });
  };

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between px-4 sm:px-6">
        <button
          type="button"
          onClick={() => scroll("left")}
          aria-label="Temas anteriores"
          className="flex size-7 items-center justify-center rounded-full border border-border bg-background text-foreground/60 transition-colors hover:border-foreground/40 hover:text-foreground"
        >
          <ChevronLeft className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() => scroll("right")}
          aria-label="Próximos temas"
          className="flex size-7 items-center justify-center rounded-full border border-border bg-background text-foreground/60 transition-colors hover:border-foreground/40 hover:text-foreground"
        >
          <ChevronRight className="size-3.5" />
        </button>
      </div>

      <div
        ref={scrollRef}
        className="no-scrollbar flex snap-x snap-mandatory items-stretch justify-center overflow-x-auto py-2"
      >
        {THEMES.map((theme, index) => {
          const active = selected === theme.id;
          const Icon = THEME_ICONS[theme.id];
          const isCalibration = CALIBRATION_THEME_IDS.has(theme.id);
          const tone = TONES[index % TONES.length];

          return (
            <motion.button
              key={theme.id}
              type="button"
              data-theme-card
              aria-label={theme.name}
              disabled={isCalibration}
              title={isCalibration ? "Em breve" : theme.name}
              onClick={isCalibration ? undefined : () => onSelect(theme.id)}
              whileTap={isCalibration ? undefined : { scale: 0.96 }}
              className={cn(
                "relative mr-1.5 flex h-[5.5rem] w-14 shrink-0 snap-start flex-col justify-between overflow-hidden rounded-3xl border p-1.5 text-left transition-colors duration-300 last:mr-0 sm:h-28 sm:w-20 sm:p-2 md:h-32 md:w-24 md:p-2.5",
                isCalibration
                  ? "cursor-not-allowed border-border bg-muted text-muted-foreground opacity-40"
                  : active
                    ? "border-foreground"
                    : "border-foreground/[0.08] hover:border-foreground/25",
              )}
              style={
                isCalibration
                  ? undefined
                  : {
                      backgroundColor: active ? "hsl(var(--deep-navy))" : tone.bg,
                      color: active ? "hsl(var(--primary-foreground))" : tone.fg,
                      boxShadow: "0 24px 50px -24px hsl(0 0% 0% / 0.45)",
                    }
              }
            >
              <div className="flex items-start justify-between">
                <span
                  className={cn(
                    "text-[8px] font-medium tracking-[0.12em]",
                    active ? "text-primary-foreground/60" : "text-foreground/50",
                  )}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                {active ? (
                  <motion.span
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 380, damping: 22 }}
                    className="flex size-4 items-center justify-center rounded-full bg-neon-blue text-primary-foreground shadow-[0_4px_16px_-4px_hsl(var(--neon-blue)/0.6)]"
                  >
                    <Check className="size-2.5" strokeWidth={3} />
                  </motion.span>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Icon
                  className="size-4 sm:size-5 md:size-6"
                  strokeWidth={1.5}
                  style={{ color: active ? "hsl(var(--primary-foreground))" : tone.icon }}
                />
                <p className="text-[10px] leading-[1.2] font-semibold sm:text-[11px] md:text-xs">{theme.name}</p>
              </div>
              {isCalibration ? <span className="text-[8px] uppercase tracking-wider">Em breve</span> : null}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
