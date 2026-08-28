import Footer from "@/components/landing/Footer";
import Header from "@/components/landing/Header";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-3xl px-6 pt-20 pb-20 md:pt-24">
        <p className="mb-3 font-ubuntu text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Legal</p>
        <h1 className="font-jakarta text-3xl font-black text-foreground">Política de Privacidade</h1>
        <p className="mt-2 text-sm text-muted-foreground">Última atualização: 15 de janeiro de 2025</p>

        <div className="mt-6 rounded-2xl border border-border bg-powder-blue/15 p-5 text-sm text-foreground shadow-card-soft">
          <p className="font-medium">Compromisso com sua privacidade</p>
          <p className="mt-2 text-muted-foreground">
            Data Iris trata dados pessoais de acordo com a LGPD (Lei nº 13.709/2018), coletando apenas o necessário
            para autenticação, cálculo astrológico e histórico de previsões.
          </p>
        </div>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
          <section className="rounded-2xl border border-border bg-card/50 p-5 shadow-card-soft">
            <h2 className="mb-3 font-jakarta text-base font-bold text-foreground">1. Dados que coletamos</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>Identificação: nome e e-mail</li>
              <li>Dados astrológicos: data de nascimento; hora e cidade opcionais</li>
              <li>Dados de uso e técnicos para segurança e melhoria do produto</li>
              <li>Dados de pagamento processados por provedores terceiros (ex.: Stripe)</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-border bg-card/50 p-5 shadow-card-soft">
            <h2 className="mb-3 font-jakarta text-base font-bold text-foreground">2. Como usamos</h2>
            <p>
              Usamos os dados para prestar o serviço, autenticar usuários, gerar previsões, processar créditos e cumprir
              obrigações legais. Não vendemos dados pessoais.
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-card/50 p-5 shadow-card-soft">
            <h2 className="mb-3 font-jakarta text-base font-bold text-foreground">3. Seus direitos</h2>
            <p>
              Você pode solicitar acesso, correção ou exclusão de dados pelo perfil ou suporte, observando prazos legais
              e de segurança.
            </p>
          </section>
        </div>
      </main>
      <Footer minimal />
    </div>
  );
}
