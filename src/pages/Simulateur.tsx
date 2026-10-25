import { useState } from "react";
import { Clock, MapPin, Receipt, ShieldCheck, Wrench } from "lucide-react";
import { Navigate, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import SEO from "@/components/SEO";
import StructuredData from "@/components/StructuredData";
import Breadcrumbs from "@/components/Breadcrumbs";
import SimulateurWizard from "@/components/simulateur/SimulateurWizard";
import { NB_QUESTIONS, PAGE_DEPANNAGE, PARCOURS_OBSOLETES, type Parcours } from "@/lib/simulateur/config";

/**
 * Page /simulateur — borne de recharge, mise en conformité RGIE, dépannage.
 *
 * Le shell de la page (en-tête, intro, réassurance, pied de page) est
 * pré-rendu au build comme les autres routes ; seul le parcours lui-même est
 * interactif et se monte côté client.
 *
 * L'intro s'adapte au parcours réellement affiché — celui du `?besoin=…` posé
 * par la page d'origine, ou celui choisi à l'étape 1 — pour ne pas annoncer
 * cinq questions à quelqu'un qui n'en aura que trois, ni parler d'estimation
 * gratuite au-dessus d'une grille de tarifs de dépannage. Le nombre de
 * questions vient de `NB_QUESTIONS`, dérivé des parcours eux-mêmes : il ne peut
 * pas dériver du parcours réel.
 *
 * Le pré-rendu se fait sans paramètre : le HTML statique porte la variante
 * générique, la bonne variante s'affiche à l'hydratation.
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
  accent: "moins d'une minute",
};

const VARIANTES: Record<Exclude<Parcours, "depannage"> | "defaut", Variante> = {
  borne: {
    ...ESTIMATION,
    intro: `${NB_QUESTIONS.borne} questions sur votre installation et l'emplacement de la borne, et vous obtenez un devis indicatif détaillé poste par poste, établi sur nos tarifs réels en Brabant wallon.`,
    reassurances: [
      { icon: Clock, texte: `${NB_QUESTIONS.borne} questions, moins d'une minute` },
      { icon: ShieldCheck, texte: "Sans engagement, gratuit" },
      { icon: Wrench, texte: "Chiffres d'un électricien du Brabant wallon" },
    ],
  },
  rgie: {
    ...ESTIMATION,
    intro: `${NB_QUESTIONS.rgie} questions sur votre installation et le motif du contrôle, et vous obtenez un devis indicatif détaillé pour votre mise en conformité, établi sur nos tarifs réels en Brabant wallon.`,
    reassurances: [
      { icon: Clock, texte: `${NB_QUESTIONS.rgie} questions, moins d'une minute` },
      { icon: ShieldCheck, texte: "Sans engagement, gratuit" },
      { icon: Wrench, texte: "Chiffres d'un électricien du Brabant wallon" },
    ],
  },
  defaut: {
    ...ESTIMATION,
    intro:
      "Borne de recharge, mise en conformité RGIE ou dépannage. Quelques questions, et vous obtenez un devis indicatif détaillé poste par poste, établi sur nos tarifs réels en Brabant wallon.",
    reassurances: [
      { icon: Clock, texte: "Moins d'une minute" },
      { icon: ShieldCheck, texte: "Sans engagement, gratuit" },
      { icon: Wrench, texte: "Chiffres d'un électricien du Brabant wallon" },
    ],
  },
};

const parcoursDepuisUrl = (valeur: string | null): Parcours | null => {
  if (!valeur) return null;
  if (valeur === "borne" || valeur === "rgie" || valeur === "depannage") return valeur;
  return PARCOURS_OBSOLETES[valeur] ?? null;
};

const Simulateur = () => {
  const [params] = useSearchParams();

  // Le parcours peut aussi être choisi à l'étape 1, sans paramètre d'URL : le
  // wizard nous dit alors lui-même lequel est affiché.
  const [parcours, setParcours] = useState<Parcours | null>(() =>
    parcoursDepuisUrl(params.get("besoin")),
  );
  const variante = VARIANTES[parcours && parcours !== "depannage" ? parcours : "defaut"];

  // Anciens liens et favoris : le dépannage se lit désormais sur sa page.
  if (parcoursDepuisUrl(params.get("besoin")) === "depannage") {
    return <Navigate to={PAGE_DEPANNAGE} replace />;
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SEO
        title="Simulateur de prix - Borne de recharge, RGIE et dépannage"
        description="Estimez en moins d'une minute le prix de votre borne de recharge, de votre mise en conformité RGIE ou d'un dépannage en Brabant wallon. Devis indicatif détaillé, gratuit et sans engagement."
        keywords="prix borne de recharge, tarif mise en conformité RGIE, tarif dépannage électricien, devis borne Brabant wallon, estimation électricien"
        canonical="https://cuivre-electrique.com/simulateur"
      />
      <StructuredData
        type="Service"
        serviceName="Estimation de prix borne de recharge, mise en conformité RGIE et dépannage"
        serviceDescription="Simulateur en ligne donnant un devis indicatif détaillé pour l'installation d'une borne de recharge, une mise en conformité RGIE ou un dépannage électrique en Brabant wallon."
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

            <SimulateurWizard onParcoursChange={setParcours} />
          </div>
        </section>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Simulateur;
