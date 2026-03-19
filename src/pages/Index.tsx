
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ProofBar from "@/components/ProofBar";
import ManifestoSection from "@/components/ManifestoSection";
import PainSection from "@/components/PainSection";
import MethodologySection from "@/components/MethodologySection";
import LegacySection from "@/components/LegacySection";
import VerticalsSection from "@/components/VerticalsSection";
import HiveSection from "@/components/HiveSection";
import CtaSection from "@/components/CtaSection";
import Footer from "@/components/Footer";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const Index = () => {
  useScrollReveal();

  return (
    <>
      
      <Navbar />
      <HeroSection />
      <ProofBar />
      <ManifestoSection />
      <PainSection />
      <MethodologySection />
      <LegacySection />
      <VerticalsSection />
      <HiveSection />
      <CtaSection />
      <Footer />
    </>
  );
};

export default Index;
