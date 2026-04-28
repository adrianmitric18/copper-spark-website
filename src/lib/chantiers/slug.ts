/**
 * Génération et validation des slugs SEO pour les chantiers.
 * Le format autorisé côté DB est : ^[a-z0-9]+(-[a-z0-9]+)*$ (3-100 chars).
 */

const MAX_SLUG_LENGTH = 100;
const MIN_SLUG_LENGTH = 3;
const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Convertit un titre libre en slug compatible SEO.
 * Retire accents, met en minuscules, remplace tout caractère non
 * alphanumérique par un tiret, élague les tirets en bord.
 *
 * Exemple : "Bornes Hager — Court-Saint-Étienne"
 *        → "bornes-hager-court-saint-etienne"
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG_LENGTH);
}

/** Vérifie qu'un slug respecte le format imposé par la DB. */
export function isValidSlug(slug: string): boolean {
  return (
    SLUG_REGEX.test(slug) &&
    slug.length >= MIN_SLUG_LENGTH &&
    slug.length <= MAX_SLUG_LENGTH
  );
}

/**
 * Garantit l'unicité d'un slug en suffixant -2, -3, etc. quand il
 * est déjà pris. `taken` = slugs des chantiers actifs (non supprimés).
 */
export function uniqueSlug(base: string, taken: ReadonlySet<string>): string {
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}
