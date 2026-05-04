import type { ThemeOption } from "@/types/calculator";

export const LOADING_TEXTS = [
  "Calculando posição solar...",
  "Mapeando aspectos planetários...",
  "Analisando seu momento atual...",
  "Gerando sua previsão...",
];

export const THEMES: ThemeOption[] = [
  { id: "amor", name: "Amor e Relacionamentos" },
  { id: "carreira", name: "Carreira e Propósito" },
  { id: "financas", name: "Finanças e Prosperidade" },
  { id: "saude", name: "Saúde e Bem-estar" },
  { id: "familia", name: "Família e Lar" },
  { id: "viagens", name: "Viagens e Novos Ciclos" },
];
