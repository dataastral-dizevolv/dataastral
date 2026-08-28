import type { NatalChartData, NatalPlanet } from "@/lib/astrology/natal-chart";
import type { PlanetInput } from "@/lib/astrology/aspect-analysis";

export type ChartData = NatalChartData;
export type Planet = NatalPlanet;

export interface PersonChart {
  id: string;
  name: string;
  birthPlace?: string;
  /** Sem horário → sem casas */
  hasHouses?: boolean;
  chart: ChartData;
  isSample?: boolean;
}

export type InfoTopic =
  | { type: "angle"; key: string }
  | { type: "element"; key: string }
  | { type: "modality"; key: string }
  | { type: "custom"; label: string; title: string; body: string };

export type BarDatum = { label: string; value: number; color: string };

export type AxesFn = (c: ChartData) => { label: string; lon: number }[];
export type PlanetInputsFn = (c: ChartData) => PlanetInput[];
export type BarsFn = (c: ChartData) => BarDatum[];
