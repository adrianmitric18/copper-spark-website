import { useCallback } from "react";
import { mesureActive } from "@/lib/analytics/gtag";

/**
 * Envoi d'événements à Google Analytics 4.
 *
 * Rien ne part tant que le visiteur n'a pas accepté la mesure d'audience :
 * `mesureActive()` n'est vrai qu'après l'accord, quand GA4 a été chargé par
 * src/lib/analytics/gtag.ts (qui écarte aussi les robots).
 */

export type AnalyticsEventName =
  | "call_click"
  | "whatsapp_click"
  | "quote_request"
  | "form_submit"
  | "review_click";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnalyticsParams = Record<string, any>;

export function useAnalyticsEvents() {
  const trackEvent = useCallback(
    (eventName: AnalyticsEventName | string, params: AnalyticsParams = {}) => {
      if (typeof window === "undefined") return;
      if (!mesureActive() || typeof window.gtag !== "function") return;

      window.gtag("event", eventName, {
        page_path: window.location.pathname,
        page_title: typeof document !== "undefined" ? document.title : "",
        ...params,
      });
    },
    [],
  );

  return { trackEvent };
}
