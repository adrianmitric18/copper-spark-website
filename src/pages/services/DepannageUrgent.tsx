import ServicePageLayout from "@/components/services/ServicePageLayout";
import GrilleDepannage from "@/components/services/GrilleDepannage";
import {
  COMMUNES_FORFAIT,
  COMPLEMENT_MOMENT,
  DEFINITION_MOMENT,
  DEPANNAGE,
  HORS_FORFAIT,
  ZONES,
  type Moment,
} from "@/lib/simulateur/config";
import { formatEuros } from "@/lib/simulateur/calcul";

/**
 * Montants repris dans la FAQ de la page (et donc dans son schema FAQPage). La
 * grille affichée en haut de page vit dans `GrilleDepannage`. Les montants
 * viennent de `config.ts`, jamais d'ici : la page et le simulateur ne peuvent
 * pas diverger. Grille du 2026-10-25 : forfait
 * (déplacement + première heure) par zone et par moment, puis demi-heure
 * supplémentaire entamée.
 */
const forfaitsJour = ZONES.map((z) => z.forfait.jour);
const forfaitsNuit = ZONES.map((z) => z.forfait.nuitWeekend);
const demiHeure = DEPANNAGE.demiHeureSupplementaire;

/** « Zone 1 : 110 €, Zone 2 : 130 €, Zone 3 : 150 € » — pour la FAQ (et son schema). */
const detailZones = (moment: Moment) =>
  ZONES.map((z) => `${z.label} : ${formatEuros(z.forfait[moment])}`).join(", ");

const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const faqs = [
  {
    question: "Combien de temps pour une intervention urgente ?",
    answer:
      "Selon votre localisation et l'heure d'appel, nous intervenons généralement en 1 à 3 heures dans le Brabant wallon (Court-Saint-Étienne, Ottignies-LLN, Wavre, Nivelles…). Pour les interventions de nuit ou très éloignées, le délai peut être adapté — nous vous le confirmons immédiatement par téléphone.",
  },
  {
    question: "Quel est le tarif d'un dépannage urgent ?",
    answer: `Un dépannage se facture au forfait, déplacement et première heure compris. En journée (${DEFINITION_MOMENT.jour.toLowerCase()}), le forfait va de ${formatEuros(Math.min(...forfaitsJour))} à ${formatEuros(Math.max(...forfaitsJour))} hors TVA selon votre commune (${detailZones("jour")}). ${majuscule(COMPLEMENT_MOMENT.nuitWeekend)}, il va de ${formatEuros(Math.min(...forfaitsNuit))} à ${formatEuros(Math.max(...forfaitsNuit))} (${detailZones("nuitWeekend")}). Chaque demi-heure supplémentaire entamée est comptée ${formatEuros(demiHeure.jour)} en journée et ${formatEuros(demiHeure.nuitWeekend)} ${COMPLEMENT_MOMENT.nuitWeekend}. À Bruxelles, pour une commune hors liste ou au-delà de 50 km, le forfait est confirmé par téléphone selon la distance, avant tout départ. TVA en sus : 6 % si votre logement a plus de 10 ans, sinon 21 %. Le matériel éventuel est facturé en plus, après votre accord. Le forfait est annoncé et accepté avant que nous prenions la route. Paiement sur place par QR code.`,
  },
  {
    question: "Que faire en attendant votre arrivée ?",
    answer:
      "Si possible, coupez le disjoncteur général au tableau pour mettre l'installation hors tension. Ne touchez ni au tableau ni à la prise/appareil suspect tant que le courant n'est pas coupé.",
  },
  {
    question: "Intervenez-vous la nuit et le week-end ?",
    answer:
      "Oui, week-ends compris. Le bureau est ouvert du lundi au samedi de 7h à 19h (fermé le dimanche) ; en dehors de ces plages, le numéro 0485 75 52 27 reste joignable pour les urgences. Les interventions de nuit se font sous réserve de disponibilité, confirmée par téléphone au moment de votre appel.",
  },
];

