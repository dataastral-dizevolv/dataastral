"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Flame, Heart, MessageCircle, Moon, Plus, Search, Sun, Target } from "lucide-react";

import { ChartPanel } from "@/components/mapa-astral/ChartPanel";
import { ChartSections } from "@/components/mapa-astral/ChartSections";
import type {
  AxesFn,
  BarsFn,
  ChartData,
  PersonChart,
  Planet,
  PlanetInputsFn,
} from "@/components/mapa-astral/types";
import ZodiacGlyph from "@/components/natal-chart/ZodiacGlyph";
import { findSynastryAspect } from "@/lib/astrology/aspect-analysis";
import { formatSignDegree, signFromLongitude } from "@/lib/astrology/natal-chart";
import { cn } from "@/lib/utils";

interface MapTwoSectionProps {
  people: PersonChart[];
  primaryChart: ChartData;
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
  primaryName: string;
}

export function MapTwoSection({
  people,
  primaryChart,
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
  primaryName,
}: MapTwoSectionProps) {
  const [query, setQuery] = React.useState("");
  const [id2, setId2] = React.useState<string | null>(null);
  const [showAdd, setShowAdd] = React.useState(false);
  const [showCombine, setShowCombine] = React.useState(false);
  const [showCompare, setShowCompare] = React.useState(false);
  const [showPositives, setShowPositives] = React.useState(false);
  const [showNegatives, setShowNegatives] = React.useState(false);
  const [showVerdict, setShowVerdict] = React.useState(false);

  const person2 = people.find((p) => p.id === id2) ?? null;
  const results = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? people.filter((p) => p.name.toLowerCase().includes(q)) : people;
  }, [people, query]);

  const synastry = React.useMemo(() => {
    if (!person2) return [];
    const pairs: { a: Planet; b: Planet; aspect: string; orb: string }[] = [];
    for (const p1 of primaryChart.planets) {
      for (const p2 of person2.chart.planets) {
        const hit = findSynastryAspect(p1.longitude, p2.longitude);
        if (hit) pairs.push({ a: p1, b: p2, aspect: hit.aspect, orb: hit.orb });
      }
    }
    return pairs;
  }, [primaryChart, person2]);

  const positives = React.useMemo(
    () => synastry.filter((s) => ["Trígono", "Sextil", "Conjunção"].includes(s.aspect)),
    [synastry],
  );
  const negatives = React.useMemo(
    () => synastry.filter((s) => ["Quadratura", "Oposição"].includes(s.aspect)),
    [synastry],
  );

  const verdict = React.useMemo(() => {
    const total = positives.length + negatives.length;
    const raw = total === 0 ? 5 : (positives.length / total) * 10;
    const nota = Math.round(raw * 10) / 10;
    if (nota >= 7) {
      return {
        nota,
        titulo: "Amor",
        resposta: "Há sustentação real para um vínculo amoroso.",
        conselho:
          "Aproveite a facilidade dos encontros, mas nomeie combinados desde cedo: o que flui sem esforço também precisa de rotina e escolha consciente.",
      };
    }
    if (nota >= 4.5) {
      return {
        nota,
        titulo: "Amizade",
        resposta: "A conexão é boa, porém mais estável como parceria do que como romance.",
        conselho:
          "Invista no que já funciona (conversa, projetos, apoio) e observe se o desejo cresce sem cobrança. Forçar romance aqui costuma gerar desgaste.",
      };
    }
    return {
      nota,
      titulo: "Foge",
      resposta: "O atrito estrutural supera os pontos de apoio.",
      conselho:
        "Antes de insistir, defina limites claros e um prazo de observação. Se o mesmo conflito se repetir três vezes, é padrão — não fase.",
    };
  }, [positives, negatives]);

  return (
    <div className="mt-5 space-y-3 border-t border-border pt-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-jakarta text-lg font-black tracking-[-0.02em]">
          Mapa 2
          {person2 ? <span className="font-medium text-muted-foreground"> · {person2.name}</span> : null}
        </h3>
        <button
          type="button"
          onClick={() => setShowCombine((v) => !v)}
          disabled={!person2}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-jakarta text-xs font-black tracking-[0.04em] transition-colors",
            showCombine
              ? "bg-foreground text-background"
              : person2
                ? "bg-azure text-azure-foreground hover:bg-azure/90"
                : "cursor-not-allowed bg-muted text-muted-foreground",
          )}
        >
          Combinar
        </button>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar mapa 2 por nome"
          className="w-full rounded-full border border-border bg-background py-2.5 pr-4 pl-11 text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:outline-none"
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {results.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => {
              setId2(p.id === id2 ? null : p.id);
              setShowCombine(false);
            }}
            className={cn(
              "rounded-full px-3 py-1.5 font-jakarta text-xs font-black transition-colors",
              p.id === id2
                ? "bg-foreground text-background"
                : "border border-border text-muted-foreground hover:bg-muted/60",
            )}
          >
            {p.name}
          </button>
        ))}
        {results.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Nenhum mapa encontrado. Adicione outro mapa abaixo para comparar.
          </p>
        ) : null}
      </div>

      <div className="space-y-2.5">
        <button
          type="button"
          onClick={() => setShowAdd((v) => !v)}
          aria-expanded={showAdd}
          className={cn(
            "flex w-full items-center justify-between gap-2 rounded-2xl border px-4 py-3.5 text-left transition-colors",
            showAdd
              ? "border-transparent bg-foreground text-background"
              : "border-border bg-background hover:bg-muted/50",
          )}
        >
          <span className="font-jakarta text-xs font-black tracking-[0.06em] uppercase">Adicionar mapa</span>
          <Plus className={cn("h-3.5 w-3.5 shrink-0 transition-transform duration-300", showAdd && "rotate-45")} />
        </button>

        <AnimatePresence initial={false}>
          {showAdd ? (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 0.61, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="space-y-3 rounded-2xl border border-border bg-background p-4 sm:p-5">
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Cadastre nome, data completa, horário (opcional) e cidade para gerar o mapa 2.
                </p>
                <a
                  href="#adicionar-mapa-form"
                  className="inline-flex items-center gap-2 rounded-full bg-iris-blue-chambray px-4 py-2.5 font-jakarta text-xs font-black tracking-[0.06em] text-background uppercase"
                >
                  <Plus className="h-3.5 w-3.5" /> Adicionar dados
                </a>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {person2 && showCombine ? (
        <div className="space-y-4 rounded-2xl border border-planetary-foreground/20 bg-planetary p-4 sm:p-5">
          <button
            type="button"
            onClick={() => setShowCompare((v) => !v)}
            aria-expanded={showCompare}
            className="flex w-full items-center justify-between gap-3 text-left"
          >
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-[0.18em] text-planetary-foreground/70">Sinastria</p>
              <h4 className="font-jakarta text-lg font-black tracking-[-0.02em] text-planetary-foreground">
                Comparando posições
              </h4>
            </div>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-milky-way text-planetary">
              <Plus className={cn("h-4 w-4 transition-transform duration-300", showCompare && "rotate-45")} />
            </span>
          </button>

          <AnimatePresence initial={false}>
            {showCompare ? (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.28, ease: [0.22, 0.61, 0.36, 1] }}
                className="overflow-hidden"
              >
                <p className="pb-3 text-xs text-planetary-foreground/80">
                  Clique em cada astro para entender mais
                </p>
                <div className="space-y-3">
                  {(
                    [
                      { id: "sun", label: "Sol", icon: Sun, desc: "Identidade e saúde" },
                      { id: "moon", label: "Lua", icon: Moon, desc: "Afinidade nos sentimentos e necessidades" },
                      { id: "venus", label: "Vênus", icon: Heart, desc: "Modo de amar e desejar" },
                      { id: "mars", label: "Marte", icon: Flame, desc: "Modo de conquistar e energia sexual" },
                      {
                        id: "mercury",
                        label: "Mercúrio",
                        icon: MessageCircle,
                        desc: "Comunicar, pensar e dizer o que sente",
                      },
                      { id: "saturn", label: "Saturno", icon: Target, desc: "Projeto de longo prazo" },
                    ] as const
                  ).map((item) => {
                    const p1 = primaryChart.planets.find((p) => p.id === item.id);
                    const p2 = person2.chart.planets.find((p) => p.id === item.id);
                    const pos1 = p1 ? signFromLongitude(p1.longitude) : null;
                    const pos2 = p2 ? signFromLongitude(p2.longitude) : null;
                    const Icon = item.icon;
                    const link = p1 && p2 ? findSynastryAspect(p1.longitude, p2.longitude) : null;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          onCustomInfo(
                            "Sinastria",
                            item.label,
                            `${item.desc}.\n\n${primaryName}: ${p1 ? formatSignDegree(p1.longitude) : "—"}\n${person2.name}: ${p2 ? formatSignDegree(p2.longitude) : "—"}\n\n${
                              link
                                ? `Aspecto entre os dois mapas: ${link.aspect} (orbe ${link.orb}°).`
                                : "Sem aspecto maior entre os dois mapas neste astro — a conexão aqui é mais independente."
                            }`,
                          );
                        }}
                        className="flex w-full items-start gap-3 rounded-2xl border border-planetary-foreground/10 bg-milky-way p-3 text-left transition-colors hover:bg-milky-way/90"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-planetary/10 text-planetary">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1 space-y-2">
                          <div>
                            <span className="block font-jakarta text-sm font-black">{item.label}</span>
                            <span className="text-[10px] leading-tight text-muted-foreground">{item.desc}</span>
                          </div>
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2">
                              {pos1 ? (
                                <ZodiacGlyph index={pos1.index} size={16} className="text-iris-blue-chambray" />
                              ) : null}
                              <div className="flex flex-col">
                                <span className="max-w-[9ch] truncate text-muted-foreground">{primaryName}</span>
                                <span className="font-medium">
                                  {p1 ? formatSignDegree(p1.longitude) : "—"}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-right">
                              {pos2 ? (
                                <ZodiacGlyph index={pos2.index} size={16} className="text-iris-blue-chambray" />
                              ) : null}
                              <div className="flex flex-col">
                                <span className="max-w-[9ch] truncate text-muted-foreground">{person2.name}</span>
                                <span className="font-medium">
                                  {p2 ? formatSignDegree(p2.longitude) : "—"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <ExpandList
            title="Pontos positivos"
            count={positives.length}
            open={showPositives}
            onToggle={() => setShowPositives((v) => !v)}
            empty="Nenhum aspecto harmônico encontrado."
            items={positives.map((s) => ({
              left: `${s.a.label} · ${s.b.label}`,
              right: `${s.aspect} ${s.orb}°`,
            }))}
          />
          <ExpandList
            title="Pontos negativos"
            count={negatives.length}
            open={showNegatives}
            onToggle={() => setShowNegatives((v) => !v)}
            empty="Nenhum aspecto tenso encontrado."
            items={negatives.map((s) => ({
              left: `${s.a.label} · ${s.b.label}`,
              right: `${s.aspect} ${s.orb}°`,
            }))}
          />

          <div className="overflow-hidden rounded-2xl bg-milky-way text-foreground">
            <button
              type="button"
              onClick={() => setShowVerdict((v) => !v)}
              aria-expanded={showVerdict}
              className="flex w-full items-center justify-between gap-3 px-4 py-5 text-left"
            >
              <span className="font-jakarta text-sm font-black">Amor, Amizade ou Foge?</span>
              <Plus
                className={cn(
                  "h-4 w-4 shrink-0 text-planetary transition-transform duration-300",
                  showVerdict && "rotate-45",
                )}
              />
            </button>
            <AnimatePresence initial={false}>
              {showVerdict ? (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                  className="overflow-hidden"
                >
                  <div className="space-y-3 px-4 pb-4">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-lg font-black tracking-[-0.02em]">{verdict.titulo}</span>
                      <span className="text-sm font-semibold text-muted-foreground">
                        Nota {verdict.nota.toFixed(1)}/10
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed">{verdict.resposta}</p>
                    <div className="border-t border-border/60 pt-3">
                      <p className="mb-1 text-[11px] tracking-widest text-muted-foreground uppercase">Conselho</p>
                      <p className="text-xs leading-relaxed">{verdict.conselho}</p>
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      ) : null}

      {person2 ? (
        <div className="space-y-4 pt-2">
          <div>
            <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">
              {person2.birthPlace ?? "Mapa"}
            </p>
            <h2 className="mt-1 font-jakarta text-2xl font-black tracking-[-0.02em]">{person2.name}</h2>
          </div>
          <ChartPanel
            chart={person2.chart}
            showHouses={person2.hasHouses !== false}
            axes={axesFor(person2.chart)}
            selectedId={selectedId}
            openPlanet={openPlanet}
            onAngleClick={onAngleClick}
          />
          <ChartSections
            chart={person2.chart}
            planetInputs={planetInputsFor(person2.chart)}
            elementData={elementDataFor(person2.chart)}
            modalityData={modalityDataFor(person2.chart)}
            openPlanet={openPlanet}
            onElementClick={onElementClick}
            onModalityClick={onModalityClick}
          />
        </div>
      ) : null}
    </div>
  );
}

function ExpandList({
  title,
  count,
  open,
  onToggle,
  items,
  empty,
}: {
  title: string;
  count: number;
  open: boolean;
  onToggle: () => void;
  items: { left: string; right: string }[];
  empty: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl bg-milky-way">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-5 text-left"
      >
        <span className="flex items-center gap-2">
          <span className="font-jakarta text-sm font-black">{title}</span>
          <span className="min-w-6 rounded-full bg-planetary px-2 py-0.5 text-center font-jakarta text-[11px] font-black text-planetary-foreground">
            {count}
          </span>
        </span>
        <Plus className={cn("h-4 w-4 shrink-0 text-planetary transition-transform duration-300", open && "rotate-45")} />
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 0.61, 0.36, 1] }}
            className="overflow-hidden"
          >
            <ul className="space-y-2 px-4 pb-4">
              {items.map((item, i) => (
                <li
                  key={`${title}-${i}`}
                  className="flex items-center justify-between gap-3 border-t border-border/60 pt-2 text-xs"
                >
                  <span className="font-medium">{item.left}</span>
                  <span className="text-muted-foreground">{item.right}</span>
                </li>
              ))}
              {items.length === 0 ? (
                <li className="pt-2 text-xs text-muted-foreground">{empty}</li>
              ) : null}
            </ul>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
