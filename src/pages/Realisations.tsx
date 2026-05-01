import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import SEO from "@/components/SEO";
import StructuredData from "@/components/StructuredData";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProjectVerticalList from "@/components/realisations/ProjectVerticalList";

const Realisations = () => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SEO
        title="Réalisations | Chantiers électriques en Brabant wallon — Le Cuivre Électrique"
        description="Chantiers réalisés en Brabant wallon : bornes de recharge, panneaux photovoltaïques, mise en conformité RGIE, installations et rénovations électriques."
        keywords="réalisations électricien, chantiers, bornes recharge, photovoltaïque, RGIE, Brabant wallon"
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

      <main className="pt-24">
        <div className="container mx-auto px-4 max-w-5xl">
          <Breadcrumbs
            items={[{ label: "Réalisations", href: "/realisations" }]}
          />
        </div>

        {/* Hero sobre — pas de fond anthracite, pas de glow, lisible et calme */}
        <section className="py-10 md:py-14">
          <div className="container mx-auto px-4 max-w-5xl">
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-5 leading-tight">
              Quelques chantiers récents
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl leading-relaxed">
              Bornes de recharge, panneaux photovoltaïques, mise en conformité
              RGIE, rénovations complètes. Chaque chantier est documenté avec
              le contexte, les marques posées et le résultat.
            </p>
          </div>
        </section>

        {/* Liste verticale — un chantier par bloc */}
        <section className="pb-20 md:pb-28">
          <div className="container mx-auto px-4 max-w-5xl">
            <ProjectVerticalList />
          </div>
        </section>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Realisations;
