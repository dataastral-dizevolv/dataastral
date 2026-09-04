import { Suspense } from "react";

import Header from "@/components/landing/Header";
import { IrisChatShell } from "@/components/iris-chat/IrisChatShell";

export default function PrevisaoComDataPage() {
  return (
    <Suspense fallback={<div className="h-[100dvh] bg-background" />}>
      <IrisChatShell context="public" header={<Header />} />
    </Suspense>
  );
}
