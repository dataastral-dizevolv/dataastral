"use client";

import { Suspense, useRef } from "react";
import { motion, useInView } from "framer-motion";

import ZodiacWheel from "@/components/landing/ZodiacWheel";

const highlights = [
  "Posições planetárias via Swiss Ephemeris",
  "Aspectos calculados em tempo real",
  "Casas baseadas na sua localização",
];

function WheelFallback() {
  return (
    <div className="flex h-[400px] w-[400px] items-center justify-center border border-border/70">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-iris-accent" aria-label="Carregando roda zodiacal" />
    </div>
  );
}

export default function ZodiacWheelSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="bg-background py-20 lg:py-28">
      <div className="w-full px-6 lg:px-16">
        <div ref={ref} className="grid grid-cols-1 items-center gap-10 border-b border-border/70 pb-10 lg:grid-cols-2 lg:gap-16 lg:pb-14">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="space-y-5"
          >
            <p className="font-mono-iris text-xs uppercase tracking-[0.18em] text-iris-accent">Céu em tempo real</p>
            <h2 className="font-display text-3xl text-foreground lg:text-4xl">
              Os planetas da sua leitura são os do momento exato da pergunta
            </h2>
            <p className="max-w-xl font-body text-base leading-relaxed text-iris-secondary">
              Calculamos o céu atual com Swiss Ephemeris e combinamos com seu mapa natal para gerar uma leitura
              contextual, rápida e consistente.
            </p>

            <ul className="space-y-3 border-t border-border/70 pt-5">
              {highlights.map((item) => (
                <li key={item} className="flex items-start gap-3 font-body text-sm text-iris-secondary">
                  <span className="mt-1 h-1.5 w-1.5 bg-iris-accent" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="flex justify-center lg:justify-end"
          >
            <Suspense fallback={<WheelFallback />}>
              <ZodiacWheel size={400} animate />
            </Suspense>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
