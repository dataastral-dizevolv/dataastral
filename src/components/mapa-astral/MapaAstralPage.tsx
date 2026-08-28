"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import useSWR from "swr";

import { AddMapForm } from "@/components/mapa-astral/AddMapForm";
import { ANGLE_INFO, ELEMENT_COLORS, ELEMENT_INFO, MODALITY_COLORS, MODALITY_INFO } from "@/components/mapa-astral/constants";
import { InfoSheet } from "@/components/mapa-astral/InfoSheet";
import { PeopleChartsCarousel } from "@/components/mapa-astral/PeopleChartsCarousel";
import type { InfoTopic, PersonChart, Planet } from "@/components/mapa-astral/types";
import Footer from "@/components/landing/Footer";
import Header from "@/components/landing/Header";
import { PlanetInfoSheet } from "@/components/natal-chart/PlanetInfoSheet";
import {
  elementDistribution,
  findPlanetAspects,
  modalityDistribution,
  type PlanetInput,
} from "@/lib/astrology/aspect-analysis";
import { buildNatalChart, SAMPLE_NATAL_CHART } from "@/lib/astrology/natal-chart";
import type { DashboardMeResponse } from "@/types/dashboard";
import { cn } from "@/lib/utils";

const meFetcher = async (url: string): Promise<DashboardMeResponse | null> => {
  const res = await fetch(url, { credentials: "include" });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error("Falha ao carregar perfil");
  return (await res.json()) as DashboardMeResponse;
};

function personFromUser(user: DashboardMeResponse | null): PersonChart {
  if (!user?.birthDate) {
    return {
      id: "self",
      name: user?.nome?.trim() || "Eu",
      birthPlace: user?.birthLocation ?? undefined,
      hasHouses: true,
      chart: SAMPLE_NATAL_CHART,
      isSample: true,
    };
  }

  const built = buildNatalChart({
    birthDate: user.birthDate,
    birthTime: user.birthTime,
    birthTimezone: user.birthTimezone,
    birthLat: user.birthLat,
    birthLng: user.birthLng,
  });

  return {
    id: "self",
    name: user.nome?.trim() || "Eu",
    birthPlace: user.birthLocation ?? undefined,
    hasHouses: built.showHouses,
    chart: built.data,
    isSample: built.isSample,
  };
}

