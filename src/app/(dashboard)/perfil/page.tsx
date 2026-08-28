import type { Metadata } from "next";
import { Suspense } from "react";

import Footer from "@/components/landing/Footer";
import { PerfilConfirmationToast } from "@/components/perfil/PerfilConfirmationToast";
import { ProfileBubbleSections } from "@/components/perfil/ProfileBubbleSections";
import { ProfilePageShell } from "@/components/perfil/ProfilePageShell";

export const metadata: Metadata = {
  title: "Meu Perfil | Data Iris",
  description: "Gerencie seus dados de nascimento, mapa natal, créditos e histórico no Data Iris.",
};

export default function PerfilPage() {
  return (
    <>
      <Suspense fallback={null}>
        <PerfilConfirmationToast />
      </Suspense>
      <ProfilePageShell />
      <main className="mx-auto max-w-2xl space-y-4 px-4 py-6 pb-20">
        <ProfileBubbleSections />
      </main>
      <Footer minimal />
    </>
  );
}
