"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, X } from "lucide-react";

import { InfoSheet } from "@/components/mapa-astral/InfoSheet";
import {
  computeAspects,
  type ComputedAspect,
  type PlanetInput,
} from "@/lib/astrology/aspect-analysis";

const ASPECT_INFO: Record<ComputedAspect["kind"], string> = {
  conjunction:
    "Conjunção (0°): os dois planetas fundem suas energias e agem como um só. Marca começos e intensidade — bom para iniciar algo que una os dois temas.",
  sextile:
    "Sextil (60°): oportunidade fluida. A energia está disponível, mas pede um pequeno movimento seu para acontecer. Ótimo para trocas e colaborações.",
  square:
    "Quadratura (90°): tensão criativa. Há atrito entre os dois temas, e é justamente esse atrito que gera ação, ajuste de rota e amadurecimento.",
  trine:
    "Trígono (120°): harmonia natural. As energias se apoiam sem esforço — confie no fluxo e avance no que já está funcionando.",
  opposition:
    "Oposição (180°): polaridade a equilibrar. Os dois temas se puxam em direções opostas; a saída é integrar, não escolher um lado.",
};

const PHASE_INFO: Record<ComputedAspect["phase"], string> = {
  applying:
    "Aplicando: o aspecto ainda está se formando — a energia está crescendo e tende a ficar mais forte nos próximos dias.",
  exact: "Exato: o aspecto está no auge agora. É o momento de maior intensidade dessa combinação.",
  separating:
    "Separando: o aspecto já passou do ponto exato — a energia está se dissipando e deixa aprendizados.",
};

const PHASE_LABEL: Record<ComputedAspect["phase"], string> = {
  applying: "aplicando",
  separating: "separando",
  exact: "exato",
};

const PHASE_DOT: Record<ComputedAspect["phase"], string> = {
  applying: "hsl(150 55% 45%)",
  exact: "hsl(45 90% 50%)",
  separating: "hsl(0 0% 55%)",
};

interface AspectsPanelProps {
  planets: PlanetInput[];
  topCount?: number;
}

export function AspectsPanel({ planets, topCount = 5 }: AspectsPanelProps) {
  const [expanded, setExpanded] = React.useState(false);
  const [selected, setSelected] = React.useState<ComputedAspect | null>(null);

  const aspects = React.useMemo(() => {
    const all = computeAspects(planets);
    const phaseRank: Record<ComputedAspect["phase"], number> = {
      exact: 0,
      applying: 1,
      separating: 2,
    };
    return [...all].sort((x, y) => {
      const dp = phaseRank[x.phase] - phaseRank[y.phase];
      if (dp !== 0) return dp;
      return Math.abs(x.orb) - Math.abs(y.orb);
    });
  }, [planets]);

  const applying = aspects.filter((a) => a.phase === "applying");
  const exact = aspects.filter((a) => a.phase === "exact");
  const top = aspects.slice(0, topCount);
  const rest = aspects.slice(topCount);

  return (
    <>
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-background p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Aspectos</p>
          <div className="flex items-center gap-3">
            <p className="hidden text-[10px] tracking-[0.12em] text-muted-foreground tabular-nums sm:block">
              {exact.length > 0 ? (
                <span className="mr-2 font-jakarta font-black text-foreground">
                  {exact.length} exato{exact.length > 1 ? "s" : ""}
                </span>
              ) : null}
              <span className="font-jakarta font-black text-foreground">{applying.length}</span>
              <span className="ml-1">aplicando</span>
              <span className="mx-2 opacity-30">·</span>
              <span className="font-jakarta font-black text-foreground">{aspects.length}</span>
              <span className="ml-1">total</span>
            </p>
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-label={expanded ? "Recolher aspectos" : "Ver todos os aspectos"}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            >
              {expanded ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {expanded ? (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 0.61, 0.36, 1] }}
              className="flex flex-col gap-4 overflow-hidden"
            >
              {top.length > 0 ? (
                <div>
                  <p className="mb-2 text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Principais</p>
                  <ul className="flex flex-col gap-1.5">
                    {top.map((a, i) => (
                      <AspectRow key={`top-${i}`} a={a} emphasis onClick={() => setSelected(a)} />
                    ))}
                  </ul>
                </div>
              ) : null}

              {applying.length > 0 ? (
                <div className="border-t border-border pt-3">
                  <p className="mb-2 text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Aplicativos</p>
                  <ul className="flex flex-col gap-1">
                    {applying.map((a, i) => (
                      <AspectRow key={`apl-${i}`} a={a} onClick={() => setSelected(a)} />
                    ))}
                  </ul>
                </div>
              ) : null}

              {rest.length > 0 ? (
                <div className="border-t border-border pt-3">
                  <p className="mb-2 text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                    Todos os aspectos
                  </p>
                  <ul className="flex flex-col gap-1">
                    {rest.map((a, i) => (
                      <AspectRow key={`rest-${i}`} a={a} onClick={() => setSelected(a)} />
                    ))}
                  </ul>
                </div>
              ) : null}
            </motion.div>
          ) : null}
        </AnimatePresence>

        {expanded && aspects.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhum aspecto dentro de orbe.</p>
        ) : null}
      </div>

      <InfoSheet
        open={selected !== null}
        onOpenChange={(open) => !open && setSelected(null)}
        eyebrow={
          selected
            ? `Aspecto · ${PHASE_LABEL[selected.phase]} · orbe ${Math.abs(selected.orb).toFixed(1)}°`
            : undefined
        }
        title={selected ? `${selected.a.label} ${selected.label} ${selected.b.label}` : ""}
        body={
          selected
            ? `${ASPECT_INFO[selected.kind]}\n\n${PHASE_INFO[selected.phase]}`
            : ""
        }
      />
    </>
  );
}

function AspectRow({
  a,
  emphasis = false,
  onClick,
}: {
  a: ComputedAspect;
  emphasis?: boolean;
  onClick?: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center justify-between gap-3 rounded-lg py-1 text-left text-xs transition-colors hover:bg-muted/60"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span
            aria-hidden
            className="inline-block shrink-0 rounded-full"
            style={{ width: 6, height: 6, background: PHASE_DOT[a.phase] }}
          />
          <span className="flex min-w-0 items-center gap-1">
            <span
              className="font-jakarta font-black tabular-nums text-foreground"
              style={{ fontSize: emphasis ? 12 : 11 }}
            >
              {a.a.symbol ?? a.a.label}
            </span>
            <span
              className="uppercase tracking-[0.1em] text-muted-foreground"
              style={{
                color: a.color,
                fontWeight: emphasis ? 600 : 500,
                fontSize: 9,
                letterSpacing: "0.14em",
              }}
            >
              {a.label}
            </span>
            <span
              className="font-jakarta font-black tabular-nums text-foreground"
              style={{ fontSize: emphasis ? 12 : 11 }}
            >
              {a.b.symbol ?? a.b.label}
            </span>
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2 tabular-nums text-muted-foreground">
          <span className="text-[10px]">{Math.abs(a.orb).toFixed(1)}°</span>
          <span
            className="text-[9px] uppercase tracking-[0.14em]"
            style={{
              color:
                a.phase === "exact"
                  ? "hsl(45 90% 35%)"
                  : a.phase === "applying"
                    ? "hsl(150 50% 30%)"
                    : undefined,
              fontWeight: a.phase !== "separating" ? 600 : 400,
            }}
          >
            {PHASE_LABEL[a.phase]}
          </span>
        </span>
      </button>
    </li>
  );
}
