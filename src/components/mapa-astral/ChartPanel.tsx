"use client";

import * as React from "react";

import { NatalChartWheel } from "@/components/natal-chart/NatalChartWheel";
import { signFromLongitude } from "@/lib/astrology/natal-chart";
import type { ChartData, Planet } from "@/components/mapa-astral/types";

interface ChartPanelProps {
  chart: ChartData;
  showHouses?: boolean;
  axes: { label: string; lon: number }[];
  selectedId: string | null;
  openPlanet: (p: Planet) => void;
  onAngleClick: (key: string) => void;
}

export function ChartPanel({
  chart,
  showHouses = true,
  axes,
  selectedId,
  openPlanet,
  onAngleClick,
}: ChartPanelProps) {
  const chartRef = React.useRef<HTMLDivElement>(null);
  const [chartSize, setChartSize] = React.useState(360);

  React.useEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      const padding = 32;
      const available = Math.max(280, rect.width - padding);
      setChartSize(Math.min(available, 420));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-6">
      <div
        ref={chartRef}
        className="flex min-h-[320px] items-center justify-center overflow-hidden rounded-2xl border border-border bg-background p-4 sm:min-h-[420px] sm:p-6 md:col-span-4"
      >
        <NatalChartWheel
          data={chart}
          size={chartSize}
          showHouses={showHouses}
          onSelectPlanet={openPlanet}
          selectedPlanetId={selectedId}
        />
      </div>
      <div className="rounded-2xl border border-border bg-background p-4 sm:p-5 md:col-span-2">
        <p className="mb-3 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Eixos</p>
        {!showHouses ? (
          <p className="text-xs leading-relaxed text-muted-foreground">
            Sem horário de nascimento, o mapa é calculado sem casas astrológicas.
          </p>
        ) : null}
        <ul className="divide-y divide-border">
          {showHouses
            ? axes.map((a) => {
                const s = signFromLongitude(a.lon);
                return (
                  <li key={a.label}>
                    <button
                      type="button"
                      onClick={() => onAngleClick(a.label)}
                      className="-mx-1 w-full rounded-md px-1 py-2.5 text-left transition-colors hover:bg-muted/40"
                    >
                      <span className="flex items-baseline justify-between">
                        <span className="font-jakarta text-sm font-black tracking-[0.08em]">{a.label}</span>
                        <span className="text-right text-sm">
                          <span className="font-jakarta font-black">{s.name}</span>
                          <span className="ml-2 text-xs tabular-nums text-muted-foreground">
                            {s.degree}°{String(s.minute).padStart(2, "0")}′
                          </span>
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })
            : null}
        </ul>
      </div>
    </div>
  );
}
