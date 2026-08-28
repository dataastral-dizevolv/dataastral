"use client";

import * as React from "react";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";

import { ChartPanel } from "@/components/mapa-astral/ChartPanel";
import { ChartSections } from "@/components/mapa-astral/ChartSections";
import { MapTwoSection } from "@/components/mapa-astral/MapTwoSection";
import type {
  AxesFn,
  BarsFn,
  PersonChart,
  Planet,
  PlanetInputsFn,
} from "@/components/mapa-astral/types";
import { cn } from "@/lib/utils";

interface PeopleChartsCarouselProps {
  people: PersonChart[];
  axesFor: AxesFn;
  planetInputsFor: PlanetInputsFn;
  elementDataFor: BarsFn;
  modalityDataFor: BarsFn;
  selectedId: string | null;
  openPlanet: (p: Planet) => void;
  onAngleClick: (key: string) => void;
  onElementClick: (key: string) => void;
  onModalityClick: (key: string) => void;
  onCustomInfo: (label: string, title: string, body: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export function PeopleChartsCarousel({
  people,
  axesFor,
  planetInputsFor,
  elementDataFor,
  modalityDataFor,
  selectedId,
  openPlanet,
  onAngleClick,
  onElementClick,
  onModalityClick,
  onCustomInfo,
  searchQuery,
  onSearchChange,
}: PeopleChartsCarouselProps) {
  const [index, setIndex] = React.useState(0);
  const [direction, setDirection] = React.useState(1);

  React.useEffect(() => {
    if (index >= people.length) {
      setIndex(Math.max(0, people.length - 1));
    }
  }, [people.length, index]);

  const go = (next: number) => {
    const clamped = Math.max(0, Math.min(people.length - 1, next));
    setDirection(clamped > index ? 1 : -1);
    setIndex(clamped);
  };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -80) go(index + 1);
    else if (info.offset.x > 80) go(index - 1);
  };

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
  };

  const current = people[index];
  if (!current) {
    return (
      <div className="rounded-2xl border border-border bg-background p-6 text-sm text-muted-foreground">
        Nenhum mapa disponível. Adicione um mapa abaixo.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-background">
      <div className="space-y-3 border-b border-border px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-jakarta text-lg font-black tracking-[-0.02em]">
            Mapa 1
            <span className="font-medium text-muted-foreground"> · {current.name}</span>
          </h3>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar mapa 1 por nome"
            className="w-full rounded-full border border-border bg-background py-2.5 pr-4 pl-11 text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-1.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {people.map((p, i) => (
              <button
                key={p.id}
                type="button"
                onClick={() => go(i)}
                className={cn(
                  "whitespace-nowrap rounded-full px-3 py-1.5 font-jakarta text-xs font-black tracking-[0.04em] transition-colors",
                  i === index
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-muted/60",
                )}
              >
                {p.name}
              </button>
            ))}
            <a
              href="#adicionar-mapa-form"
              className="inline-flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-1.5 font-jakarta text-xs font-black text-muted-foreground transition-colors hover:bg-muted/60"
              aria-label="Novo mapa"
            >
              <Plus className="h-3.5 w-3.5" /> Novo
            </a>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => go(index - 1)}
              disabled={index === 0}
              className="rounded-full p-1.5 transition-colors hover:bg-muted/60 disabled:opacity-30 disabled:hover:bg-transparent"
              aria-label="Mapa anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-[2.5rem] px-1 text-center text-[10px] tabular-nums text-muted-foreground">
              {index + 1} / {people.length}
            </span>
            <button
              type="button"
              onClick={() => go(index + 1)}
              disabled={index === people.length - 1}
              className="rounded-full p-1.5 transition-colors hover:bg-muted/60 disabled:opacity-30 disabled:hover:bg-transparent"
              aria-label="Próximo mapa"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current.id}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.32, ease: [0.22, 0.61, 0.36, 1] }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={onDragEnd}
            className="space-y-4 p-4 sm:p-6"
          >
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">
                  {current.birthPlace ?? (current.isSample ? "Exemplo" : "Mapa")}
                </p>
                <h2 className="mt-1 font-jakarta text-2xl font-black tracking-[-0.02em] sm:text-3xl">
                  {current.name}
                </h2>
                {current.isSample ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Mapa de exemplo. Preencha seus dados no perfil ou adicione um mapa abaixo.
                  </p>
                ) : null}
              </div>
            </div>

            <ChartPanel
              chart={current.chart}
              showHouses={current.hasHouses !== false}
              axes={axesFor(current.chart)}
              selectedId={selectedId}
              openPlanet={openPlanet}
              onAngleClick={onAngleClick}
            />

            <ChartSections
              chart={current.chart}
              planetInputs={planetInputsFor(current.chart)}
              elementData={elementDataFor(current.chart)}
              modalityData={modalityDataFor(current.chart)}
              openPlanet={openPlanet}
              onElementClick={onElementClick}
              onModalityClick={onModalityClick}
            />

            <MapTwoSection
              people={people.filter((p) => p.id !== current.id)}
              primaryChart={current.chart}
              axesFor={axesFor}
              planetInputsFor={planetInputsFor}
              elementDataFor={elementDataFor}
              modalityDataFor={modalityDataFor}
              selectedId={selectedId}
              openPlanet={openPlanet}
              onAngleClick={onAngleClick}
              onElementClick={onElementClick}
              onModalityClick={onModalityClick}
              onCustomInfo={onCustomInfo}
              primaryName={current.name}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
