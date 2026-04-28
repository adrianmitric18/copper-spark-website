import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import SEO from "@/components/SEO";
import Breadcrumbs from "@/components/Breadcrumbs";
import StructuredData from "@/components/StructuredData";
import ProjectGrid from "@/components/realisations/ProjectGrid";

const Realisations = () => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SEO
        title="Nos réalisations | Chantiers électriques Brabant wallon & Bruxelles"
        description="Découvrez nos chantiers réalisés : tableaux RGIE, bornes de recharge, installations neuves, dépannages, éclairage LED, photovoltaïque. Portfolio Le Cuivre Électrique."
        keywords="réalisations électricien, chantiers électriques, tableaux, bornes recharge, RGIE, Brabant wallon, Bruxelles"
        canonical="https://cuivre-electrique.com/realisations"
      />
      <StructuredData
        type="BreadcrumbList"
        items={[
          { name: "Accueil", url: "https://cuivre-electrique.com" },
          { name: "Réalisations", url: "https://cuivre-electrique.com/realisations" },
        ]}
      />
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <Breadcrumbs items={[{ label: "Réalisations", href: "/realisations" }]} />

          <div className="max-w-3xl mb-10">
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Nos réalisations
            </h1>
            <p className="text-lg text-muted-foreground">
              Chantiers d'électricité réalisés en Brabant wallon, à Bruxelles et
              dans les communes voisines. Sélectionne un type de chantier ou
              une zone pour filtrer.
            </p>
          </div>

          <ProjectGrid />
        </div>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Realisations;
