"use client";

import { useState } from "react";
import { motion } from "framer-motion";
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
        <motion.button
          type="button"
          whileHover={{ scale: 1.04, y: -2 }}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="flex cursor-pointer items-center gap-2 rounded-3xl border border-foreground/15 bg-bubble px-4 py-2.5 font-extrabold text-foreground shadow-[6px_8px_24px_-8px_hsl(0_0%_0%/0.12)] transition-shadow duration-300 hover:shadow-[8px_12px_32px_-6px_hsl(0_0%_0%/0.2)]"
        >
          <Lightbulb className="size-4 shrink-0 text-iris" fill="currentColor" strokeWidth={1.5} />
          <span className="font-jakarta text-[13px] font-extrabold tracking-[0.01em] sm:text-[14px]">Dicas</span>
        </motion.button>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="start" className="pointer-events-auto w-80 p-4">
        <p className="mb-3 text-[10px] font-semibold tracking-[0.22em] text-iris uppercase">Dicas</p>
        <TipsList tips={TIPS} />
      </PopoverContent>
    </Popover>
  );
}
