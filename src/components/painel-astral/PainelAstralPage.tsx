"use client";

import * as React from "react";
import useSWR from "swr";

import Footer from "@/components/landing/Footer";
import Header from "@/components/landing/Header";
import { LunarCalendarPanel } from "@/components/painel-astral/LunarCalendarPanel";
import { NatalChartSVG } from "@/components/painel-astral/NatalChartSVG";
import { PlanetInfoSheet, type PlanetAspectRow } from "@/components/natal-chart/PlanetInfoSheet";
import type { NatalPlanet } from "@/lib/astrology/natal-chart";
import {
  type AstrologicalAspect,
  type PlanetPosition,
  buildBirthMoment,
  calculateAspects,
  calculateChartAngles,
  calculateMoonData,
  calculatePlanets,
  CITY_OPTIONS,
  findCity,
  findCityByTimezone,
  formatDegreeMinutes,
} from "@/lib/astrology/painel";
import { cn } from "@/lib/utils";
import type { DashboardMeResponse } from "@/types/dashboard";

type Tab = "transitos" | "natal";

const meFetcher = async (url: string): Promise<DashboardMeResponse | null> => {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) return null;
  return (await res.json()) as DashboardMeResponse;
};

function toNatalPlanet(p: PlanetPosition): NatalPlanet {
  return {
    id: p.id,
    symbol: p.symbol,
    label: p.name,
    longitude: p.longitude,
  };
}

