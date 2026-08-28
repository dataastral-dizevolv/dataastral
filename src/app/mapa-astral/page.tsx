import type { Metadata } from "next";

import { MapaAstralPage } from "@/components/mapa-astral/MapaAstralPage";

export const metadata: Metadata = {
  title: "Mapa Astral e Sinastrias | Data Iris",
  description:
    "Calcule mapas astrais, compare sinastrias e leia elementos, modalidades e aspectos com o método Data Iris.",
};

export default function MapaAstralRoutePage() {
  return <MapaAstralPage />;
}
