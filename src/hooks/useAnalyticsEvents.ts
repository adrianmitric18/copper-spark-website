import { useCallback } from "react";

/**
 * GA4 event tracking hook with Consent Mode v2 + bot filtering.
 *
 * - Reads cookie consent from localStorage key "cookie_consent_v1"
 * - Skips events from bots/crawlers (Googlebot, Lighthouse, headless, etc.)
 * - Forwards to gtag('event', ...) only when analytics consent is granted
 *
 * Google Ads conversion mapping (TODO_CONVERSION_LABEL — to wire once
 * Google Ads conversion IDs are provided):
 *   - call_click       → AW-XXXXXXXXXX/TODO_CONVERSION_LABEL
 *   - whatsapp_click   → AW-XXXXXXXXXX/TODO_CONVERSION_LABEL
 *   - quote_request    → AW-XXXXXXXXXX/TODO_CONVERSION_LABEL
 *   - form_submit      → AW-XXXXXXXXXX/TODO_CONVERSION_LABEL
 */

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gtag?: (...args: any[]) => void;
  }
}

const CONSENT_KEY = "cookie_consent_v1";

function isBot(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent.toLowerCase();
  const botPatterns =
    /bot|crawl|spider|slurp|mediapartners|bingbot|googlebot|yandex|baidu|headless|phantom|puppeteer|selenium|lighthouse|chrome-lighthouse|pagespeed|gtmetrix|ahrefsbot|semrush|dotbot/i;
  return botPatterns.test(ua);
}

function hasAnalyticsConsent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as {
      expires?: string;
      choices?: { analytics?: boolean };
    };
    if (!parsed?.expires || new Date(parsed.expires).getTime() < Date.now()) {
      return false;
    }
    return parsed.choices?.analytics === true;
  } catch {
    return false;
  }
}

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
      if (typeof window.gtag !== "function") return;
      if (isBot()) return;
      if (!hasAnalyticsConsent()) return;

      const enriched: AnalyticsParams = {
        page_path: window.location.pathname,
        page_title: typeof document !== "undefined" ? document.title : "",
        ...params,
      };

      window.gtag("event", eventName, enriched);

      // TODO_CONVERSION_LABEL — Google Ads conversion tracking
      // Once conversion IDs are configured in Google Ads, wire them here:
      // if (eventName === "call_click")    window.gtag("event", "conversion", { send_to: "AW-XXXXXXXXXX/TODO_CONVERSION_LABEL" });
      // if (eventName === "whatsapp_click") window.gtag("event", "conversion", { send_to: "AW-XXXXXXXXXX/TODO_CONVERSION_LABEL" });
      // if (eventName === "quote_request")  window.gtag("event", "conversion", { send_to: "AW-XXXXXXXXXX/TODO_CONVERSION_LABEL" });
      // if (eventName === "form_submit")    window.gtag("event", "conversion", { send_to: "AW-XXXXXXXXXX/TODO_CONVERSION_LABEL" });
    },
    [],
  );

  return { trackEvent };
}
