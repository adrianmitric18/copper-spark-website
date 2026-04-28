import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import SEO from "@/components/SEO";
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

      {/* Hero éditorial sombre, cohérent avec le Hero du home */}
      <section className="relative bg-anthracite pt-32 pb-20 md:pt-40 md:pb-24 overflow-hidden">
        {/* Glow orange ambiant comme sur le hero d'accueil */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[400px] md:h-[600px] bg-primary/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-copper/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          {/* Eyebrow / Breadcrumb minimaliste */}
          <div className="text-xs uppercase tracking-[0.25em] text-copper-light font-semibold mb-5">
            Portfolio · Le Cuivre Électrique
          </div>

          {/* Titre éditorial */}
          <h1 className="font-display font-black text-4xl md:text-6xl lg:text-7xl leading-[1.05] text-cream max-w-4xl mb-6">
            Nos{" "}
            <span className="text-gradient-copper">réalisations</span>
            <br className="hidden md:block" />
            <span className="text-cream-dark/70 font-light italic text-3xl md:text-5xl">
              du courant à l'œuvre.
            </span>
          </h1>

          {/* Lead */}
          <p className="text-lg md:text-xl text-cream-dark/80 max-w-2xl leading-relaxed mb-8">
            Chantiers d'électricité réalisés en Brabant wallon, à Bruxelles et
            dans les communes voisines. Tableaux RGIE, bornes de recharge,
            rénovations, éclairages, dépannages — chaque dossier raconte un
            problème résolu.
          </p>

          {/* Méta géographique */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-cream-dark/60 pt-6 border-t border-cream-dark/10">
            <span className="inline-flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-copper" />
              Brabant wallon
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-copper" />
              Bruxelles
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-copper" />
              Communes du Brabant wallon
            </span>
          </div>
        </div>
      </section>

      <main className="pb-20 md:pb-28">
        <div className="container mx-auto px-4 -mt-10 md:-mt-14 relative z-20">
          <ProjectGrid />
        </div>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Realisations;
