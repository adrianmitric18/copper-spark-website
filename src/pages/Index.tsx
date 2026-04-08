import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import ReassuranceSection from "@/components/ReassuranceSection";
import KeyFiguresSection from "@/components/KeyFiguresSection";
import GoogleReviewsSection from "@/components/GoogleReviewsSection";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import MouseEffects from "@/components/MouseEffects";
import MobileStickyBar from "@/components/MobileStickyBar";
import SEO from "@/components/SEO";
import StructuredData from "@/components/StructuredData";

const Index = () => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SEO 
        title="Le Cuivre Électrique | Électricien à Bruxelles et Wallonie"
        description="Électricien professionnel à Bruxelles et en Wallonie. Installation, mise en conformité RGIE, dépannage 24h/24. Devis gratuit et intervention rapide."
        keywords="électricien Bruxelles, électricien Wallonie, installation électrique, mise en conformité RGIE, dépannage électrique, Le Cuivre Électrique"
        canonical="https://cuivre-electrique.com"
      />
      <StructuredData type="LocalBusiness" />
      <MouseEffects />
      <Header />
      <main>
        <HeroSection />
        <ReassuranceSection />
        <KeyFiguresSection />
        <GoogleReviewsSection />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Index;
