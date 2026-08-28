"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";

import { AspectsPanel } from "@/components/mapa-astral/AspectsPanel";
import { ElementModalityBars } from "@/components/mapa-astral/ElementModalityBars";
import type { ChartData, Planet } from "@/components/mapa-astral/types";
import type { PlanetInput } from "@/lib/astrology/aspect-analysis";
import { signFromLongitude } from "@/lib/astrology/natal-chart";
import { cn } from "@/lib/utils";

interface ChartSectionsProps {
  chart: ChartData;
  planetInputs: PlanetInput[];
  elementData: { label: string; value: number; color: string }[];
  modalityData: { label: string; value: number; color: string }[];
  openPlanet: (p: Planet) => void;
  onElementClick: (key: string) => void;
  onModalityClick: (key: string) => void;
}

export function ChartSections({
  chart,
  planetInputs,
  elementData,
  modalityData,
  openPlanet,
  onElementClick,
  onModalityClick,
}: ChartSectionsProps) {
  const [open, setOpen] = React.useState<string | null>(null);
  const sections = ["Modalidades", "Elementos", "Planetas", "Aspectos"] as const;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2.5">
        {sections.map((s) => {
          const active = open === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setOpen(active ? null : s)}
              aria-expanded={active}
              className={cn(
                "flex items-center justify-between gap-2 rounded-2xl border px-4 py-3.5 text-left transition-colors",
                active
                  ? "border-transparent bg-foreground text-background"
                  : "border-border bg-background text-foreground hover:bg-muted/50",
              )}
            >
              <span className="font-jakarta text-xs font-black tracking-[0.06em] uppercase">{s}</span>
              <Plus className={cn("h-3.5 w-3.5 shrink-0 transition-transform duration-300", active && "rotate-45")} />
            </button>
          );
        })}
      </div>

      <AnimatePresence initial={false} mode="wait">
        {open ? (
          <motion.div
            key={open}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 0.61, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="mb-2 px-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Clique em cada tema para saber o significado
            </p>

            {open === "Modalidades" ? (
              <ElementModalityBars
                title="Modalidades"
                unit="pl"
                data={modalityData}
                onItemClick={(item) => onModalityClick(item.label)}
              />
            ) : null}
            {open === "Elementos" ? (
              <ElementModalityBars
                title="Elementos"
                unit="pl"
                data={elementData}
                onItemClick={(item) => onElementClick(item.label)}
              />
            ) : null}
            {open === "Aspectos" ? <AspectsPanel planets={planetInputs} topCount={5} /> : null}
            {open === "Planetas" ? (
              <div className="rounded-2xl border border-border bg-background p-4 sm:p-5">
                <p className="mb-3 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Planetas</p>
                <ul className="divide-y divide-border">
                  {chart.planets.map((p) => {
                    const s = signFromLongitude(p.longitude);
                    return (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => openPlanet(p)}
                          className="flex w-full items-center justify-between rounded-md px-1 py-2.5 text-left transition-colors hover:bg-muted/40"
                        >
                          <span className="flex items-center gap-3">
                            <span className="inline-block h-2 w-2 rounded-full bg-iris-blue-chambray" />
                            <span className="font-jakarta text-sm font-black">{p.label}</span>
                          </span>
                          <span className="text-sm">
                            <span className="font-jakarta font-black">{s.name}</span>
                            <span className="ml-2 text-xs tabular-nums text-muted-foreground">
                              {s.degree}°{String(s.minute).padStart(2, "0")}′
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
