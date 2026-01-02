import Header from "@/components/Header";
import ContactSection from "@/components/ContactSection";
import ZoneSection from "@/components/ZoneSection";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import SEO from "@/components/SEO";

const Contact = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Contact | Le Cuivre Électrique - Devis Gratuit"
        description="Contactez Le Cuivre Électrique pour un devis gratuit. Électricien disponible à Bruxelles et en Wallonie. Appelez ou remplissez le formulaire."
        keywords="contact électricien, devis gratuit, électricien Bruxelles, électricien Wallonie, demande devis"
      />
      <Header />
      <main className="pt-24">
        <ContactSection />
        <ZoneSection />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Contact;
