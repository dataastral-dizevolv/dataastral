"use client";

import * as React from "react";

import {
  type AstrologicalAspect,
  type PlanetPosition,
  ZODIAC_SIGNS,
} from "@/lib/astrology/painel";

type NatalChartSVGProps = {
  positions: PlanetPosition[];
  aspects: AstrologicalAspect[];
  size?: number;
  highlightedAspect?: AstrologicalAspect | null;
  onHoverAspect?: (a: AstrologicalAspect | null) => void;
  onSelectPlanet?: (p: PlanetPosition) => void;
};

/** Áries (0°) na esquerda; ângulos crescem anti-horário. */
function lonToXY(longitudeDeg: number, radius: number, cx: number, cy: number) {
  const a = ((180 - longitudeDeg) * Math.PI) / 180;
  return { x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) };
}

const SIGN_FILL = [
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

export function NatalChartSVG({
  positions,
  aspects,
  size = 520,
  highlightedAspect = null,
  onHoverAspect,
  onSelectPlanet,
}: NatalChartSVGProps) {
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = size * 0.48;
  const rSign = size * 0.42;
  const rInner = size * 0.34;
  const rPlanet = size * 0.3;
  const rAspect = size * 0.27;
  const uid = React.useId().replace(/:/g, "");

  const sorted = [...positions].sort((a, b) => a.longitude - b.longitude);
  const adjusted = new Map<string, number>();
  const minGap = 7;
  let lastLon = -Infinity;
  for (const p of sorted) {
    let lon = p.longitude;
    if (lon - lastLon < minGap) lon = lastLon + minGap;
    adjusted.set(p.id, lon);
    lastLon = lon;
  }

  const aspectDelays = React.useMemo(() => {
    const keyed = aspects.map((aspect, index) => {
      const key = `${aspect.body1}|${aspect.type}|${aspect.body2}`;
      let hash = 0;
      for (let i = 0; i < key.length; i++) {
        hash = (hash * 33 + key.charCodeAt(i)) >>> 0;
      }
      return { index, hash };
    });
    keyed.sort((a, b) => a.hash - b.hash || a.index - b.index);
    const delays: number[] = new Array(aspects.length);
    const step = 0.35;
    keyed.forEach((item, order) => {
      delays[item.index] = order * step;
    });
    return delays;
  }, [aspects]);

  const totalCycle = Math.max(aspects.length * 0.35 + 2.5, 4);

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width="100%"
      style={{ maxWidth: size, height: "auto" }}
      className="select-none"
      aria-label="Roda do mapa astral"
    >
      <defs>
        <radialGradient id={`${uid}-signGlow`} cx="50%" cy="50%" r="50%">
          <stop offset="55%" stopColor="hsl(var(--crystal-blue))" stopOpacity="0" />
          <stop offset="78%" stopColor="hsl(var(--crystal-blue))" stopOpacity="0.55" />
          <stop offset="100%" stopColor="hsl(var(--crystal-blue))" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${uid}-centerGlow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsl(var(--powder-blue))" stopOpacity="0.12" />
          <stop offset="65%" stopColor="hsl(var(--powder-blue))" stopOpacity="0.03" />
          <stop offset="100%" stopColor="hsl(var(--powder-blue))" stopOpacity="0" />
        </radialGradient>
        <filter id={`${uid}-softGlow`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <filter id={`${uid}-watermarkTint`} x="0%" y="0%" width="100%" height="100%">
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.773
                    0 0 0 0 0.898
                    0 0 0 0 0.925
                    0 0 0 1 0"
          />
        </filter>
      </defs>

      <style>{`
        @keyframes natalAspectPulse-${uid} {
          0% { stroke-dashoffset: 1; opacity: 0.08; }
          20% { stroke-dashoffset: 0; opacity: 0.38; }
          55% { stroke-dashoffset: 0; opacity: 0.22; }
          100% { stroke-dashoffset: 0; opacity: 0.18; }
        }
        @keyframes natalPlanetTwinkle-${uid} {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.18); opacity: 0.85; }
        }
        @keyframes natalPlanetIn-${uid} {
          0% { opacity: 0; transform: scale(0.4); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes natalTickGlow-${uid} {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 1; }
        }
        .natal-planet-${uid} {
          transform-box: fill-box;
          transform-origin: center;
          animation: natalPlanetIn-${uid} 0.6s ease-out both, natalPlanetTwinkle-${uid} 3.6s ease-in-out infinite;
          transition: transform 0.2s ease-out;
        }
        .natal-planet-${uid}:hover { transform: scale(1.25); }
        .natal-tick-${uid} {
          animation: natalTickGlow-${uid} 3.6s ease-in-out infinite;
        }
      `}</style>

      <circle
        cx={cx}
        cy={cy}
        r={(rOuter + rSign) / 2}
        fill={`url(#${uid}-signGlow)`}
        filter={`url(#${uid}-softGlow)`}
        style={{ pointerEvents: "none" }}
      />

      {ZODIAC_SIGNS.map((s, i) => {
        const startDeg = i * 30;
        const endDeg = (i + 1) * 30;
        const p1 = lonToXY(startDeg, rOuter, cx, cy);
        const p2 = lonToXY(endDeg, rOuter, cx, cy);
        const p3 = lonToXY(endDeg, rSign, cx, cy);
        const p4 = lonToXY(startDeg, rSign, cx, cy);
        const labelPos = lonToXY(startDeg + 15, (rOuter + rSign) / 2, cx, cy);
        return (
          <g key={s.name}>
            <path
              d={`M ${p1.x} ${p1.y} A ${rOuter} ${rOuter} 0 0 0 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${rSign} ${rSign} 0 0 1 ${p4.x} ${p4.y} Z`}
              fill={SIGN_FILL[i]}
              opacity={0.85}
            />
            <text
              x={labelPos.x}
              y={labelPos.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={size * 0.035}
              fill="hsl(var(--background))"
              fontWeight={700}
            >
              {s.symbol}
            </text>
          </g>
        );
      })}

      <circle cx={cx} cy={cy} r={rSign} fill="none" stroke="hsl(var(--background) / 0.5)" />
      <circle cx={cx} cy={cy} r={rInner} fill="none" stroke="hsl(var(--background) / 0.4)" />
      <circle
        cx={cx}
        cy={cy}
        r={rAspect}
        fill="hsl(var(--blue-ink))"
        stroke="hsl(var(--background) / 0.4)"
      />

      <circle
        cx={cx}
        cy={cy}
        r={rAspect}
        fill={`url(#${uid}-centerGlow)`}
        style={{ pointerEvents: "none" }}
      />
      <image
        href="/brand/iris-mark.png"
        x={cx - rAspect * 0.225}
        y={cy - rAspect * 0.225}
        width={rAspect * 0.45}
        height={rAspect * 0.45}
        opacity={0.06}
        filter={`url(#${uid}-watermarkTint)`}
        style={{ pointerEvents: "none" }}
      />

      {Array.from({ length: 12 }).map((_, i) => {
        const p1 = lonToXY(i * 30, rSign, cx, cy);
        const p2 = lonToXY(i * 30, rInner, cx, cy);
        return (
          <line
            key={i}
            x1={p1.x}
            y1={p1.y}
            x2={p2.x}
            y2={p2.y}
            stroke="hsl(var(--background) / 0.3)"
            strokeWidth={1}
          />
        );
      })}

      <g>
        {aspects.map((a, idx) => {
          const p1 = lonToXY(a.long1, rAspect, cx, cy);
          const p2 = lonToXY(a.long2, rAspect, cx, cy);
          const dim = highlightedAspect && highlightedAspect !== a;
          const isHighlighted = highlightedAspect === a;
          const animStyle: React.CSSProperties = isHighlighted
            ? { cursor: "pointer", opacity: 0.55 }
            : {
                cursor: "pointer",
                strokeDasharray: 1,
                strokeDashoffset: 1,
                animationName: `natalAspectPulse-${uid}`,
                animationDuration: `${totalCycle}s`,
                animationTimingFunction: "ease-in-out",
                animationDelay: `${aspectDelays[idx] ?? 0}s`,
                animationIterationCount: "infinite",
              };
          return (
            <line
              key={`${a.body1}-${a.body2}-${a.type}-${idx}`}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke={isHighlighted ? "hsl(var(--crystal-blue))" : "hsl(var(--casper))"}
              strokeWidth={isHighlighted ? 1 : 0.7}
              opacity={dim ? 0.06 : isHighlighted ? 0.55 : 0.22}
              strokeLinecap="round"
              pathLength={1}
              onMouseEnter={() => onHoverAspect?.(a)}
              onMouseLeave={() => onHoverAspect?.(null)}
              style={animStyle}
            />
          );
        })}
      </g>

      {positions.map((p, i) => {
        const lon = adjusted.get(p.id) ?? p.longitude;
        const pos = lonToXY(lon, rPlanet, cx, cy);
        const tick1 = lonToXY(p.longitude, rInner, cx, cy);
        const tick2 = lonToXY(p.longitude, rInner - 6, cx, cy);
        const delay = (i % Math.max(positions.length, 1)) * 0.22;
        return (
          <g
            key={p.id}
            style={{ cursor: onSelectPlanet ? "pointer" : "default" }}
            onClick={() => onSelectPlanet?.(p)}
            role={onSelectPlanet ? "button" : undefined}
            aria-label={`${p.name} em ${p.sign}`}
          >
            <line
              x1={tick1.x}
              y1={tick1.y}
              x2={tick2.x}
              y2={tick2.y}
              stroke="hsl(var(--background) / 0.7)"
              className={`natal-tick-${uid}`}
              style={{ animationDelay: `${delay}s` }}
            />
            <g
              className={`natal-planet-${uid}`}
              style={{
                animationDelay: `${delay * 0.5}s, ${delay}s`,
                transformOrigin: `${pos.x}px ${pos.y}px`,
              }}
            >
              <circle cx={pos.x} cy={pos.y} r={size * 0.04} fill="transparent" />
              <circle cx={pos.x} cy={pos.y} r={size * 0.022} fill="hsl(var(--background))" />
              <text
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={size * 0.028}
                fill="hsl(var(--blue-ink))"
                fontWeight={700}
                style={{ pointerEvents: "none" }}
              >
                {p.symbol}
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
}
