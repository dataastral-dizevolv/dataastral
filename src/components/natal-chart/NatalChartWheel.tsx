"use client";

import * as React from "react";
import { motion } from "framer-motion";

import ZodiacGlyph from "@/components/natal-chart/ZodiacGlyph";
import type { NatalChartData, NatalPlanet } from "@/lib/astrology/natal-chart";
import { SIGN_NAMES } from "@/lib/astrology/natal-chart";

export type Planet = NatalPlanet;
export type ChartData = NatalChartData;

const SIGN_COLORS = [
  "hsl(var(--chambray))",
  "hsl(var(--casper))",
  "hsl(var(--powder-blue))",
  "hsl(var(--blue-steel))",
  "hsl(var(--chambray))",
  "hsl(var(--casper))",
  "hsl(var(--powder-blue))",
  "hsl(var(--blue-steel))",
  "hsl(var(--chambray))",
  "hsl(var(--casper))",
  "hsl(var(--powder-blue))",
  "hsl(var(--blue-steel))",
];

export const DEFAULT_PLANET_COLORS: Record<string, string> = {
  sun: "hsl(var(--chambray))",
  moon: "hsl(var(--casper))",
  mercury: "hsl(var(--powder-blue))",
  venus: "hsl(var(--azure-soft))",
  mars: "hsl(var(--blue-steel))",
  jupiter: "hsl(var(--chambray))",
  saturn: "hsl(var(--blue-deep))",
  uranus: "hsl(var(--casper))",
  neptune: "hsl(var(--blue-steel))",
  pluto: "hsl(var(--blue-ink))",
};

interface NatalChartWheelProps {
  data: ChartData;
  size?: number;
  onSelectPlanet?: (planet: Planet) => void;
  selectedPlanetId?: string | null;
  showHouses?: boolean;
}

