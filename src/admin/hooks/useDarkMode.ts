// Dark mode toggle isolé à /admin (le site public reste en clair).
// Persisté dans localStorage ; default = dark (Adrian travaille tard).

import { useEffect, useState } from "react";

const STORAGE_KEY = "ce_admin_theme";

type Theme = "dark" | "light";

const readInitial = (): Theme => {
  if (typeof window === "undefined") return "dark";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return "dark"; // default sombre, parti pris pour /admin
};

const applyTheme = (theme: Theme) => {
  const root = document.documentElement;
  if (theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
};

export const useDarkMode = () => {
  const [theme, setTheme] = useState<Theme>(readInitial);

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  // Au unmount (ex: l'utilisateur sort de /admin pour aller sur le site
  // public), on retire le mode sombre — le public reste toujours clair.
  useEffect(() => {
    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, []);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return { theme, toggle, isDark: theme === "dark" };
};
