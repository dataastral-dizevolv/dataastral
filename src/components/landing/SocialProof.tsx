"use client";

import { useRef } from "react";
import { Star } from "lucide-react";
import { motion, useInView } from "framer-motion";

import { Button } from "@/components/ui/button";

const testimonials = [
  {
    text: "O relatorio mudou como planejo minha empresa. Os dados sao precisos e profissionais.",
    name: "Maria C.",
    location: "Sao Paulo",
    stars: 5,
  },
  {
    text: "Uso semanalmente para planejar lancamentos. ROI comprovado. Ferramenta essencial.",
    name: "Ricardo S.",
    location: "Lisboa",
    stars: 5,
  },
  {
    text: "A precisao das efemerides e impressionante. Finalmente uma ferramenta seria para astrologos.",
    name: "Ana L.",
    location: "Porto Alegre",
    stars: 5,
  },
];

export default function SocialProof() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="bg-background py-24 lg:py-32">
      <div className="w-full px-6 lg:px-16">
        <div ref={ref} className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.6 }}>
            <div className="w-full border-b border-border/70 pb-8">
              <div className="space-y-4">
                <div className="h-1 w-16 bg-primary" />
                <h3 className="font-display text-xl text-foreground">RELATORIO NATAL</h3>
                <div className="h-px bg-primary/20" />
                <div className="space-y-2">
                  <div className="flex gap-3"><div className="h-3 w-3/4 bg-muted" /></div>
                  <div className="flex gap-3"><div className="h-3 w-2/3 bg-muted" /></div>
                  <div className="flex gap-3"><div className="h-3 w-4/5 bg-muted" /></div>
                </div>
                <div className="h-px bg-muted" />
                <div className="space-y-2">
                  <div className="h-2.5 w-full bg-muted" />
                  <div className="h-2.5 w-5/6 bg-muted" />
                  <div className="h-2.5 w-4/5 bg-muted" />
                  <div className="h-2.5 w-full bg-muted" />
                  <div className="h-2.5 w-3/4 bg-muted" />
                </div>
                <Button asChild variant="outline" className="mt-4 font-body text-xs uppercase tracking-wider">
                  <a href="#calculadora">Ver exemplo completo</a>
                </Button>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-8"
          >
            <h3 className="font-display text-2xl text-foreground">O que dizem nossos usuarios</h3>
            {testimonials.map((testimonial, index) => (
              <div key={index} className="space-y-2 border-l-2 border-primary/30 pl-5">
                <div className="flex gap-0.5">
                  {Array.from({ length: testimonial.stars }).map((_, i) => (
                    <Star key={i} size={14} className="fill-primary text-primary" />
                  ))}
                </div>
                <p className="font-display text-sm italic leading-relaxed text-foreground">&quot;{testimonial.text}&quot;</p>
                <p className="font-body text-xs text-iris-secondary">
                  - {testimonial.name}, {testimonial.location}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
