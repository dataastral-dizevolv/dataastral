"use client";

import { TONE_COLORS, TONE_LABELS, type EventTone } from "@/lib/planner/plannerEvents";
import { TONE_TO_TYPE } from "@/lib/planner/mapEvents";
import { cn } from "@/lib/utils";
import type { EphemerisEventType } from "@/types/dashboard";

interface FiltroEventosProps {
  filtroAtivo: EphemerisEventType | "todos";
  onChange: (filtro: EphemerisEventType | "todos") => void;
}

const SHORT_LABELS: Record<EventTone, string> = {
  tenso: "Tensão",
  sorte: "Harmonia",
  suave: "Portal",
  neutro: "Neutro",
};

const TONE_ORDER = Object.keys(TONE_LABELS) as EventTone[];

export function FiltroEventos({ filtroAtivo, onChange }: FiltroEventosProps) {
  return (
    <div className="rounded-3xl border border-border bg-background px-4 py-5 sm:px-6">
      <p className="mb-4 text-[10px] tracking-[0.18em] text-muted-foreground uppercase">Filtro</p>
      <ul className="flex flex-wrap gap-2">
        <li>
          <button
            type="button"
            onClick={() => onChange("todos")}
            className={cn(
              "inline-flex h-8 items-center gap-2 rounded-full border px-3 text-xs tracking-wider transition-colors",
              filtroAtivo === "todos"
                ? "border-iris-blue-chambray bg-iris-blue-chambray text-background"
                : "border-border text-iris-blue-chambray hover:bg-muted",
            )}
          >
            Todos
          </button>
        </li>
        {TONE_ORDER.map((tone) => {
          const tipo = TONE_TO_TYPE[tone];
          const ativo = filtroAtivo === tipo;
          return (
            <li key={tone}>
              <button
                type="button"
                onClick={() => onChange(tipo)}
                title={TONE_LABELS[tone]}
                className={cn(
                  "inline-flex h-8 items-center gap-2 rounded-full border px-3 text-xs tracking-wider transition-colors",
                  ativo ? "border-transparent text-primary-foreground" : "border-border bg-background text-foreground/80 hover:bg-muted",
                )}
                style={
                  ativo
                    ? { backgroundColor: TONE_COLORS[tone], borderColor: TONE_COLORS[tone] }
                    : undefined
                }
              >
                <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: TONE_COLORS[tone] }} />
                {SHORT_LABELS[tone]}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
