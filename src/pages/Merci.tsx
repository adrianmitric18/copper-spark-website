import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, Phone, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { useAnalyticsEvents } from "@/hooks/useAnalyticsEvents";

const Merci = () => {
  const { trackEvent } = useAnalyticsEvents();

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SEO
        title="Merci | Le Cuivre Électrique"
        description="Votre demande a bien été reçue. Nous vous recontactons sous 24 à 48h ouvrables."
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
            className="max-w-2xl mx-auto text-center py-12 md:py-16"
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
              Votre demande a bien été <span className="text-gradient-copper">reçue !</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg text-muted-foreground mb-10 leading-relaxed"
            >
              Merci de nous avoir contactés. Nous revenons vers vous sous{" "}
              <strong className="text-foreground">24 à 48h ouvrables</strong>. Vous recevrez également un email de
              confirmation dans quelques instants.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="p-6 md:p-8 rounded-2xl bg-primary/10 border-2 border-primary shadow-copper-lg mb-8"
            >
              <h2 className="font-display text-xl md:text-2xl font-bold text-foreground mb-4">
                Besoin d'une intervention urgente ?
              </h2>
              <Button asChild size="xl" variant="copper" className="w-full sm:w-auto">
                <a
                  href="tel:+32485755227"
                  data-analytics="call_click"
                  onClick={() => trackEvent("call_click", { source_section: "merci_page_urgent" })}
                >
                  <Phone className="w-5 h-5" />
                  Appeler le 0485 75 52 27
                </a>
              </Button>
              <p className="text-sm text-muted-foreground mt-4">
                Disponible 7j/7 24h/24 pour urgences électriques
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <Button asChild variant="ghost">
                <Link to="/">
                  <ArrowLeft className="w-4 h-4" />
                  Retour à l'accueil
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
