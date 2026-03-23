"use client";

import { useRef } from "react";
import { Calendar, HelpCircle, Sparkles, Star } from "lucide-react";
import { motion, useInView } from "framer-motion";

import { Card, CardContent } from "@/components/ui/card";

const steps = [
  {
    num: "01",
    icon: Star,
    title: "Escolha um tema",
    desc: "Amor, carreira, finanças, saúde e mais. Selecione o que está presente em sua vida agora.",
  },
  {
    num: "02",
    icon: HelpCircle,
    title: "Escolha sua pergunta",
    desc: "Perguntas objetivas e calibradas para resposta astrológica precisa.",
  },
  {
    num: "03",
    icon: Calendar,
    title: "Informe seu nascimento",
    desc: "Data, horário e local para o cálculo exato das posições planetárias no seu mapa natal.",
  },
  {
    num: "04",
    icon: Sparkles,
    title: "Receba sua previsão",
    desc: "Análise gerada em segundos. Leia online ou baixe o PDF.",
  },
];

export default function HowItWorks() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="como-funciona" className="bg-card py-24 lg:py-32">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-16">
        <h2 className="mb-16 text-center font-display text-3xl text-foreground lg:text-4xl">Como funciona</h2>

        <div ref={ref} className="relative grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="absolute top-12 right-[12.5%] left-[12.5%] hidden h-px border-t border-dashed border-primary/30 lg:block" />

          {steps.map((step, index) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: index * 0.15 }}
            >
              <Card className="h-full border-iris bg-card text-center">
                <CardContent className="space-y-4 p-6">
                  <span className="font-display text-3xl text-iris-accent">{step.num}</span>
                  <div className="flex justify-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                      <step.icon size={22} className="text-iris-accent" />
                    </div>
                  </div>
                  <h3 className="font-body font-semibold text-foreground">{step.title}</h3>
                  <p className="font-body text-sm leading-relaxed text-iris-secondary">{step.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
