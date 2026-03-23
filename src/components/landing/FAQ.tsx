"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    q: "Os cálculos são realmente precisos?",
    a: "Sim. Utilizamos a Swiss Ephemeris, motor usado por astrólogos profissionais. Os dados são baseados em efemérides reais.",
  },
  {
    q: "Qual a diferença deste serviço vs apps gratuitos?",
    a: "Apps gratuitos usam cálculos simplificados. Aqui você recebe uma leitura com base astronômica mais precisa e foco prático para decisão.",
  },
  {
    q: "Como funciona a entrega por WhatsApp?",
    a: "Após gerar o relatório, o envio pode ser feito automaticamente para o WhatsApp cadastrado, conforme plano contratado.",
  },
  {
    q: "Posso cancelar a assinatura a qualquer momento?",
    a: "Sim. Não há fidelidade. O acesso continua ativo até o fim do ciclo já pago.",
  },
  {
    q: "Existe período de teste gratuito?",
    a: "A calculadora gratuita permite experimentar a qualidade do sistema antes de adquirir pacotes de perguntas.",
  },
];

export default function FAQ() {
  return (
    <section className="bg-background py-24 lg:py-32">
      <div className="mx-auto max-w-[680px] px-6 lg:px-16">
        <h2 className="mb-12 text-center font-display text-3xl text-foreground lg:text-4xl">Perguntas frequentes</h2>

        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`faq-${index}`}
              className="rounded-xl border border-iris px-5 transition-colors data-[state=open]:border-iris-accent"
            >
              <AccordionTrigger className="py-4 font-body text-sm text-foreground hover:no-underline">{faq.q}</AccordionTrigger>
              <AccordionContent className="pb-4 font-body text-sm leading-relaxed text-iris-secondary">{faq.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
