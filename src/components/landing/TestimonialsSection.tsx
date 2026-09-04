"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

interface Testimonial {
  name: string;
  role: string;
  content: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Ana Paula Silva",
    role: "Empresária",
    content:
      "O Método Iris transformou completamente minha visão sobre planejamento. As previsões com datas específicas me ajudaram a tomar decisões estratégicas no momento certo.",
  },
  {
    name: "Roberto Mendes",
    role: "Executivo",
    content:
      "Consulto a Iris há mais de 8 anos. A abordagem científica e ética faz toda a diferença. É autoconhecimento real, não entretenimento.",
  },
  {
    name: "Mariana Costa",
    role: "Psicóloga",
    content:
      "Como profissional de saúde mental, aprecio a fundamentação do método. É responsável, respeita a ciência e realmente promove transformação.",
  },
];

const TestimonialsSection = () => {
  return (
    <section
      className="py-32 lg:py-48 bg-black text-white"
      style={{ fontFamily: "var(--font-jakarta-fallback), Inter, system-ui, sans-serif" }}
    >
      <div className="px-8 lg:px-20 max-w-[1400px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 lg:mb-28 mt-8"
        >
          <p className="text-[12px] uppercase tracking-[0.15em] mb-6 text-white/70">
            Depoimentos
          </p>
          <h2 className="section-title-energias text-white">
            O que dizem nossos consulentes
          </h2>
        </motion.div>

        <Carousel opts={{ align: "start", loop: true, dragFree: false }}>
          <CarouselContent className="ml-0 gap-6">
            {TESTIMONIALS.map((testimonial, index) => {
              const paletteIndex = index % 3;
              const tone =
                paletteIndex === 0
                  ? "bg-[#EAF2FC] text-[#1C2839]"
                  : paletteIndex === 1
                    ? "bg-[#B3C8E3] text-[#1C2839]"
                    : "bg-[#2F363E] text-[#F5F8FD]";
              const metaTone =
                paletteIndex === 2 ? "text-[#F5F8FD]/80" : "text-[#1C2839]/70";
              const borderTone =
                paletteIndex === 2 ? "border-white/10" : "border-[#1C2839]/10";
              return (
                <CarouselItem
                  key={index}
                  className="pl-0 basis-full md:basis-1/2 lg:basis-1/3"
                >
                  <div
                    className={`h-full rounded-3xl border ${borderTone} px-10 py-14 lg:px-14 lg:py-16 flex flex-col shadow-card-soft ${tone}`}
                  >
                    <div className="flex gap-0.5 mb-6">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                    <p className="text-base lg:text-lg leading-[1.5] mb-10 flex-1">
                      &quot;{testimonial.content}&quot;
                    </p>
                    <div>
                      <p className="text-sm font-display">{testimonial.name}</p>
                      <p className={`text-[12px] ${metaTone}`}>{testimonial.role}</p>
                    </div>
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>
        </Carousel>

        <p className="text-[11px] uppercase tracking-[0.15em] text-white/60 mt-8 md:hidden">
          Arraste para o lado
        </p>
      </div>
    </section>
  );
};

export default TestimonialsSection;