const DepannageUrgent = () => {
  return (
    <ServicePageLayout
      slug="depannage-urgent"
      breadcrumbLabel="Dépannage urgent 7j/7"
      seoTitle="Dépannage électrique urgent 7j/7 en Brabant wallon | Le Cuivre Électrique"
      seoDescription="Panne électrique, court-circuit, disjoncteur qui saute ? Dépannage urgent 7j/7, à Court-Saint-Étienne et dans tout le Brabant wallon. 0485 75 52 27."
      seoKeywords="dépannage électrique urgent, électricien 7j/7, panne électrique Brabant wallon, court-circuit, disjoncteur qui saute, électricien Court-Saint-Étienne"
      schemaServiceName="Dépannage électrique urgent 7j/7"
      schemaServiceDescription="Service de dépannage électrique d'urgence disponible 7j/7 dans tout le Brabant wallon, en Wallonie et à Bruxelles."
      hero={{
        eyebrow: "Dépannage urgent",
        h1: "Dépannage électrique urgent — jour, soirée et week-end",
        intro:
          "Une panne électrique ne peut pas attendre. Adrian intervient rapidement dans le Brabant wallon, en Wallonie et à Bruxelles pour rétablir votre installation en toute sécurité, jour et nuit, week-ends compris.",
      }}
      schemaAreaServed={COMMUNES_FORFAIT}
      faqs={faqs}
    >
      {/* La grille d'abord, sans rien à cliquer : décision d'Adrian du
          2026-10-25, quelqu'un en panne est pressé. Les boutons du hero sont
          juste au-dessus, la grille les répète en dessous. */}
      <GrilleDepannage />

      <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6">
        Types de pannes traitées
      </h2>
      <ul className="space-y-3 text-foreground mb-10">
        {[
          "Panne électrique générale (plus aucun courant)",
          "Disjoncteur ou différentiel qui saute en boucle",
          "Prise qui grille, qui chauffe, ou qui ne fonctionne plus",
          "Tableau électrique défaillant ou obsolète",
          "Court-circuit après un orage ou un dégât des eaux",
          "Panne partielle (plus de courant dans une partie de la maison)",
          "Éclairage qui ne fonctionne plus",
          "Bruit, étincelles, odeur de brûlé sur le tableau",
        ].map((item) => (
          <li key={item} className="flex items-start gap-3">
            <span className="mt-2 w-2 h-2 rounded-full bg-primary shrink-0" />
            <span className="leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>

      <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6">
        Zones d'intervention urgente
      </h2>
      <p className="text-muted-foreground leading-relaxed mb-4">
        Nous intervenons depuis notre base de Court-Saint-Étienne. Les zones sont
        les mêmes que celles de la grille ci-dessus.
      </p>
      {/* Même liste que la grille et que le schema : ZONES, dans config.ts. */}
      <div className="space-y-4 mb-4">
        {ZONES.map((z) => (
          <div key={z.value}>
            <p className="font-semibold text-foreground mb-2">{z.label}</p>
            <div className="flex flex-wrap gap-2 text-sm">
              {z.communes.map((commune) => (
                <span
                  key={commune}
                  className="px-3 py-1.5 bg-card border border-border/60 rounded-lg text-foreground"
                >
                  {commune}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="text-muted-foreground text-sm">
        {HORS_FORFAIT.libelle} : {HORS_FORFAIT.detail.toLowerCase()}. Selon
        disponibilité, nous intervenons aussi sur le reste de la Wallonie.
      </p>

      <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6">
        Conseils sécurité en attendant l'arrivée
      </h2>
      <ul className="space-y-3 text-foreground mb-6">
        <li className="flex items-start gap-3">
          <span className="mt-2 w-2 h-2 rounded-full bg-primary shrink-0" />
          <span>
            <strong>Coupez le disjoncteur général</strong> au tableau si vous savez
            le faire en sécurité.
          </span>
        </li>
        <li className="flex items-start gap-3">
          <span className="mt-2 w-2 h-2 rounded-full bg-primary shrink-0" />
          <span>
            <strong>Ne touchez pas</strong> au tableau, à une prise qui chauffe ou à
            un appareil suspect tant que le courant n'est pas coupé.
          </span>
        </li>
        <li className="flex items-start gap-3">
          <span className="mt-2 w-2 h-2 rounded-full bg-primary shrink-0" />
          <span>
            <strong>Débranchez les appareils sensibles</strong> (informatique,
            électroménager) si l'installation est instable.
          </span>
        </li>
      </ul>
    </ServicePageLayout>
  );
};

export default DepannageUrgent;
