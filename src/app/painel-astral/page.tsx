import type { Metadata } from "next";

import { PainelAstralPage } from "@/components/painel-astral/PainelAstralPage";

export const metadata: Metadata = {
  title: "Painel Astral — Trânsitos e Mapa | Data Iris",
  description:
    "Veja trânsitos do céu, calendário lunar e mapa astral por ângulos com posições eclípticas reais.",
};

export default function PainelAstralRoutePage() {
  return <PainelAstralPage />;
}
