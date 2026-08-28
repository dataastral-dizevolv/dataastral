"use client";

import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";

interface Props {
  onComplete: () => void;
  duration?: number;
}

type OrbitConfig = {
  r: number;
  duration: number;
  size: number;
  color: string;
  glow: string;
  fadeDelay: number;
  fadeDuration: number;
  ring?: "saturn" | "uranus";
};

const ORBITS: OrbitConfig[] = [
  { r: 40, duration: 7, size: 8, color: "hsl(220 12% 78%)", glow: "hsl(220 12% 78% / 0.4)", fadeDelay: 0, fadeDuration: 4 },
  { r: 62, duration: 11, size: 11, color: "hsl(42 55% 78%)", glow: "hsl(42 55% 78% / 0.45)", fadeDelay: 1.2, fadeDuration: 5.5 },
  { r: 84, duration: 15, size: 12, color: "hsl(210 55% 80%)", glow: "hsl(210 55% 80% / 0.4)", fadeDelay: 2.4, fadeDuration: 6 },
  { r: 106, duration: 20, size: 10, color: "hsl(18 50% 72%)", glow: "hsl(18 50% 72% / 0.45)", fadeDelay: 0.8, fadeDuration: 4.8 },
  { r: 132, duration: 28, size: 16, color: "hsl(215 38% 70%)", glow: "hsl(215 38% 70% / 0.4)", fadeDelay: 3.1, fadeDuration: 7 },
  { r: 160, duration: 36, size: 14, color: "hsl(38 48% 76%)", glow: "hsl(38 48% 76% / 0.4)", fadeDelay: 1.7, fadeDuration: 6.5, ring: "saturn" },
  { r: 188, duration: 44, size: 12, color: "hsl(195 55% 80%)", glow: "hsl(195 55% 80% / 0.4)", fadeDelay: 2.1, fadeDuration: 6, ring: "uranus" },
];

export function VanCleefSolarLoader({ onComplete, duration = 8000 }: Props) {
  useEffect(() => {
    const t = setTimeout(onComplete, duration);
    return () => clearTimeout(t);
  }, [onComplete, duration]);

  const keyframes = useMemo(
    () =>
      ORBITS.map(
        (o, i) => `
        @keyframes vcs-orbit-${i} {
          from { transform: rotate(0deg) translateX(${o.r}px) rotate(0deg); }
          to   { transform: rotate(360deg) translateX(${o.r}px) rotate(-360deg); }
        }
      `,
      ).join("\n") +
      `
      @keyframes vcs-sun-pulse {
        0%, 100% { opacity: 0.95; transform: scale(1); }
        50%      { opacity: 1;    transform: scale(1.04); }
      }
    `,
    [],
  );

  return (
    <div className="relative flex h-[320px] w-full items-center justify-center overflow-hidden">
      <div className="relative h-[320px] w-[400px]">
        <svg viewBox="-200 -160 400 320" className="absolute inset-0 h-full w-full" fill="none" aria-hidden>
          {ORBITS.map((o, i) => (
            <circle
              key={`ring-${i}`}
              cx="0"
              cy="0"
              r={o.r}
              stroke="currentColor"
              strokeWidth="0.4"
              vectorEffect="non-scaling-stroke"
              className="text-foreground/15"
            />
          ))}
        </svg>

        <div
          className="absolute top-1/2 left-1/2 rounded-full"
          style={{
            width: 22,
            height: 22,
            marginLeft: -11,
            marginTop: -11,
            background:
              "radial-gradient(circle at 35% 35%, hsl(0 0% 98%) 0%, hsl(220 8% 78%) 55%, hsl(220 10% 55%) 100%)",
            boxShadow:
              "0 0 14px hsl(220 12% 80% / 0.55), inset -1.5px -1.5px 2px hsl(220 10% 40% / 0.5), inset 1px 1px 1.5px hsl(0 0% 100% / 0.8)",
            animation: "vcs-sun-pulse 4.5s ease-in-out infinite",
          }}
        />

        {ORBITS.map((o, i) => (
          <div
            key={`p-${i}`}
            className="absolute top-1/2 left-1/2"
            style={{
              width: o.size,
              height: o.size,
              marginLeft: -o.size / 2,
              marginTop: -o.size / 2,
              transformOrigin: "center center",
              animation: `vcs-orbit-${i} ${o.duration}s linear infinite`,
              willChange: "transform",
            }}
          >
            <motion.div
              className="relative h-full w-full rounded-full"
              style={{
                background: `radial-gradient(circle at 32% 32%, ${o.color} 0%, ${o.color} 55%, hsl(220 10% 25%) 100%)`,
                boxShadow: `0 0 ${o.size * 1.4}px ${o.glow}, inset -0.8px -0.8px 1.2px hsl(0 0% 0% / 0.55), inset 0.5px 0.5px 0.8px hsl(0 0% 100% / 0.45)`,
              }}
              animate={{ opacity: [0.15, 1, 0.6, 1, 0.2] }}
              transition={{
                duration: o.fadeDuration,
                delay: o.fadeDelay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              {o.ring === "saturn" ? (
                <span
                  className="pointer-events-none absolute top-1/2 left-1/2 rounded-full"
                  style={{
                    width: o.size * 2.6,
                    height: o.size * 0.9,
                    transform: "translate(-50%, -50%) rotate(-18deg)",
                    border: "1px solid hsl(40 45% 75% / 0.5)",
                    boxShadow: "inset 0 0 2px hsl(40 45% 75% / 0.25), 0 0 3px hsl(40 45% 75% / 0.2)",
                  }}
                />
              ) : null}
              {o.ring === "uranus" ? (
                <span
                  className="pointer-events-none absolute top-1/2 left-1/2 rounded-full"
                  style={{
                    width: o.size * 2.2,
                    height: o.size * 0.55,
                    transform: "translate(-50%, -50%) rotate(82deg)",
                    border: "1px solid hsl(195 50% 78% / 0.45)",
                    boxShadow: "inset 0 0 2px hsl(195 50% 78% / 0.2), 0 0 3px hsl(195 50% 78% / 0.15)",
                  }}
                />
              ) : null}
            </motion.div>
          </div>
        ))}
      </div>

      <p className="absolute bottom-2 right-0 left-0 text-center text-[10px] tracking-[0.28em] text-muted-foreground uppercase">
        Consultando o céu
      </p>

      <style>{keyframes}</style>
    </div>
  );
}
