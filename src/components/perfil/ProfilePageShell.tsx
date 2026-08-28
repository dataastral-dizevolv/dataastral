"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

import { useDashboardUser } from "@/components/dashboard/DashboardUserContext";

export function ProfilePageShell() {
  const router = useRouter();
  const { user } = useDashboardUser();

  return (
    <div className="border-b border-border/60">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-4 py-4">
        <button
          type="button"
          aria-label="Voltar"
          onClick={() => router.back()}
          className="flex items-center justify-center p-1 text-foreground/70 transition-colors hover:text-iris"
        >
          <ArrowLeft className="size-5" />
        </button>

        <div className="flex flex-1 justify-center">
          <Image
            src="/brand/iris-wordmark.png"
            alt="Data Iris"
            width={120}
            height={24}
            className="h-5 w-auto opacity-40 select-none sm:h-6"
            draggable={false}
          />
        </div>

        <div
          aria-label="Créditos disponíveis"
          className="flex flex-col items-end justify-center text-right leading-none"
          title="Créditos disponíveis"
        >
          <span className="font-jakarta text-lg font-black tracking-[0.01em] text-iris">{user.credits}</span>
          <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">créditos</span>
        </div>
      </div>
    </div>
  );
}
