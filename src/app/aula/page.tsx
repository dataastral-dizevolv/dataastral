import type { Metadata } from "next";

import { AulaPage } from "@/components/aula/AulaPage";

export const metadata: Metadata = {
  title: "Aulas de Astrologia | Data Iris",
  description:
    "Referência visual de signos do zodíaco e planetas — glifos, elementos e tipologias clássicas.",
};

export default function AulaRoutePage() {
  return <AulaPage />;
}
