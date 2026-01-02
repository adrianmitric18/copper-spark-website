import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import ServicesSection from "@/components/ServicesSection";
import GallerySection from "@/components/GallerySection";
import TestimonialsSection from "@/components/TestimonialsSection";
import ReassuranceSection from "@/components/ReassuranceSection";
import ZoneSection from "@/components/ZoneSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import MouseEffects from "@/components/MouseEffects";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <MouseEffects />
      <Header />
      <main>
        <HeroSection />
        <ServicesSection />
        <GallerySection />
        <TestimonialsSection />
        <ReassuranceSection />
        <ZoneSection />
        <ContactSection />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Index;
