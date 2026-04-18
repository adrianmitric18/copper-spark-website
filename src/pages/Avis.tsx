import Header from "@/components/Header";
import TestimonialsSection from "@/components/TestimonialsSection";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import SEO from "@/components/SEO";
import Breadcrumbs from "@/components/Breadcrumbs";

const Avis = () => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SEO 
        title="Avis clients 5 étoiles | Le Cuivre Électrique"
        description="Lisez les avis 5 étoiles de nos clients satisfaits. Découvrez pourquoi choisir Le Cuivre Électrique en Brabant wallon et à Bruxelles."
        keywords="avis électricien, témoignages clients, Le Cuivre Électrique, électricien recommandé, Bruxelles, Wallonie"
        canonical="https://cuivre-electrique.com/avis"
      />
      <Header />
      <main className="pt-24">
        <div className="container mx-auto px-4">
          <Breadcrumbs items={[{ label: "Avis", href: "/avis" }]} />
        </div>
        <TestimonialsSection />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Avis;
