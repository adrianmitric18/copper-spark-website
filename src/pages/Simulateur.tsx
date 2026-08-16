import { useState } from "react";
import { Clock, MapPin, Receipt, ShieldCheck, Wrench } from "lucide-react";
import { useSearchParams } from "react-router-dom";
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
 *
 * L'intro s'adapte au `?besoin=…` posé par la page d'origine, pour ne pas
 * annoncer quatre questions à quelqu'un qui n'en aura que deux, ni parler de
 * borne de recharge à quelqu'un venu pour une mise en conformité. Le pré-rendu
 * se fait sans paramètre : le HTML statique porte la variante générique, la
 * bonne variante s'affiche à l'hydratation.
 */

interface Variante {
  eyebrow: string;
  titre: string;
  accent: string;
  intro: string;
  reassurances: { icon: typeof Clock; texte: string }[];
}

const ESTIMATION = {
  eyebrow: "Simulateur de prix",
  titre: "Estimez votre prix en",
  accent: "45 secondes",
};

const VARIANTES: Record<"borne" | "rgie" | "depannage" | "defaut", Variante> = {
  borne: {
    ...ESTIMATION,
    intro:
      "Trois questions sur votre installation et l'emplacement de la borne, et vous obtenez une fourchette indicative établie sur nos tarifs réels en Brabant wallon.",
    reassurances: [
      { icon: Clock, texte: "Moins de 45 secondes, 3 questions" },
      { icon: ShieldCheck, texte: "Sans engagement, gratuit" },
      { icon: Wrench, texte: "Chiffres d'un électricien du Brabant wallon" },
    ],
  },
  rgie: {
    ...ESTIMATION,
    intro:
      "Deux questions sur votre installation et le motif du contrôle, et vous obtenez une fourchette indicative pour votre mise en conformité, établie sur nos tarifs réels en Brabant wallon.",
    reassurances: [
      { icon: Clock, texte: "Moins de 30 secondes, 2 questions" },
      { icon: ShieldCheck, texte: "Sans engagement, gratuit" },
      { icon: Wrench, texte: "Chiffres d'un électricien du Brabant wallon" },
    ],
  },
  // Aucune promesse de gratuité ni de durée de parcours ici : il n'y a pas de
  // simulation, seulement une grille de tarifs payants.
  depannage: {
    eyebrow: "Dépannage",
    titre: "Une panne ?",
    accent: "Nos tarifs, sans détour",
    intro:
      "Un problème électrique ne s'estime pas en ligne. Voici ce que coûte une intervention, puis le moyen le plus rapide de nous joindre.",
    reassurances: [
      { icon: Clock, texte: "Intervention 24h/24, 7j/7" },
      { icon: Receipt, texte: "Forfait annoncé avant le départ" },
      { icon: MapPin, texte: "Électricien basé à Court-Saint-Étienne" },
    ],
  },
  defaut: {
    ...ESTIMATION,
    intro:
      "Borne de recharge, mise en conformité RGIE, ou les deux. Quatre questions, et vous obtenez une fourchette indicative établie sur nos tarifs réels en Brabant wallon.",
    reassurances: [
      { icon: Clock, texte: "Moins de 45 secondes, 4 questions" },
      { icon: ShieldCheck, texte: "Sans engagement, gratuit" },
      { icon: Wrench, texte: "Chiffres d'un électricien du Brabant wallon" },
    ],
  },
};

const Simulateur = () => {
  const [params] = useSearchParams();
  const besoin = params.get("besoin");
  const cleUrl =
    besoin === "borne" || besoin === "rgie" || besoin === "depannage" ? besoin : "defaut";

  // Le dépannage est aussi atteignable depuis l'étape 1, sans paramètre d'URL :
  // le parcours nous dit alors lui-même quel écran est affiché.
  const [ecran, setEcran] = useState<"simulation" | "depannage">(
    cleUrl === "depannage" ? "depannage" : "simulation",
  );
  const variante = VARIANTES[ecran === "depannage" ? "depannage" : cleUrl];

  return (
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
                {variante.eyebrow}
              </span>
              <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-[1.15] mb-5">
                {variante.titre}{" "}
                <span className="text-gradient-copper">{variante.accent}</span>
              </h1>
              <p className="text-muted-foreground leading-relaxed">{variante.intro}</p>

              <ul className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
                {variante.reassurances.map(({ icon: Icon, texte }) => (
                  <li key={texte} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Icon className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
                    {texte}
                  </li>
                ))}
              </ul>
            </div>

            <SimulateurWizard onEcranChange={setEcran} />
          </div>
        </section>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Simulateur;
