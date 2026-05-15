"use client";

import { Suspense } from "react";
import { motion } from "framer-motion";

import Calculator from "@/components/landing/Calculator";
import StarField from "@/components/landing/StarField";
import { Button } from "@/components/ui/button";

export default function HeroSection() {
  return (
    <section className="relative flex min-h-[64vh] items-center overflow-hidden bg-background lg:min-h-[68vh]">
      <StarField />
      <div className="relative z-10 grid w-full grid-cols-1 items-start gap-5 border-b border-border/70 px-6 pt-20 pb-6 lg:grid-cols-12 lg:gap-7 lg:px-16 lg:pt-20 lg:pb-6">
        <div className="space-y-4 lg:col-span-5 lg:pt-1">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="heading-hero max-w-[20ch] text-4xl leading-[1.02] lg:text-5xl"
          >
            A geometria do tempo aplicada ao seu momento
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="max-w-md font-body text-base leading-relaxed text-iris-secondary lg:text-lg"
          >
            Faça uma pergunta, informe seus dados de nascimento e receba uma leitura baseada no céu do momento. Sem
            login nesta fase.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="font-mono-iris text-xs text-iris-muted"
          >
            Grátis agora - Sem cadastro - Resultado na hora
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="flex flex-wrap gap-3 pt-1">
            <Button asChild variant="outline" className="font-body text-xs uppercase tracking-wider">
              <a href="#como-funciona">Como funciona</a>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex items-center gap-4 pt-2 font-mono-iris text-xs text-iris-muted"
          >
            <span>847 previsões hoje</span>
            <span className="text-iris-accent">-</span>
            <span>4.9 média</span>
            <span className="text-iris-accent">-</span>
            <span>Swiss Ephemeris</span>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="border-t border-border/70 pt-3 lg:col-span-7 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6"
        >
          <div className="mx-auto w-full max-w-xl">
            <Suspense fallback={null}>
              <Calculator context="landing" layout="embedded" />
            </Suspense>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
