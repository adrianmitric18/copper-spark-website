import Header from "@/components/Header";
import TestimonialsSection from "@/components/TestimonialsSection";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import SEO from "@/components/SEO";

const Avis = () => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SEO 
        title="Avis Clients | Le Cuivre Électrique - Témoignages"
        description="Lisez les avis et témoignages de nos clients satisfaits. Découvrez pourquoi choisir Le Cuivre Électrique pour vos travaux électriques à Bruxelles."
        keywords="avis électricien, témoignages clients, Le Cuivre Électrique, électricien recommandé, Bruxelles, Wallonie"
        canonical="https://cuivre-electrique.com/avis"
      />
      <Header />
      <main className="pt-24">
        <TestimonialsSection />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Avis;
