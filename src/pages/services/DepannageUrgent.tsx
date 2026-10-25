import ServicePageLayout from "@/components/services/ServicePageLayout";
import SimulateurCTA from "@/components/simulateur/SimulateurCTA";
import { Phone, MessageCircle, AlertTriangle } from "lucide-react";
import { useAnalyticsEvents } from "@/hooks/useAnalyticsEvents";
import {
  DEFINITION_MOMENT,
  DEPANNAGE,
  MENTIONS,
  ZONES,
  type Moment,
  type ZoneDeplacement,
} from "@/lib/simulateur/config";
import { formatEuros, plancherDepannage } from "@/lib/simulateur/calcul";

/**
 * Grille de dépannage affichée au public (section « Tarification transparente »
 * et FAQ). Les montants viennent de `config.ts`, jamais d'ici : la page et le
 * simulateur ne peuvent pas diverger. Grille du 2026-10-25 : forfait
 * (déplacement + première heure) par zone et par moment, puis demi-heure
 * supplémentaire entamée.
 */
type ZoneForfaitisee = ZoneDeplacement & { forfait: Record<Moment, number> };
const ZONES_FORFAIT = ZONES.filter((z): z is ZoneForfaitisee => z.forfait !== null);
const forfaitsJour = ZONES_FORFAIT.map((z) => z.forfait.jour);
const forfaitsNuit = ZONES_FORFAIT.map((z) => z.forfait.nuitWeekend);
const demiHeure = DEPANNAGE.demiHeureSupplementaire;

/** « Zone 1 : 110 €, Zone 2 : 130 €, Zone 3 : 150 € » — pour la FAQ (et son schema). */
const detailZones = (moment: Moment) =>
  ZONES_FORFAIT.map((z) => `${z.label} : ${formatEuros(z.forfait[moment])}`).join(", ");

const faqs = [
  {
    question: "Combien de temps pour une intervention urgente ?",
    answer:
      "Selon votre localisation et l'heure d'appel, nous intervenons généralement en 1 à 3 heures dans le Brabant wallon (Court-Saint-Étienne, Ottignies-LLN, Wavre, Nivelles…). Pour les interventions de nuit ou très éloignées, le délai peut être adapté — nous vous le confirmons immédiatement par téléphone.",
  },
  {
    question: "Quel est le tarif d'un dépannage urgent ?",
    answer: `Un dépannage se facture au forfait, déplacement et première heure compris. En journée (${DEFINITION_MOMENT.jour.toLowerCase()}), le forfait va de ${formatEuros(Math.min(...forfaitsJour))} à ${formatEuros(Math.max(...forfaitsJour))} hors TVA selon votre commune (${detailZones("jour")}). La nuit, le week-end et les jours fériés, il va de ${formatEuros(Math.min(...forfaitsNuit))} à ${formatEuros(Math.max(...forfaitsNuit))} (${detailZones("nuitWeekend")}). Chaque demi-heure supplémentaire entamée est comptée ${formatEuros(demiHeure.jour)} en journée et ${formatEuros(demiHeure.nuitWeekend)} la nuit ou le week-end. À Bruxelles, pour une commune hors liste ou au-delà de 50 km, le déplacement est confirmé par téléphone avant tout départ. TVA en sus : 6 % si votre logement a plus de 10 ans, sinon 21 %. Le matériel éventuel est facturé en plus, après votre accord. Le forfait est annoncé et accepté avant que nous prenions la route.`,
  },
  {
    question: "Que faire en attendant votre arrivée ?",
    answer:
      "Si possible, coupez le disjoncteur général au tableau pour mettre l'installation hors tension. Ne touchez ni au tableau ni à la prise/appareil suspect tant que le courant n'est pas coupé. En cas de fumée ou d'odeur de brûlé, quittez la pièce et appelez les pompiers (112) avant de nous joindre.",
  },
  {
    question: "Intervenez-vous la nuit et le week-end ?",
    answer:
      "Oui, week-ends compris. Le bureau est ouvert du lundi au samedi de 7h à 19h (fermé le dimanche) ; en dehors de ces plages, le numéro 0485 75 52 27 reste joignable pour les urgences. Les interventions de nuit se font sous réserve de disponibilité, confirmée par téléphone au moment de votre appel.",
  },
];

