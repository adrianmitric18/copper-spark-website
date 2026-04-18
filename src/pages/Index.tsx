import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import ReassuranceSection from "@/components/ReassuranceSection";
import KeyFiguresSection from "@/components/KeyFiguresSection";
import GoogleReviewsSection from "@/components/GoogleReviewsSection";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import MouseEffects from "@/components/MouseEffects";
import SEO from "@/components/SEO";
import StructuredData from "@/components/StructuredData";

const Index = () => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SEO 
        title="Le Cuivre Électrique | Électricien agréé Bruxelles & Brabant wallon"
        description="Électricien agréé à Bruxelles et en Brabant wallon. Installation, mise en conformité RGIE, dépannage urgent 7j/7 24h/24. Devis gratuit : 0485 75 52 27."
        keywords="électricien Bruxelles, électricien Brabant wallon, installation électrique, mise en conformité RGIE, dépannage électrique, Le Cuivre Électrique"
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
