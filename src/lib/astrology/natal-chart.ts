import { fromZonedTime } from "date-fns-tz";

import { getCurrentPosition, PLANET_LABELS_PT, PLANET_SYMBOLS, ZODIAC } from "@/lib/astrology/ephemeris";

export type NatalPlanet = {
  id: string;
  symbol: string;
  label: string;
  longitude: number;
  color?: string;
};

export type NatalChartData = {
  ascendant: number;
  midheaven: number;
  planets: NatalPlanet[];
};

export const SIGN_NAMES = ZODIAC.map((sign) => sign.name);

export const SAMPLE_NATAL_CHART: NatalChartData = {
  ascendant: 12,
  midheaven: 285,
  planets: [
    { id: "sun", symbol: PLANET_SYMBOLS.sun, label: PLANET_LABELS_PT.sun, longitude: 134 },
    { id: "moon", symbol: PLANET_SYMBOLS.moon, label: PLANET_LABELS_PT.moon, longitude: 218 },
    { id: "mercury", symbol: PLANET_SYMBOLS.mercury, label: PLANET_LABELS_PT.mercury, longitude: 152 },
    { id: "venus", symbol: PLANET_SYMBOLS.venus, label: PLANET_LABELS_PT.venus, longitude: 108 },
    { id: "mars", symbol: PLANET_SYMBOLS.mars, label: PLANET_LABELS_PT.mars, longitude: 64 },
    { id: "jupiter", symbol: PLANET_SYMBOLS.jupiter, label: PLANET_LABELS_PT.jupiter, longitude: 305 },
    { id: "saturn", symbol: PLANET_SYMBOLS.saturn, label: PLANET_LABELS_PT.saturn, longitude: 248 },
    { id: "uranus", symbol: PLANET_SYMBOLS.uranus, label: PLANET_LABELS_PT.uranus, longitude: 12 },
    { id: "neptune", symbol: PLANET_SYMBOLS.neptune, label: PLANET_LABELS_PT.neptune, longitude: 354 },
    { id: "pluto", symbol: PLANET_SYMBOLS.pluto, label: PLANET_LABELS_PT.pluto, longitude: 282 },
  ],
};

const NATAL_BODIES: Array<{ id: string; key: string }> = [
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

export function signFromLongitude(longitude: number) {
  const norm = ((longitude % 360) + 360) % 360;
  const idx = Math.floor(norm / 30);
  return {
    index: idx,
    name: SIGN_NAMES[idx],
    degree: Math.floor(norm % 30),
    norm,
  };
}

function parseBirthInstant(birthDate: string, birthTime: string | null, birthTimezone: string | null) {
  const time = (birthTime ?? "12:00").slice(0, 5);
  const localStamp = `${birthDate}T${time}:00`;

  if (birthTimezone && birthTimezone.length > 0) {
    try {
      return fromZonedTime(localStamp, birthTimezone);
    } catch {
      return new Date(`${birthDate}T${time}:00`);
    }
  }

  return new Date(`${birthDate}T${time}:00`);
}

function toJulianDate(date: Date) {
  return date.getTime() / 86400000 + 2440587.5;
}

function gmstDegrees(jd: number) {
  const t = (jd - 2451545.0) / 36525;
  const st = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * t * t - (t * t * t) / 38710000;
  return ((st % 360) + 360) % 360;
}

function obliquityDegrees(jd: number) {
  const t = (jd - 2451545.0) / 36525;
  return 23.439291111 - 0.013004166 * t;
}

function computeAxes(date: Date, lat: number, lng: number) {
  const jd = toJulianDate(date);
  const ramc = ((gmstDegrees(jd) + lng) % 360 + 360) % 360;
  const obl = (obliquityDegrees(jd) * Math.PI) / 180;
  const ramcRad = (ramc * Math.PI) / 180;
  const latRad = (lat * Math.PI) / 180;

  const mc = Math.atan2(Math.sin(ramcRad), Math.cos(ramcRad) * Math.cos(obl));
  const y = Math.cos(ramcRad);
  const x = -(Math.sin(ramcRad) * Math.cos(obl) + Math.tan(latRad) * Math.sin(obl));
  const asc = Math.atan2(y, x);

  return {
    ascendant: ((asc * 180) / Math.PI + 360) % 360,
    midheaven: ((mc * 180) / Math.PI + 360) % 360,
  };
}

export function buildNatalChart(input: {
  birthDate: string | null;
  birthTime: string | null;
  birthTimezone: string | null;
  birthLat: number | null;
  birthLng: number | null;
}): { data: NatalChartData; showHouses: boolean; isSample: boolean } {
  if (!input.birthDate) {
    return { data: SAMPLE_NATAL_CHART, showHouses: true, isSample: true };
  }

  const instant = parseBirthInstant(input.birthDate, input.birthTime, input.birthTimezone);
  if (Number.isNaN(instant.getTime())) {
    return { data: SAMPLE_NATAL_CHART, showHouses: true, isSample: true };
  }

  const planets: NatalPlanet[] = NATAL_BODIES.map((body) => {
    const position = getCurrentPosition(body.key, instant);
    return {
      id: body.id,
      symbol: PLANET_SYMBOLS[body.id],
      label: PLANET_LABELS_PT[body.id],
      longitude: position.longitude,
    };
  });

  const showHouses = input.birthLat != null && input.birthLng != null && Boolean(input.birthTime);
  if (!showHouses) {
    return {
      data: {
        ascendant: SAMPLE_NATAL_CHART.ascendant,
        midheaven: SAMPLE_NATAL_CHART.midheaven,
        planets,
      },
      showHouses: false,
      isSample: false,
    };
  }

  const axes = computeAxes(instant, input.birthLat as number, input.birthLng as number);
  return {
    data: {
      ascendant: axes.ascendant,
      midheaven: axes.midheaven,
      planets,
    },
    showHouses: true,
    isSample: false,
  };
}
