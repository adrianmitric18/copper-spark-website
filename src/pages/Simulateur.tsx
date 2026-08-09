import { Clock, ShieldCheck, Wrench } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import SEO from "@/components/SEO";
import StructuredData from "@/components/StructuredData";
import Breadcrumbs from "@/components/Breadcrumbs";
import SimulateurWizard from "@/components/simulateur/SimulateurWizard";

/**
 * Page /simulateur — estimation borne de recharge et mise en conformité RGIE.
 *
 * Le shell de la page (en-tête, intro, réassurance, pied de page) est
 * pré-rendu au build comme les autres routes ; seul le parcours lui-même est
 * interactif et se monte côté client.
 */
const reassurances = [
  { icon: Clock, texte: "Moins de 45 secondes, 4 questions" },
  { icon: ShieldCheck, texte: "Sans engagement, gratuit" },
  { icon: Wrench, texte: "Chiffres d'un électricien du Brabant wallon" },
];

const Simulateur = () => (
  <div className="min-h-screen bg-background overflow-x-hidden">
    <SEO
      title="Simulateur de prix - Borne de recharge et RGIE"
      description="Estimez en 45 secondes le prix de votre borne de recharge ou de votre mise en conformité RGIE en Brabant wallon. Estimation gratuite et sans engagement."
      keywords="prix borne de recharge, tarif mise en conformité RGIE, devis borne Brabant wallon, estimation électricien"
      canonical="https://cuivre-electrique.com/simulateur"
    />
    <StructuredData
      type="Service"
      serviceName="Estimation de prix borne de recharge et mise en conformité RGIE"
      serviceDescription="Simulateur en ligne donnant une fourchette de prix indicative pour l'installation d'une borne de recharge ou une mise en conformité RGIE en Brabant wallon."
    />
    <Header />

    <main className="pt-24">
      <div className="container mx-auto px-4">
        <Breadcrumbs items={[{ label: "Simulateur de prix", href: "/simulateur" }]} />
      </div>

      <section className="py-8 md:py-14">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center mb-10 md:mb-14">
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-4">
              Simulateur de prix
            </span>
            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-[1.15] mb-5">
              Estimez votre prix en{" "}
              <span className="text-gradient-copper">45 secondes</span>
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              Borne de recharge, mise en conformité RGIE, ou les deux. Quatre questions,
              et vous obtenez une fourchette indicative établie sur nos tarifs réels en
              Brabant wallon.
            </p>

            <ul className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
              {reassurances.map(({ icon: Icon, texte }) => (
                <li key={texte} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Icon className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
                  {texte}
                </li>
              ))}
            </ul>
          </div>

          <SimulateurWizard />
        </div>
      </section>
    </main>

    <Footer />
    <WhatsAppButton />
  </div>
);

export default Simulateur;
