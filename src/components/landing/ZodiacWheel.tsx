import { useEffect, useState } from "react";

const SIGNS = ["♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"];
const SIGN_NAMES = ["Áries","Touro","Gêmeos","Câncer","Leão","Virgem","Libra","Escorpião","Sagitário","Capricórnio","Aquário","Peixes"];

const PLANETS = [
  { symbol: "☉", name: "Sol", angle: 225 },
  { symbol: "☽", name: "Lua", angle: 38 },
  { symbol: "☿", name: "Mercúrio", angle: 198 },
  { symbol: "♀", name: "Vênus", angle: 252 },
  { symbol: "♂", name: "Marte", angle: 68 },
  { symbol: "♃", name: "Júpiter", angle: 155 },
  { symbol: "♄", name: "Saturno", angle: 340 },
  { symbol: "♇", name: "Plutão", angle: 298 },
];

const ASPECTS = [
  { from: 0, to: 4, color: "hsl(4, 65%, 46%)" },
  { from: 1, to: 3, color: "hsl(145, 54%, 42%)" },
  { from: 2, to: 5, color: "hsl(145, 54%, 42%)" },
  { from: 0, to: 7, color: "hsl(282, 41%, 54%)" },
];

interface ZodiacWheelProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

const ZodiacWheel = ({ size = 400, className = "", animate = true }: ZodiacWheelProps) => {
  const [visiblePlanets, setVisiblePlanets] = useState(animate ? 0 : PLANETS.length);
  const renderedVisiblePlanets = animate ? visiblePlanets : PLANETS.length;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.45;
  const innerR = size * 0.33;
  const planetR = size * 0.27;

  useEffect(() => {
    if (!animate) {
      return;
    }

    let nextVisible = 0;
    const startTimeout = window.setTimeout(() => {
      setVisiblePlanets(0);
    }, 0);

    const interval = window.setInterval(() => {
      nextVisible += 1;
      setVisiblePlanets(nextVisible);

      if (nextVisible >= PLANETS.length) {
        window.clearInterval(interval);
      }
    }, 200);

    return () => {
      window.clearTimeout(startTimeout);
      window.clearInterval(interval);
    };
  }, [animate]);

  const formatCoord = (value: number) => value.toFixed(6);

  const toXY = (angle: number, r: number) => {
    const radians = ((angle - 90) * Math.PI) / 180;

    return {
      x: formatCoord(cx + r * Math.cos(radians)),
      y: formatCoord(cy + r * Math.sin(radians)),
    };
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      aria-label="Roda zodiacal"
    >
      {/* Background gradient */}
      <defs>
        <radialGradient id="wheelBg">
          <stop offset="0%" stopColor="hsl(265, 20%, 11%)" />
          <stop offset="100%" stopColor="hsl(265, 30%, 5%)" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={outerR} fill="url(#wheelBg)" />

      {/* Sign segments */}
      {SIGNS.map((sign, i) => {
        const startAngle = i * 30;
        const midAngle = startAngle + 15;
        const startInner = toXY(startAngle, innerR);
        const startOuter = toXY(startAngle, outerR);
        const labelPos = toXY(midAngle, (outerR + innerR) / 2);
        return (
          <g key={i}>
            <line
              x1={startInner.x} y1={startInner.y}
              x2={startOuter.x} y2={startOuter.y}
              stroke="hsl(48, 30%, 93%)" strokeOpacity={0.06} strokeWidth={1}
            />
            <text
              x={labelPos.x} y={labelPos.y}
              textAnchor="middle" dominantBaseline="central"
              fill="hsl(48, 30%, 93%)" fillOpacity={0.4}
              fontSize={size * 0.04}
              aria-label={SIGN_NAMES[i]}
            >
              {sign}
            </text>
          </g>
        );
      })}

      {/* Circles */}
      <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="hsl(48,30%,93%)" strokeOpacity={0.08} strokeWidth={1} />
      <circle cx={cx} cy={cy} r={innerR} fill="none" stroke="hsl(48,30%,93%)" strokeOpacity={0.06} strokeWidth={1} />

      {/* ASC/DSC axis */}
      <line
        x1={toXY(3, outerR).x}
        y1={toXY(3, outerR).y}
        x2={toXY(183, outerR).x}
        y2={toXY(183, outerR).y}
        stroke="#E30613" strokeWidth={2} strokeOpacity={0.7}
      />
      {/* MC/IC axis */}
      <line
        x1={toXY(270, outerR).x}
        y1={toXY(270, outerR).y}
        x2={toXY(90, outerR).x}
        y2={toXY(90, outerR).y}
        stroke="hsl(48,30%,93%)" strokeWidth={1} strokeOpacity={0.15}
      />

      {/* Aspect lines */}
      {ASPECTS.map((a, i) => {
        if (renderedVisiblePlanets <= Math.max(a.from, a.to)) return null;
        const p1 = toXY(PLANETS[a.from].angle, planetR);
        const p2 = toXY(PLANETS[a.to].angle, planetR);
        return (
          <line key={`asp-${i}`}
            x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
            stroke={a.color} strokeWidth={1} strokeOpacity={0.5}
            style={{ transition: "opacity 0.4s" }}
          />
        );
      })}

      {/* Planets */}
      {PLANETS.slice(0, renderedVisiblePlanets).map((p, i) => {
        const pos = toXY(p.angle, planetR);
        return (
          <g key={i} style={{ opacity: 1, transition: "opacity 0.4s" }}>
            <circle cx={pos.x} cy={pos.y} r={size * 0.025} fill="hsl(43,52%,54%)" fillOpacity={0.2} />
            <text
              x={pos.x} y={pos.y}
              textAnchor="middle" dominantBaseline="central"
              fill="hsl(43,52%,54%)" fontSize={size * 0.04}
              aria-label={p.name}
            >
              {p.symbol}
            </text>
          </g>
        );
      })}

      {/* ASC label */}
      <text
        x={toXY(3, outerR * 1.08).x}
        y={toXY(3, outerR * 1.08).y}
        textAnchor="start" fill="#E30613" fontSize={size * 0.025}
        fontFamily="var(--font-mono)" letterSpacing="0.1em"
      >
        ASC
      </text>
    </svg>
  );
};

export default ZodiacWheel;
