import Calculator from "@/components/landing/Calculator";
import FAQ from "@/components/landing/FAQ";
import FinalCTA from "@/components/landing/FinalCTA";
import Footer from "@/components/landing/Footer";
import HeroSection from "@/components/landing/HeroSection";
import HowItWorks from "@/components/landing/HowItWorks";
import Navbar from "@/components/landing/Navbar";
import SocialProof from "@/components/landing/SocialProof";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <HeroSection />
      <Calculator />
      <HowItWorks />
      <SocialProof />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
}
