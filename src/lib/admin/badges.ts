/**
 * Palette des badges de l'admin — SOURCE UNIQUE (lot 2 du brief admin 2026-11).
 *
 * Chaque ton fournit fond + texte + bordure pour le mode clair ET le mode
 * sombre (`dark:`). Règle : texte ≥ 4,5:1 sur son fond dans les deux modes, et
 * des teintes franchement différentes entre elles (orange, violet, bleu, vert,
 * rouge, gris) pour que deux statuts ne se confondent jamais. Vérifié par
 * calcul avec scripts/admin-audit.mjs — ne pas remettre de `text-xxx-600` sur
 * un fond teinté dans une page : ça ne passe ni en clair ni en sombre.
 */
export const TON = {
  orange:
    "bg-orange-100 text-orange-900 border-orange-300 dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/40",
  violet:
    "bg-violet-100 text-violet-900 border-violet-300 dark:bg-violet-500/20 dark:text-violet-300 dark:border-violet-500/40",
  bleu: "bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-500/40",
  vert: "bg-green-100 text-green-900 border-green-300 dark:bg-green-500/20 dark:text-green-300 dark:border-green-500/40",
  rouge: "bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40",
  gris: "bg-zinc-200 text-zinc-800 border-zinc-400 dark:bg-zinc-500/25 dark:text-zinc-200 dark:border-zinc-500/50",
  ambre:
    "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40",
  sarcelle:
    "bg-teal-100 text-teal-900 border-teal-300 dark:bg-teal-500/20 dark:text-teal-300 dark:border-teal-500/40",
} as const;

export type Ton = keyof typeof TON;

/** Texte seul (sans fond de badge) lisible sur les surfaces de l'admin, clair et sombre. */
export const TEXTE_TON = {
  orange: "text-orange-800 dark:text-orange-300",
  vert: "text-green-800 dark:text-green-300",
  rouge: "text-rose-800 dark:text-rose-300",
  bleu: "text-sky-800 dark:text-sky-300",
  ambre: "text-amber-800 dark:text-amber-300",
} as const;
