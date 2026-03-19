import CustomCursor from "@/components/CustomCursor";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ManifestoSection from "@/components/ManifestoSection";
import MethodologySection from "@/components/MethodologySection";
import LegacySection from "@/components/LegacySection";
import VerticalsSection from "@/components/VerticalsSection";
import HiveSection from "@/components/HiveSection";
import Footer from "@/components/Footer";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const Index = () => {
  useScrollReveal();

  return (
    <>
      <CustomCursor />
      <Navbar />
      <HeroSection />
      <ManifestoSection />
      <MethodologySection />
      <LegacySection />
      <VerticalsSection />
      <HiveSection />
      <Footer />
    </>
  );
};

export default Index;
