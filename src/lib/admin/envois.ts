/**
 * Envois de messages (SMS / WhatsApp / Email) — logique pure, sans réseau.
 *
 * Règles du brief admin 2026-11-04 :
 *  - l'email est un bonus : on ne l'utilise que s'il est réel (`hasUsableEmail`) ;
 *  - taper SMS / WhatsApp / Email trace l'envoi d'une ligne horodatée dans
 *    `leads.notes_internes` (`formatTraceEnvoi` + `ajouterTrace`).
 *
 * La partie Supabase (`traceEnvoi`) vit dans queries.ts ; ici tout est testable.
 */

export type CanalEnvoi = "SMS" | "WhatsApp" | "Email";

/**
 * Email « utilisable » : réel, pas vide, pas « Non fourni », pas le placeholder
 * local généré par l'ancien RDV rapide. Source unique : les anciens leads
 * gardent leurs placeholders en base tant que la migration de nettoyage n'a
 * pas tourné, et `null` est désormais la valeur normale d'un lead sans email.
 */
export const hasUsableEmail = (email: string | null | undefined): boolean => {
  if (!email) return false;
  const e = email.trim().toLowerCase();
  if (!e.includes("@")) return false;
  if (e === "non fourni") return false;
  if (e.endsWith("@local.cuivre-electrique.com")) return false;
  return true;
};

const pad2 = (n: number): string => String(n).padStart(2, "0");

/** `04/11/2026 16:30 — WhatsApp : Confirmation RDV` */
export const formatTraceEnvoi = (canal: CanalEnvoi, titre: string, quand: Date = new Date()): string =>
  `${pad2(quand.getDate())}/${pad2(quand.getMonth() + 1)}/${quand.getFullYear()} ${pad2(quand.getHours())}:${pad2(quand.getMinutes())} — ${canal} : ${titre.trim()}`;

/** Ajoute une ligne en fin de notes (une ligne par envoi, jamais de doublon de saut de ligne). */
export const ajouterTrace = (notes: string | null | undefined, ligne: string): string => {
  const base = (notes ?? "").trimEnd();
  return base ? `${base}\n${ligne}` : ligne;
};
