import Link from "next/link";

import Footer from "@/components/landing/Footer";
import Header from "@/components/landing/Header";

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-3xl px-6 pt-20 pb-20 md:pt-24">
        <p className="mb-3 font-ubuntu text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Legal</p>
        <h1 className="font-jakarta text-3xl font-black text-foreground">Termos de Uso</h1>
        <p className="mt-2 text-sm text-muted-foreground">Última atualização: 15 de janeiro de 2025</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
          <section className="rounded-2xl border border-border bg-card/50 p-5 shadow-card-soft">
            <h2 className="mb-3 font-jakarta text-base font-bold text-foreground">1. Aceitação dos Termos</h2>
            <p>
              Ao acessar e utilizar o Data Astral, você concorda em estar vinculado a estes Termos de Uso. Se não
              concorda, não deve utilizar nossos serviços.
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-card/50 p-5 shadow-card-soft">
            <h2 className="mb-3 font-jakarta text-base font-bold text-foreground">2. Descrição dos Serviços</h2>
            <p>
              Oferecemos consultas e previsões com datas baseadas em mapa astral e efemérides, com caráter informativo,
              educacional e de autoconhecimento. Não substituem orientação médica, psicológica, jurídica ou financeira.
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-card/50 p-5 shadow-card-soft">
            <h2 className="mb-3 font-jakarta text-base font-bold text-foreground">3. Conta e uso aceitável</h2>
            <p>
              Você é responsável por manter a segurança da conta e por fornecer dados verdadeiros. É proibido uso
              fraudulento, abuso de créditos, scraping automatizado ou qualquer tentativa de acesso não autorizado.
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-card/50 p-5 shadow-card-soft">
            <h2 className="mb-3 font-jakarta text-base font-bold text-foreground">4. Pagamentos e reembolsos</h2>
            <p>
              Valores e pacotes são os informados no momento da compra. Para política de reembolso, consulte{" "}
              <Link href="/reembolso" className="font-medium text-iris-accent underline-offset-4 hover:underline">
                /reembolso
              </Link>
              .
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-card/50 p-5 shadow-card-soft">
            <h2 className="mb-3 font-jakarta text-base font-bold text-foreground">5. Limitação de responsabilidade</h2>
            <p>
              O serviço é fornecido “como está”. Não nos responsabilizamos por decisões tomadas com base nas informações
              geradas pela plataforma.
            </p>
          </section>
        </div>
      </main>
      <Footer minimal />
    </div>
  );
}
