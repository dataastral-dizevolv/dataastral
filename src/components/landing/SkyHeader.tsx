"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const PLANETS = [
  { name: "Sol", tip: "vitalidade e identidade" },
  { name: "Lua", tip: "emoção e ritmo" },
  { name: "Mercúrio", tip: "comunicação" },
  { name: "Vênus", tip: "afeto e valor" },
  { name: "Marte", tip: "ação e desejo" },
  { name: "Júpiter", tip: "expansão" },
];

/**
 * Lightweight stand-in for Lovable SkyHeader.
 * Full live ephemeris UI depends on astronomy-engine (not ported here).
 */
export default function SkyHeader() {
  return (
    <section
      id="sky-header"
      className="relative w-full px-5 sm:px-8 md:px-10 pt-10 sm:pt-16 pb-24 sm:pb-32"
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8 }}
        className="max-w-[1100px]"
      >
        <p className="text-[11px] sm:text-[12px] uppercase tracking-[0.18em] text-white/55 mb-4">
          Céu agora
        </p>
        <h2 className="section-title-energias text-white mb-4">
          O mapa do momento
        </h2>
        <p className="text-white/70 text-[14px] sm:text-[16px] leading-relaxed max-w-2xl mb-10">
          Acompanhe o ritmo dos astros e use as datas a seu favor. Entre para ver
          o céu ao vivo no painel e gerar previsões com o seu mapa.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {PLANETS.map((p) => (
            <div
              key={p.name}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-5 backdrop-blur-sm"
            >
              <p className="text-white font-semibold text-sm sm:text-base">{p.name}</p>
              <p className="text-white/50 text-[11px] sm:text-xs mt-1 leading-snug">{p.tip}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/cadastro"
            className="inline-flex items-center justify-center rounded-full bg-[hsl(var(--blue-chambray))] px-6 py-3 text-sm font-bold text-black hover:opacity-90 transition-opacity"
          >
            Começar agora
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3 text-sm font-medium text-white/85 hover:bg-white/5 transition-colors"
          >
            Já tenho conta
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
