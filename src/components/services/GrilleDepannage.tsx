import { Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAnalyticsEvents } from "@/hooks/useAnalyticsEvents";
import {
  CONTACT,
  DEFINITION_MOMENT,
  DEPANNAGE,
  LIBELLE_HORS_JOUR,
  MENTIONS,
  MESSAGE_WHATSAPP_DEPANNAGE,
  ZONES,
  type Moment,
  type ZoneDeplacement,
} from "@/lib/simulateur/config";
import { formatEuros, plancherDepannage } from "@/lib/simulateur/calcul";

/**
 * Grille de dépannage affichée tout en haut de /services/depannage-urgent,
 * sans rien à cliquer ni à remplir (décision d'Adrian du 2026-10-25 : quelqu'un
 * en panne est pressé, il ne passe pas par le simulateur pour voir un prix).
 *
 * Aucun montant n'est écrit ici : tout vient de `config.ts` (ZONES, DEPANNAGE,
 * MENTIONS), la même source que le simulateur et que la FAQ de la page. Les
 * boutons d'appel et WhatsApp sont répétés sous la grille : c'est l'action
 * utile une fois le prix lu.
 */
type ZoneForfaitisee = ZoneDeplacement & { forfait: Record<Moment, number> };
const ZONES_FORFAIT = ZONES.filter((z): z is ZoneForfaitisee => z.forfait !== null);

const lienWhatsApp = `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(
  MESSAGE_WHATSAPP_DEPANNAGE,
)}`;

const celluleMontant =
  "px-3 py-3 align-top font-display text-base font-bold text-foreground whitespace-nowrap sm:px-4";

const GrilleDepannage = () => {
  const { trackEvent } = useAnalyticsEvents();
  const source = "depannage_grille";

  return (
    <section aria-labelledby="grille-depannage-titre" className="mb-12">
      <h2
        id="grille-depannage-titre"
        className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2"
      >
        Nos tarifs de dépannage
      </h2>
      <p className="text-muted-foreground leading-relaxed mb-4">
        Forfait déplacement et première heure compris, à partir de{" "}
        <strong className="text-foreground">
          {formatEuros(plancherDepannage("jour"))} hors TVA
        </strong>
        , annoncé avant le départ.
      </p>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
        <table className="w-full text-sm">
          <caption className="sr-only">
            Forfaits de dépannage hors TVA, par zone et par moment
          </caption>
          <thead className="bg-muted/50 text-left text-foreground">
            <tr>
              <th scope="col" className="px-3 py-3 font-semibold sm:px-4">
                Zone
              </th>
              <th scope="col" className="px-3 py-3 font-semibold sm:px-4">
                Jour
              </th>
              <th scope="col" className="px-3 py-3 font-semibold leading-tight sm:px-4">
                {LIBELLE_HORS_JOUR.court}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {ZONES_FORFAIT.map((z) => (
              <tr key={z.value}>
                <td className="px-3 py-3 align-top sm:px-4">
                  <p className="font-medium text-foreground">{z.label}</p>
                  <p className="text-xs leading-snug text-muted-foreground">
                    {z.communes.join(", ")}
                  </p>
                </td>
                <td className={celluleMontant}>{formatEuros(z.forfait.jour)}</td>
                <td className={celluleMontant}>{formatEuros(z.forfait.nuitWeekend)}</td>
              </tr>
            ))}
            <tr className="bg-muted/30">
              <td className="px-3 py-3 align-top sm:px-4">
                <p className="font-medium text-foreground">{DEPANNAGE.libelleDemiHeure}</p>
                <p className="text-xs leading-snug text-muted-foreground">
                  Au-delà de la première heure
                </p>
              </td>
              <td className={celluleMontant}>
                {formatEuros(DEPANNAGE.demiHeureSupplementaire.jour)}
              </td>
              <td className={celluleMontant}>
                {formatEuros(DEPANNAGE.demiHeureSupplementaire.nuitWeekend)}
              </td>
            </tr>
            <tr>
              <td className="px-3 py-3 align-top sm:px-4">
                <p className="font-medium text-foreground">Bruxelles et communes hors liste</p>
              </td>
              <td colSpan={2} className="px-3 py-3 align-top text-muted-foreground sm:px-4">
                Forfait confirmé par téléphone selon la distance, avant tout départ
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Les définitions des plages sous le tableau, pas dans l'en-tête : dans
          des colonnes de 70 px, elles faisaient déborder la grille d'un écran. */}
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        <strong className="text-foreground">Jour :</strong> {DEFINITION_MOMENT.jour.toLowerCase()}.{" "}
        <strong className="text-foreground">{LIBELLE_HORS_JOUR.court} :</strong>{" "}
        {DEFINITION_MOMENT.nuitWeekend.toLowerCase()}.
      </p>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        {MENTIONS.depannageTva} {MENTIONS.depannageMateriel} {MENTIONS.depannagePaiement}{" "}
        {MENTIONS.depannageNuit}
      </p>

      <div className="mt-5 flex flex-col sm:flex-row gap-3">
        <Button variant="copper" size="lg" asChild className="flex-1 h-auto min-h-14 py-4 text-lg font-bold">
          <a
            href={`tel:${CONTACT.telephone}`}
            data-analytics="call_click"
            onClick={() => trackEvent("call_click", { source_section: source })}
          >
            <Phone className="w-5 h-5 mr-2 shrink-0" />
            Appeler le {CONTACT.telephoneAffiche}
          </a>
        </Button>
        <Button
          size="lg"
          asChild
          className="flex-1 h-auto min-h-14 py-4 text-lg font-bold bg-[#1F1F1F] text-white hover:bg-[#2E2E2E] border border-white/10"
        >
          <a
            href={lienWhatsApp}
            target="_blank"
            rel="noopener noreferrer"
            data-analytics="whatsapp_click"
            onClick={() => trackEvent("whatsapp_click", { source_section: source })}
          >
            <MessageCircle className="w-5 h-5 mr-2 shrink-0" />
            Décrire ma panne sur WhatsApp
          </a>
        </Button>
      </div>
    </section>
  );
};

export default GrilleDepannage;
