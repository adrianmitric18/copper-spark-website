/**
 * Templates de messages pro pour les workflows admin :
 *   - Confirmations de RDV (7 types × 3 supports)
 *   - Relances devis J+3 / J+7 / J+14 (× 3 supports)
 *
 * Pour chaque support :
 *   - SMS  : court (≤ ~160 chars idéalement), branding minimal, percutant
 *   - WhatsApp : moyen, emojis, *gras markdown*, sections "Au programme"
 *                / "À prévoir", signature avec site
 *   - Email : HTML stylé inline (compat Gmail/Outlook), signature pro avec
 *            mention BE 0805 376 944 et lien vers la page service du site
 *
 * Toute la copie éditoriale est centralisée dans TYPE_CONFIGS pour qu'Adrian
 * puisse ajuster un seul endroit et que les 3 supports restent alignés.
 */

import type { TypeVisite } from "./rdv-rapide";

// ---------------------------------------------------------------------------
// Constantes branding
// ---------------------------------------------------------------------------

export const COMPANY = {
  name: "Le Cuivre Électrique",
  owner: "Adrian Mitric",
  ownerFirstName: "Adrian",
  tel: "0485 75 52 27",
  telE164: "+32485755227",
  email: "cuivre.electrique@gmail.com",
  site: "cuivre-electrique.com",
  siteUrl: "https://cuivre-electrique.com",
  vat: "BE 0805 376 944",
  brandColor: "#E85D04",
  darkColor: "#1F1F1F",
  creamColor: "#F5F0E8",
} as const;

// ---------------------------------------------------------------------------
// Configs éditoriales par type de RDV
// ---------------------------------------------------------------------------

interface TypeConfig {
  /** Variant court pour SMS et titres ("Devis", "Inspection RGIE"…). */
  shortLabel: string;
  /** Variant introductif pour phrases ("votre rendez-vous devis"…). */
  introLabel: string;
  /** Tagline punchy pour l'objet email et le titre WhatsApp. */
  emailSubject: string;
  /** Bullets "Au programme" (max 4-5, concrets, vérifiés terrain). */
  programme: string[];
  /** Bullets "À prévoir de votre côté" (max 3, opérationnels). */
  prerequis: string[];
  /** Path vers la page service du site (sans le domaine). */
  servicePath: string;
  /** Phrase d'introduction de la confirmation. */
  introLine: string;
}

