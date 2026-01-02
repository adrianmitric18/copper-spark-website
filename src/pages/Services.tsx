import Header from "@/components/Header";
import ServicesSection from "@/components/ServicesSection";
import ZoneSection from "@/components/ZoneSection";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import SEO from "@/components/SEO";

const Services = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Services Électriques | Le Cuivre Électrique - Bruxelles & Wallonie"
        description="Installation électrique, mise en conformité RGIE, dépannage, panneaux photovoltaïques et bornes de recharge. Tous nos services électriques à Bruxelles et en Wallonie."
        keywords="services électricien, installation électrique, mise en conformité RGIE, dépannage électrique, panneaux solaires, borne recharge, Bruxelles, Wallonie"
      />
      <Header />
      <main className="pt-24">
        <ServicesSection />
        <ZoneSection />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Services;
