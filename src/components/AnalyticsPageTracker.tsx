import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { envoyerVueDePage } from "@/lib/analytics/gtag";

/**
 * Une vue de page par changement d'adresse. Sans effet tant que le visiteur
 * n'a pas accepté la mesure d'audience (voir src/lib/analytics/gtag.ts) ; la
 * page sur laquelle il accepte est comptée au moment de l'accord.
 */
const AnalyticsPageTracker = () => {
  const location = useLocation();

  useEffect(() => {
    envoyerVueDePage();
  }, [location]);

  return null;
};

export default AnalyticsPageTracker;
