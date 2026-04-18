import Header from "@/components/Header";
import GallerySection from "@/components/GallerySection";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import SEO from "@/components/SEO";
import Breadcrumbs from "@/components/Breadcrumbs";

const Realisations = () => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SEO 
        title="Nos réalisations | Chantiers électriques Brabant wallon & Bruxelles"
        description="Découvrez nos chantiers : tableaux, installations, ambiances lumineuses, décorations de Noël. Portfolio Le Cuivre Électrique à Bruxelles et en Brabant wallon."
        keywords="réalisations électricien, chantiers électriques, tableaux, ambiances lumineuses, Brabant wallon, Bruxelles"
        canonical="https://cuivre-electrique.com/realisations"
      />
      <Header />
      <main className="pt-24">
        <div className="container mx-auto px-4">
          <Breadcrumbs items={[{ label: "Réalisations", href: "/realisations" }]} />
        </div>
        <GallerySection />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Realisations;
