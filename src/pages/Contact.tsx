import Header from "@/components/Header";
import ContactSection from "@/components/ContactSection";
import ZoneSection from "@/components/ZoneSection";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import SEO from "@/components/SEO";
import Breadcrumbs from "@/components/Breadcrumbs";

const Contact = () => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SEO 
        title="Contact & Devis gratuit | Le Cuivre Électrique 0485 75 52 27"
        description="Contactez Le Cuivre Électrique pour un devis gratuit. Bureau : Lun-Ven 8h-18h, Sam 9h-13h — Dépannage urgent 7j/7 24h/24 au 0485 75 52 27."
        keywords="contact électricien, devis gratuit, électricien Bruxelles, électricien Brabant wallon, dépannage urgent"
        canonical="https://cuivre-electrique.com/contact"
      />
      <Header />
      <main className="pt-24">
        <div className="container mx-auto px-4">
          <Breadcrumbs items={[{ label: "Contact", href: "/contact" }]} />
        </div>
        <ContactSection />
        <ZoneSection />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Contact;
