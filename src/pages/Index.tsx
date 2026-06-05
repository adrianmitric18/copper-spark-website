import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import ReassuranceSection from "@/components/ReassuranceSection";
// 2026-06-05 — Allègement home : section "Nos services" retirée (page /services dédiée existe déjà).
// import ServicesSection from "@/components/ServicesSection";
// 2026-06-05 — Doublon "Zones d'intervention" : on garde InternalLinks (maillage SEO),
// ZoneSection (bloc visuel sans liens) retiré.
// import ZoneSection from "@/components/ZoneSection";
import InternalLinks from "@/components/InternalLinks";
import KeyFiguresSection from "@/components/KeyFiguresSection";
// 2026-06-05 — Mini-formulaire "Recevez un devis sous 24h" retiré (redondant avec /contact).
// import MiniContactForm from "@/components/MiniContactForm";
import HomeReviewsBanner from "@/components/HomeReviewsBanner";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import SEO from "@/components/SEO";
import StructuredData from "@/components/StructuredData";

const Index = () => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SEO
        title="Le Cuivre Électrique | Électricien indépendant en Brabant wallon & Wallonie — Devis gratuit"
        description="Électricien indépendant basé à Court-Saint-Étienne. Installation, dépannage 24h/24, conformité RGIE, bornes de recharge, photovoltaïque. Brabant wallon, Wallonie et Bruxelles. Devis gratuit : 0485 75 52 27."
        keywords="électricien Brabant wallon, électricien Court-Saint-Étienne, électricien Wallonie, électricien Bruxelles, installation électrique, mise en conformité RGIE, dépannage électrique, Le Cuivre Électrique"
        canonical="https://cuivre-electrique.com"
      />
      <StructuredData type="LocalBusiness" />
      <Header />
      <main>
        <HeroSection />
        <ReassuranceSection />
        {/* 2026-06-05 — "Nos services" retiré de la home (page /services dédiée). */}
        {/* <ServicesSection /> */}
        {/* 2026-06-05 — Doublon zones : ZoneSection retiré, on garde InternalLinks ci-dessous. */}
        {/* <ZoneSection /> */}
        <KeyFiguresSection />
        <InternalLinks
          mode="zones"
          title="Nos zones d'intervention"
          intro="Le Cuivre Électrique intervient dans tout le Brabant wallon et au-delà. Pages dédiées à chaque commune avec contexte local, FAQ et délais d'intervention."
        />
        {/* 2026-06-05 — Mini-formulaire devis retiré (redondant avec /contact). */}
        {/* <MiniContactForm /> */}
        <HomeReviewsBanner />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Index;
