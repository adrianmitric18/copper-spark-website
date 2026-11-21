// Google Analytics 4 : chargé UNIQUEMENT après l'accord du visiteur.
//
// Règle (décision d'Adrian du 2026-11-21, règles de l'Autorité de protection
// des données) : aucun script Google avant « Tout accepter », rien si le
// visiteur refuse. Il n'y a donc plus aucune balise Google dans index.html :
// c'est ce module qui injecte le script, et seulement sur appel de
// `chargerMesure()` par le gestionnaire de consentement.
//
// Google Ads n'est plus chargé du tout (aucune campagne en cours au
// 2026-11-21). S'il revient : une catégorie « publicité » à part, jamais
// activée par défaut.

export const GA_ID = "G-FVMP3D980B";

/** Durée de vie des cookies _ga : 13 mois, sans prolongation à chaque visite. */
const DUREE_COOKIE_S = 60 * 60 * 24 * 30 * 13;

const SCRIPT_ID = "ga4-script";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gtag?: (...args: any[]) => void;
    dataLayer?: unknown[];
  }
}

let actif = false;
/** Dernière page comptée : l'accord et le suivi de navigation peuvent se suivre de près. */
let dernierChemin: string | null = null;

/** Robots et outils de mesure : on ne les compte pas et on ne leur charge rien. */
export function estRobot(): boolean {
  if (typeof navigator === "undefined") return false;
  return /bot|crawl|spider|slurp|mediapartners|bingbot|googlebot|yandex|baidu|headless|phantom|puppeteer|selenium|lighthouse|chrome-lighthouse|pagespeed|gtmetrix|ahrefsbot|semrush|dotbot/i.test(
    navigator.userAgent,
  );
}

/** Vrai quand le visiteur a accepté la mesure et que GA4 est chargé. */
export function mesureActive(): boolean {
  return actif;
}

function drapeauDesactivation(valeur: boolean) {
  (window as unknown as Record<string, boolean>)[`ga-disable-${GA_ID}`] = valeur;
}

/** Vue de page (l'application change de page sans recharger le document). */
export function envoyerVueDePage() {
  if (!actif || typeof window.gtag !== "function") return;
  const chemin = window.location.pathname + window.location.search;
  if (chemin === dernierChemin) return;
  dernierChemin = chemin;
  window.gtag("event", "page_view", {
    page_path: chemin,
    page_location: window.location.href,
    page_title: document.title,
    send_to: GA_ID,
  });
}

/** À appeler quand le visiteur accepte la mesure d'audience. */
export function chargerMesure() {
  if (typeof window === "undefined" || estRobot()) return;
  drapeauDesactivation(false);

  if (!document.getElementById(SCRIPT_ID)) {
    window.dataLayer = window.dataLayer || [];
    // gtag attend l'objet `arguments`, pas un tableau : fonction classique voulue.
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    };
    window.gtag("consent", "default", {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "granted",
    });
    window.gtag("js", new Date());
    window.gtag("config", GA_ID, {
      anonymize_ip: true,
      // Les vues de page sont envoyées par `envoyerVueDePage` (une par page).
      send_page_view: false,
      cookie_expires: DUREE_COOKIE_S,
      cookie_update: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    });

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(script);
  } else if (typeof window.gtag === "function") {
    // Le visiteur avait refusé puis accepte à nouveau, sans recharger la page.
    window.gtag("consent", "update", { analytics_storage: "granted" });
  }

  actif = true;
  envoyerVueDePage();
}

/** Efface les cookies posés par Google (_ga, _ga_<id>, _gid, _gat, _gcl_*). */
function effacerCookiesGoogle() {
  // Google pose ses cookies sur le domaine le plus large qu'il peut : on tente
  // donc l'hôte et chacun de ses domaines parents (a.b.c.d, .b.c.d, .c.d).
  const morceaux = window.location.hostname.split(".");
  const domaines = new Set<string>([""]);
  for (let i = 0; i <= morceaux.length - 2; i++) {
    const suffixe = morceaux.slice(i).join(".");
    domaines.add(suffixe);
    domaines.add(`.${suffixe}`);
  }

  for (const paire of document.cookie.split(";")) {
    const nom = paire.split("=")[0].trim();
    if (!/^(_ga|_gid|_gat|_gcl)/.test(nom)) continue;
    for (const domaine of domaines) {
      document.cookie = `${nom}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${
        domaine ? `; domain=${domaine}` : ""
      }`;
    }
  }
}

/**
 * À appeler quand le visiteur refuse ou retire son accord : plus aucun envoi,
 * et les cookies Google déjà posés sont effacés. Sans effet si rien n'a jamais
 * été chargé (aucun script n'est injecté ici).
 */
export function arreterMesure() {
  if (typeof window === "undefined") return;
  actif = false;
  dernierChemin = null;
  drapeauDesactivation(true);
  if (document.getElementById(SCRIPT_ID) && typeof window.gtag === "function") {
    window.gtag("consent", "update", { analytics_storage: "denied" });
  }
  effacerCookiesGoogle();
}
