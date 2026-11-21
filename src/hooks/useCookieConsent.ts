import { useCallback, useEffect, useState } from "react";
import { arreterMesure, chargerMesure } from "@/lib/analytics/gtag";

/**
 * Clé du stockage local qui retient le choix du visiteur.
 * v2 (2026-11) : le texte du bandeau et les catégories ont changé (plus de
 * publicité, Google chargé seulement après accord) ; un accord donné sous
 * l'ancien bandeau ne vaut pas pour le nouveau, donc on redemande.
 * Ce nom est publié dans la page /cookies : le changer là aussi.
 */
export const CONSENT_KEY = "cookie_consent_v2";
const ANCIENNE_CLE = "cookie_consent_v1";

/** Le choix est retenu 6 mois, puis redemandé. Durée publiée dans /cookies. */
const SIX_MONTHS_MS = 1000 * 60 * 60 * 24 * 30 * 6;
export const OPEN_PREFERENCES_EVENT = "open-cookie-preferences";

export type CookieChoices = {
  /** Mesure d'audience (Google Analytics 4). */
  analytics: boolean;
};

export type StoredConsent = {
  timestamp: string;
  expires: string;
  choices: CookieChoices;
};

/** Choix encore valable, ou `null` s'il n'y en a pas ou s'il a expiré. */
export const readStoredConsent = (): StoredConsent | null => {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
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

/** Charge Google si la mesure est acceptée ; sinon arrête tout et efface ses cookies. */
const appliquer = (choices: CookieChoices) => {
  if (choices.analytics) chargerMesure();
  else arreterMesure();
};

export const useCookieConsent = () => {
  const [stored, setStored] = useState<StoredConsent | null>(null);
  const [needsChoice, setNeedsChoice] = useState(false);

  useEffect(() => {
    try {
      localStorage.removeItem(ANCIENNE_CLE);
    } catch {
      /* stockage indisponible : rien à nettoyer */
    }
    const existing = readStoredConsent();
    if (existing) {
      setStored(existing);
      appliquer(existing.choices);
    } else {
      // Pas de choix (ou choix expiré) : rien n'est chargé, et d'éventuels
      // cookies Google restés d'un accord ancien sont effacés.
      arreterMesure();
      setNeedsChoice(true);
    }
  }, []);

  const persist = useCallback((choices: CookieChoices) => {
    const now = new Date();
    const consent: StoredConsent = {
      timestamp: now.toISOString(),
      expires: new Date(now.getTime() + SIX_MONTHS_MS).toISOString(),
      choices,
    };
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
    } catch {
      /* ignore */
    }
    appliquer(choices);
    setStored(consent);
    setNeedsChoice(false);
  }, []);

  const acceptAll = useCallback(() => persist({ analytics: true }), [persist]);
  const rejectAll = useCallback(() => persist({ analytics: false }), [persist]);
  const savePreferences = useCallback((c: CookieChoices) => persist(c), [persist]);

  return { stored, needsChoice, acceptAll, rejectAll, savePreferences };
};

export const openCookiePreferences = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_PREFERENCES_EVENT));
};
