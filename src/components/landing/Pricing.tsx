"use client";

import { useRef } from "react";
import { Check } from "lucide-react";
import { motion, useInView } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Basico",
    eyebrow: "POR RELATORIO",
    price: "R$29",
    period: "/mapa",
    features: ["Mapa natal PDF", "Download imediato", "Valido por 30 dias"],
    cta: "Comecar",
    highlighted: false,
  },
  {
    name: "Profissional",
    eyebrow: "MENSAL",
    price: "R$89",
    period: "/mes",
    features: ["10 mapas/mes", "Audio incluido", "Envio WhatsApp", "Dashboard analytics", "Suporte prioritario"],
    cta: "Assinar agora",
    highlighted: true,
  },
  {
    name: "Studio",
    eyebrow: "MENSAL",
    price: "R$290",
    period: "/mes",
    features: ["Mapas ilimitados", "WhatsApp automatizado", "Acesso a API", "White-label", "Onboarding dedicado"],
    cta: "Falar com equipe",
    highlighted: false,
  },
];

export default function Pricing() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="planos" className="bg-background py-24 lg:py-32">
      <div className="w-full px-6 lg:px-16">
        <h2 className="mb-16 border-b border-border/70 pb-4 text-center font-display text-3xl text-foreground lg:text-4xl">Escolha seu plano</h2>

        <div ref={ref} className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: index * 0.12 }}
            >
              <div className={`relative h-full space-y-4 border-b pb-7 ${plan.highlighted ? "border-iris-accent" : "border-iris"}`}>
                  {plan.highlighted && <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Mais popular</Badge>}

                  <p className="font-mono-iris text-[10px] tracking-widest text-iris-secondary">{plan.eyebrow}</p>
                  <h3 className="font-display text-xl text-foreground">{plan.name}</h3>
                  <div className="mb-2 flex items-baseline gap-1">
                    <span className="font-display text-3xl text-foreground">{plan.price}</span>
                    <span className="font-body text-sm text-iris-secondary">{plan.period}</span>
                  </div>

                  <ul className="space-y-2.5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 font-body text-sm text-foreground">
                        <Check size={15} className="mt-0.5 shrink-0 text-iris-accent" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant={plan.highlighted ? "default" : "outline"}
                    className="mt-4 w-full font-body text-xs uppercase tracking-wider"
                  >
                    {plan.cta}
                  </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
