import { Body, Illumination, MoonPhase } from "astronomy-engine";
import { fromZonedTime } from "date-fns-tz";

import {
  getCurrentPosition,
  PLANET_LABELS_PT,
  PLANET_SYMBOLS,
  ZODIAC,
} from "@/lib/astrology/ephemeris";

export type PlanetPosition = {
  id: string;
  name: string;
  symbol: string;
  longitude: number;
  sign: string;
  signSymbol: string;
  degreeWithinSign: number;
};

export type AspectType = "Conjunção" | "Sêxtil" | "Quadratura" | "Trígono" | "Oposição";

export type AstrologicalAspect = {
  body1: string;
  body2: string;
  long1: number;
  long2: number;
  type: AspectType;
  angle: number;
  orb: number;
  color: string;
};

export type MoonData = {
  angle: number;
  name: string;
  illumination: number;
  waxing: boolean;
};

export type ChartAngle = {
  name: "Ascendente" | "Meio do Céu" | "Descendente" | "Fundo do Céu";
  abbr: "ASC" | "MC" | "DSC" | "FC";
  longitude: number;
  sign: string;
  signSymbol: string;
  degreeWithinSign: number;
};

export type ChartAngles = {
  ASC: ChartAngle;
  MC: ChartAngle;
  DSC: ChartAngle;
  FC: ChartAngle;
};

export type CityOption = {
  id: string;
  label: string;
  timezone: string;
  latitude: number;
  longitude: number;
};

export type BirthMomentResult = {
  utcDate: Date;
  offsetMinutes: number;
  isDST: boolean;
  localISO: string;
  utcISO: string;
};

export const ZODIAC_SIGNS = ZODIAC.map((s) => ({ name: s.name, symbol: s.symbol }));

export const CITY_OPTIONS: CityOption[] = [
  { id: "sao-paulo", label: "São Paulo, BR", timezone: "America/Sao_Paulo", latitude: -23.5505, longitude: -46.6333 },
  { id: "rio-janeiro", label: "Rio de Janeiro, BR", timezone: "America/Sao_Paulo", latitude: -22.9068, longitude: -43.1729 },
  { id: "brasilia", label: "Brasília, BR", timezone: "America/Sao_Paulo", latitude: -15.7939, longitude: -47.8828 },
  { id: "recife", label: "Recife, BR", timezone: "America/Recife", latitude: -8.0476, longitude: -34.877 },
  { id: "manaus", label: "Manaus, BR", timezone: "America/Manaus", latitude: -3.119, longitude: -60.0217 },
  { id: "lisbon", label: "Lisboa, PT", timezone: "Europe/Lisbon", latitude: 38.7223, longitude: -9.1393 },
  { id: "madrid", label: "Madrid, ES", timezone: "Europe/Madrid", latitude: 40.4168, longitude: -3.7038 },
  { id: "paris", label: "Paris, FR", timezone: "Europe/Paris", latitude: 48.8566, longitude: 2.3522 },
  { id: "london", label: "Londres, UK", timezone: "Europe/London", latitude: 51.5074, longitude: -0.1278 },
  { id: "new-york", label: "Nova York, US", timezone: "America/New_York", latitude: 40.7128, longitude: -74.006 },
  { id: "los-angeles", label: "Los Angeles, US", timezone: "America/Los_Angeles", latitude: 34.0522, longitude: -118.2437 },
  { id: "tokyo", label: "Tóquio, JP", timezone: "Asia/Tokyo", latitude: 35.6762, longitude: 139.6503 },
];

const PAINEL_BODIES: Array<{ id: string; key: string }> = [
  { id: "sun", key: "earth" },
  { id: "moon", key: "moon" },
  { id: "mercury", key: "mercury" },
  { id: "venus", key: "venus" },
  { id: "mars", key: "mars" },
  { id: "jupiter", key: "jupiter" },
  { id: "saturn", key: "saturn" },
  { id: "uranus", key: "uranus" },
  { id: "neptune", key: "neptune" },
  { id: "pluto", key: "pluto" },
];

