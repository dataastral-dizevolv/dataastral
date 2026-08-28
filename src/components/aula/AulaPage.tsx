import Footer from "@/components/landing/Footer";
import Header from "@/components/landing/Header";
import { PainelAstrologico } from "@/components/aula/PainelAstrologico";

export function AulaPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="px-4 pt-24 pb-12">
        <div className="mx-auto max-w-5xl">
          <h1 className="mb-2 font-jakarta text-3xl font-black tracking-tight text-foreground">
            Aulas de Astrologia
          </h1>
          <p className="mb-10 text-muted-foreground">
            Referência visual de signos e planetas
          </p>
          <PainelAstrologico />
        </div>
      </main>
      <Footer />
    </div>
  );
}
