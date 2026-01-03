import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import SEO from "@/components/SEO";
import CategoryGallery from "@/components/CategoryGallery";
import { Button } from "@/components/ui/button";
import { getCategoryBySlug } from "@/data/galleryData";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const InstallationReseaux = () => {
  const category = getCategoryBySlug("installation-reseaux");

  if (!category) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Installation Réseaux | Réalisations - Le Cuivre Électrique"
        description="Découvrez nos installations réseaux professionnelles : baies de brassage, câblage structuré, visiophonie. Connectivité sur mesure à Bruxelles."
        keywords="installation réseaux, baie de brassage, câblage réseau, visiophonie, Bruxelles, électricien"
        canonical="https://cuivre-electrique.com/realisations/installation-reseaux"
      />
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <Breadcrumb className="mb-8">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/">Accueil</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/realisations">Réalisations</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{category.label}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <Link 
              to="/realisations" 
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour aux réalisations
            </Link>
            
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              {category.label}
            </h1>
            <p className="text-muted-foreground text-lg max-w-3xl">
              {category.longDescription}
            </p>
            <p className="text-muted-foreground mt-2">
              {category.images.length} photos
            </p>
          </motion.div>

          {/* Gallery */}
          <CategoryGallery category={category} />

          {/* CTA */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-16 text-center"
          >
            <p className="text-muted-foreground mb-6">
              Vous souhaitez un projet similaire ?
            </p>
            <Button asChild variant="copper" size="xl">
              <Link to="/contact" className="inline-flex items-center gap-2">
                Demander un devis
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default InstallationReseaux;
