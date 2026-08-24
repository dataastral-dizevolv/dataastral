"use client";

import Footer from "@/components/landing/Footer";
import Header from "@/components/landing/Header";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FAQ_ITEMS = [
  {
    q: "A Consulta de Perguntas no site é feita pelo Data Astral?",
    a: "Os créditos comprados para perguntas no site entregam o cálculo de sua previsão logo em seguida. É feito pelo Método exclusivo Data Astral, de acordo com a sua data de nascimento.",
  },
  {
    q: "Quando devo fazer uma nova pergunta?",
    a: "É melhor repetir a mesma pergunta apenas depois que passar a data da previsão. Para perguntas diferentes, pode fazer quando quiser.",
  },
  {
    q: "Posso fazer reembolso?",
    a: "O reembolso acontece apenas para créditos não utilizados, dentro de 7 dias corridos após a compra.",
  },
  {
    q: "Como funciona?",
    a: "Você escolhe um tema, escolhe uma pergunta e informa seus dados de nascimento. O Método Data Astral estuda seu mapa e devolve uma resposta com datas exatas.",
  },
  {
    q: "Preciso pagar?",
    a: "Não para começar. Você ganha perguntas grátis para conhecer. Depois, use créditos conforme os planos.",
  },
  {
    q: "Posso deletar meus dados?",
    a: "Sim. Em Meu perfil você pode excluir histórico ou solicitar exclusão da conta.",
  },
  {
    q: "Os cálculos são realmente precisos?",
    a: "Sim. Utilizamos a Swiss Ephemeris, motor usado por astrólogos profissionais. Os dados são baseados em efemérides reais.",
  },
];

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="relative mx-auto max-w-2xl px-6 pt-20 pb-20 md:pt-24">
        <h1 className="mb-8 font-jakarta text-3xl font-black text-foreground">Dúvidas frequentes</h1>
        <Accordion type="single" collapsible className="space-y-2">
          {FAQ_ITEMS.map((item, i) => (
            <AccordionItem key={item.q} value={`i-${i}`} className="border-b border-border">
              <AccordionTrigger className="py-6 text-left hover:no-underline lg:py-8">{item.q}</AccordionTrigger>
              <AccordionContent className="pb-6 text-sm text-muted-foreground lg:pb-8">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </main>
      <Footer />
    </div>
  );
}
