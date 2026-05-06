"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

import { Button } from "@/components/ui/button";

export default function FinalCTA() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="bg-muted/20 py-24 lg:py-32">

      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        className="w-full space-y-6 border-b border-border/70 px-6 pb-8 text-center lg:px-16"
      >
        <h2 className="font-display text-3xl text-foreground lg:text-4xl">Faça sua primeira pergunta</h2>
        <p className="font-body text-iris-secondary">
          Sem cadastro, sem assinatura. Escolha um tema, faça uma pergunta e receba sua previsão em segundos.
        </p>
        <Button asChild className="font-body text-xs uppercase tracking-wider">
          <a href="#calculadora">Fazer minha pergunta agora</a>
        </Button>
      </motion.div>
    </section>
  );
}
