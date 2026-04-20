// Génération du lien "Ajouter à Google Calendar"
// Format ISO 8601 attendu par Google : YYYYMMDDTHHMMSS (heure locale, sans Z)
// On précise le fuseau via le paramètre ?ctz=Europe/Brussels

export interface GCalParams {
  date_rdv: string;        // "YYYY-MM-DD"
  heure_rdv: string;       // "HH:MM" ou "HH:MM:SS"
  duree_minutes: number;
  type_visite: string;
  client_name: string;
  client_phone: string;
  notes_internes?: string | null;
  rue?: string | null;
  numero?: string | null;
  code_postal?: string | null;
  commune?: string | null;
}

function toLocalIso(date: string, heure: string): string {
  // "2026-04-21" + "18:00" -> "20260421T180000"
  const d = date.replace(/-/g, "");
  const h = heure.slice(0, 5).replace(":", "") + "00";
  return `${d}T${h}`;
}

function addMinutesToIso(iso: string, minutes: number): string {
  // iso = "20260421T180000"
  const y = +iso.slice(0, 4);
  const mo = +iso.slice(4, 6) - 1;
  const d = +iso.slice(6, 8);
  const h = +iso.slice(9, 11);
  const mi = +iso.slice(11, 13);
  const date = new Date(y, mo, d, h, mi);
  date.setMinutes(date.getMinutes() + minutes);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `T${pad(date.getHours())}${pad(date.getMinutes())}00`
  );
}

export function buildGoogleCalendarUrl(p: GCalParams): string {
  const start = toLocalIso(p.date_rdv, p.heure_rdv);
  const end = addMinutesToIso(start, p.duree_minutes);

  const location = [p.rue, p.numero, p.code_postal, p.commune]
    .filter(Boolean)
    .join(" ");

  const detailsLines = [
    `Client : ${p.client_name}`,
    `Tél : ${p.client_phone}`,
    `Type : ${p.type_visite}`,
  ];
  if (p.notes_internes?.trim()) {
    detailsLines.push("", `Notes : ${p.notes_internes.trim()}`);
  }

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `RDV ${p.type_visite} - ${p.client_name}`,
    dates: `${start}/${end}`,
    details: detailsLines.join("\n"),
    location,
    ctz: "Europe/Brussels",
  });

  return `https://www.google.com/calendar/render?${params.toString()}`;
}