export function PainelAstralPage() {
  const { data: me, isLoading: meLoading } = useSWR("/api/dashboard/me", meFetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });

  const [tab, setTab] = React.useState<Tab>("transitos");
  const [selectedDate, setSelectedDate] = React.useState(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12, 0, 0, 0));
  });
  const [birthDateStr, setBirthDateStr] = React.useState("1990-01-01");
  const [birthTimeStr, setBirthTimeStr] = React.useState("12:00");
  const [cityId, setCityId] = React.useState("sao-paulo");
  const [hydratedFromProfile, setHydratedFromProfile] = React.useState(false);
  const [hovered, setHovered] = React.useState<AstrologicalAspect | null>(null);
  const [selectedPlanet, setSelectedPlanet] = React.useState<NatalPlanet | null>(null);
  const [planetAspects, setPlanetAspects] = React.useState<PlanetAspectRow[]>([]);

  React.useEffect(() => {
    if (hydratedFromProfile || me === undefined) return;
    if (me?.birthDate) {
      setBirthDateStr(me.birthDate);
      if (me.birthTime) setBirthTimeStr(me.birthTime.slice(0, 5));
      const matched =
        findCityByTimezone(me.birthTimezone) ??
        (me.birthLat != null && me.birthLng != null
          ? CITY_OPTIONS.find(
              (c) =>
                Math.abs(c.latitude - me.birthLat!) < 0.8 &&
                Math.abs(c.longitude - me.birthLng!) < 0.8,
            )
          : undefined);
      if (matched) setCityId(matched.id);
    }
    setHydratedFromProfile(true);
  }, [me, hydratedFromProfile]);

  const city = findCity(cityId) ?? CITY_OPTIONS[0];

  const birthMoment = React.useMemo(
    () =>
      buildBirthMoment({
        date: birthDateStr,
        time: birthTimeStr,
        timezone: city.timezone,
      }),
    [birthDateStr, birthTimeStr, city.timezone],
  );

  const birthDate = birthMoment?.utcDate ?? new Date();

  const transitPlanets = React.useMemo(() => calculatePlanets(selectedDate), [selectedDate]);
  const transitAspects = React.useMemo(() => calculateAspects(transitPlanets), [transitPlanets]);
  const transitMoon = React.useMemo(() => calculateMoonData(selectedDate), [selectedDate]);

  const natalPlanets = React.useMemo(() => calculatePlanets(birthDate), [birthDate]);
  const natalAspects = React.useMemo(() => calculateAspects(natalPlanets), [natalPlanets]);
  const natalAngles = React.useMemo(
    () => calculateChartAngles(birthDate, city.latitude, city.longitude),
    [birthDate, city.latitude, city.longitude],
  );

  const activePlanets = tab === "transitos" ? transitPlanets : natalPlanets;
  const activeAspects = tab === "transitos" ? transitAspects : natalAspects;

  const handleSelectPlanet = React.useCallback(
    (p: PlanetPosition) => {
      const aspects = activeAspects
        .filter((a) => a.body1 === p.name || a.body2 === p.name)
        .map((a) => ({
          name: a.type,
          with: a.body1 === p.name ? a.body2 : a.body1,
          orb: `${a.orb.toFixed(1)}°`,
        }));
      setPlanetAspects(aspects);
      setSelectedPlanet(toNatalPlanet(p));
    },
    [activeAspects],
  );

  const usingDefaults = !me?.birthDate && tab === "natal";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="container mx-auto max-w-6xl px-4 pt-24 pb-16">
        <div className="mb-8">
          <p className="mb-2 text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase">
            Painel Astrológico
          </p>
          <h1 className="text-3xl leading-tight font-black tracking-tight md:text-5xl">
            Trânsitos do Céu &amp;
            <br />
            Mapa Astral por Ângulos
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            Posições eclípticas reais (NASA / astronomy-engine). Sem casas — apenas longitude
            zodiacal e aspectos maiores entre os 10 corpos clássicos.
          </p>
          {meLoading && tab === "natal" ? (
            <p className="mt-2 text-xs text-muted-foreground">Carregando perfil…</p>
          ) : null}
        </div>

        <div className="mb-8 flex gap-1 border-b border-border">
          {(
            [
              ["transitos", "Calendário e Trânsitos"],
              ["natal", "Mapa Astral"],
            ] as [Tab, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                "border-b-2 px-4 py-2 text-sm font-black tracking-tight transition -mb-px",
                tab === key
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "natal" ? (
          <div className="mb-6 grid gap-3 sm:grid-cols-[1fr,1fr,1.4fr]">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                Data de nascimento
              </span>
              <input
                type="date"
                value={birthDateStr}
                onChange={(e) => setBirthDateStr(e.target.value)}
                className="rounded-sm border border-border bg-transparent px-3 py-2 text-sm font-medium focus:border-foreground focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                Hora local
              </span>
              <input
                type="time"
                value={birthTimeStr}
                onChange={(e) => setBirthTimeStr(e.target.value)}
                className="rounded-sm border border-border bg-transparent px-3 py-2 text-sm font-medium focus:border-foreground focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                Cidade (timezone histórica)
              </span>
              <select
                value={cityId}
                onChange={(e) => setCityId(e.target.value)}
                className="rounded-sm border border-border bg-transparent px-3 py-2 text-sm font-medium focus:border-foreground focus:outline-none"
              >
                {CITY_OPTIONS.map((c) => (
                  <option key={c.id} value={c.id} className="bg-background">
                    {c.label} — {c.timezone}
                  </option>
                ))}
              </select>
            </label>
            {usingDefaults ? (
              <p className="text-[11px] text-muted-foreground sm:col-span-3">
                Sem data de nascimento no perfil — usando exemplo editável (1990-01-01). Ajuste os
                campos ou complete o{" "}
                <a href="/perfil" className="underline underline-offset-2">
                  perfil
                </a>
                .
              </p>
            ) : null}
            {birthMoment ? (
              <p className="text-[11px] text-muted-foreground sm:col-span-3">
                Convertido para UTC:{" "}
                <span className="font-mono">{birthMoment.utcISO}</span>
                {" · "}offset {birthMoment.offsetMinutes / 60}h
                {birthMoment.isDST ? " · horário de verão ativo" : ""}
                {" · "}ASC{" "}
                <span className="font-bold">
                  {natalAngles.ASC.signSymbol} {Math.floor(natalAngles.ASC.degreeWithinSign)}°
                </span>
                {" · "}MC{" "}
                <span className="font-bold">
                  {natalAngles.MC.signSymbol} {Math.floor(natalAngles.MC.degreeWithinSign)}°
                </span>
              </p>
            ) : (
              <p className="text-[11px] text-muted-foreground sm:col-span-3">
                Data/hora inválida — ajuste os campos para calcular o mapa.
              </p>
            )}
          </div>
        ) : null}

        <div className="grid gap-8 lg:grid-cols-[1fr,380px]">
          <div className="space-y-4">
            <div className="rounded-sm border border-border bg-background p-4 md:p-6">
              {activePlanets.length === 0 ? (
                <p className="py-16 text-center text-sm text-muted-foreground">
                  Não foi possível calcular as posições planetárias.
                </p>
              ) : (
                <NatalChartSVG
                  positions={activePlanets}
                  aspects={activeAspects}
                  highlightedAspect={hovered}
                  onHoverAspect={setHovered}
                  onSelectPlanet={handleSelectPlanet}
                  size={560}
                />
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-sm border border-border p-4">
                <h3 className="mb-3 text-xs font-black tracking-wider uppercase">Posições</h3>
                {activePlanets.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Nenhuma posição disponível.</p>
                ) : (
                  <ul className="space-y-1.5 text-sm">
                    {activePlanets.map((p) => (
                      <li key={p.id} className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2 font-medium">
                          <span className="text-base">{p.symbol}</span>
                          {p.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDegreeMinutes(p.degreeWithinSign)} {p.signSymbol} {p.sign}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-sm border border-border p-4">
                <h3 className="mb-3 text-xs font-black tracking-wider uppercase">
                  Aspectos ({activeAspects.length})
                </h3>
                {activeAspects.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Sem aspectos maiores ativos.</p>
                ) : (
                  <ul className="max-h-72 space-y-1 overflow-y-auto pr-1 text-xs">
                    {activeAspects.map((a, i) => (
                      <li
                        key={`${a.body1}-${a.body2}-${a.type}-${i}`}
                        onMouseEnter={() => setHovered(a)}
                        onMouseLeave={() => setHovered(null)}
                        className="flex cursor-pointer items-center justify-between gap-2 border-b border-border/50 px-1 py-1 last:border-0 hover:bg-foreground/5"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ background: a.color }}
                          />
                          <span className="font-medium">
                            {a.body1} · {a.body2}
                          </span>
                        </div>
                        <span className="text-muted-foreground">
                          {a.type} · orbe {a.orb.toFixed(1)}°
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <aside className="self-start rounded-sm border border-border p-5 lg:sticky lg:top-24">
            {tab === "transitos" ? (
              <>
                <div className="mb-4">
                  <h3 className="mb-1 text-xs font-black tracking-wider uppercase">
                    Calendário Lunar
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Clique em um dia para atualizar a roda do céu.
                  </p>
                </div>
                <LunarCalendarPanel date={selectedDate} onSelectDate={setSelectedDate} />
              </>
            ) : (
              <div className="space-y-3 text-sm">
                <h3 className="text-xs font-black tracking-wider uppercase">Sobre o método</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Este painel não calcula casas astrológicas. Trabalhamos apenas com a longitude
                  eclíptica real de cada corpo, mapeada para os 12 signos (30° cada, começando em
                  Áries a 0°), e com os 5 aspectos maiores: conjunção, sêxtil, quadratura, trígono e
                  oposição.
                </p>
                <div className="border-t border-border pt-3">
                  <div className="mb-1 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                    Lua agora
                  </div>
                  <div className="text-sm font-medium">
                    {transitMoon.name} · {transitMoon.illumination}%
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>

      <Footer />

      <PlanetInfoSheet
        planet={selectedPlanet}
        aspects={planetAspects}
        onClose={() => {
          setSelectedPlanet(null);
          setPlanetAspects([]);
        }}
      />
    </div>
  );
}