const DepannageUrgent = () => {
  const { trackEvent } = useAnalyticsEvents();
  return (
    <ServicePageLayout
      slug="depannage-urgent"
      breadcrumbLabel="Dépannage urgent 24h/24"
      seoTitle="Dépannage électrique urgent 24h/24 en Brabant wallon | Le Cuivre Électrique"
      seoDescription="Panne électrique, court-circuit, disjoncteur qui saute ? Dépannage urgent 24h/24, 7j/7, à Court-Saint-Étienne et dans tout le Brabant wallon. 0485 75 52 27."
      seoKeywords="dépannage électrique urgent, électricien 24h/24, panne électrique Brabant wallon, court-circuit, disjoncteur qui saute, électricien Court-Saint-Étienne"
      schemaServiceName="Dépannage électrique urgent 24h/24"
      schemaServiceDescription="Service de dépannage électrique d'urgence disponible 24h/24 et 7j/7 dans tout le Brabant wallon, en Wallonie et à Bruxelles."
      hero={{
        eyebrow: "Dépannage urgent",
        h1: "Dépannage électrique urgent — jour, soirée et week-end",
        intro:
          "Une panne électrique ne peut pas attendre. Adrian intervient rapidement dans le Brabant wallon, en Wallonie et à Bruxelles pour rétablir votre installation en toute sécurité, jour et nuit, week-ends compris.",
      }}
      simulateurCta="depannage"
      faqs={faqs}
    >
      {/* Bloc urgence */}
      <div className="bg-primary/10 border-2 border-primary/40 rounded-2xl p-6 md:p-8 mb-10">
        <div className="flex items-start gap-4">
          <AlertTriangle className="w-10 h-10 text-primary shrink-0" />
          <div className="flex-1">
            <p className="font-display text-xl md:text-2xl font-bold text-foreground mb-2">
              Panne en cours ? Appelez maintenant
            </p>
            <p className="text-muted-foreground mb-3">
              Réponse immédiate, intervention rapide.
            </p>
            {/* Seule consigne de sécurité du parcours dépannage, et elle vit
                ici — pas dans le simulateur, qui ne donne que des prix. Reprend
                mot pour mot la FAQ plus bas sur cette page. Sans elle, un
                visiteur qui sent le brûlé traverse page → simulateur → appel
                sans croiser aucun avertissement. */}
            <p className="mb-4 font-semibold text-foreground">
              Odeur de brûlé, fumée ou étincelles ? Quittez la pièce et appelez
              les pompiers (112) avant de nous joindre.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="tel:+32485755227"
                data-analytics="call_click"
                onClick={() => trackEvent("call_click", { source_section: "depannage_urgence_block" })}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-lg shadow-copper hover:shadow-copper-lg transition-shadow"
              >
                <Phone className="w-5 h-5" />
                0485 75 52 27
              </a>
              <a
                href="https://wa.me/32485755227?text=Urgence%20%C3%A9lectrique"
                target="_blank"
                rel="noopener noreferrer"
                data-analytics="whatsapp_click"
                onClick={() => trackEvent("whatsapp_click", { source_section: "depannage_urgence_block" })}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-primary text-primary font-semibold hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                WhatsApp urgence
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Le simulateur vient APRÈS le bloc d'urgence, jamais avant : quelqu'un
          dont l'installation est en panne doit tomber sur le numéro en premier.
          Ce parcours-ci s'adresse à celui qui veut connaître le tarif avant
          d'appeler. */}
      <SimulateurCTA contexte="depannage" />

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
        Nous intervenons en priorité dans tout le Brabant wallon depuis notre base
        de Court-Saint-Étienne :
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4 text-sm">
        {[
          "Court-Saint-Étienne",
          "Ottignies-Louvain-la-Neuve",
          "Wavre",
          "Nivelles",
          "Waterloo",
          "Genappe",
          "Rixensart",
          "Lasne",
          "Braine-l'Alleud",
          "Jodoigne",
          "Gembloux",
          "Namur",
          "Bruxelles",
        ].map((city) => (
          <div
            key={city}
            className="px-3 py-2 bg-card border border-border/60 rounded-lg text-foreground"
          >
            {city}
          </div>
        ))}
      </div>
      <p className="text-muted-foreground text-sm">
        Vous n'êtes pas dans cette liste ? Appelez-nous : selon disponibilité, nous
        intervenons aussi sur le reste de la Wallonie.
      </p>

      <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6">
        Tarification transparente
      </h2>
      <p className="text-muted-foreground leading-relaxed mb-4">
        Un dépannage se facture au <strong>forfait</strong> : le déplacement et la
        première heure sont compris, à partir de{" "}
        <strong>{formatEuros(plancherDepannage("jour"))} hors TVA</strong>. Le
        montant dépend de votre commune et du moment de l'intervention ; il est
        annoncé et accepté avant que nous prenions la route, par téléphone ou
        WhatsApp. Pas de mauvaise surprise au moment de la facture.
      </p>

      {/* La grille, telle qu'elle est facturée. Les montants viennent de
          config.ts (simulateur) : une seule source pour les deux affichages. */}
      <div className="overflow-x-auto rounded-2xl border border-border/60 mb-4">
        <table className="w-full text-sm">
          <caption className="sr-only">
            Forfaits de dépannage hors TVA, par zone et par moment
          </caption>
          <thead className="bg-card text-left text-foreground">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">
                Zone
              </th>
              <th scope="col" className="px-4 py-3 font-semibold whitespace-nowrap">
                Jour
              </th>
              <th scope="col" className="px-4 py-3 font-semibold whitespace-nowrap">
                Nuit / week-end
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {ZONES_FORFAIT.map((z) => (
              <tr key={z.value}>
                <td className="px-4 py-3 align-top">
                  <p className="font-medium text-foreground">{z.label}</p>
                  <p className="text-muted-foreground leading-snug">{z.communes.join(", ")}</p>
                </td>
                <td className="px-4 py-3 align-top font-display font-bold text-foreground whitespace-nowrap">
                  {formatEuros(z.forfait.jour)}
                </td>
                <td className="px-4 py-3 align-top font-display font-bold text-foreground whitespace-nowrap">
                  {formatEuros(z.forfait.nuitWeekend)}
                </td>
              </tr>
            ))}
            <tr>
              <td className="px-4 py-3 align-top">
                <p className="font-medium text-foreground">
                  Bruxelles, commune hors liste, au-delà de 50 km
                </p>
              </td>
              <td colSpan={2} className="px-4 py-3 align-top text-muted-foreground">
                Déplacement confirmé par téléphone avant tout départ
              </td>
            </tr>
            <tr className="bg-card/60">
              <td className="px-4 py-3 align-top">
                <p className="font-medium text-foreground">{DEPANNAGE.libelleDemiHeure}</p>
                <p className="text-muted-foreground leading-snug">Au-delà de la première heure</p>
              </td>
              <td className="px-4 py-3 align-top font-display font-bold text-foreground whitespace-nowrap">
                {formatEuros(demiHeure.jour)}
              </td>
              <td className="px-4 py-3 align-top font-display font-bold text-foreground whitespace-nowrap">
                {formatEuros(demiHeure.nuitWeekend)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <ul className="space-y-1.5 text-sm text-muted-foreground mb-4">
        <li>
          <strong className="text-foreground">Jour :</strong>{" "}
          {DEFINITION_MOMENT.jour.toLowerCase()}.
        </li>
        <li>
          <strong className="text-foreground">Nuit / week-end :</strong>{" "}
          {DEFINITION_MOMENT.nuitWeekend.toLowerCase()}.
        </li>
      </ul>
      <p className="text-muted-foreground leading-relaxed mb-4">
        Prix hors TVA : <strong>6 %</strong> si votre logement a plus de 10 ans,
        sinon <strong>21 %</strong>. Le matériel éventuellement nécessaire
        (différentiel, disjoncteur, prise…) est facturé en sus, après votre accord.
      </p>
      <p className="text-muted-foreground leading-relaxed">{MENTIONS.depannageNuit}</p>

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
            <strong>En cas de fumée ou flammes</strong>, quittez immédiatement la
            pièce et appelez le 112 avant de nous joindre.
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
