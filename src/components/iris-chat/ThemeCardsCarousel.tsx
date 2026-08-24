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

interface ThemeCardsCarouselProps {
  selected: ThemeId | null;
  onSelect: (theme: ThemeId) => void;
}

export function ThemeCardsCarousel({ selected, onSelect }: ThemeCardsCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    const element = scrollRef.current;
    if (!element) return;
    const card = element.querySelector<HTMLElement>("[data-theme-card]")?.offsetWidth ?? 72;
    element.scrollBy({ left: direction === "left" ? -card - 8 : card + 8, behavior: "smooth" });
  };

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between px-1">
        <button
          type="button"
          onClick={() => scroll("left")}
          aria-label="Temas anteriores"
          className="flex size-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() => scroll("right")}
          aria-label="Próximos temas"
          className="flex size-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronRight className="size-3.5" />
        </button>
      </div>

      <div ref={scrollRef} className="no-scrollbar flex snap-x snap-mandatory items-stretch overflow-x-auto py-2">
        {THEMES.map((theme, index) => {
          const active = selected === theme.id;
          const Icon = THEME_ICONS[theme.id];
          const isCalibration = CALIBRATION_THEME_IDS.has(theme.id);

          return (
            <motion.button
              key={theme.id}
              type="button"
              data-theme-card
              aria-label={theme.name}
              disabled={isCalibration}
              title={isCalibration ? "Em breve" : theme.name}
              onClick={isCalibration ? undefined : () => onSelect(theme.id)}
              whileTap={isCalibration ? undefined : { scale: 0.97 }}
              className={cn(
                "relative mr-2 flex h-28 w-20 shrink-0 snap-start flex-col justify-between overflow-hidden rounded-2xl border p-2 text-left last:mr-0 sm:h-32 sm:w-24",
                isCalibration
                  ? "cursor-not-allowed border-border bg-muted text-muted-foreground opacity-40"
                  : active
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-card text-foreground hover:border-foreground/40",
              )}
            >
              <div className="flex items-start justify-between">
                <span className="text-[8px] font-medium tracking-[0.12em] opacity-60">{String(index + 1).padStart(2, "0")}</span>
                {active ? (
                  <span className="flex size-4 items-center justify-center rounded-full bg-background text-foreground">
                    <Check className="size-2.5" strokeWidth={3} />
                  </span>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Icon className="size-5" strokeWidth={1.5} />
                <p className="text-[10px] leading-tight font-semibold sm:text-xs">{theme.name}</p>
              </div>
              {isCalibration ? <span className="text-[8px] uppercase tracking-wider">Em breve</span> : null}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
