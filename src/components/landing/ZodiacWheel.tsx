import { useEffect, useState } from "react";

const SIGNS = ["♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"];
const SIGN_NAMES = ["Áries","Touro","Gêmeos","Câncer","Leão","Virgem","Libra","Escorpião","Sagitário","Capricórnio","Aquário","Peixes"];
const HOUSE_NUMBERS = Array.from({ length: 12 }, (_, index) => index + 1);
const UI_FONT_STACK = '"Inter", "Segoe UI", system-ui, sans-serif';

interface Planet {
  name: string;
  symbol: string;
  angle: number;
  visual_angle: number;
  sign: string;
}

interface Aspect {
  from: string;
  to: string;
  color: string;
}

interface SkyNowResponse {
  planets: Planet[];
  aspects?: Aspect[];
  houses?: number[];
  angles?: {
    asc: number;
    mc: number;
    desc: number;
    ic: number;
  };
  ascendant?: number;
}

interface ZodiacWheelProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

const ZodiacWheel = ({ size = 400, className = "", animate = true }: ZodiacWheelProps) => {
  const [planets, setPlanets] = useState<Planet[]>([]);
  const [aspects, setAspects] = useState<Aspect[]>([]);
  const [houses, setHouses] = useState<number[]>([]);
  const [chartAngles, setChartAngles] = useState({ asc: 0, mc: 90, desc: 180, ic: 270 });
  const [ascendantAngle, setAscendantAngle] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [visiblePlanets, setVisiblePlanets] = useState(animate ? 0 : 0);
  const renderedVisiblePlanets = animate ? visiblePlanets : planets.length;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.45;
  const innerR = size * 0.33;
  const planetR = size * 0.27;

  const normalizeAngle = (angle: number) => ((angle % 360) + 360) % 360;

  useEffect(() => {
    const controller = new AbortController();

    const loadSkyNow = async () => {
      setIsLoading(true);
      setFetchError(null);

      try {
        const response = await fetch("/api/sky-now", {
          method: "GET",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Falha ao carregar o céu do momento (${response.status})`);
        }

        const payload = (await response.json()) as SkyNowResponse;
        const apiPlanets = Array.isArray(payload.planets)
          ? payload.planets.map((planet) => ({
            ...planet,
            visual_angle: Number.isFinite(planet.visual_angle) ? planet.visual_angle : planet.angle,
          }))
          : [];
        const apiHouses = Array.isArray(payload.houses)
          ? payload.houses.filter((value) => Number.isFinite(value)).slice(0, 12)
          : [];
        const apiAsc: number = payload.angles && Number.isFinite(payload.angles.asc)
          ? Number(payload.angles.asc)
          : (Number.isFinite(payload.ascendant) ? Number(payload.ascendant) : 0);

        setPlanets(apiPlanets);
        setAspects(Array.isArray(payload.aspects) ? payload.aspects : []);
        setHouses(apiHouses);
        setChartAngles({
          asc: apiAsc,
          mc: payload.angles && Number.isFinite(payload.angles.mc) ? payload.angles.mc : 90,
          desc: payload.angles && Number.isFinite(payload.angles.desc) ? payload.angles.desc : normalizeAngle(apiAsc + 180),
          ic: payload.angles && Number.isFinite(payload.angles.ic) ? payload.angles.ic : 270,
        });
        setAscendantAngle(apiAsc);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setFetchError("Não foi possível carregar o Céu do Momento.");
        setPlanets([]);
        setAspects([]);
        setHouses([]);
        setChartAngles({ asc: 0, mc: 90, desc: 180, ic: 270 });
        setAscendantAngle(0);
      } finally {
        setIsLoading(false);
      }
    };

    void loadSkyNow();

    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (!animate || isLoading) {
      const syncTimeout = window.setTimeout(() => {
        setVisiblePlanets(planets.length);
      }, 0);

      return () => {
        window.clearTimeout(syncTimeout);
      };
    }

    let nextVisible = 0;
    const startTimeout = window.setTimeout(() => {
      setVisiblePlanets(0);
    }, 0);

    const interval = window.setInterval(() => {
      nextVisible += 1;
      setVisiblePlanets(nextVisible);

      if (nextVisible >= planets.length) {
        window.clearInterval(interval);
      }
    }, 200);

    return () => {
      window.clearTimeout(startTimeout);
      window.clearInterval(interval);
    };
  }, [animate, isLoading, planets.length]);

  const formatCoord = (value: number) => value.toFixed(6);

  const toXYPoint = (angle: number, r: number) => {
    const radians = ((angle - 180) * Math.PI) / 180;

    return {
      x: cx + r * Math.cos(radians),
      y: cy + r * Math.sin(radians),
    };
  };

  const toXY = (angle: number, r: number) => {
    const point = toXYPoint(angle, r);
    return {
      x: formatCoord(point.x),
      y: formatCoord(point.y),
    };
  };

  const getAngleDistance = (angleA: number, angleB: number) => {
    const diff = Math.abs(normalizeAngle(angleA) - normalizeAngle(angleB));
    return diff > 180 ? 360 - diff : diff;
  };

  const houseCusps = houses.length === 12 ? houses : HOUSE_NUMBERS.map((_, index) => index * 30);

  const getPlanetColor = (planetName: string) => {
    switch (planetName) {
      case "Sun":
      case "Mars":
        return "hsl(43, 80%, 60%)";
      case "Moon":
      case "Venus":
        return "hsl(0, 0%, 83%)";
      case "Mercury":
        return "hsl(182, 62%, 62%)";
      case "Jupiter":
        return "hsl(158, 56%, 52%)";
      case "Saturn":
        return "hsl(30, 55%, 48%)";
      case "Pluto":
        return "hsl(220, 8%, 46%)";
      default:
        return "hsl(190, 52%, 60%)";
    }
  };

  const getAspectStyle = (fromAngle: number, toAngle: number, fallbackColor: string) => {
    const distance = getAngleDistance(fromAngle, toAngle);
    const orb = 6;

    const styles = [
      { angle: 120, stroke: "hsl(145, 54%, 42%)", opacity: 0.2, width: size * 0.0038 },
      { angle: 90, stroke: "hsl(24, 75%, 57%)", opacity: 0.18, width: size * 0.0036 },
      { angle: 180, stroke: "hsl(4, 65%, 46%)", opacity: 0.2, width: size * 0.004 },
    ];

    let closestStyle: { stroke: string; opacity: number; width: number; distance: number } | null = null;

    styles.forEach((style) => {
      const currentDistance = Math.abs(distance - style.angle);
      if (currentDistance > orb) {
        return;
      }

      if (!closestStyle || currentDistance < closestStyle.distance) {
        closestStyle = {
          stroke: style.stroke,
          opacity: style.opacity,
          width: style.width,
          distance: currentDistance,
        };
      }
    });

    if (closestStyle) {
      return closestStyle;
    }

    return {
      stroke: fallbackColor,
      opacity: 0.15,
      width: size * 0.0034,
    };
  };

  const planetIndexByName = new Map(planets.map((planet, index) => [planet.name, index]));
  const rotationAngle = -ascendantAngle;
  const toDisplayAngle = (angle: number) => normalizeAngle(angle + rotationAngle);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      aria-label="Roda zodiacal"
    >
      <circle cx={cx} cy={cy} r={outerR} fill="hsl(220, 14%, 7%)" />

      <g transform={`rotate(${rotationAngle} ${cx} ${cy})`}>
        {/* House lines and numbers */}
        {HOUSE_NUMBERS.map((houseNumber, index) => {
          const houseAngle = houseCusps[index] ?? index * 30;
          const nextHouseAngle = houseCusps[(index + 1) % houseCusps.length] ?? (houseAngle + 30);
          const angularSpan = normalizeAngle(nextHouseAngle - houseAngle);
          const houseMidAngle = normalizeAngle(houseAngle + angularSpan / 2);
          const lineStart = toXY(houseAngle, size * 0.1);
          const lineEnd = toXY(houseAngle, innerR);
          const houseLabelPos = toXY(houseMidAngle, innerR - size * 0.045);

          return (
            <g key={`house-${houseNumber}`}>
              <line
                x1={lineStart.x}
                y1={lineStart.y}
                x2={lineEnd.x}
                y2={lineEnd.y}
                stroke="hsl(48, 30%, 93%)"
                strokeOpacity={0.04}
                strokeWidth={Math.max(0.7, size * 0.0018)}
              />
              <text
                x={houseLabelPos.x}
                y={houseLabelPos.y}
                textAnchor="middle"
                dominantBaseline="central"
                fill="hsl(48, 30%, 93%)"
                fillOpacity={0.32}
                fontSize={size * 0.018}
                fontFamily={UI_FONT_STACK}
              >
                {houseNumber}
              </text>
            </g>
          );
        })}

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

        {/* Aspect lines */}
        {aspects.map((aspect, i) => {
          const fromIndex = planetIndexByName.get(aspect.from);
          const toIndex = planetIndexByName.get(aspect.to);

          if (fromIndex === undefined || toIndex === undefined) {
            return null;
          }

          if (renderedVisiblePlanets <= Math.max(fromIndex, toIndex)) {
            return null;
          }

          const fromPlanet = planets[fromIndex];
          const toPlanet = planets[toIndex];
          const p1 = toXY(fromPlanet.visual_angle, planetR);
          const p2 = toXY(toPlanet.visual_angle, planetR);
          const aspectStyle = getAspectStyle(fromPlanet.angle, toPlanet.angle, aspect.color);

          return (
            <line
              key={`asp-${i}`}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke={aspectStyle.stroke}
              strokeWidth={aspectStyle.width}
              strokeOpacity={aspectStyle.opacity}
              strokeLinecap="round"
              strokeDasharray={`${size * 0.012} ${size * 0.009}`}
              style={{ transition: "opacity 0.4s" }}
            />
          );
        })}

        {/* Planets */}
        {planets.slice(0, renderedVisiblePlanets).map((planet, i) => {
          const planetColor = getPlanetColor(planet.name);
          const pos = toXY(planet.visual_angle, planetR);
          const degreePosition = toXYPoint(planet.visual_angle, planetR + size * 0.047);
          const realAnglePosition = toXYPoint(planet.angle, outerR - size * 0.03);
          const needsLeaderLine = getAngleDistance(planet.visual_angle, planet.angle) > 0.3;
          const roundedDegree = Math.round(normalizeAngle(planet.angle));
          return (
            <g key={planet.name || i} style={{ opacity: 1, transition: "opacity 0.4s" }}>
              {needsLeaderLine && (
                <line
                  x1={formatCoord(realAnglePosition.x)}
                  y1={formatCoord(realAnglePosition.y)}
                  x2={pos.x}
                  y2={pos.y}
                  stroke={planetColor}
                  strokeOpacity={0.45}
                  strokeWidth={0.5}
                  strokeDasharray="1 2"
                />
              )}
              <circle cx={pos.x} cy={pos.y} r={size * 0.025} fill={planetColor} fillOpacity={0.22} />
              <text
                x={pos.x} y={pos.y}
                textAnchor="middle" dominantBaseline="central"
                fill={planetColor}
                fontSize={size * 0.04}
                aria-label={`${planet.name} em ${planet.sign}`}
              >
                {planet.symbol}
              </text>
              <text
                x={formatCoord(degreePosition.x)}
                y={formatCoord(degreePosition.y)}
                textAnchor="middle"
                dominantBaseline="central"
                fill="hsl(48,30%,93%)"
                fillOpacity={0.5}
                fontSize={size * 0.015}
                fontFamily={UI_FONT_STACK}
              >
                {roundedDegree}°
              </text>
            </g>
          );
        })}
      </g>

      {/* ASC/DSC axis */}
      <line
        x1={toXY(toDisplayAngle(chartAngles.asc), outerR).x}
        y1={toXY(toDisplayAngle(chartAngles.asc), outerR).y}
        x2={toXY(toDisplayAngle(chartAngles.desc), outerR).x}
        y2={toXY(toDisplayAngle(chartAngles.desc), outerR).y}
        stroke="#E30613" strokeWidth={2} strokeOpacity={0.9}
      />
      {/* MC/IC axis */}
      <line
        x1={toXY(toDisplayAngle(chartAngles.mc), outerR).x}
        y1={toXY(toDisplayAngle(chartAngles.mc), outerR).y}
        x2={toXY(toDisplayAngle(chartAngles.ic), outerR).x}
        y2={toXY(toDisplayAngle(chartAngles.ic), outerR).y}
        stroke="hsl(48,30%,93%)" strokeWidth={1.2} strokeOpacity={0.9}
      />

      {isLoading && (
        <g>
          <circle cx={cx} cy={cy} r={size * 0.12} fill="none" stroke="hsl(48,30%,93%)" strokeOpacity={0.12} strokeWidth={2} />
          <circle
            cx={cx}
            cy={cy}
            r={size * 0.12}
            fill="none"
            stroke="hsl(43,52%,54%)"
            strokeWidth={2.5}
            strokeDasharray={`${size * 0.3} ${size}`}
          >
            <animateTransform
              attributeName="transform"
              attributeType="XML"
              type="rotate"
              from={`0 ${cx} ${cy}`}
              to={`360 ${cx} ${cy}`}
              dur="1.2s"
              repeatCount="indefinite"
            />
          </circle>
          <text
            x={cx}
            y={cy + size * 0.18}
            textAnchor="middle"
            fill="hsl(48,30%,93%)"
            fillOpacity={0.65}
            fontSize={size * 0.03}
          >
            Carregando Ceu do Momento...
          </text>
        </g>
      )}

      {fetchError && !isLoading && (
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          fill="hsl(4, 65%, 46%)"
          fontSize={size * 0.028}
        >
          {fetchError}
        </text>
      )}

      {/* Axis labels */}
      <text
        x={toXY(toDisplayAngle(chartAngles.asc), outerR * 1.05).x}
        y={toXY(toDisplayAngle(chartAngles.asc), outerR * 1.05).y}
        textAnchor="start" fill="#E30613" fontSize={size * 0.025}
        fillOpacity={0.9}
        fontFamily={UI_FONT_STACK}
        letterSpacing="0.1em"
      >
        ASC
      </text>
      <text
        x={toXY(toDisplayAngle(chartAngles.desc), outerR * 1.05).x}
        y={toXY(toDisplayAngle(chartAngles.desc), outerR * 1.05).y}
        textAnchor="end"
        fill="#E30613"
        fillOpacity={0.9}
        fontSize={size * 0.022}
        fontFamily={UI_FONT_STACK}
        letterSpacing="0.08em"
      >
        DESC
      </text>
      <text
        x={toXY(toDisplayAngle(chartAngles.mc), outerR * 1.05).x}
        y={toXY(toDisplayAngle(chartAngles.mc), outerR * 1.05).y}
        textAnchor="middle"
        fill="hsl(48,30%,93%)"
        fillOpacity={0.9}
        fontSize={size * 0.021}
        fontFamily={UI_FONT_STACK}
        letterSpacing="0.08em"
      >
        MC
      </text>
      <text
        x={toXY(toDisplayAngle(chartAngles.ic), outerR * 1.05).x}
        y={toXY(toDisplayAngle(chartAngles.ic), outerR * 1.05).y}
        textAnchor="middle"
        fill="hsl(48,30%,93%)"
        fillOpacity={0.82}
        fontSize={size * 0.021}
        fontFamily={UI_FONT_STACK}
        letterSpacing="0.08em"
      >
        IC
      </text>
    </svg>
  );
};

export default ZodiacWheel;