const TYPE_CONFIGS: Record<TypeVisite, TypeConfig> = {
  Devis: {
    shortLabel: "RDV devis",
    introLabel: "notre rendez-vous devis",
    emailSubject: "Confirmation RDV devis",
    introLine: "Je vous confirme notre rendez-vous pour l'établissement de votre devis.",
    programme: [
      "Visite des lieux et écoute de votre besoin",
      "Prise de mesures et photos techniques",
      "Conseils sur les options possibles et leur impact budget",
      "Devis détaillé envoyé sous 48 à 72 h ouvrées",
    ],
    prerequis: [
      "Plans ou photos du projet si vous en avez (utile, pas obligatoire)",
      "Accès aux pièces concernées par les travaux",
    ],
    servicePath: "/services",
  },

  "Visite technique": {
    shortLabel: "Visite technique",
    introLabel: "votre visite technique",
    emailSubject: "Confirmation visite technique",
    introLine: "Je vous confirme notre visite technique sur place.",
    programme: [
      "Analyse de l'installation électrique existante",
      "Identification des points d'amélioration et risques éventuels",
      "Recommandations concrètes adaptées à votre logement",
      "Échange sur les prochaines étapes possibles",
    ],
    prerequis: [
      "Accès libre au tableau électrique principal",
      "Plans ou schémas si vous en disposez",
    ],
    servicePath: "/services/installation-electrique-renovation",
  },

  Dépannage: {
    shortLabel: "Dépannage",
    introLabel: "notre intervention de dépannage",
    emailSubject: "Confirmation intervention dépannage",
    introLine: "Je vous confirme notre intervention de dépannage.",
    programme: [
      "Diagnostic complet de la panne",
      "Réparation immédiate si la pièce est sur le camion",
      "Test fonctionnel et remise en service",
      "Devis si des travaux complémentaires sont nécessaires",
    ],
    prerequis: [
      "Description de la panne (par SMS si possible avant le RDV)",
      "Accès au tableau électrique et à la zone concernée",
    ],
    servicePath: "/services/depannage-urgent",
  },

  "Inspection RGIE": {
    shortLabel: "Inspection RGIE",
    introLabel: "votre inspection RGIE",
    emailSubject: "Confirmation inspection RGIE",
    introLine: "Je vous confirme notre rendez-vous pour l'inspection RGIE de votre installation.",
    programme: [
      "Contrôle complet de la conformité au Règlement Général sur les Installations Électriques",
      "Mesures d'isolement, de continuité et de mise à la terre",
      "Vérification du tableau, des disjoncteurs différentiels et de la sélectivité",
      "Rapport de conformité remis en fin de visite",
    ],
    prerequis: [
      "Plans de l'installation (en cas de rénovation récente)",
      "Procès-verbal d'inspection précédent si vous en avez un",
      "Accès libre et dégagé au tableau électrique",
    ],
    servicePath: "/services/mise-en-conformite-rgie",
  },

  "Installation borne de recharge": {
    shortLabel: "Pose borne",
    introLabel: "l'installation de votre borne de recharge",
    emailSubject: "Confirmation installation borne de recharge",
    introLine: "Je vous confirme l'installation de votre borne de recharge pour véhicule électrique.",
    programme: [
      "Pose de la borne (Hager Witty Pro recommandée)",
      "Création d'un sous-tableau dédié, conforme RGIE",
      "Mise en service, tests de charge et vérification du courant de fuite",
      "Configuration du badge ou de l'application mobile selon votre véhicule",
    ],
    prerequis: [
      "Accès libre au tableau électrique",
      "Place de stationnement dégagée pendant l'intervention",
      "Modèle exact de votre véhicule (type de connecteur)",
    ],
    servicePath: "/services/bornes-de-recharge",
  },

  "Installation panneaux photovoltaïques": {
    shortLabel: "Panneaux PV",
    introLabel: "l'installation de vos panneaux photovoltaïques",
    emailSubject: "Confirmation installation panneaux photovoltaïques",
    introLine: "Je vous confirme notre intervention pour vos panneaux photovoltaïques.",
    programme: [
      "Étude de faisabilité technique sur place",
      "Repérage des points de fixation et passages de câbles",
      "Plan d'installation et dimensionnement de l'onduleur",
      "Validation du planning des travaux avec vous",
    ],
    prerequis: [
      "Accès aux combles ou à la toiture si possible",
      "Dernière facture d'électricité pour estimer la consommation",
      "Plans de l'installation électrique existante",
    ],
    servicePath: "/services/panneaux-photovoltaiques",
  },

  Autre: {
    shortLabel: "RDV",
    introLabel: "notre rendez-vous",
    emailSubject: "Confirmation RDV",
    introLine: "Je vous confirme notre rendez-vous.",
    programme: ["Échange sur place selon votre demande"],
    prerequis: ["Accès aux pièces ou installations concernées"],
    servicePath: "/services",
  },
};

// ---------------------------------------------------------------------------
// Payloads
// ---------------------------------------------------------------------------

export interface ConfirmationRdvPayload {
  clientName: string;
  /** YYYY-MM-DD */
  dateIso: string;
  /** HH:MM */
  heure: string;
  typeVisite: TypeVisite;
  dureeMinutes: number;
  /** Adresse complète si saisie. */
  address?: string;
}

export interface RelanceDevisPayload {
  clientName: string;
  /** Date d'envoi du devis, YYYY-MM-DD. */
  devisEnvoyeAt: string;
  /** Montant optionnel formaté en clair (ex: "1 250 €"). */
  montant?: string;
}

// ---------------------------------------------------------------------------
// Helpers de formatage
// ---------------------------------------------------------------------------