const ASPECT_RULES: Array<{ type: AspectType; target: number; orb: number; color: string }> = [
  { type: "Conjunção", target: 0, orb: 8, color: "hsl(45 95% 55%)" },
  { type: "Sêxtil", target: 60, orb: 6, color: "hsl(150 70% 50%)" },
  { type: "Quadratura", target: 90, orb: 8, color: "hsl(10 80% 55%)" },
  { type: "Trígono", target: 120, orb: 8, color: "hsl(210 85% 55%)" },
  { type: "Oposição", target: 180, orb: 8, color: "hsl(280 60% 55%)" },
];

export function findCity(id: string): CityOption | undefined {
  return CITY_OPTIONS.find((c) => c.id === id);
}

export function findCityByTimezone(timezone: string | null | undefined): CityOption | undefined {
  if (!timezone) return undefined;
  return CITY_OPTIONS.find((c) => c.timezone === timezone);
}

export function getZodiacDetails(longitude: number) {
  const normalized = ((longitude % 360) + 360) % 360;
  const signIndex = Math.floor(normalized / 30);
  const degreeWithinSign = normalized % 30;
  const sign = ZODIAC[signIndex] ?? ZODIAC[0];
  return {
    sign: sign.name,
    signSymbol: sign.symbol,
    signIndex,
    degree: parseFloat(degreeWithinSign.toFixed(2)),
    totalDegrees: normalized,
  };
}

export function calculatePlanets(date: Date): PlanetPosition[] {
  if (Number.isNaN(date.getTime())) return [];

  return PAINEL_BODIES.map((body) => {
    const pos = getCurrentPosition(body.key, date);
    const d = getZodiacDetails(pos.longitude);
    return {
      id: body.id,
      name: PLANET_LABELS_PT[body.id] ?? body.id,
      symbol: PLANET_SYMBOLS[body.id] ?? "✦",
      longitude: d.totalDegrees,
      sign: d.sign,
      signSymbol: d.signSymbol,
      degreeWithinSign: d.degree,
    };
  });
}

export function calculateAspects(positions: PlanetPosition[]): AstrologicalAspect[] {
  const out: AstrologicalAspect[] = [];
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const diff = Math.abs(positions[i].longitude - positions[j].longitude);
      const angle = Math.min(diff, 360 - diff);
      for (const rule of ASPECT_RULES) {
        const orb = Math.abs(angle - rule.target);
        if (orb <= rule.orb) {
          out.push({
            body1: positions[i].name,
            body2: positions[j].name,
            long1: positions[i].longitude,
            long2: positions[j].longitude,
            type: rule.type,
            angle: parseFloat(angle.toFixed(2)),
            orb: parseFloat(orb.toFixed(2)),
            color: rule.color,
          });
          break;
        }
      }
    }
  }
  return out;
}

export function calculateMoonData(date: Date): MoonData {
  if (Number.isNaN(date.getTime())) {
    return { angle: 0, name: "Lua Nova", illumination: 0, waxing: true };
  }

  const phaseAngle = MoonPhase(date);
  let phaseName = "Lua Nova";
  if (phaseAngle >= 355 || phaseAngle < 5) phaseName = "Lua Nova";
  else if (phaseAngle < 85) phaseName = "Lua Crescente";
  else if (phaseAngle < 95) phaseName = "Quarto Crescente";
  else if (phaseAngle < 175) phaseName = "Gibosa Crescente";
  else if (phaseAngle < 185) phaseName = "Lua Cheia";
  else if (phaseAngle < 265) phaseName = "Gibosa Minguante";
  else if (phaseAngle < 275) phaseName = "Quarto Minguante";
  else phaseName = "Lua Minguante";

  let illuminationPct = Math.sin((phaseAngle * Math.PI) / 360) ** 2 * 100;
  try {
    const ill = Illumination(Body.Moon, date);
    if (typeof ill.phase_fraction === "number") {
      illuminationPct = ill.phase_fraction * 100;
    }
  } catch {
    /* keep geometric estimate */
  }

  return {
    angle: phaseAngle,
    name: phaseName,
    illumination: parseFloat(illuminationPct.toFixed(1)),
    waxing: phaseAngle < 180,
  };
}

export function moonSignSymbol(date: Date): string {
  try {
    return getZodiacDetails(getCurrentPosition("moon", date).longitude).signSymbol;
  } catch {
    return "";
  }
}

