"use client";

import * as React from "react";

type MoonPhaseDiscProps = {
  /** 0..360 — 0 nova, 180 cheia */
  angle: number;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * Esfera lunar translúcida com a porção iluminada desenhada pela fase.
 */
export function MoonPhaseDisc({ angle, className, style }: MoonPhaseDiscProps) {
  const a = ((angle % 360) + 360) % 360;
  const k = (1 - Math.cos((a * Math.PI) / 180)) / 2;
  const waxing = a < 180;

  const r = 50;
  const rx = Number((Math.abs(1 - 2 * k) * r).toFixed(3));
  const sweepOuter = waxing ? 1 : 0;
  const sweepInner = k < 0.5 ? (waxing ? 0 : 1) : waxing ? 1 : 0;
  const litPath = `M 50 0 A ${r} ${r} 0 0 ${sweepOuter} 50 100 A ${rx} ${r} 0 0 ${sweepInner} 50 0 Z`;

  return (
    <svg viewBox="0 0 100 100" className={className} style={style} aria-hidden>
      <circle cx="50" cy="50" r={r} fill="hsl(220 20% 62% / 0.18)" />
      {k > 0.005 ? <path d={litPath} fill="hsl(220 30% 88% / 0.65)" /> : null}
      <circle
        cx="50"
        cy="50"
        r={r - 0.5}
        fill="none"
        stroke="hsl(220 15% 70% / 0.45)"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