function formatDateLong(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("fr-BE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateShort(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

function formatDureeShort(minutes: number): string {
  if (minutes < 60) return `~${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return h === 1 ? "~1 h" : `~${h} h`;
  return `~${h}h${String(m).padStart(2, "0")}`;
}

function formatDureeLong(minutes: number): string {
  if (minutes < 60) return `${minutes} minutes`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return h === 1 ? "1 heure" : `${h} heures`;
  return `${h}h${String(m).padStart(2, "0")}`;
}

/** Tronque une adresse longue pour SMS en retirant le code postal. */
function shortenAddress(address: string): string {
  return address.replace(/,\s*\d{4}\s*/, ", ").trim();
}

// ---------------------------------------------------------------------------
// SMS — Confirmations
// ---------------------------------------------------------------------------

export function smsTemplateConfirmation(payload: ConfirmationRdvPayload): string {
  const config = TYPE_CONFIGS[payload.typeVisite];
  const lines = [
    `🔌 ${COMPANY.name}`,
    `Bonjour ${payload.clientName},`,
    `${capitalize(config.introLabel)} :`,
    `📅 ${formatDateShort(payload.dateIso)} à ${payload.heure}`,
  ];
  if (payload.address) {
    lines.push(`📍 ${shortenAddress(payload.address)}`);
  }
  lines.push(`⏱️ ${formatDureeShort(payload.dureeMinutes)}`);
  lines.push("À bientôt,");
  lines.push(`${COMPANY.ownerFirstName} - ${COMPANY.tel}`);
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// WhatsApp — Confirmations
// ---------------------------------------------------------------------------

export function whatsappTemplateConfirmation(payload: ConfirmationRdvPayload): string {
  const config = TYPE_CONFIGS[payload.typeVisite];
  const dateFr = formatDateLong(payload.dateIso);

  const programme = config.programme.map((p) => `✓ ${p}`).join("\n");
  const prerequis = config.prerequis.map((p) => `• ${p}`).join("\n");

  const adresseBlock = payload.address ? `\n📍 *${payload.address}*` : "";

  return [
    `⚡ *${COMPANY.name}*`,
    "",
    `Bonjour ${payload.clientName} 👋`,
    "",
    config.introLine,
    "",
    `📅 *${dateFr}*`,
    `🕐 *${payload.heure}*${adresseBlock}`,
    `⏱️ *Durée estimée : ${formatDureeLong(payload.dureeMinutes)}*`,
    "",
    `🔧 *Au programme :*`,
    programme,
    "",
    `📋 *À prévoir :*`,
    prerequis,
    "",
    "Je vous appelle 30 minutes avant mon arrivée pour vous prévenir.",
    "",
    `À bientôt,`,
    `${COMPANY.owner}`,
    `🌐 ${COMPANY.site}`,
    `📱 ${COMPANY.tel}`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Email plaintext (mailto:body) — Confirmations
// ---------------------------------------------------------------------------

export function emailPlaintextConfirmation(payload: ConfirmationRdvPayload): string {
  const config = TYPE_CONFIGS[payload.typeVisite];
  const dateFr = formatDateLong(payload.dateIso);
  const lines = [
    `Bonjour ${payload.clientName},`,
    "",
    config.introLine,
    "",
    "INFORMATIONS PRATIQUES",
    `Date    : ${dateFr}`,
    `Heure   : ${payload.heure}`,
  ];
  if (payload.address) lines.push(`Lieu    : ${payload.address}`);
  lines.push(`Durée   : environ ${formatDureeLong(payload.dureeMinutes)}`);
  lines.push("");
  lines.push("AU PROGRAMME");
  config.programme.forEach((p) => lines.push(`- ${p}`));
  lines.push("");
  lines.push("À PRÉVOIR DE VOTRE CÔTÉ");
  config.prerequis.forEach((p) => lines.push(`- ${p}`));
  lines.push("");
  lines.push("Je vous rappelle 30 minutes avant mon arrivée pour confirmer.");
  lines.push("");
  lines.push("En savoir plus sur ce service :");
  lines.push(`${COMPANY.siteUrl}${config.servicePath}`);
  lines.push("");
  lines.push("Bien cordialement,");
  lines.push(`${COMPANY.owner}`);
  lines.push(`${COMPANY.name}`);
  lines.push(`${COMPANY.tel} · ${COMPANY.email}`);
  lines.push(`${COMPANY.siteUrl}`);
  lines.push(`${COMPANY.vat} · Électricien agréé`);
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Email HTML (à coller dans Gmail/Outlook ou à envoyer via Resend en V2)
// ---------------------------------------------------------------------------

export function emailHtmlConfirmation(payload: ConfirmationRdvPayload): string {
  const config = TYPE_CONFIGS[payload.typeVisite];
  const dateFr = formatDateLong(payload.dateIso);

  const programmeHtml = config.programme
    .map((p) => `<li style="margin-bottom: 6px;">${escapeHtml(p)}</li>`)
    .join("\n");

  const prerequisHtml = config.prerequis
    .map((p) => `<li style="margin-bottom: 6px;">${escapeHtml(p)}</li>`)
    .join("\n");

  const adresseRow = payload.address
    ? `<tr><td style="padding: 6px 0; color: #888; font-size: 13px;">📍 Lieu</td><td style="padding: 6px 0; font-weight: 600;">${escapeHtml(payload.address)}</td></tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(config.emailSubject)}</title>
</head>
<body style="margin: 0; padding: 0; background: #f4f4f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff;">

    <div style="background: ${COMPANY.darkColor}; padding: 32px 24px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px; color: ${COMPANY.brandColor}; letter-spacing: -0.5px;">⚡ ${escapeHtml(COMPANY.name)}</h1>
      <p style="margin: 8px 0 0; color: #ccc; font-size: 13px;">Électricien agréé · Brabant wallon · Bruxelles · Wallonie</p>
    </div>

    <div style="padding: 32px 24px; color: #1a1a1a; line-height: 1.6;">
      <p style="margin: 0 0 16px; font-size: 16px;">Bonjour <strong>${escapeHtml(payload.clientName)}</strong>,</p>
      <p style="margin: 0 0 24px; font-size: 15px;">${escapeHtml(config.introLine)}</p>

      <table style="width: 100%; border-collapse: collapse; border-top: 2px solid ${COMPANY.brandColor}; border-bottom: 2px solid ${COMPANY.brandColor}; margin: 24px 0;">
        <tr><td style="padding: 6px 0; color: #888; font-size: 13px; width: 90px;">📅 Date</td><td style="padding: 6px 0; font-weight: 600;">${escapeHtml(dateFr)}</td></tr>
        <tr><td style="padding: 6px 0; color: #888; font-size: 13px;">🕐 Heure</td><td style="padding: 6px 0; font-weight: 600;">${escapeHtml(payload.heure)}</td></tr>
        ${adresseRow}
        <tr><td style="padding: 6px 0; color: #888; font-size: 13px;">⏱️ Durée</td><td style="padding: 6px 0; font-weight: 600;">environ ${escapeHtml(formatDureeLong(payload.dureeMinutes))}</td></tr>
      </table>

      <h3 style="margin: 32px 0 12px; color: ${COMPANY.brandColor}; font-size: 16px; text-transform: uppercase; letter-spacing: 1px;">Au programme</h3>
      <ul style="margin: 0 0 24px; padding-left: 20px;">
        ${programmeHtml}
      </ul>

      <h3 style="margin: 24px 0 12px; color: ${COMPANY.brandColor}; font-size: 16px; text-transform: uppercase; letter-spacing: 1px;">À prévoir de votre côté</h3>
      <ul style="margin: 0 0 24px; padding-left: 20px;">
        ${prerequisHtml}
      </ul>

      <p style="margin: 24px 0 16px; font-size: 14px; color: #555; font-style: italic;">Je vous rappelle 30 minutes avant mon arrivée pour confirmer.</p>

      <p style="margin: 24px 0 0; font-size: 14px;">En savoir plus sur ce service : <a href="${COMPANY.siteUrl}${config.servicePath}" style="color: ${COMPANY.brandColor}; text-decoration: none; font-weight: 600;">${COMPANY.siteUrl}${config.servicePath}</a></p>
    </div>

    <div style="background: ${COMPANY.creamColor}; padding: 24px; border-top: 1px solid #e5e5e5;">
      <p style="margin: 0 0 8px; font-size: 14px;"><strong style="color: ${COMPANY.darkColor};">${escapeHtml(COMPANY.owner)}</strong></p>
      <p style="margin: 0 0 12px; font-size: 13px; color: #555;">${escapeHtml(COMPANY.name)} – Électricien agréé</p>
      <p style="margin: 0; font-size: 13px; color: #555; line-height: 1.8;">
        📱 <a href="tel:${COMPANY.telE164}" style="color: ${COMPANY.darkColor}; text-decoration: none;">${COMPANY.tel}</a><br>
        ✉️ <a href="mailto:${COMPANY.email}" style="color: ${COMPANY.darkColor}; text-decoration: none;">${COMPANY.email}</a><br>
        🌐 <a href="${COMPANY.siteUrl}" style="color: ${COMPANY.darkColor}; text-decoration: none;">${COMPANY.site}</a>
      </p>
      <p style="margin: 12px 0 0; font-size: 11px; color: #888;">${escapeHtml(COMPANY.vat)} · Court-Saint-Étienne, Belgique</p>
    </div>
  </div>
</body>
</html>`;
}

export function emailSubjectConfirmation(payload: ConfirmationRdvPayload): string {
  const config = TYPE_CONFIGS[payload.typeVisite];
  return `${config.emailSubject} — ${formatDateShort(payload.dateIso)} à ${payload.heure}`;
}

// ---------------------------------------------------------------------------
// SMS — Relances devis (J+3, J+7, J+14)
// ---------------------------------------------------------------------------

export function smsTemplateRelance1(payload: RelanceDevisPayload): string {
  const dateFr = formatDateShort(payload.devisEnvoyeAt);
  const montantPart = payload.montant ? ` (${payload.montant})` : "";
  return [
    `🔌 ${COMPANY.name}`,
    `Bonjour ${payload.clientName},`,
    `Avez-vous eu l'occasion de regarder le devis${montantPart} envoyé le ${dateFr} ?`,
    `Je reste à votre disposition pour toute précision.`,
    `${COMPANY.ownerFirstName} - ${COMPANY.tel}`,
  ].join("\n");
}

