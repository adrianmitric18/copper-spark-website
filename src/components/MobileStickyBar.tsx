import { Phone, FileText, Calculator } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAnalyticsEvents } from "@/hooks/useAnalyticsEvents";

/**
 * Barre de conversion mobile.
 *
 * ⚠️ ARBITRAGE EN COURS — deux variantes d'intégration du simulateur :
 *
 *   "A" · trois boutons de même poids : Appeler / Estimer / Devis.
 *         Le plus direct, mais serré sous 360 px et les libellés doivent être
 *         raccourcis.
 *   "B" · deux boutons inchangés, plus un bandeau cuivre fin au-dessus qui
 *         renvoie au simulateur. Ne touche pas aux actions existantes et reste
 *         lisible, au prix d'environ 30 px de hauteur supplémentaire.
 *
 * Basculer la constante ci-dessous pour comparer, puis supprimer la variante
 * non retenue et cette note.
 */
// Fonction et non constante : TypeScript réduirait une constante littérale à sa
// seule valeur et signalerait l'autre branche comme morte, ce qui empêcherait
// justement de comparer les deux variantes.
const variante = (): "A" | "B" => "B";
const VARIANTE = variante();

/**
 * Pré-sélection du besoin selon la page où la barre est affichée.
 *
 * Depuis une page service couverte par le simulateur, le visiteur a déjà dit ce
 * qu'il cherchait : lui reposer la question à l'étape 1 — et, sur la page RGIE,
 * lui parler de borne de recharge — serait incohérent. Partout ailleurs, le
 * lien reste générique.
 */
const BESOIN_PAR_PAGE: Record<string, string> = {
  "/services/bornes-de-recharge": "borne",
  "/services/mise-en-conformite-rgie": "rgie",
};

const MobileStickyBar = () => {
  const { trackEvent } = useAnalyticsEvents();
  const { pathname } = useLocation();

  // Ne pas afficher la barre publique de conversion sur l'espace admin
  if (pathname.startsWith("/admin")) return null;

  // Sur le simulateur lui-même, inutile de proposer d'y aller.
  const surSimulateur = pathname.startsWith("/simulateur");

  const besoin = BESOIN_PAR_PAGE[pathname];
  const lienVersSimulateur = besoin ? `/simulateur?besoin=${besoin}` : "/simulateur";

  const lienAppel = (
    <a
      href="tel:+32485755227"
      data-analytics="call_click"
      onClick={() => trackEvent("call_click", { source_section: "mobile_sticky_bar" })}
      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-md active:scale-95 transition-transform"
    >
      <Phone className="w-4 h-4 shrink-0" />
      Appeler
    </a>
  );

  const lienDevis = (
    <Link
      to="/contact"
      data-analytics="quote_request"
      onClick={() => trackEvent("quote_request", { source_section: "mobile_sticky_bar" })}
      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-primary text-copper-deep font-semibold text-sm active:scale-95 transition-transform"
    >
      <FileText className="w-4 h-4 shrink-0" />
      Devis
    </Link>
  );

  const lienSimulateur = (
    <Link
      to={lienVersSimulateur}
      onClick={() =>
        trackEvent("simu_ouverture", {
          source_section: "mobile_sticky_bar",
          besoin_prefill: besoin ?? "aucun",
        })
      }
      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-primary/50 bg-primary/[0.06] text-copper-deep font-semibold text-sm active:scale-95 transition-transform"
    >
      <Calculator className="w-4 h-4 shrink-0" />
      Estimer
    </Link>
  );

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t border-border safe-area-bottom">
      {VARIANTE === "B" && !surSimulateur && (
        <Link
          to={lienVersSimulateur}
          onClick={() =>
            trackEvent("simu_ouverture", {
              source_section: "mobile_sticky_banner",
              besoin_prefill: besoin ?? "aucun",
            })
          }
          className="flex items-center justify-center gap-2 bg-primary/[0.08] border-b border-primary/20 py-2 text-xs font-semibold text-copper-deep active:opacity-80"
        >
          <Calculator className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          {besoin === "borne"
            ? "Estimez le prix de votre borne en 1 minute"
            : besoin === "rgie"
              ? "Estimez le prix de votre mise en conformité"
              : "Estimez votre prix en 1 minute"}
        </Link>
      )}

      <div className="flex gap-3 px-4 py-3">
        {lienAppel}
        {VARIANTE === "A" && !surSimulateur && lienSimulateur}
        {lienDevis}
      </div>
    </div>
  );
};

export default MobileStickyBar;
