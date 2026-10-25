import { Link } from "react-router-dom";
import { ArrowRight, MessageCircle, Phone, Zap } from "lucide-react";
import { useAnalyticsEvents } from "@/hooks/useAnalyticsEvents";
import { CONTACT, MESSAGE_WHATSAPP_DEPANNAGE, PAGE_DEPANNAGE } from "@/lib/simulateur/config";
import { formatEuros, plancherDepannage } from "@/lib/simulateur/calcul";

/**
 * Bandeau dépannage de l'accueil, visible sans défiler (décision d'Adrian du
 * 2026-10-26) : quelqu'un en panne doit trouver le numéro et l'ordre de prix
 * dès l'arrivée, sans passer par « Estimer mon prix », réservé aux chantiers.
 *
 * Le montant « dès 110 € » vient de la grille (plancherDepannage), jamais
 * d'ici ; le lien renvoie vers la page dépannage, où la grille complète est
 * affichée sans clic.
 */
const lienWhatsApp = `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(
  MESSAGE_WHATSAPP_DEPANNAGE,
)}`;

const DepannageBanner = () => {
  const { trackEvent } = useAnalyticsEvents();
  const source = "home_depannage_banner";

  return (
    <div className="mx-auto mb-8 w-full max-w-3xl rounded-2xl border-2 border-primary/50 bg-card/90 p-4 text-left shadow-lg shadow-primary/10 backdrop-blur md:p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 border border-primary/30">
            <Zap className="h-5 w-5 text-primary" aria-hidden="true" />
          </span>
          <div>
            <p className="font-display text-lg font-bold leading-tight text-foreground md:text-xl">
              Panne ? Dépannage 7j/7
            </p>
            <p className="text-sm text-muted-foreground">
              Forfait dès{" "}
              <strong className="text-foreground">{formatEuros(plancherDepannage("jour"))}</strong>{" "}
              en journée, déplacement et première heure compris.{" "}
              <Link
                to={PAGE_DEPANNAGE}
                onClick={() => trackEvent("depannage_grille_click", { source_section: source })}
                className="inline-flex items-center gap-1 font-semibold text-primary underline underline-offset-4 hover:no-underline"
              >
                Voir la grille complète
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </p>
          </div>
        </div>

        <div className="flex shrink-0 gap-2">
          <a
            href={`tel:${CONTACT.telephone}`}
            data-analytics="call_click"
            onClick={() => trackEvent("call_click", { source_section: source })}
            className="flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-primary px-3 py-3 text-sm font-bold text-primary-foreground shadow-copper transition-shadow hover:shadow-copper-lg md:flex-none md:px-4"
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            {CONTACT.telephoneAffiche}
          </a>
          <a
            href={lienWhatsApp}
            target="_blank"
            rel="noopener noreferrer"
            data-analytics="whatsapp_click"
            onClick={() => trackEvent("whatsapp_click", { source_section: source })}
            className="flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border-2 border-primary px-3 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground md:flex-none md:px-4"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
};

export default DepannageBanner;