export function NatalChartWheel({
  data,
  size = 360,
  onSelectPlanet,
  selectedPlanetId,
  showHouses = true,
}: NatalChartWheelProps) {
  const rOuter = 168;
  const rSigns = 150;
  const rHouses = 120;
  const rPlanets = 96;
  const rInner = 74;
  const offset = 180 - data.ascendant;

  const toXY = (lon: number, r: number) => {
    const a = ((lon + offset) * Math.PI) / 180;
    return { x: r * Math.cos(a), y: -r * Math.sin(a) };
  };

  const signTicks = Array.from({ length: 12 }, (_, i) => i * 30);
  const houseCusps = Array.from({ length: 12 }, (_, i) => data.ascendant + i * 30);
  const axes = [
    { lon: data.ascendant, label: "ASC", anchor: "end" as const, dx: -8, dy: 4 },
    { lon: data.midheaven, label: "MC", anchor: "middle" as const, dx: 0, dy: -10 },
    { lon: data.ascendant + 180, label: "DSC", anchor: "start" as const, dx: 8, dy: 4 },
    { lon: data.midheaven + 180, label: "FC", anchor: "middle" as const, dx: 0, dy: 18 },
  ];

  function handlePlanetClick(planet: Planet) {
    onSelectPlanet?.(planet);
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="-180 -180 360 360" width={size} height={size} className="block">
        {[rOuter, rSigns, rHouses, rInner].map((r, i) => (
          <circle
            key={i}
            cx={0}
            cy={0}
            r={r}
            fill="none"
            stroke="hsl(var(--foreground))"
            strokeOpacity={0.9}
            strokeWidth="0.8"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {signTicks.map((lon, i) => {
          const a1 = ((lon + offset) * Math.PI) / 180;
          const a2 = ((lon + 30 + offset) * Math.PI) / 180;
          const x1 = rSigns * Math.cos(a1);
          const y1 = -rSigns * Math.sin(a1);
          const x2 = rSigns * Math.cos(a2);
          const y2 = -rSigns * Math.sin(a2);
          const x3 = rOuter * Math.cos(a2);
          const y3 = -rOuter * Math.sin(a2);
          const x4 = rOuter * Math.cos(a1);
          const y4 = -rOuter * Math.sin(a1);
          return (
            <path
              key={`sect-${i}`}
              d={`M ${x1} ${y1} A ${rSigns} ${rSigns} 0 0 0 ${x2} ${y2} L ${x3} ${y3} A ${rOuter} ${rOuter} 0 0 1 ${x4} ${y4} Z`}
              fill={SIGN_COLORS[i]}
              fillOpacity={i % 2 === 0 ? 0.55 : 0.35}
              stroke="none"
            />
          );
        })}

        {signTicks.map((lon, i) => {
          const a = toXY(lon, rOuter);
          const b = toXY(lon, rHouses);
          return (
            <line
              key={`sign-tick-${i}`}
              x1={b.x}
              y1={b.y}
              x2={a.x}
              y2={a.y}
              stroke="hsl(var(--foreground))"
              strokeOpacity={0.85}
              strokeWidth="0.8"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}

        {Array.from({ length: 12 }).map((_, i) => {
          const center = i * 30 + 15;
          const p = toXY(center, (rOuter + rSigns) / 2);
          const s = 22;
          return (
            <g key={`gly-${i}`} transform={`translate(${p.x - s / 2}, ${p.y - s / 2})`}>
              <ZodiacGlyph index={i} size={s} strokeWidth={1.6} className="text-background" />
            </g>
          );
        })}

        {showHouses
          ? houseCusps.map((lon, i) => {
              const a = toXY(lon, rHouses);
              const b = toXY(lon, rInner);
              const isAxis = i % 3 === 0;
              return (
                <line
                  key={`cusp-${i}`}
                  x1={b.x}
                  y1={b.y}
                  x2={a.x}
                  y2={a.y}
                  stroke="hsl(var(--foreground))"
                  strokeOpacity={isAxis ? 0.9 : 0.45}
                  strokeWidth={isAxis ? 0.9 : 0.5}
                  vectorEffect="non-scaling-stroke"
                />
              );
            })
          : null}

        <image
          href="/brand/app-logo.png"
          x={-rInner * 0.25}
          y={-rInner * 0.25}
          width={rInner * 0.5}
          height={rInner * 0.5}
          opacity={0.08}
          style={{ pointerEvents: "none" }}
        />

        <g opacity={0.7}>
          {data.planets.map((p1, i) =>
            data.planets.slice(i + 1).map((p2, j) => {
              const diff = Math.abs(((p1.longitude - p2.longitude) % 360 + 360) % 360);
              const angle = diff > 180 ? 360 - diff : diff;
              const aspects = [
                { deg: 0, orb: 6 },
                { deg: 60, orb: 4 },
                { deg: 90, orb: 5 },
                { deg: 120, orb: 5 },
                { deg: 180, orb: 6 },
              ];
              const hit = aspects.find((item) => Math.abs(angle - item.deg) <= item.orb);
              if (!hit) return null;
              const a = toXY(p1.longitude, rInner - 2);
              const b = toXY(p2.longitude, rInner - 2);
              return (
                <line
                  key={`asp-${i}-${j}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke="hsl(var(--blue-deep))"
                  strokeOpacity={0.55}
                  strokeWidth="0.8"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              );
            }),
          )}
        </g>

        {showHouses
          ? axes.map((ax, i) => {
              const a = toXY(ax.lon, rOuter + 8);
              return (
                <text
                  key={`axis-${i}`}
                  x={a.x + ax.dx}
                  y={a.y + ax.dy}
                  textAnchor={ax.anchor}
                  dominantBaseline="central"
                  fontSize="14"
                  fill="hsl(var(--foreground))"
                  style={{ fontFamily: "var(--font-jakarta-fallback), sans-serif", fontWeight: 900, letterSpacing: "0.06em" }}
                >
                  {ax.label}
                </text>
              );
            })
          : null}

        {data.planets.map((planet, i) => {
          const pos = toXY(planet.longitude, rPlanets);
          const fill = planet.color ?? DEFAULT_PLANET_COLORS[planet.id] ?? "hsl(var(--chambray))";
          const selected = selectedPlanetId === planet.id;
          return (
            <motion.g
              key={planet.id}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + i * 0.06, duration: 0.5, ease: "easeOut" }}
              onClick={() => handlePlanetClick(planet)}
              style={{ cursor: onSelectPlanet ? "pointer" : "default" }}
            >
              <title>{`${planet.label} em ${SIGN_NAMES[Math.floor((((planet.longitude % 360) + 360) % 360) / 30)]}`}</title>
              <circle cx={pos.x} cy={pos.y} r={22} fill="transparent" />
              {selected ? (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={18}
                  fill="none"
                  stroke="hsl(var(--foreground))"
                  strokeWidth="1.2"
                  vectorEffect="non-scaling-stroke"
                />
              ) : null}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={13}
                fill={fill}
                stroke="hsl(var(--foreground))"
                strokeOpacity={0.9}
                strokeWidth="0.8"
                vectorEffect="non-scaling-stroke"
              />
              <text
                x={pos.x}
                y={pos.y + 0.5}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="14"
                fill="hsl(var(--background))"
                style={{ fontWeight: 900, pointerEvents: "none" }}
              >
                {planet.symbol}
              </text>
            </motion.g>
          );
        })}
      </svg>
    </div>
  );
}

export default NatalChartWheel;
