"use client";

import { useState } from "react";
import { Lightbulb } from "lucide-react";

import { TypewriterText } from "@/components/iris-chat/TypewriterText";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const TIPS = [
  "Espere a data para conferir a previsão.",
  "Repita a pergunta apenas depois da data ocorrida.",
  "Uma previsão é a data no seu mapa astral, com a melhor energia para você decidir.",
  "Não fazemos adivinhação, nem datas aleatórias. Enviamos conselhos sobre a energia do momento para suas decisões e expectativas.",
  "Para assuntos jurídicos, de saúde, e sobre temas sensíveis, aconselhamos a buscar advogados, médicos e psicólogos.",
];

function TipsList({ tips }: { tips: string[] }) {
  const [revealed, setRevealed] = useState(0);
  return (
    <ol className="space-y-4">
      {tips.map((tip, index) => {
        if (index > revealed) return null;
        return (
          <li key={tip} className="flex gap-3 text-sm leading-[1.6] text-foreground">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-iris text-[11px] font-bold text-iris-foreground">
              {index + 1}
            </span>
            <span>
              {index < revealed ? (
                tip
              ) : (
                <TypewriterText
                  text={tip}
                  speed={18}
                  onComplete={() => {
                    if (index + 1 < tips.length) {
                      window.setTimeout(() => setRevealed((current) => Math.max(current, index + 1)), 250);
                    }
                  }}
                />
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function ChatTips() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-2xl border border-border bg-bubble px-4 py-2.5 font-jakarta text-[13px] font-extrabold text-foreground transition-colors hover:bg-muted sm:text-sm"
        >
          <Lightbulb className="size-4 shrink-0 text-iris" strokeWidth={1.5} />
          Dicas
        </button>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="start" className="w-80 p-4">
        <p className="mb-3 text-[10px] font-semibold tracking-[0.22em] text-iris uppercase">Dicas</p>
        <TipsList tips={TIPS} />
      </PopoverContent>
    </Popover>
  );
}
