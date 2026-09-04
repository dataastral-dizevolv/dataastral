import { Suspense } from "react";

import { IrisChatShell } from "@/components/iris-chat/IrisChatShell";

export default function CalculadoraPage() {
  return (
    <Suspense fallback={<div className="h-full bg-background" />}>
      <IrisChatShell context="app" />
    </Suspense>
  );
}
