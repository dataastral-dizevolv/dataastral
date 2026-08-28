/**
 * Aspectos aplicativos/separativos + distribuição de elementos e modalidades.
 */

export const MEAN_SPEED_DEG_PER_DAY: Record<string, number> = {
  moon: 13.176,
  mercury: 1.383,
  venus: 1.202,
  sun: 0.985,
  mars: 0.524,
  jupiter: 0.083,
  saturn: 0.034,
  uranus: 0.012,
  neptune: 0.006,
  pluto: 0.004,
};

export type AspectKind = "conjunction" | "sextile" | "square" | "trine" | "opposition";

export interface AspectDef {
  kind: AspectKind;
  label: string;
  angle: number;
  orb: number;
  color: string;
}

export const ASPECT_DEFS: AspectDef[] = [
  { kind: "conjunction", label: "Conjunção", angle: 0, orb: 8, color: "hsl(var(--foreground))" },
  { kind: "sextile", label: "Sextil", angle: 60, orb: 4, color: "hsl(var(--blue-chambray))" },
  { kind: "square", label: "Quadratura", angle: 90, orb: 6, color: "hsl(0 60% 50%)" },
  { kind: "trine", label: "Trígono", angle: 120, orb: 6, color: "hsl(150 45% 42%)" },
  { kind: "opposition", label: "Oposição", angle: 180, orb: 8, color: "hsl(var(--muted-foreground))" },
];

/** Orbes mais apertados para sinastria entre mapas (paridade Lovable). */
export const SYNASTRY_ASPECT_TYPES = [
  { deg: 0, orb: 6, name: "Conjunção" },
  { deg: 60, orb: 4, name: "Sextil" },
  { deg: 90, orb: 5, name: "Quadratura" },
  { deg: 120, orb: 5, name: "Trígono" },
  { deg: 180, orb: 6, name: "Oposição" },
] as const;

export interface PlanetInput {
  id: string;
  label: string;
  symbol?: string;
  longitude: number;
  speed?: number;
  retrograde?: boolean;
}

export interface ComputedAspect {
  kind: AspectKind;
  label: string;
  a: PlanetInput;
  b: PlanetInput;
  orb: number;
  phase: "applying" | "separating" | "exact";
  color: string;
}

export function computeAspects(planets: PlanetInput[]): ComputedAspect[] {
  const out: ComputedAspect[] = [];
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const p1 = planets[i];
      const p2 = planets[j];
      const rawDiff = Math.abs(((p1.longitude - p2.longitude) % 360 + 360) % 360);
      const angle = rawDiff > 180 ? 360 - rawDiff : rawDiff;
      const def = ASPECT_DEFS.find((d) => Math.abs(angle - d.angle) <= d.orb);
      if (!def) continue;
      const orb = +(angle - def.angle).toFixed(2);

      const s1 = (p1.speed ?? MEAN_SPEED_DEG_PER_DAY[p1.id] ?? 0) * (p1.retrograde ? -1 : 1);
      const s2 = (p2.speed ?? MEAN_SPEED_DEG_PER_DAY[p2.id] ?? 0) * (p2.retrograde ? -1 : 1);
      const fasterIsP1 = Math.abs(s1) >= Math.abs(s2);
      const faster = fasterIsP1 ? p1 : p2;
      const slower = fasterIsP1 ? p2 : p1;
      const relSpeed = (fasterIsP1 ? s1 : s2) - (fasterIsP1 ? s2 : s1);

      const signedDiff = ((faster.longitude - slower.longitude) % 360 + 540) % 360 - 180;
      const passed = Math.abs(signedDiff) - def.angle;

      let phase: ComputedAspect["phase"];
      if (Math.abs(passed) < 0.05) phase = "exact";
      else if ((passed < 0 && relSpeed > 0) || (passed > 0 && relSpeed < 0)) phase = "applying";
      else phase = "separating";

      out.push({
        kind: def.kind,
        label: def.label,
        a: p1,
        b: p2,
        orb,
        phase,
        color: def.color,
      });
    }
  }
  return out;
}

export type Element = "fire" | "earth" | "air" | "water";
export type Modality = "cardinal" | "fixed" | "mutable";

const SIGN_ELEMENTS: Element[] = [
  "fire", "earth", "air", "water",
  "fire", "earth", "air", "water",
  "fire", "earth", "air", "water",
];

const SIGN_MODALITIES: Modality[] = [
  "cardinal", "fixed", "mutable", "cardinal",
  "fixed", "mutable", "cardinal", "fixed",
  "mutable", "cardinal", "fixed", "mutable",
];

export function signIndex(longitude: number): number {
  const norm = ((longitude % 360) + 360) % 360;
  return Math.floor(norm / 30);
}

export function elementOf(longitude: number): Element {
  return SIGN_ELEMENTS[signIndex(longitude)];
}

export function modalityOf(longitude: number): Modality {
  return SIGN_MODALITIES[signIndex(longitude)];
}

export function elementDistribution(planets: PlanetInput[]): Record<Element, number> {
  const acc: Record<Element, number> = { fire: 0, earth: 0, air: 0, water: 0 };
  for (const p of planets) acc[elementOf(p.longitude)]++;
  return acc;
}

export function modalityDistribution(planets: PlanetInput[]): Record<Modality, number> {
  const acc: Record<Modality, number> = { cardinal: 0, fixed: 0, mutable: 0 };
  for (const p of planets) acc[modalityOf(p.longitude)]++;
  return acc;
}

export function angularSeparation(a: number, b: number) {
  const diff = Math.abs(((a - b) % 360 + 360) % 360);
  return diff > 180 ? 360 - diff : diff;
}

export function findSynastryAspect(aLon: number, bLon: number) {
  const angle = angularSeparation(aLon, bLon);
  const hit = SYNASTRY_ASPECT_TYPES.find((t) => Math.abs(angle - t.deg) <= t.orb);
  return hit ? { aspect: hit.name, orb: Math.abs(angle - hit.deg).toFixed(1) } : null;
}

export function findPlanetAspects(
  target: PlanetInput,
  all: PlanetInput[],
): { other: PlanetInput; aspect: string; orb: string }[] {
  return all
    .filter((p) => p.id !== target.id)
    .map((p) => {
      const hit = findSynastryAspect(target.longitude, p.longitude);
      return hit ? { other: p, aspect: hit.aspect, orb: hit.orb } : null;
    })
    .filter(Boolean) as { other: PlanetInput; aspect: string; orb: string }[];
}
