import Header from "@/components/Header";
import GallerySection from "@/components/GallerySection";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";

const Realisations = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24">
        <GallerySection />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Realisations;
