"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function CheckoutReturnDetails() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      router.push("/calculadora");
    }, 2500);
    return () => window.clearTimeout(timeout);
  }, [router]);

  return (
    <div className="mt-6 space-y-2">
      <p className="text-sm text-muted-foreground">Você será redirecionado para a calculadora em instantes.</p>
      {sessionId ? (
        <p className="max-w-full break-all font-mono text-[10px] text-muted-foreground/70">Sessão: {sessionId}</p>
      ) : null}
    </div>
  );
}
