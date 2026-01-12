import Header from "@/components/Header";
import GallerySection from "@/components/GallerySection";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import SEO from "@/components/SEO";

const Realisations = () => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SEO 
        title="Nos Réalisations | Le Cuivre Électrique - Galerie Photos"
        description="Découvrez nos réalisations électriques : tableaux, installations, décorations lumineuses de Noël. Portfolio de Le Cuivre Électrique à Bruxelles."
        keywords="réalisations électricien, portfolio électrique, galerie photos, tableaux électriques, installations électriques, Bruxelles"
      />
      <Header />
      <main className="pt-24">
        <GallerySection />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Realisations;
