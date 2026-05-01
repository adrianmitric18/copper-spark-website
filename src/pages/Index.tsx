import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import ReassuranceSection from "@/components/ReassuranceSection";
import KeyFiguresSection from "@/components/KeyFiguresSection";
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
        <KeyFiguresSection />
        <HomeReviewsBanner />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Index;