function toJulianDate(date: Date) {
  return date.getTime() / 86400000 + 2440587.5;
}

function gmstDegrees(jd: number) {
  const t = (jd - 2451545.0) / 36525;
  const st =
    280.46061837 +
    360.98564736629 * (jd - 2451545.0) +
    0.000387933 * t * t -
    (t * t * t) / 38710000;
  return ((st % 360) + 360) % 360;
}

function obliquityDegrees(jd: number) {
  const t = (jd - 2451545.0) / 36525;
  return 23.439291111 - 0.013004166 * t;
}

function buildAngle(
  longitude: number,
  name: ChartAngle["name"],
  abbr: ChartAngle["abbr"],
): ChartAngle {
  const d = getZodiacDetails(longitude);
  return {
    name,
    abbr,
    longitude: d.totalDegrees,
    sign: d.sign,
    signSymbol: d.signSymbol,
    degreeWithinSign: d.degree,
  };
}

export function calculateChartAngles(date: Date, latitude: number, longitude: number): ChartAngles {
  const jd = toJulianDate(date);
  const ramc = ((gmstDegrees(jd) + longitude) % 360 + 360) % 360;
  const obl = (obliquityDegrees(jd) * Math.PI) / 180;
  const ramcRad = (ramc * Math.PI) / 180;
  const latRad = (latitude * Math.PI) / 180;

  const mc = Math.atan2(Math.sin(ramcRad), Math.cos(ramcRad) * Math.cos(obl));
  const y = Math.cos(ramcRad);
  const x = -(Math.sin(ramcRad) * Math.cos(obl) + Math.tan(latRad) * Math.sin(obl));
  const asc = Math.atan2(y, x);

  const ascLon = ((asc * 180) / Math.PI + 360) % 360;
  const mcLon = ((mc * 180) / Math.PI + 360) % 360;

  return {
    ASC: buildAngle(ascLon, "Ascendente", "ASC"),
    MC: buildAngle(mcLon, "Meio do Céu", "MC"),
    DSC: buildAngle((ascLon + 180) % 360, "Descendente", "DSC"),
    FC: buildAngle((mcLon + 180) % 360, "Fundo do Céu", "FC"),
  };
}

export function buildBirthMoment(input: {
  date: string;
  time: string;
  timezone: string;
}): BirthMomentResult | null {
  const time = (input.time || "12:00").slice(0, 5);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date) || !/^\d{2}:\d{2}$/.test(time)) {
    return null;
  }

  const localStamp = `${input.date}T${time}:00`;
  let utcDate: Date;
  try {
    utcDate = fromZonedTime(localStamp, input.timezone);
  } catch {
    utcDate = new Date(localStamp);
  }

  if (Number.isNaN(utcDate.getTime())) return null;

  let offsetMinutes = 0;
  let isDST = false;
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: input.timezone,
      timeZoneName: "shortOffset",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(utcDate);
    const tzName = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT";
    const match = tzName.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/i);
    if (match) {
      const sign = match[1] === "-" ? -1 : 1;
      offsetMinutes = sign * (Number(match[2]) * 60 + Number(match[3] ?? 0));
    }
    const jan = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
    const jul = new Date(Date.UTC(utcDate.getUTCFullYear(), 6, 1));
    const janOff = getOffsetMinutes(jan, input.timezone);
    const julOff = getOffsetMinutes(jul, input.timezone);
    const std = Math.min(janOff, julOff);
    isDST = offsetMinutes !== std && Math.abs(offsetMinutes) > Math.abs(std);
  } catch {
    /* keep defaults */
  }

  return {
    utcDate,
    offsetMinutes,
    isDST,
    localISO: localStamp,
    utcISO: utcDate.toISOString(),
  };
}

function getOffsetMinutes(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const tzName = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT";
  const match = tzName.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/i);
  if (!match) return 0;
  const sign = match[1] === "-" ? -1 : 1;
  return sign * (Number(match[2]) * 60 + Number(match[3] ?? 0));
}

export function formatDegreeMinutes(degreeWithinSign: number): string {
  const deg = Math.floor(degreeWithinSign);
  const min = String(Math.floor((degreeWithinSign % 1) * 60)).padStart(2, "0");
  return `${deg}°${min}′`;
}
