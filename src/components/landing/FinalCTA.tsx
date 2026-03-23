"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

import { Button } from "@/components/ui/button";

export default function FinalCTA() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="relative overflow-hidden bg-muted py-24 lg:py-32">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(hsl(48 30% 93% / 0.03) 1px, transparent 1px), linear-gradient(90deg, hsl(48 30% 93% / 0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        className="relative mx-auto max-w-2xl space-y-6 px-6 text-center lg:px-16"
      >
        <h2 className="font-display text-3xl text-foreground lg:text-4xl">Faça sua primeira pergunta</h2>
        <p className="mx-auto max-w-md font-body text-iris-secondary">
          Sem cadastro, sem assinatura. Escolha um tema, faça uma pergunta e receba sua previsão em segundos.
        </p>
        <Button asChild className="font-body text-xs uppercase tracking-wider">
          <a href="#calculadora">Fazer minha pergunta agora</a>
        </Button>
      </motion.div>
    </section>
  );
}
