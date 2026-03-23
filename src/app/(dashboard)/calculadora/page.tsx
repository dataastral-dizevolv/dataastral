import { Suspense } from "react";

import Calculator from "@/components/landing/Calculator";

export default function CalculadoraPage() {
  return (
    <main className="bg-background">
      <Suspense fallback={null}>
        <Calculator context="app" />
      </Suspense>
    </main>
  );
}
