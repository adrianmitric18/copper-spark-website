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
        title="Contact | Le Cuivre Électrique - Devis Gratuit"
        description="Contactez Le Cuivre Électrique pour un devis gratuit. Électricien disponible à Bruxelles et en Wallonie. Appelez ou remplissez le formulaire."
        keywords="contact électricien, devis gratuit, électricien Bruxelles, électricien Wallonie, demande devis"
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
