/**
 * Templates de SMS pour les workflows admin :
 *   - Confirmation de RDV (selon type)
 *   - 3 paliers de relance devis (J+3, J+7, J+14)
 *
 * Tous les messages sont sobres, courts (< 280 chars en général pour rester
 * dans 1 SMS chez la plupart des opérateurs belges), en français belge
 * professionnel. Adrian peut les ajuster en éditant ce seul fichier.
 *
 * Les fonctions retournent une chaîne brute. Pour générer le lien sms:
 * compatible iOS/Android, passer par buildSmsHref().
 */

const SIGNATURE = "Adrian – Le Cuivre Électrique – 0485 75 52 27";

// ---------------------------------------------------------------------------
// Confirmation RDV
// ---------------------------------------------------------------------------

export interface ConfirmationRdvPayload {
  clientName: string;
  /** YYYY-MM-DD */
  dateIso: string;
  /** HH:MM */
  heure: string;
  typeVisite: string;
  /** Adresse du chantier, optionnelle. */
  address?: string;
}

export function smsTemplateConfirmationRdv(payload: ConfirmationRdvPayload): string {
  const dateFr = formatDateFr(payload.dateIso);
  const adressePart = payload.address ? `\nAdresse : ${payload.address}` : "";
  return [
    `Bonjour ${payload.clientName},`,
    `je vous confirme notre rendez-vous "${payload.typeVisite}" le ${dateFr} à ${payload.heure}.${adressePart}`,
    `À bientôt,`,
    SIGNATURE,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Relances devis — 3 paliers
// ---------------------------------------------------------------------------

export interface RelanceDevisPayload {
  clientName: string;
  /** Date d'envoi du devis, YYYY-MM-DD. */
  devisEnvoyeAt: string;
  /** Montant optionnel, formaté en clair. Ex: "1 250 €". */
  montant?: string;
}

/** Relance 1 (J+3) — chaleureuse, simple rappel. */
export function smsTemplateRelance1(payload: RelanceDevisPayload): string {
  const dateFr = formatDateFr(payload.devisEnvoyeAt);
  const montantPart = payload.montant ? ` (${payload.montant})` : "";
  return [
    `Bonjour ${payload.clientName},`,
    `j'espère que vous allez bien. Avez-vous eu l'occasion de regarder le devis${montantPart} envoyé le ${dateFr} ?`,
    `Je reste à votre disposition pour toute question ou ajustement.`,
    `Bien cordialement,`,
    SIGNATURE,
  ].join("\n");
}

/** Relance 2 (J+7) — un peu plus directe, propose ajustement. */
export function smsTemplateRelance2(payload: RelanceDevisPayload): string {
  const dateFr = formatDateFr(payload.devisEnvoyeAt);
  return [
    `Bonjour ${payload.clientName},`,
    `je reviens vers vous concernant le devis envoyé le ${dateFr}.`,
    `S'il y a des points à préciser ou à ajuster, n'hésitez pas — un coup de fil suffit.`,
    SIGNATURE,
  ].join("\n");
}

/** Relance 3 (J+14) — dernière relance, ferme mais polie. */
export function smsTemplateRelance3(payload: RelanceDevisPayload): string {
  const dateFr = formatDateFr(payload.devisEnvoyeAt);
  return [
    `Bonjour ${payload.clientName},`,
    `je vous ai envoyé un devis le ${dateFr} et je n'ai pas eu de retour.`,
    `Pour clôturer le dossier, pourriez-vous me confirmer si le projet vous intéresse toujours ?`,
    `Merci d'avance,`,
    SIGNATURE,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Construit un href "sms:" qui ouvre l'app SMS native du téléphone avec le
 * message pré-rédigé. Compatible iOS et Android.
 *
 * Important : iOS attend "sms:NUMERO&body=..." OU "sms:NUMERO?body=..."
 * selon les versions. La forme avec ?body= fonctionne sur iOS 14+ et Android.
 */
export function buildSmsHref(phone: string, message: string): string {
  // On nettoie le téléphone (espaces, tirets, points)
  const cleanPhone = phone.replace(/[\s.\-()]/g, "");
  return `sms:${cleanPhone}?body=${encodeURIComponent(message)}`;
}

/** "2026-05-01" -> "vendredi 1 mai 2026" */
function formatDateFr(dateIso: string): string {
  const [y, m, d] = dateIso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("fr-BE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
