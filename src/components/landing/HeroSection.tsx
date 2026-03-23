"use client";

import { motion, useReducedMotion } from "framer-motion";

import StarField from "@/components/landing/StarField";
import { Button } from "@/components/ui/button";
import ZodiacWheel from "@/components/landing/ZodiacWheel";

export default function HeroSection() {
  const prefersReducedMotion = useReducedMotion();
  const twinklePoints = [
    { top: "16%", left: "74%", size: 3, duration: 2.8 },
    { top: "66%", left: "17%", size: 2.5, duration: 4.2 },
    { top: "82%", left: "58%", size: 4, duration: 3.4 },
    { top: "28%", left: "88%", size: 2.3, duration: 5 },
    { top: "44%", left: "6%", size: 3.2, duration: 3.1 },
    { top: "91%", left: "35%", size: 2.6, duration: 4.6 },
  ] as const;

  return (
    <section className="relative flex min-h-screen items-center overflow-hidden bg-background">
      <div
        className="pointer-events-none absolute z-0"
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "-10%",
          right: "-5%",
          width: "55%",
          height: "70%",
          background: "radial-gradient(ellipse, hsl(265 60% 68% / 0.13) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />
      <div
        className="pointer-events-none absolute z-0"
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: "5%",
          left: "-8%",
          width: "45%",
          height: "60%",
          background: "radial-gradient(ellipse, hsl(282 50% 40% / 0.10) 0%, transparent 70%)",
          filter: "blur(100px)",
        }}
      />

      <StarField />

      <div className="pointer-events-none absolute inset-0 z-[2]" aria-hidden="true">
        {twinklePoints.map((point, index) => (
          <div
            key={`twinkle-${index}`}
            className="twinkle-particle absolute rounded-full"
            style={{
              width: `${point.size}px`,
              height: `${point.size}px`,
              top: point.top,
              left: point.left,
              background: "hsl(265 60% 85%)",
              boxShadow: "0 0 18px hsl(var(--iris-accent-glow)), 0 0 28px hsl(var(--iris-accent-glow))",
              animation: prefersReducedMotion ? "none" : "twinkle 3.6s ease-in-out infinite",
              animationDuration: `${point.duration}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 mx-auto grid w-full max-w-[1280px] grid-cols-1 items-center gap-12 px-6 pt-32 lg:grid-cols-12 lg:px-16 lg:pt-24">
        <div className="space-y-6 lg:col-span-7">
          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="heading-hero">
            A geometria do tempo
            <br />
            aplicada às suas decisões
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="max-w-lg font-body text-lg leading-relaxed text-iris-secondary"
          >
            Faça uma pergunta. Receba uma previsão baseada em efemérides reais. Sem assinatura - você compra apenas as
            perguntas que quiser.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="flex flex-wrap gap-3 pt-2">
            <Button asChild className="font-body text-xs uppercase tracking-wider">
              <a href="#calculadora">Fazer minha primeira pergunta</a>
            </Button>
            <Button asChild variant="outline" className="font-body text-xs uppercase tracking-wider">
              <a href="#como-funciona">Como funciona</a>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex items-center gap-4 pt-4 font-mono-iris text-xs text-iris-muted"
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
          className="flex justify-center lg:col-span-5"
        >
          <div className={prefersReducedMotion ? "" : "animate-rotate-slow"}>
            <ZodiacWheel size={380} />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
