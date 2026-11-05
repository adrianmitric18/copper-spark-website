// Thème de l'admin (le site public reste toujours clair).
// Persisté dans localStorage ; défaut = sombre (Adrian travaille tard).
//
// Un seul état partagé par tout l'admin (store module + useSyncExternalStore).
// Avant, chaque composant qui appelait le hook avait son propre état et retirait
// la classe `dark` en se démontant : fermer le tiroir « Plus » repassait la page
// en clair, et l'écran de connexion n'était jamais sombre.

import { useLayoutEffect, useSyncExternalStore } from "react";

const STORAGE_KEY = "ce_admin_theme";

type Theme = "dark" | "light";

const lireStockage = (): Theme => {
  if (typeof window === "undefined") return "dark";
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // stockage indisponible (navigation privée) → défaut
  }
  return "dark"; // défaut sombre, parti pris pour /admin
};

let theme: Theme = lireStockage();
let montages = 0;
const abonnes = new Set<() => void>();

// `admin` : portée des jetons de contraste réservés à l'admin (index.css).
// `dark`  : thème sombre. Aucune des deux classes n'existe sur le site public.
const appliquer = () => {
  if (typeof document === "undefined") return;
  document.documentElement.classList.add("admin");
  document.documentElement.classList.toggle("dark", theme === "dark");
};

const sAbonner = (cb: () => void) => {
  abonnes.add(cb);
  return () => abonnes.delete(cb);
};

const lire = (): Theme => theme;

const basculer = () => {
  theme = theme === "dark" ? "light" : "dark";
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // non bloquant
  }
  appliquer();
  abonnes.forEach((cb) => cb());
};

/**
 * À appeler dans tout écran de l'admin (AdminShell, connexion, chargement).
 * Applique le thème tant qu'au moins un écran admin est monté ; le retire
 * seulement quand on quitte réellement /admin pour le site public.
 */
export const useDarkMode = () => {
  const courant = useSyncExternalStore(sAbonner, lire, lire);

  useLayoutEffect(() => {
    montages += 1;
    appliquer();
    return () => {
      montages -= 1;
      // Différé : entre deux écrans admin (changement de route, chargement
      // d'un morceau de code) on ne veut pas d'éclair blanc.
      const retirer = () => document.documentElement.classList.remove("dark", "admin");
      window.setTimeout(() => {
        if (montages === 0 && !window.location.pathname.startsWith("/admin")) retirer();
      }, 0);
      // Filet : une page non-admin servie sous une URL /admin (adresse
      // inconnue → page introuvable du site public) ne monte aucun écran
      // admin. Passé le temps de charger un écran, on rend la main au site.
      window.setTimeout(() => {
        if (montages === 0) retirer();
      }, 4000);
    };
  }, []);

  return { theme: courant, toggle: basculer, isDark: courant === "dark" };
};
