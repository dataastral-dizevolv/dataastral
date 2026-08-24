"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

interface AuthLoginGateProps {
  message: string;
  nextPath: string;
  actionLabel?: string;
}

export function AuthLoginGate({ message, nextPath, actionLabel = "Entrar" }: AuthLoginGateProps) {
  return (
    <div className="mx-auto max-w-md text-center">
      <p className="mb-4 text-sm text-muted-foreground">{message}</p>
      <Button asChild className="rounded-full">
        <Link href={`/login?next=${encodeURIComponent(nextPath)}`}>{actionLabel}</Link>
      </Button>
    </div>
  );
}