export function smsTemplateRelance2(payload: RelanceDevisPayload): string {
  const dateFr = formatDateShort(payload.devisEnvoyeAt);
  return [
    `🔌 ${COMPANY.name}`,
    `Bonjour ${payload.clientName},`,
    `Je reviens vers vous concernant le devis du ${dateFr}.`,
    `Si certains points sont à ajuster, un coup de fil suffit.`,
    `${COMPANY.ownerFirstName} - ${COMPANY.tel}`,
  ].join("\n");
}

export function smsTemplateRelance3(payload: RelanceDevisPayload): string {
  const dateFr = formatDateShort(payload.devisEnvoyeAt);
  return [
    `🔌 ${COMPANY.name}`,
    `Bonjour ${payload.clientName},`,
    `Devis envoyé le ${dateFr} resté sans suite.`,
    `Pourriez-vous me confirmer si le projet vous intéresse toujours ? Merci.`,
    `${COMPANY.ownerFirstName} - ${COMPANY.tel}`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// WhatsApp — Relances devis
// ---------------------------------------------------------------------------

export function whatsappTemplateRelance1(payload: RelanceDevisPayload): string {
  const dateFr = formatDateLong(payload.devisEnvoyeAt);
  const montantBlock = payload.montant ? `\nMontant : *${payload.montant}*\n` : "";
  return [
    `⚡ *${COMPANY.name}*`,
    "",
    `Bonjour ${payload.clientName},`,
    "",
    `J'espère que vous allez bien.`,
    `Avez-vous eu l'occasion de regarder le devis envoyé le *${dateFr}* ?${montantBlock}`,
    `Je reste à votre disposition pour préciser ou ajuster un point — un message ou un coup de fil suffit.`,
    "",
    `Bien cordialement,`,
    `${COMPANY.owner}`,
    `📱 ${COMPANY.tel}`,
    `🌐 ${COMPANY.site}`,
  ].join("\n");
}

export function whatsappTemplateRelance2(payload: RelanceDevisPayload): string {
  const dateFr = formatDateLong(payload.devisEnvoyeAt);
  return [
    `⚡ *${COMPANY.name}*`,
    "",
    `Bonjour ${payload.clientName},`,
    "",
    `Je reviens vers vous concernant le devis envoyé le *${dateFr}*.`,
    "",
    `S'il y a des points à préciser ou à ajuster (matériel, planning, budget), je peux retravailler la proposition rapidement.`,
    "",
    `${COMPANY.owner}`,
    `📱 ${COMPANY.tel}`,
  ].join("\n");
}

export function whatsappTemplateRelance3(payload: RelanceDevisPayload): string {
  const dateFr = formatDateLong(payload.devisEnvoyeAt);
  return [
    `⚡ *${COMPANY.name}*`,
    "",
    `Bonjour ${payload.clientName},`,
    "",
    `Le devis envoyé le *${dateFr}* est resté sans réponse de votre côté.`,
    "",
    `Avant de clôturer le dossier, pourriez-vous me dire si le projet vous intéresse toujours, ou si vous avez choisi une autre piste ?`,
    "",
    `Merci d'avance pour votre retour,`,
    `${COMPANY.owner}`,
    `📱 ${COMPANY.tel}`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Email plaintext — Relances
// ---------------------------------------------------------------------------

export function emailPlaintextRelance1(payload: RelanceDevisPayload): string {
  const dateFr = formatDateLong(payload.devisEnvoyeAt);
  const montantPart = payload.montant ? ` (${payload.montant})` : "";
  return [
    `Bonjour ${payload.clientName},`,
    "",
    `J'espère que vous allez bien.`,
    `Avez-vous eu l'occasion de regarder le devis${montantPart} que je vous ai envoyé le ${dateFr} ?`,
    "",
    `Je reste à votre disposition pour toute précision ou pour ajuster certains points si nécessaire — n'hésitez pas à me répondre directement à ce mail ou à m'appeler.`,
    "",
    `Bien cordialement,`,
    `${COMPANY.owner}`,
    `${COMPANY.name}`,
    `${COMPANY.tel} · ${COMPANY.email}`,
    `${COMPANY.siteUrl}`,
  ].join("\n");
}

export function emailPlaintextRelance2(payload: RelanceDevisPayload): string {
  const dateFr = formatDateLong(payload.devisEnvoyeAt);
  return [
    `Bonjour ${payload.clientName},`,
    "",
    `Je reviens vers vous concernant le devis envoyé le ${dateFr}.`,
    "",
    `Si certains points doivent être précisés ou ajustés (matériel, planning, budget), je peux retravailler rapidement la proposition.`,
    `Un simple retour suffit pour qu'on en discute.`,
    "",
    `Bien cordialement,`,
    `${COMPANY.owner}`,
    `${COMPANY.name}`,
    `${COMPANY.tel} · ${COMPANY.email}`,
  ].join("\n");
}

export function emailPlaintextRelance3(payload: RelanceDevisPayload): string {
  const dateFr = formatDateLong(payload.devisEnvoyeAt);
  return [
    `Bonjour ${payload.clientName},`,
    "",
    `Le devis envoyé le ${dateFr} est resté sans réponse de votre part.`,
    "",
    `Avant de clôturer le dossier, pourriez-vous me dire si le projet vous intéresse toujours, ou si vous avez retenu une autre solution ?`,
    "",
    `Merci d'avance pour votre retour, même bref.`,
    "",
    `Bien cordialement,`,
    `${COMPANY.owner}`,
    `${COMPANY.name}`,
    `${COMPANY.tel} · ${COMPANY.email}`,
  ].join("\n");
}

export function emailSubjectRelance(palier: 1 | 2 | 3): string {
  const map = {
    1: "Suivi de votre devis",
    2: "Devis — points à préciser ?",
    3: "Devis — votre projet est-il toujours d'actualité ?",
  } as const;
  return map[palier];
}

// ---------------------------------------------------------------------------
// Liens deep links (sms: / wa.me / mailto:)
// ---------------------------------------------------------------------------

export function buildSmsHref(phone: string, message: string): string {
  const cleanPhone = phone.replace(/[\s.\-()]/g, "");
  return `sms:${cleanPhone}?body=${encodeURIComponent(message)}`;
}

/**
 * Le numéro doit être au format international SANS le "+" pour wa.me
 * (ex: 32485755227). On normalise les numéros belges qui commencent
 * par "0" en préfixant 32.
 */
export function buildWhatsappHref(phone: string, message: string): string {
  let clean = phone.replace(/[\s.\-()]/g, "");
  if (clean.startsWith("00")) clean = clean.slice(2);
  else if (clean.startsWith("+")) clean = clean.slice(1);
  else if (clean.startsWith("0")) clean = "32" + clean.slice(1);
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

export function buildMailtoHref(
  email: string | undefined,
  subject: string,
  body: string,
): string {
  const params = new URLSearchParams({ subject, body });
  return email && email.length > 0
    ? `mailto:${email}?${params.toString()}`
    : `mailto:?${params.toString()}`;
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
