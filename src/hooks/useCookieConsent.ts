import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "cookie_consent_v1";
const SIX_MONTHS_MS = 1000 * 60 * 60 * 24 * 30 * 6;
export const OPEN_PREFERENCES_EVENT = "open-cookie-preferences";

export type CookieChoices = {
  analytics: boolean;
  marketing: boolean;
};

export type StoredConsent = {
  timestamp: string;
  expires: string;
  choices: CookieChoices;
};

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gtag?: (...args: any[]) => void;
    dataLayer?: unknown[];
  }
}

const applyConsent = (choices: CookieChoices, acceptAll = false) => {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  const base = {
    ad_storage: choices.marketing ? "granted" : "denied",
    ad_user_data: choices.marketing ? "granted" : "denied",
    ad_personalization: choices.marketing ? "granted" : "denied",
    analytics_storage: choices.analytics ? "granted" : "denied",
  };
  window.gtag(
    "consent",
    "update",
    acceptAll
      ? { ...base, functionality_storage: "granted", security_storage: "granted" }
      : base,
  );
};

const readStored = (): StoredConsent | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredConsent;
    if (!parsed?.expires || new Date(parsed.expires).getTime() < Date.now()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export const useCookieConsent = () => {
  const [stored, setStored] = useState<StoredConsent | null>(null);
  const [needsChoice, setNeedsChoice] = useState(false);

  useEffect(() => {
    const existing = readStored();
    if (existing) {
      setStored(existing);
      applyConsent(existing.choices);
    } else {
      setNeedsChoice(true);
    }
  }, []);

  const persist = useCallback((choices: CookieChoices, acceptAll = false) => {
    const now = new Date();
    const consent: StoredConsent = {
      timestamp: now.toISOString(),
      expires: new Date(now.getTime() + SIX_MONTHS_MS).toISOString(),
      choices,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
    } catch {
      /* ignore */
    }
    applyConsent(choices, acceptAll);
    setStored(consent);
    setNeedsChoice(false);
  }, []);

  const acceptAll = useCallback(() => persist({ analytics: true, marketing: true }, true), [persist]);
  const rejectAll = useCallback(() => persist({ analytics: false, marketing: false }), [persist]);
  const savePreferences = useCallback((c: CookieChoices) => persist(c), [persist]);

  return { stored, needsChoice, acceptAll, rejectAll, savePreferences };
};

export const openCookiePreferences = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_PREFERENCES_EVENT));
};
