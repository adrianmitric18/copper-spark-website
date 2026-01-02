import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import ServicesSection from "@/components/ServicesSection";
import ReassuranceSection from "@/components/ReassuranceSection";
import ZoneSection from "@/components/ZoneSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <ServicesSection />
        <ReassuranceSection />
        <ZoneSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
