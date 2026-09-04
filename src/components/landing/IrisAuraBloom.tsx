"use client";

import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";

/**
 * IrisAuraBloom
 * -------------
 * Aurora de tons pastéis ancorada na BASE do visor, ocupando 100% da largura
 * (edge-to-edge), com bordas difusas/transparentes. Inspirada na referência
 * Lovable: o gradiente "nasce" no rodapé e se difunde para cima. Sem pulse —
 * surge uma única vez (fade in + sobe) e desaparece lentamente conforme o
 * usuário rola a tela.
 *
 * Paleta: azul pastel · violeta azulado · azul claro céu · chambray suave.
 */

type Layer = {
  /** Cor central forte (pastel) */
  core: string;
  /** Cor intermediária */
  mid: string;
  /** Largura do bloom em % do container */
  widthPct: number;
  /** Altura do bloom em % do container */
  heightPct: number;
  /** Deslocamento horizontal do centro do gradiente (% do container) */
  cx: number;
  /** Quão acima da base nasce o núcleo (% do container, 0 = base) */
  cyFromBottom: number;
  blur: number;
  opacity: number;
  delay: number;
};

// Camadas — todas ancoradas próximas à base do visor.
// Centro recuado para a esquerda para que o bloom alcance mais a lateral esquerda.
const LAYERS: Layer[] = [
  // Azul claro céu — base ampla, puxada para a esquerda
  {
    core: "rgba(196, 222, 240, 0.85)",
    mid: "rgba(196, 222, 240, 0.24)",
    widthPct: 220,
    heightPct: 120,
    cx: 38,
    cyFromBottom: 0,
    blur: 90,
    opacity: 1,
    delay: 0,
  },
  // Chambray pastel — coração central, ligeiramente à esquerda
  {
    core: "rgba(150, 188, 222, 0.95)",
    mid: "rgba(150, 188, 222, 0.28)",
    widthPct: 170,
    heightPct: 105,
    cx: 36,
    cyFromBottom: 8,
    blur: 75,
    opacity: 1,
    delay: 0.1,
  },
  // Violeta azulado — toque cromático lateral esquerdo, mais expandido
  {
    core: "rgba(168, 162, 220, 0.65)",
    mid: "rgba(168, 162, 220, 0.18)",
    widthPct: 160,
    heightPct: 95,
    cx: 18,
    cyFromBottom: 14,
    blur: 85,
    opacity: 0.95,
    delay: 0.18,
  },
  // Azul/glauco mais saturado — destaque pontual direita, equilibrado com a expansão esquerda
  {
    core: "rgba(118, 158, 200, 0.7)",
    mid: "rgba(118, 158, 200, 0.2)",
    widthPct: 170,
    heightPct: 80,
    cx: 70,
    cyFromBottom: 12,
    blur: 65,
    opacity: 0.9,
    delay: 0.24,
  },
];

const GRAIN_SVG =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.6 0'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.55'/></svg>\")";

interface IrisAuraBloomProps {
  className?: string;
  /** Scroll (px) para o fade-out completo. */
  fadeDistance?: number;
  /** Altura visual do bloom (em vh/svh). Default 70svh. */
  bloomHeight?: string;
}

const IrisAuraBloom = ({
  className = "",
  fadeDistance = 650,
  bloomHeight = "85svh",
}: IrisAuraBloomProps) => {
  const reduceMotion = useReducedMotion();

  const { scrollY } = useScroll();
  const scrollOpacity = useTransform(
    scrollY,
    [0, fadeDistance * 0.35, fadeDistance],
    [1, 0.65, 0]
  );
  const scrollY2 = useTransform(scrollY, [0, fadeDistance], [0, 40]);

  return (
    <motion.div
      aria-hidden
      className={`pointer-events-none fixed inset-x-0 bottom-0 z-[2] overflow-hidden ${className}`}
      style={{
        height: bloomHeight,
        opacity: scrollOpacity,
        y: scrollY2,
        willChange: "opacity, transform",
        // bordas superiores difusas — desaparece suavemente para cima
        maskImage:
          "linear-gradient(to top, rgba(0,0,0,1) 15%, rgba(0,0,0,0.85) 45%, rgba(0,0,0,0.4) 75%, rgba(0,0,0,0) 100%)",
        WebkitMaskImage:
          "linear-gradient(to top, rgba(0,0,0,1) 15%, rgba(0,0,0,0.85) 45%, rgba(0,0,0,0.4) 75%, rgba(0,0,0,0) 100%)",
      }}
    >
      {LAYERS.map((layer, i) => (
        <motion.div
          key={i}
          className="absolute"
          initial={{ opacity: 0, y: 40 }}
          animate={
            reduceMotion
              ? { opacity: layer.opacity, y: 0 }
              : {
                  opacity: [0, layer.opacity * 0.85, layer.opacity],
                  y: [60, -4, 0],
                }
          }
          transition={{
            duration: reduceMotion ? 1.2 : 3.4,
            delay: layer.delay,
            times: reduceMotion ? undefined : [0, 0.7, 1],
            ease: [0.22, 0.61, 0.36, 1],
          }}
          style={{
            width: `${layer.widthPct}%`,
            height: `${layer.heightPct}%`,
            left: `${layer.cx}%`,
            bottom: `${layer.cyFromBottom - 30}%`,
            transform: "translateX(-50%)",
            background: `radial-gradient(ellipse at 50% 100%, ${layer.core} 0%, ${layer.mid} 38%, transparent 72%)`,
            filter: `blur(${layer.blur}px)`,
          }}
        />
      ))}

      {/* Textura granulada — sensação orgânica */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.18 }}
        transition={{ duration: 2.4, delay: 0.4, ease: "easeOut" }}
        style={{
          backgroundImage: GRAIN_SVG,
          backgroundSize: "220px 220px",
          mixBlendMode: "overlay",
        }}
      />
    </motion.div>
  );
};

export default IrisAuraBloom;
