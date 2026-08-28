import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Página não encontrada | Data Iris",
  description: "A página que você procura não existe no Data Iris.",
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-6">
      <div className="text-center">
        <p className="mb-2 font-ubuntu text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Data Iris</p>
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Página não encontrada.</p>
        <Link href="/" className="text-primary underline hover:text-primary/90">
          Voltar para início
        </Link>
      </div>
    </div>
  );
}
