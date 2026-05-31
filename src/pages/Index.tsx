import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import ReassuranceSection from "@/components/ReassuranceSection";
// Nettoyage home 2026-05-31 : section "Nos services" retirée (page /services dédiée existe).
// import ServicesSection from "@/components/ServicesSection";
import ZoneSection from "@/components/ZoneSection";
// Nettoyage home 2026-05-31 : doublon "Zones" — InternalLinks zones fusionné dans ZoneSection (chips cliquables).
// import InternalLinks from "@/components/InternalLinks";
import KeyFiguresSection from "@/components/KeyFiguresSection";
// Nettoyage home 2026-05-31 : mini-formulaire "Recevez un devis sous 24h" retiré (redondant avec /contact).
// import MiniContactForm from "@/components/MiniContactForm";
import HomeReviewsBanner from "@/components/HomeReviewsBanner";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import SEO from "@/components/SEO";
import StructuredData from "@/components/StructuredData";
import { useAggregateRating } from "@/hooks/useAggregateRating";

const Index = () => {
  const { data: aggregateRating } = useAggregateRating();

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SEO
        title="Le Cuivre Électrique | Électricien indépendant en Brabant wallon & Wallonie — Devis gratuit"
        description="Électricien indépendant basé à Court-Saint-Étienne. Installation, dépannage 24h/24, conformité RGIE, bornes de recharge, photovoltaïque. Brabant wallon, Wallonie et Bruxelles. Devis gratuit : 0485 75 52 27."
        keywords="électricien Brabant wallon, électricien Court-Saint-Étienne, électricien Wallonie, électricien Bruxelles, installation électrique, mise en conformité RGIE, dépannage électrique, Le Cuivre Électrique"
        canonical="https://cuivre-electrique.com"
      />
      <StructuredData
        type="LocalBusiness"
        aggregateRating={
          aggregateRating
            ? {
                ratingValue: aggregateRating.ratingValueSchema,
                reviewCount: aggregateRating.reviewCount,
              }
            : undefined
        }
      />
      <Header />
      <main>
        <HeroSection />
        <ReassuranceSection />
        {/* Nettoyage home 2026-05-31 : "Nos services" retirée (page /services dédiée). */}
        {/* <ServicesSection /> */}
        {/* ZoneSection fusionne désormais le bloc visuel + les liens internes vers
            les pages communes (ancien <InternalLinks mode="zones" />). */}
        <ZoneSection />
        <KeyFiguresSection />
        {/* Nettoyage home 2026-05-31 : doublon "Zones" — fusionné dans <ZoneSection />.
        <InternalLinks
          mode="zones"
          title="Nos zones d'intervention"
          intro="Le Cuivre Électrique intervient dans tout le Brabant wallon et au-delà. Pages dédiées à chaque commune avec contexte local, FAQ et délais d'intervention."
        /> */}
        {/* Nettoyage home 2026-05-31 : mini-formulaire retiré (redondant avec /contact). */}
        {/* <MiniContactForm /> */}
        <HomeReviewsBanner />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Index;
