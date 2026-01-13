import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import SEO from "@/components/SEO";
import Breadcrumbs from "@/components/Breadcrumbs";
import { motion } from "framer-motion";

const MentionsLegales = () => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SEO 
        title="Mentions Légales | Le Cuivre Électrique"
        description="Mentions légales de Le Cuivre Électrique. Informations sur l'entreprise, protection des données RGPD, cookies et conditions d'utilisation."
        keywords="mentions légales, RGPD, conditions utilisation, Le Cuivre Électrique"
        canonical="https://cuivre-electrique.com/mentions-legales"
        noindex={true}
      />
      <Header />
      <main className="pt-24">
        <section className="py-16 md:py-24">
          <div className="container mx-auto max-w-4xl px-4">
            <Breadcrumbs items={[{ label: "Mentions légales", href: "/mentions-legales" }]} />
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display text-4xl md:text-5xl font-bold text-foreground mb-8"
            >
              Mentions Légales
            </motion.h1>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-8 text-muted-foreground"
            >
              {/* Identité */}
              <div className="bg-card border border-border/50 rounded-2xl p-6 md:p-8">
                <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                  1. Identité de l'entreprise
                </h2>
                <ul className="space-y-2">
                  <li><strong className="text-foreground">Responsable :</strong> Adrian Mitric</li>
                  <li><strong className="text-foreground">Forme juridique :</strong> Indépendant personne physique</li>
                  <li><strong className="text-foreground">N° TVA :</strong> BE 0805.376.944</li>
                  <li><strong className="text-foreground">N° BCE :</strong> 0805.376.944</li>
                  <li><strong className="text-foreground">Siège social :</strong> 1490 Court-Saint-Étienne, Belgique</li>
                  <li><strong className="text-foreground">Téléphone :</strong> +32 485 75 52 27</li>
                  <li><strong className="text-foreground">Email :</strong> cuivre.electrique@gmail.com</li>
                </ul>
              </div>

              {/* Hébergement */}
              <div className="bg-card border border-border/50 rounded-2xl p-6 md:p-8">
                <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                  2. Hébergement du site
                </h2>
                <ul className="space-y-2">
                  <li><strong className="text-foreground">Hébergeur :</strong> Lovable (Netlify)</li>
                  <li><strong className="text-foreground">Adresse :</strong> San Francisco, CA, USA</li>
                </ul>
              </div>

              {/* Propriété intellectuelle */}
              <div className="bg-card border border-border/50 rounded-2xl p-6 md:p-8">
                <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                  3. Propriété intellectuelle
                </h2>
                <p>
                  L'ensemble du contenu de ce site (textes, images, logos, vidéos) est la propriété 
                  exclusive de Cuivre Électrique ou de ses partenaires. Toute reproduction, 
                  représentation ou diffusion, en tout ou partie, du contenu de ce site sans 
                  autorisation expresse est interdite.
                </p>
              </div>

              {/* RGPD */}
              <div className="bg-card border border-border/50 rounded-2xl p-6 md:p-8">
                <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                  4. Protection des données (RGPD)
                </h2>
                <p className="mb-4">
                  Conformément au Règlement Général sur la Protection des Données (RGPD) et à la 
                  loi belge du 30 juillet 2018, vous disposez des droits suivants :
                </p>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li>Droit d'accès à vos données personnelles</li>
                  <li>Droit de rectification</li>
                  <li>Droit à l'effacement</li>
                  <li>Droit à la limitation du traitement</li>
                  <li>Droit à la portabilité des données</li>
                  <li>Droit d'opposition</li>
                </ul>
                <p>
                  Pour exercer ces droits, contactez-nous par email à{" "}
                  <a href="mailto:contact@cuivre-electrique.be" className="text-primary hover:underline">
                    contact@cuivre-electrique.be
                  </a>
                </p>
              </div>

              {/* Cookies */}
              <div className="bg-card border border-border/50 rounded-2xl p-6 md:p-8">
                <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                  5. Cookies
                </h2>
                <p className="mb-4">
                  Ce site utilise des cookies techniques nécessaires à son bon fonctionnement. 
                  Ces cookies ne collectent aucune donnée personnelle à des fins publicitaires.
                </p>
                <p>
                  Vous pouvez configurer votre navigateur pour refuser les cookies, mais certaines 
                  fonctionnalités du site pourraient ne plus être accessibles.
                </p>
              </div>

              {/* Responsabilité */}
              <div className="bg-card border border-border/50 rounded-2xl p-6 md:p-8">
                <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                  6. Limitation de responsabilité
                </h2>
                <p>
                  Cuivre Électrique s'efforce de fournir des informations exactes et à jour sur ce site. 
                  Toutefois, nous ne pouvons garantir l'exactitude, la complétude ou l'actualité des 
                  informations diffusées. L'utilisation des informations de ce site se fait sous 
                  votre propre responsabilité.
                </p>
              </div>

              {/* Droit applicable */}
              <div className="bg-card border border-border/50 rounded-2xl p-6 md:p-8">
                <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                  7. Droit applicable
                </h2>
                <p>
                  Les présentes mentions légales sont régies par le droit belge. En cas de litige, 
                  les tribunaux de Bruxelles seront seuls compétents.
                </p>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default MentionsLegales;
