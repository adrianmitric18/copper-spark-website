// Helpers de formatage pour les RDV (dates, heures en français Belgique)

const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const MOIS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Formate une date YYYY-MM-DD en "Mardi 21 avril 2026"
 */
export function formatDateLong(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return cap(`${JOURS[date.getDay()]} ${d} ${MOIS[m - 1]} ${y}`);
}

/**
 * Formate une date YYYY-MM-DD en "demain mardi 21 avril" (sans année)
 * Utilisé pour les rappels J-1.
 */
export function formatDateRappel(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return `demain ${JOURS[date.getDay()]} ${d} ${MOIS[m - 1]}`;
}

/**
 * Formate une heure HH:MM:SS ou HH:MM en "18h00"
 */
export function formatHeure(heureStr: string): string {
  const [h, m] = heureStr.split(":");
  return `${h}h${m}`;
}

/**
 * Formate la durée en minutes en libellé lisible : "30 minutes", "1 heure", "1h30"
 */
export function formatDuree(minutes: number): string {
  if (minutes < 60) return `${minutes} minutes`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return h === 1 ? "1 heure" : `${h} heures`;
  return `${h}h${String(m).padStart(2, "0")}`;
}