export function MapaAstralPage() {
  const { data: me } = useSWR("/api/dashboard/me", meFetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });

  const [people, setPeople] = React.useState<PersonChart[]>(() => [personFromUser(null)]);
  const [hydratedSelf, setHydratedSelf] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [selectedPlanet, setSelectedPlanet] = React.useState<Planet | null>(null);
  const [planetAspects, setPlanetAspects] = React.useState<
    { name: string; with: string; orb: string }[]
  >([]);
  const [infoDrawer, setInfoDrawer] = React.useState<InfoTopic | null>(null);
  const [showHowItWorks, setShowHowItWorks] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  React.useEffect(() => {
    if (hydratedSelf || me === undefined) return;
    setPeople((prev) => {
      const others = prev.filter((p) => p.id !== "self");
      return [personFromUser(me), ...others];
    });
    setHydratedSelf(true);
  }, [me, hydratedSelf]);

  const filteredCharts = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return people;
    return people.filter((p) => p.name.toLowerCase().includes(q));
  }, [searchQuery, people]);

  const axesFor = React.useCallback(
    (c: PersonChart["chart"]) => [
      { label: "ASC", lon: c.ascendant },
      { label: "MC", lon: c.midheaven },
      { label: "DSC", lon: c.ascendant + 180 },
      { label: "FC", lon: c.midheaven + 180 },
    ],
    [],
  );

  const planetInputsFor = React.useCallback(
    (c: PersonChart["chart"]): PlanetInput[] =>
      c.planets.map((p) => ({
        id: p.id,
        label: p.label,
        symbol: p.symbol,
        longitude: p.longitude,
      })),
    [],
  );

  const elementDataFor = React.useCallback((c: PersonChart["chart"]) => {
    const e = elementDistribution(c.planets);
    return [
      { label: "Fogo", value: e.fire, color: ELEMENT_COLORS.fire },
      { label: "Terra", value: e.earth, color: ELEMENT_COLORS.earth },
      { label: "Ar", value: e.air, color: ELEMENT_COLORS.air },
      { label: "Água", value: e.water, color: ELEMENT_COLORS.water },
    ];
  }, []);

  const modalityDataFor = React.useCallback((c: PersonChart["chart"]) => {
    const m = modalityDistribution(c.planets);
    return [
      { label: "Cardinal", value: m.cardinal, color: MODALITY_COLORS.cardinal },
      { label: "Fixo", value: m.fixed, color: MODALITY_COLORS.fixed },
      { label: "Mutável", value: m.mutable, color: MODALITY_COLORS.mutable },
    ];
  }, []);

  const openPlanet = (p: Planet) => {
    const owner = people.find((person) =>
      person.chart.planets.some((x) => x.id === p.id && x.longitude === p.longitude),
    );
    const pool = owner?.chart.planets ?? [p];

    setSelectedId(p.id);
    setSelectedPlanet(p);
    setPlanetAspects(
      findPlanetAspects(p, pool).map((a) => ({
        name: a.aspect,
        with: a.other.label,
        orb: `${a.orb}°`,
      })),
    );
  };

  const infoContent = React.useMemo(() => {
    if (!infoDrawer) return null;
    if (infoDrawer.type === "custom") {
      return {
        eyebrow: infoDrawer.label,
        title: infoDrawer.title,
        body: infoDrawer.body,
      };
    }
    if (infoDrawer.type === "angle") {
      const info = ANGLE_INFO[infoDrawer.key];
      if (!info) return null;
      return { eyebrow: "Ângulo", title: info.title, body: info.text };
    }
    if (infoDrawer.type === "element") {
      const info = ELEMENT_INFO[infoDrawer.key];
      if (!info) return null;
      return {
        eyebrow: "Elemento",
        title: info.title,
        body: `${info.text}\n\nSignos: ${info.signs}.`,
      };
    }
    const info = MODALITY_INFO[infoDrawer.key];
    if (!info) return null;
    return {
      eyebrow: "Modalidade",
      title: info.title,
      body: `${info.text}\n\nSignos: ${info.signs}.`,
    };
  }, [infoDrawer]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="mx-auto max-w-6xl px-4 pt-24 pb-16 sm:px-6">
        <header className="mb-10 max-w-3xl">
          <h1 className="mb-4 font-ubuntu text-4xl leading-[1.05] font-black tracking-[-0.035em] text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
            Mapa Astral e Sinastrias
          </h1>
          <button
            type="button"
            onClick={() => setShowHowItWorks((v) => !v)}
            aria-expanded={showHowItWorks}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-jakarta text-xs font-black tracking-[0.04em] transition-colors",
              showHowItWorks
                ? "bg-foreground text-background"
                : "border border-border text-muted-foreground hover:bg-muted/60",
            )}
          >
            Como Funciona
          </button>

          <AnimatePresence initial={false}>
            {showHowItWorks ? (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.28, ease: [0.22, 0.61, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="mt-4 space-y-3 rounded-2xl border border-border bg-background p-4 text-sm leading-relaxed text-muted-foreground sm:p-5">
                  <p className="font-medium text-foreground">O Método Data Iris é diferente, e resolve!</p>
                  <p>
                    Sinastria não é auto conhecimento nem filosofia vã. É um método prático que cura uma das principais
                    dores, se não for a primeira, da humanidade: encontrar amor verdadeiro, e perdoar o ressentimento
                    mais profundo.
                  </p>
                  <p>
                    A verdade é que 99% de nossos relacionamentos são expectativas e desilusões. Mas com poucas dicas em
                    uma Sinastria excelente, você preserva tempo, energia e foca no relacionamento certo.
                  </p>
                  <p>O signo solar não indica quase nada. Toque nos planetas para entender e ler os conselhos.</p>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </header>

        <PeopleChartsCarousel
          people={filteredCharts}
          axesFor={axesFor}
          planetInputsFor={planetInputsFor}
          elementDataFor={elementDataFor}
          modalityDataFor={modalityDataFor}
          selectedId={selectedId}
          openPlanet={(p) => openPlanet(p)}
          onAngleClick={(key) => setInfoDrawer({ type: "angle", key })}
          onElementClick={(key) => setInfoDrawer({ type: "element", key })}
          onModalityClick={(key) => setInfoDrawer({ type: "modality", key })}
          onCustomInfo={(label, title, body) => setInfoDrawer({ type: "custom", label, title, body })}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <AddMapForm
          onAdd={(person) => {
            setPeople((prev) => [...prev, person]);
          }}
        />
      </main>

      <PlanetInfoSheet
        planet={selectedPlanet}
        aspects={planetAspects}
        onClose={() => {
          setSelectedPlanet(null);
          setSelectedId(null);
          setPlanetAspects([]);
        }}
      />

      <InfoSheet
        open={infoDrawer !== null && infoContent !== null}
        onOpenChange={(open) => !open && setInfoDrawer(null)}
        eyebrow={infoContent?.eyebrow}
        title={infoContent?.title ?? ""}
        body={infoContent?.body ?? ""}
      />

      <Footer />
    </div>
  );
}
