/**
 * Saisie d'une heure au format HH:MM sur 24 h — logique pure.
 *
 * Pourquoi pas `<input type="time">` : le champ natif suit la langue du
 * navigateur / du système (AM/PM sur un appareil réglé en anglais) et rien ne
 * permet de le forcer en 24 h. L'admin affiche et saisit toujours HH:MM.
 */

const pad2 = (n: number): string => String(n).padStart(2, "0");

/**
 * Mise en forme au fil de la frappe (clavier numérique, pas besoin du « : ») :
 *   "0" → "0", "07" → "07", "073" → "07:3", "0730" → "07:30"
 *   "7" → "7", "73" → "7:3", "730" → "7:30"  (un seul chiffre d'heure si > 2
 *   ou si les deux premiers dépassent 23)
 * Une saisie qui contient déjà un séparateur (":" "h" ".") est respectée.
 */
export const formaterSaisieHeure = (brut: string): string => {
  const avecSep = /^\s*(\d{1,2})\s*[:hH.]\s*(\d{0,2})/.exec(brut);
  if (avecSep) return `${avecSep[1]}:${avecSep[2]}`;
  const d = brut.replace(/\D/g, "").slice(0, 4);
  if (d.length <= 1) return d;
  const heureSurUnChiffre = Number(d[0]) > 2 || Number(d.slice(0, 2)) > 23;
  if (heureSurUnChiffre) return d.length === 1 ? d : `${d[0]}:${d.slice(1, 3)}`;
  if (d.length === 2) return d;
  return `${d.slice(0, 2)}:${d.slice(2)}`;
};

/**
 * Normalisation à la sortie du champ : renvoie "HH:MM" ou "" si la saisie
 * n'est pas une heure valide.
 *   "7" → "07:00", "7:3" → "07:30", "730" → "07:30", "16h" → "16:00",
 *   "24:00" → "", "12:75" → ""
 */
export const normaliserSaisieHeure = (brut: string): string => {
  const t = brut.trim();
  if (!t) return "";
  let h: number;
  let m: number;
  const avecSep = /^(\d{1,2})\s*[:hH.]\s*(\d{0,2})$/.exec(t);
  if (avecSep) {
    h = Number(avecSep[1]);
    const min = avecSep[2];
    m = min === "" ? 0 : min.length === 1 ? Number(min) * 10 : Number(min);
  } else {
    if (!/^\d{1,4}$/.test(t)) return "";
    if (t.length <= 2) {
      h = Number(t);
      m = 0;
    } else if (t.length === 3) {
      h = Number(t[0]);
      m = Number(t.slice(1));
    } else {
      h = Number(t.slice(0, 2));
      m = Number(t.slice(2));
    }
  }
  if (h > 23 || m > 59) return "";
  return `${pad2(h)}:${pad2(m)}`;
};

/** Vrai si la chaîne est exactement une heure HH:MM valide sur 24 h. */
export const estHeureValide = (s: string | null | undefined): boolean =>
  /^([01]\d|2[0-3]):[0-5]\d$/.test(s ?? "");
