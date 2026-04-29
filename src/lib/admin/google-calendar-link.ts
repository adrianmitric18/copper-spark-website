/**
 * Construit une URL Google Calendar pré-remplie au format "TEMPLATE".
 * L'ouvrir ouvre le formulaire de création d'événement avec tous les champs
 * pré-saisis ; l'utilisateur n'a qu'à confirmer côté Google.
 *
 * Doc Google : https://support.google.com/calendar/thread/27236258
 *
 * Format date/heure attendu : YYYYMMDDTHHmmss en heure locale (sans Z).
 * Google appliquera la timezone du compte du visiteur.
 */

export interface CalendarEventInput {
  title: string;
  /** YYYY-MM-DD */
  date: string;
  /** HH:MM (format 24h) */
  startTime: string;
  durationMinutes: number;
  description?: string;
  location?: string;
}

const pad2 = (n: number): string => String(n).padStart(2, "0");

/**
 * Convertit "2026-05-01" + "14:30" + 60min en
 * "20260501T143000/20260501T153000" (format Google Calendar).
 */
function formatDateRange(date: string, startTime: string, durationMinutes: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const [h, mn] = startTime.split(":").map(Number);

  const start = new Date(y, m - 1, d, h, mn, 0);
  const end = new Date(start.getTime() + durationMinutes * 60_000);

  const fmt = (dt: Date): string =>
    `${dt.getFullYear()}${pad2(dt.getMonth() + 1)}${pad2(dt.getDate())}T${pad2(dt.getHours())}${pad2(dt.getMinutes())}00`;

  return `${fmt(start)}/${fmt(end)}`;
}

export function buildGoogleCalendarUrl(input: CalendarEventInput): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: input.title,
    dates: formatDateRange(input.date, input.startTime, input.durationMinutes),
  });
  if (input.description) params.set("details", input.description);
  if (input.location) params.set("location", input.location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export interface CalendarRangeEventInput {
  title: string;
  /** YYYY-MM-DD */
  dateDebut: string;
  /** HH:MM (format 24h) */
  heureDebut: string;
  /** YYYY-MM-DD (peut être identique à dateDebut pour 1 jour) */
  dateFin: string;
  /** HH:MM (format 24h) */
  heureFin: string;
  description?: string;
  location?: string;
}

/**
 * Variante pour un événement avec début et fin libres (chantier multi-jours).
 * Produit `dates=YYYYMMDDTHHmmss/YYYYMMDDTHHmmss` qui couvre toute la plage
 * en un seul événement Google Calendar.
 */
export function buildGoogleCalendarRangeUrl(input: CalendarRangeEventInput): string {
  const [yd, md, dd] = input.dateDebut.split("-").map(Number);
  const [hd, mnd] = input.heureDebut.split(":").map(Number);
  const [yf, mf, df] = input.dateFin.split("-").map(Number);
  const [hf, mnf] = input.heureFin.split(":").map(Number);

  const fmt = (y: number, m: number, d: number, h: number, mn: number): string =>
    `${y}${pad2(m)}${pad2(d)}T${pad2(h)}${pad2(mn)}00`;

  const dates = `${fmt(yd, md, dd, hd, mnd)}/${fmt(yf, mf, df, hf, mnf)}`;

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: input.title,
    dates,
  });
  if (input.description) params.set("details", input.description);
  if (input.location) params.set("location", input.location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
