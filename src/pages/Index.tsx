import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import ReassuranceSection from "@/components/ReassuranceSection";
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
        <ReassuranceSection />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Index;
