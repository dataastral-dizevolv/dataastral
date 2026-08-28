"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function PerfilConfirmationToast() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("confirmar-exclusao") === "1") {
      toast.success("Pedido de exclusão confirmado. Sua conta será apagada em até 7 dias.");
    }
  }, [searchParams]);

  return null;
}
