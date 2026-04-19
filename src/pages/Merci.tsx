import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, Home, Phone, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { useAnalyticsEvents } from "@/hooks/useAnalyticsEvents";

// Declare gtag for TypeScript
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

const Merci = () => {
  const { trackEvent } = useAnalyticsEvents();

  useEffect(() => {
    // Fire Google Ads conversion event
    if (typeof window.gtag === "function") {
      window.gtag("event", "conversion", {
        send_to: "AW-CONVERSION_ID/CONVERSION_LABEL", // Replace with your actual conversion ID and label
        event_callback: () => {
          console.log("Google Ads conversion tracked");
        },
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SEO
        title="Merci | Le Cuivre Électrique"
        description="Votre demande a bien été envoyée. Nous vous recontacterons dans les 24 à 48 heures."
        canonical="https://cuivre-electrique.com/merci"
        noindex={true}
      />
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto text-center py-16"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2, stiffness: 200 }}
              className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-8"
            >
              <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6"
            >
              Merci pour votre{" "}
              <span className="text-gradient-copper">demande !</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg text-muted-foreground mb-4"
            >
              Votre message a bien été envoyé. Un email de confirmation vous a
              été envoyé.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-lg text-foreground font-medium mb-8"
            >
              Nous vous recontacterons dans les{" "}
              <strong className="text-primary">24 à 48 heures</strong>.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="p-6 rounded-2xl bg-card border border-border/50 shadow-lg mb-10"
            >
              <p className="text-muted-foreground mb-3">
                Besoin d'une réponse urgente ?
              </p>
              <a
                href="tel:+32485755227"
                data-analytics="call_click"
                onClick={() => trackEvent("call_click", { source_section: "merci_page" })}
                className="inline-flex items-center gap-2 text-xl font-bold text-primary hover:underline"
              >
                <Phone className="w-5 h-5" />
                0485 75 52 27
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button asChild size="lg" variant="outline">
                <Link to="/">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour à l'accueil
                </Link>
              </Button>
              <Button asChild size="lg">
                <Link to="/realisations">
                  <Home className="w-4 h-4 mr-2" />
                  Voir nos réalisations
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Merci;
