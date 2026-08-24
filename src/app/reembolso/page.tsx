import Link from "next/link";

import { AuthLoginGate } from "@/components/auth/AuthLoginGate";
import Footer from "@/components/landing/Footer";
import Header from "@/components/landing/Header";
import { RefundRequestForm } from "@/components/refund/RefundRequestForm";
import { createClient } from "@/lib/supabase/server";

export default async function ReembolsoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-2xl px-6 pt-20 pb-20 md:pt-24">
        <p className="mb-3 font-ubuntu text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Legal</p>
        <h1 className="font-jakarta text-3xl font-black text-foreground">Reembolso</h1>
        <div className="mt-8 space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            Créditos não utilizados podem ser reembolsados em até 7 dias corridos após a compra, nos termos do CDC art.
            49, quando aplicável.
          </p>
          <p>Créditos já consumidos em previsões não são reembolsáveis.</p>
          <p>
            Veja também os{" "}
            <Link href="/termos-de-uso" className="font-medium text-iris-accent underline-offset-4 hover:underline">
              termos de uso
            </Link>{" "}
            e a{" "}
            <Link href="/faq" className="font-medium text-iris-accent underline-offset-4 hover:underline">
              FAQ
            </Link>
            .
          </p>
        </div>

        <div className="mt-10 border-t border-border pt-8">
          {user ? (
            <RefundRequestForm />
          ) : (
            <AuthLoginGate message="Faça login para solicitar reembolso." nextPath="/reembolso" />
          )}
        </div>
      </main>
      <Footer minimal />
    </div>
  );
}
