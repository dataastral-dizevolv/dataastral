import * as Astro from "astronomy-engine";

export const PLANET_SYMBOLS: Record<string, string> = {
  sun: "☉",
  moon: "☽",
  mercury: "☿",
  venus: "♀",
  earth: "⊕",
  mars: "♂",
  jupiter: "♃",
  saturn: "♄",
  uranus: "♅",
  neptune: "♆",
  pluto: "♇",
};

export const PLANET_LABELS_PT: Record<string, string> = {
  sun: "Sol",
  moon: "Lua",
  mercury: "Mercúrio",
  venus: "Vênus",
  earth: "Terra",
  mars: "Marte",
  jupiter: "Júpiter",
  saturn: "Saturno",
  uranus: "Urano",
  neptune: "Netuno",
  pluto: "Plutão",
};

export const ZODIAC = [
  { name: "Áries", symbol: "\u2648\uFE0E" },
  { name: "Touro", symbol: "\u2649\uFE0E" },
  { name: "Gêmeos", symbol: "\u264A\uFE0E" },
  { name: "Câncer", symbol: "\u264B\uFE0E" },
  { name: "Leão", symbol: "\u264C\uFE0E" },
  { name: "Virgem", symbol: "\u264D\uFE0E" },
  { name: "Libra", symbol: "\u264E\uFE0E" },
  { name: "Escorpião", symbol: "\u264F\uFE0E" },
  { name: "Sagitário", symbol: "\u2650\uFE0E" },
  { name: "Capricórnio", symbol: "\u2651\uFE0E" },
  { name: "Aquário", symbol: "\u2652\uFE0E" },
  { name: "Peixes", symbol: "\u2653\uFE0E" },
];

const BODY_MAP: Record<string, Astro.Body | null> = {
  sun: Astro.Body.Sun,
  mercury: Astro.Body.Mercury,
  venus: Astro.Body.Venus,
  earth: Astro.Body.Sun,
  mars: Astro.Body.Mars,
  jupiter: Astro.Body.Jupiter,
  saturn: Astro.Body.Saturn,
  uranus: Astro.Body.Uranus,
  neptune: Astro.Body.Neptune,
  pluto: Astro.Body.Pluto,
  moon: Astro.Body.Moon,
};

export type SignPosition = {
  displayName: string;
  symbol: string;
  signName: string;
  signSymbol: string;
  degree: number;
  minutes: number;
  longitude: number;
  retrograde: boolean;
  available: boolean;
};

function eclLon(body: Astro.Body, date: Date): number {
  const ecl = Astro.Ecliptic(Astro.GeoVector(body, date, true));
  return ((ecl.elon % 360) + 360) % 360;
}

export function getCurrentPosition(planetName: string, date = new Date()): SignPosition {
  const isEarth = planetName === "earth";
  const displayKey = isEarth ? "sun" : planetName;
  const body = BODY_MAP[planetName];

  if (!body) {
    return {
      displayName: PLANET_LABELS_PT[displayKey] ?? planetName,
      symbol: PLANET_SYMBOLS[displayKey] ?? "✦",
      signName: "—",
      signSymbol: "",
      degree: 0,
      minutes: 0,
      longitude: 0,
      retrograde: false,
      available: false,
    };
  }

  const lon = eclLon(body, date);
  const signIdx = Math.floor(lon / 30);
  const inSign = lon - signIdx * 30;
  const degree = Math.floor(inSign);
  const minutes = Math.floor((inSign - degree) * 60);
  const sign = ZODIAC[signIdx];

  let retrograde = false;
  if (body !== Astro.Body.Sun && body !== Astro.Body.Moon) {
    const future = new Date(date.getTime() + 24 * 60 * 60 * 1000);
    const lonF = eclLon(body, future);
    let delta = lonF - lon;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    retrograde = delta < 0;
  }

  return {
    displayName: PLANET_LABELS_PT[displayKey] ?? planetName,
    symbol: PLANET_SYMBOLS[displayKey] ?? "✦",
    signName: sign.name,
    signSymbol: sign.symbol,
    degree,
    minutes,
    longitude: lon,
    retrograde,
    available: true,
  };
}
