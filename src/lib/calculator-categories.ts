import type { ThemeId } from "@/types/calculator";

export const CALCULATOR_CATEGORY_VALUES = [
  "amor",
  "carreira",
  "financas",
  "saude",
  "familia",
  "viagens",
] as const;

export type CalculatorCategory = (typeof CALCULATOR_CATEGORY_VALUES)[number];

export const CALCULATOR_CATEGORY_LABELS: Record<CalculatorCategory, string> = {
  amor: "Amor e relacionamentos",
  carreira: "Carreira e Propósito",
  financas: "Finanças e Prosperidade",
  saude: "Saúde e Bem estar",
  familia: "Famíliar e Lar",
  viagens: "Viagens e Novos ciclos",
};

export function isCalculatorCategory(value: string): value is CalculatorCategory {
  return (CALCULATOR_CATEGORY_VALUES as readonly string[]).includes(value);
}

export function themeToCategory(theme: ThemeId): CalculatorCategory {
  return theme;
}
