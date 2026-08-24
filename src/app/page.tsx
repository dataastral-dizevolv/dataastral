import { Suspense } from "react";
import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import WorldReachMap from "@/components/landing/WorldReachMap";
import Footer from "@/components/landing/Footer";
import AnimatedGradientBackground from "@/components/landing/AnimatedGradientBackground";
import Calculator from "@/components/landing/Calculator";

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <AnimatedGradientBackground />
      <div className="relative z-10">
        <Header />
        <main>
          <Hero />
          <section id="calculadora" className="relative scroll-mt-20">
            <Suspense fallback={null}>
              <Calculator context="landing" layout="section" />
            </Suspense>
          </section>
          <TestimonialsSection />
          <WorldReachMap />
        </main>
        <Footer />
      </div>
    </div>
  );
}
