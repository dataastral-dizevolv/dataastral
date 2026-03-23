"use client";

import type { CSSProperties } from "react";

import { Button } from "@/components/ui/button";
import { EVENT_TYPE_COLORS } from "@/lib/theme/event-colors";
import type { EphemerisEventType } from "@/types/dashboard";

interface FiltroEventosProps {
  filtroAtivo: EphemerisEventType | "todos";
  onChange: (filtro: EphemerisEventType | "todos") => void;
}

const itensFiltro: Array<{
  id: EphemerisEventType | "todos";
  label: string;
}> = [
  {
    id: "todos",
    label: "Todos",
  },
  {
    id: "tensao",
    label: "Tensao",
  },
  {
    id: "harmonia",
    label: "Harmonia",
  },
  {
    id: "portal",
    label: "Portal",
  },
  {
    id: "neutro",
    label: "Neutro",
  },
];

export function FiltroEventos({ filtroAtivo, onChange }: FiltroEventosProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {itensFiltro.map((filtro) => {
        const ativo = filtroAtivo === filtro.id;
        const colorConfig = filtro.id !== "todos" ? EVENT_TYPE_COLORS[filtro.id] : null;

        const style: CSSProperties | undefined = colorConfig
          ? ativo
            ? {
                backgroundColor: colorConfig.primary,
                borderColor: colorConfig.primary,
                color: colorConfig.activeText,
              }
            : {
                backgroundColor: "transparent",
                borderColor: colorConfig.primary,
                color: colorConfig.text,
              }
          : undefined;

        return (
          <Button
            key={filtro.id}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange(filtro.id)}
            style={style}
            className={`rounded-full px-4 font-mono-iris text-[0.65rem] uppercase tracking-widest transition-colors ${
              colorConfig ? "" : ativo ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground bg-transparent"
            }`}
          >
            {filtro.label}
          </Button>
        );
      })}
    </div>
  );
}
