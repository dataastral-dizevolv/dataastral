"use client";

import { useMemo, useState } from "react";

import { NatalChartWheel } from "@/components/natal-chart/NatalChartWheel";
import { PlanetInfoSheet } from "@/components/natal-chart/PlanetInfoSheet";
import { DEFAULT_PLANET_COLORS } from "@/components/natal-chart/NatalChartWheel";
import { buildNatalChart, signFromLongitude, type NatalPlanet } from "@/lib/astrology/natal-chart";
import type { DashboardUser } from "@/lib/auth/user";

interface NatalChartSectionProps {
  user: DashboardUser;
}

export function NatalChartSection({ user }: NatalChartSectionProps) {
  const [selected, setSelected] = useState<NatalPlanet | null>(null);
  const chart = useMemo(
    () =>
      buildNatalChart({
        birthDate: user.birthDate,
        birthTime: user.birthTime,
        birthTimezone: user.birthTimezone,
        birthLat: user.birthLat,
        birthLng: user.birthLng,
      }),
    [user.birthDate, user.birthLat, user.birthLng, user.birthTime, user.birthTimezone],
  );

  const axes = [
    { label: "Ascendente (Asc)", lon: chart.data.ascendant },
    { label: "Meio do céu", lon: chart.data.midheaven },
    { label: "Descendente", lon: chart.data.ascendant + 180 },
    { label: "Fundo do céu", lon: chart.data.midheaven + 180 },
  ];

  return (
    <section className="border-t border-border">
      <header className="px-0 py-5">
        <p className="text-[12px] font-black tracking-[0.22em] text-foreground uppercase">02 · Mapa astral</p>
        <h2 className="mt-1 font-jakarta text-2xl font-black tracking-tight uppercase">Seu céu de nascimento</h2>
        {chart.isSample ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Preencha data, hora e local de nascimento para calcular o mapa com os seus dados. Enquanto isso, mostramos um
            exemplo visual.
          </p>
        ) : null}
        {!chart.isSample && !chart.showHouses ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Sem hora e local, as casas e os eixos (ASC/MC) ficam ocultos. Os planetas usam a data salva.
          </p>
        ) : null}
      </header>

      <div className="flex justify-center py-4">
        <NatalChartWheel
          data={chart.data}
          size={300}
          showHouses={chart.showHouses}
          selectedPlanetId={selected?.id ?? null}
          onSelectPlanet={setSelected}
        />
      </div>

      {chart.showHouses ? (
        <ul className="divide-y divide-border border-y border-border">
          {axes.map((axis) => {
            const sign = signFromLongitude(axis.lon);
            return (
              <li key={axis.label} className="flex items-baseline justify-between py-3 text-sm">
                <span className="font-jakarta font-black tracking-[0.08em]">{axis.label}</span>
                <span>
                  <span className="font-jakarta font-black">{sign.name}</span>
                  <span className="ml-2 font-normal tabular-nums text-muted-foreground">{sign.degree}°</span>
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}

      <ul className="grid grid-cols-5 gap-x-2 gap-y-4 pt-5 pb-2 text-xs">
        {chart.data.planets.map((planet) => {
          const sign = signFromLongitude(planet.longitude);
          return (
            <li key={planet.id} className="flex flex-col items-center gap-1.5 text-center">
              <span
                className="inline-block size-4 rounded-full border border-foreground/40"
                style={{ backgroundColor: DEFAULT_PLANET_COLORS[planet.id] }}
              />
              <span className="leading-tight text-foreground/80">{planet.label}</span>
              <span className="text-[10px] text-muted-foreground">{sign.name.slice(0, 3)}</span>
            </li>
          );
        })}
      </ul>

      <PlanetInfoSheet planet={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
