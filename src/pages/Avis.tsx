import Header from "@/components/Header";
import TestimonialsSection from "@/components/TestimonialsSection";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";

const Avis = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24">
        <TestimonialsSection />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Avis;
