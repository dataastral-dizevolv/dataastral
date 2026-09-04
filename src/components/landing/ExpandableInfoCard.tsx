"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";


export function ExpandableInfoCard() {
  const [expanded, setExpanded] = useState(false);

  const text = `O calendário e o relógio foram inventados ao olhar a posição real dos astros. Na época em que os sacerdotes estudavam todas as ciências e linguagens em conjunto, astrologia era observação da realidade, para o desenvolvimento da civilização.

Raras pessoas tinham acesso, porque é um estudo complexo. Também é bom saber, que astrologia não foi criada para julgar pessoas. Mas sim, para planejar produção de alimentos, e sobrevivência a guerras.

Dos últimos 200 mil anos, o que sobrou como fragmentos de teorias, foi reunido numa colcha de retalhos misturando conceitos de povos e tempos muito diferentes. E imagine as traduções erradas!

A psicologia por exemplo é uma escola recente. E sua ética e responsabilidade não permitem julgar.

Talvez, por isso, astrologia pode ter se tornado uma palavra vazia de seriedade.

A pesquisa para criar o Data Iris foi justamente separar o que realmente acontece em previsões, do que seja superstição.

O propósito em apoiar pessoas, por meio da empatia, surgiu na prática e em retorno recorrente dos mesmos consulentes, por vinte anos.

Seus relatos anônimos foram analisados de acordo com datas astrológicas.

Com este conjunto robusto de depoimentos, Data Iris é o método para tomada de decisões, em face de incertezas e angústias.

Astrólogos não inventam futuros. E sim, ajudam pessoas no acompanhamento da rotina em momentos de perdas graves, sofrimentos e também, sucessos.

A ciência despreza a astrologia de hoje. Contudo, no trabalho com ética, pode-se sim notar, que a posição dos astros indicam sim, algo extremamente valioso para decisões.

Tempo é vida. E soberania é a liberdade de fazer melhores escolhas.

Esses são os ganhos que Data Iris valoriza! Iluminar a confiança de milhares de consulentes que retornam todos os dias, confirmando a parte da astrologia que deu certo.

Data Iris entrega a data de maior ou menor chance para decidir. Isso é importante, porque nos ajuda a:

☆ não perder oportunidades
☆ a não gastar energia no dia errado
☆ a preservar energias em momentos difíceis
☆ a saber quando um momento difícil acaba
☆ a nos preparar e a nos concentrar para momentos de vitória!
☆ a evitar rupturas precipitadas
☆ a ganhar tempo, energia e liberdade!
☆ a ganhar autoconfiança e fé, quando algo da certo!
☆ a confiar no destino e universo
☆ diminuir a incerteza, promover serenidade, resiliência, força de vontade e realização.
☆ a saber em qual relacionamento investir, e quais os momentos de encerrar!

Saber o melhor momento, é saber o momento certo!

Queira você, novas esperanças, ou, prefira ver, como ganhar tempo e liberdade.

A certeza que temos é que nos melhores dias, o universo entrega algo melhor e maior do que se estava procurando.

Saiba o momento certo para suas decisões, e realização de seus objetivos!`;

  return (
    <div className="relative rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-md px-6 py-6 sm:px-10 sm:py-10 md:px-14 md:py-12 text-left">
      <button
        type="button"
        onClick={() => setExpanded(false)}
        className="absolute top-4 right-4 sm:top-5 sm:right-5 inline-flex items-center justify-center w-8 h-8 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        aria-label="Fechar"
      >
        <X className="w-5 h-5" strokeWidth={1.5} />
      </button>
      <h2 className="text-[11px] sm:text-[13px] uppercase tracking-[0.2em] text-muted-foreground font-medium mb-4 pr-8">
        Propósito
      </h2>

      <motion.div
        className="overflow-hidden relative"
        initial={false}
        animate={{ height: expanded ? "auto" : 160 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <div className="space-y-4">
          {text.split("\n\n").map((paragraph, i) => (
            <p
              key={i}
              className="text-[13px] sm:text-[15px] md:text-[16px] leading-[1.6] font-normal whitespace-pre-line text-muted-foreground"
            >
              {paragraph}
            </p>
          ))}
        </div>
        {!expanded && (
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-20 pointer-events-none"
            style={{ background: "linear-gradient(to bottom, transparent, hsl(0 0% 0% / 0.6))" }}
          />
        )}
      </motion.div>
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="mt-5 inline-flex items-center text-white/70 hover:text-white text-sm sm:text-base font-semibold tracking-[0.02em] underline underline-offset-4 decoration-white/30 hover:decoration-white transition-colors"
      >
        {expanded ? "Fechar" : "Leia mais"}
      </button>
    </div>
  );
}
