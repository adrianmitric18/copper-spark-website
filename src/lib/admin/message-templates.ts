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

import {
  familleDeVisite,
  type TypeVisite,
  type ServiceFamily,
} from "@/lib/rdv/constants";
import type { TypeIntervention } from "./interventions";

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
  /**
   * Phrase complète "votre X est confirmé(e)" pour le SMS court — préformulée
   * par type pour respecter accord de genre et casse des acronymes (RGIE, PV).
   */
  confirmedLabel: string;
  /**
   * Label utilisé dans les templates chantier (confirmation/rectification/
   * annulation), ex : "votre chantier {chantierLabel} est planifié".
   * Préformulé par type pour préserver la casse des acronymes (RGIE) et
   * dérouler les abréviations (PV → photovoltaïques).
   */
  chantierLabel: string;
}

const TYPE_CONFIGS: Record<ServiceFamily, TypeConfig> = {
  Devis: {
    shortLabel: "RDV devis",
    introLabel: "notre rendez-vous devis",
    emailSubject: "Confirmation RDV devis",
    introLine: "Je vous confirme notre rendez-vous pour l'établissement de votre devis.",
    confirmedLabel: "votre RDV pour devis est confirmé",
    chantierLabel: "RDV pour devis",
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
    confirmedLabel: "votre visite technique est confirmée",
    chantierLabel: "visite technique",
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
    confirmedLabel: "votre dépannage est confirmé",
    chantierLabel: "dépannage",
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
    confirmedLabel: "votre inspection RGIE est confirmée",
    chantierLabel: "inspection RGIE",
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
    confirmedLabel: "votre installation de borne de recharge est confirmée",
    chantierLabel: "installation de borne de recharge",
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
    confirmedLabel: "votre installation de panneaux photovoltaïques est confirmée",
    chantierLabel: "installation de panneaux photovoltaïques",
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
    confirmedLabel: "votre rendez-vous est confirmé",
    chantierLabel: "rendez-vous",
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
  typeVisite: TypeVisite | ServiceFamily;
  dureeMinutes: number;
  /** Adresse complète si saisie. */
  address?: string;
  /**
   * Délai d'appel avant arrivée, en minutes. NULL/undefined = on n'affiche
   * pas la phrase "Je vous appelle X min avant".
   */
  delaiAppelMinutes?: number | null;
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

/** Comme formatDateLong mais sans l'année — pour SMS courts. */
function formatDateLongNoYear(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("fr-BE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatDateShort(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

/** Convertit "17:15" en "17h15" (style français) ou "17h" si :00. */
function formatHeureFr(heure: string): string {
  const [h, m] = heure.split(":");
  return m === "00" ? `${h}h` : `${h}h${m}`;
}

/**
 * Formate une durée en minutes en français naturel.
 *   15  → "15 minutes"
 *   60  → "1 heure"
 *   90  → "1 h 30"
 *   120 → "2 heures"
 *   150 → "2 h 30"
 *   240 → "4 heures"
 * Format français avec espaces ("1 h 30", pas "1h30") pour cohérence.
 */
function formatDuree(minutes: number): string {
  if (minutes < 60) return `${minutes} minutes`;
  if (minutes === 60) return "1 heure";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h} heures`;
  return `${h} h ${m}`;
}

/**
 * Phrase "Je vous appelle X avant mon arrivée" si délai défini, sinon "".
 * Le caller décide d'inclure ou non la ligne dans son template.
 */
function phraseAppelDelai(delaiMinutes: number | null | undefined): string {
  if (!delaiMinutes || delaiMinutes <= 0) return "";
  return `Je vous appelle ${formatDuree(delaiMinutes)} avant mon arrivée.`;
}

/** Tronque une adresse longue pour SMS en retirant le code postal. */
function shortenAddress(address: string): string {
  return address.replace(/,\s*\d{4}\s*/, ", ").trim();
}

// ---------------------------------------------------------------------------
// SMS — Confirmations
// ---------------------------------------------------------------------------

export function smsTemplateConfirmation(payload: ConfirmationRdvPayload): string {
  const prenom = payload.clientName.trim().split(/\s+/)[0] || payload.clientName.trim();
  const lines = [
    `Bonjour ${prenom} 👋 C'est ${COMPANY.ownerFirstName}, du Cuivre Électrique — content d'avoir échangé avec vous.`,
    `C'est noté de mon côté :`,
    `🗓️ ${formatDateLongNoYear(payload.dateIso)} à ${formatHeureFr(payload.heure)}`,
  ];
  if (payload.typeVisite) lines.push(`🔧 ${payload.typeVisite}`);
  if (payload.address) lines.push(`📍 ${payload.address}`);
  lines.push(`Si quoi que ce soit change, appelez-moi au ${COMPANY.tel} ou répondez à ce message, on s'arrange.`);
  lines.push(`À très bientôt ! ${COMPANY.ownerFirstName}`);
  return lines.join("\n");
}

/**
 * Confirmation COURTE (SMS + WhatsApp), au choix d'Adrian quand le client a déjà
 * donné date + adresse pendant l'appel : un simple "c'est noté" daté, sans
 * programme ni adresse. Texte identique sur les deux supports.
 */
export function confirmationCourte(payload: ConfirmationRdvPayload): string {
  const prenom = payload.clientName.trim().split(/\s+/)[0] || payload.clientName.trim();
  return `Parfait ${prenom} 👋 Bien reçu, c'est noté de mon côté pour le ${formatDateLongNoYear(payload.dateIso)} à ${formatHeureFr(payload.heure)}. À très bientôt ! ${COMPANY.ownerFirstName} — ${COMPANY.name}`;
}

/**
 * SMS/WhatsApp "bien reçu" neutre — accusé de réception envoyable à n'importe
 * quel lead (appel OU message écrit), sans présumer du canal. Remplace l'ancien
 * smsCarteDeVisite (qui supposait un appel). Trace écrite + promesse de suite.
 */
export function smsBienRecu(clientName: string): string {
  const prenom = clientName.trim().split(/\s+/)[0] || clientName.trim();
  return `Bonjour ${prenom} 👋 Bien reçu, merci ! Je reviens vers vous très vite pour la suite. À bientôt, ${COMPANY.ownerFirstName} — ${COMPANY.name}`;
}

/**
 * T7 — SMS de reprise de contact pour un lead « à rappeler » (sans RDV, en
 * attente). Sert de filet quand Adrian ne peut pas appeler tout de suite :
 * il propose de fixer un créneau et redonne son numéro.
 */
export function smsRappelLead(clientName: string): string {
  const prenom = clientName.trim().split(/\s+/)[0] || clientName.trim();
  return `Bonjour ${prenom} 👋 C'est ${COMPANY.ownerFirstName}, du Cuivre Électrique. Je reviens vers vous au sujet de votre demande — dites-moi quand vous êtes joignable et on cale ça. ${COMPANY.tel}`;
}

// ---------------------------------------------------------------------------
// WhatsApp — Confirmations
// ---------------------------------------------------------------------------

export function whatsappTemplateConfirmation(payload: ConfirmationRdvPayload): string {
  const prenom = payload.clientName.trim().split(/\s+/)[0] || payload.clientName.trim();
  const lines = [
    `Bonjour ${prenom} 👋 C'est ${COMPANY.ownerFirstName}, du Cuivre Électrique — content d'avoir échangé avec vous.`,
    `C'est noté de mon côté :`,
    `🗓️ ${formatDateLongNoYear(payload.dateIso)} à ${formatHeureFr(payload.heure)}`,
  ];
  if (payload.typeVisite) lines.push(`🔧 ${payload.typeVisite}`);
  if (payload.address) lines.push(`📍 ${payload.address}`);
  lines.push(
    `Si quoi que ce soit change, écrivez-moi ici ou appelez le ${COMPANY.tel} : on trouvera un autre créneau sans souci.`,
  );
  lines.push(`À très bientôt ! ${COMPANY.ownerFirstName}`);
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Email plaintext (mailto:body) — Confirmations
// ---------------------------------------------------------------------------

export function emailPlaintextConfirmation(payload: ConfirmationRdvPayload): string {
  const config = TYPE_CONFIGS[familleDeVisite(payload.typeVisite)];
  const dateFr = formatDateLong(payload.dateIso);
  const phraseAppel = phraseAppelDelai(payload.delaiAppelMinutes);

  const lines = [
    `Bonjour ${payload.clientName},`,
    "",
    config.introLine,
    "",
    "INFORMATIONS PRATIQUES",
    `Date    : ${dateFr}`,
    `Heure   : ${formatHeureFr(payload.heure)}`,
  ];
  if (payload.address) lines.push(`Lieu    : ${payload.address}`);
  lines.push(`Durée   : environ ${formatDuree(payload.dureeMinutes)}`);
  lines.push("");
  lines.push("AU PROGRAMME");
  config.programme.forEach((p) => lines.push(`- ${p}`));
  lines.push("");
  lines.push("À PRÉVOIR DE VOTRE CÔTÉ");
  config.prerequis.forEach((p) => lines.push(`- ${p}`));
  lines.push("");
  if (phraseAppel) {
    lines.push(phraseAppel);
    lines.push("");
  }
  lines.push("En savoir plus sur ce service :");
  lines.push(`${COMPANY.siteUrl}${config.servicePath}`);
  lines.push("");
  lines.push("Bien cordialement,");
  lines.push(COMPANY.ownerFirstName);
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Email HTML (à coller dans Gmail/Outlook ou à envoyer via Resend en V2)
// ---------------------------------------------------------------------------

export function emailHtmlConfirmation(payload: ConfirmationRdvPayload): string {
  const config = TYPE_CONFIGS[familleDeVisite(payload.typeVisite)];
  const dateFr = formatDateLong(payload.dateIso);
  const phraseAppel = phraseAppelDelai(payload.delaiAppelMinutes);

  const programmeHtml = config.programme
    .map((p) => `<li style="margin-bottom: 6px;">${escapeHtml(p)}</li>`)
    .join("\n");

  const prerequisHtml = config.prerequis
    .map((p) => `<li style="margin-bottom: 6px;">${escapeHtml(p)}</li>`)
    .join("\n");

  const adresseRow = payload.address
    ? `<tr><td style="padding: 6px 0; color: #888; font-size: 13px;">📍 Lieu</td><td style="padding: 6px 0; font-weight: 600;">${escapeHtml(payload.address)}</td></tr>`
    : "";

  const phraseAppelHtml = phraseAppel
    ? `<p style="margin: 24px 0 16px; font-size: 14px; color: #555; font-style: italic;">${escapeHtml(phraseAppel)}</p>`
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
      <p style="margin: 8px 0 0; color: #ccc; font-size: 13px;">Électricien indépendant · Brabant wallon · Bruxelles · Wallonie</p>
    </div>

    <div style="padding: 32px 24px; color: #1a1a1a; line-height: 1.6;">
      <p style="margin: 0 0 16px; font-size: 16px;">Bonjour <strong>${escapeHtml(payload.clientName)}</strong>,</p>
      <p style="margin: 0 0 24px; font-size: 15px;">${escapeHtml(config.introLine)}</p>

      <table style="width: 100%; border-collapse: collapse; border-top: 2px solid ${COMPANY.brandColor}; border-bottom: 2px solid ${COMPANY.brandColor}; margin: 24px 0;">
        <tr><td style="padding: 6px 0; color: #888; font-size: 13px; width: 90px;">📅 Date</td><td style="padding: 6px 0; font-weight: 600;">${escapeHtml(dateFr)}</td></tr>
        <tr><td style="padding: 6px 0; color: #888; font-size: 13px;">🕐 Heure</td><td style="padding: 6px 0; font-weight: 600;">${escapeHtml(formatHeureFr(payload.heure))}</td></tr>
        ${adresseRow}
        <tr><td style="padding: 6px 0; color: #888; font-size: 13px;">⏱️ Durée</td><td style="padding: 6px 0; font-weight: 600;">environ ${escapeHtml(formatDuree(payload.dureeMinutes))}</td></tr>
      </table>

      <h3 style="margin: 32px 0 12px; color: ${COMPANY.brandColor}; font-size: 16px; text-transform: uppercase; letter-spacing: 1px;">Au programme</h3>
      <ul style="margin: 0 0 24px; padding-left: 20px;">
        ${programmeHtml}
      </ul>

      <h3 style="margin: 24px 0 12px; color: ${COMPANY.brandColor}; font-size: 16px; text-transform: uppercase; letter-spacing: 1px;">À prévoir de votre côté</h3>
      <ul style="margin: 0 0 24px; padding-left: 20px;">
        ${prerequisHtml}
      </ul>

      ${phraseAppelHtml}

      <p style="margin: 24px 0 24px; font-size: 14px;">En savoir plus sur ce service : <a href="${COMPANY.siteUrl}${config.servicePath}" style="color: ${COMPANY.brandColor}; text-decoration: none; font-weight: 600;">${COMPANY.siteUrl}${config.servicePath}</a></p>

      <p style="margin: 32px 0 4px; font-size: 15px;">Bien cordialement,</p>
      <p style="margin: 0; font-size: 15px; font-weight: 600;">${escapeHtml(COMPANY.ownerFirstName)}</p>
    </div>
  </div>
</body>
</html>`;
}

export function emailSubjectConfirmation(payload: ConfirmationRdvPayload): string {
  const config = TYPE_CONFIGS[familleDeVisite(payload.typeVisite)];
  return `${config.emailSubject} — ${formatDateShort(payload.dateIso)} à ${payload.heure}`;
}

// ---------------------------------------------------------------------------
// SMS — Relances devis (J+3, J+7, J+14)
// ---------------------------------------------------------------------------

export function smsTemplateRelance1(payload: RelanceDevisPayload): string {
  const dateFr = formatDateLongNoYear(payload.devisEnvoyeAt);
  const montantPart = payload.montant ? ` (${payload.montant})` : "";
  return [
    `🔌 ${COMPANY.name}`,
    `Bonjour ${payload.clientName}, avez-vous eu le temps de regarder le devis${montantPart} du ${dateFr} ?`,
    `Une question, un ajustement ? Un appel suffit.`,
    `🌐 ${COMPANY.site}`,
    `${COMPANY.owner} - ${COMPANY.tel}`,
  ].join("\n");
}

export function smsTemplateRelance2(payload: RelanceDevisPayload): string {
  const dateFr = formatDateLongNoYear(payload.devisEnvoyeAt);
  return [
    `🔌 ${COMPANY.name}`,
    `Bonjour ${payload.clientName}, je reviens sur le devis du ${dateFr}.`,
    `Toujours intéressé ? Un coup de fil et on cale tout.`,
    `🌐 ${COMPANY.site}`,
    `${COMPANY.owner} - ${COMPANY.tel}`,
  ].join("\n");
}

export function smsTemplateRelance3(payload: RelanceDevisPayload): string {
  const dateFr = formatDateLongNoYear(payload.devisEnvoyeAt);
  return [
    `🔌 ${COMPANY.name}`,
    `Bonjour ${payload.clientName}, dernier message concernant le devis du ${dateFr}.`,
    `Faites-moi signe si le projet est encore d'actualité.`,
    `🌐 ${COMPANY.site}`,
    `${COMPANY.owner} - ${COMPANY.tel}`,
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

// ===========================================================================
// CHANTIERS — Confirmations de chantiers programmés (multi-jours)
// ===========================================================================

export interface ChantierProgrammePayload {
  clientName: string;
  typeIntervention: TypeIntervention;
  /** YYYY-MM-DD */
  dateDebut: string;
  /** YYYY-MM-DD (peut être identique à dateDebut pour 1 jour) */
  dateFin: string;
  /** HH:MM */
  heureDebut: string;
  /** HH:MM */
  heureFin: string;
  /** Adresse complète si saisie. */
  address?: string;
  /** Message libre du client (notes_client de l'intervention). */
  notesClient?: string;
}

// ---------------------------------------------------------------------------
// Helpers de plage de dates
// ---------------------------------------------------------------------------

/** Vrai si dateDebut === dateFin (chantier sur 1 jour). */
function isSameDay(dateDebut: string, dateFin: string): boolean {
  return dateDebut === dateFin;
}

/** Formate la plage en version longue : "lundi 4 mai 2026 → mardi 5 mai 2026". */
function formatPlageLong(dateDebut: string, dateFin: string): string {
  if (isSameDay(dateDebut, dateFin)) return formatDateLong(dateDebut);
  return `${formatDateLong(dateDebut)} → ${formatDateLong(dateFin)}`;
}

/** Plage sans année pour SMS court : "lundi 4 mai → mardi 5 mai". */
function formatPlageLongNoYear(dateDebut: string, dateFin: string): string {
  if (isSameDay(dateDebut, dateFin)) return formatDateLongNoYear(dateDebut);
  return `${formatDateLongNoYear(dateDebut)} → ${formatDateLongNoYear(dateFin)}`;
}

/** Plage compacte pour subject email : "04/05 → 05/05" ou "04/05" si 1 jour. */
function formatPlageShort(dateDebut: string, dateFin: string): string {
  if (isSameDay(dateDebut, dateFin)) return formatDateShort(dateDebut);
  return `${formatDateShort(dateDebut)} → ${formatDateShort(dateFin)}`;
}

/**
 * Horaires journaliers : "8h-17h" si même jour, "8h-17h chaque jour" sinon.
 * Adapté pour les chantiers où l'on travaille la même plage horaire chaque jour.
 */
function formatHorairesJournaliers(
  dateDebut: string,
  dateFin: string,
  heureDebut: string,
  heureFin: string,
): string {
  const plage = `${formatHeureFr(heureDebut)} - ${formatHeureFr(heureFin)}`;
  return isSameDay(dateDebut, dateFin) ? plage : `${plage} chaque jour`;
}

// ---------------------------------------------------------------------------
// SMS — Chantier programmé
// ---------------------------------------------------------------------------

export function smsTemplateChantier(payload: ChantierProgrammePayload): string {
  const config = TYPE_CONFIGS[familleDeVisite(payload.typeIntervention)];
  const lines = [
    `🔌 ${COMPANY.name}`,
    `Bonjour ${payload.clientName}, votre chantier ${config.chantierLabel} est planifié :`,
    `📅 ${formatPlageLongNoYear(payload.dateDebut, payload.dateFin)}`,
    `🕐 ${formatHorairesJournaliers(payload.dateDebut, payload.dateFin, payload.heureDebut, payload.heureFin)}`,
  ];
  if (payload.address) {
    lines.push(`📍 ${shortenAddress(payload.address)}`);
  }
  lines.push("Je vous appelle la veille pour finaliser.");
  lines.push(`🌐 ${COMPANY.site}`);
  lines.push(`${COMPANY.owner} - ${COMPANY.tel}`);
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// WhatsApp — Chantier programmé
// ---------------------------------------------------------------------------

export function whatsappTemplateChantier(payload: ChantierProgrammePayload): string {
  const config = TYPE_CONFIGS[familleDeVisite(payload.typeIntervention)];
  const programme = config.programme.map((p) => `✓ ${p}`).join("\n");
  const prerequis = config.prerequis.map((p) => `• ${p}`).join("\n");
  const adresseBlock = payload.address ? `\n📍 *${payload.address}*` : "";
  const notesBlock = payload.notesClient
    ? `\n📝 *Note :* ${payload.notesClient.trim()}\n`
    : "";

  return [
    `⚡ *${COMPANY.name}*`,
    "",
    `Bonjour ${payload.clientName} 👋`,
    "",
    `Je vous confirme la planification de votre chantier *${config.chantierLabel}*.`,
    "",
    `📅 *${formatPlageLong(payload.dateDebut, payload.dateFin)}*`,
    `🕐 *${formatHorairesJournaliers(payload.dateDebut, payload.dateFin, payload.heureDebut, payload.heureFin)}*${adresseBlock}`,
    "",
    `🔧 *Au programme :*`,
    programme,
    "",
    `📋 *À prévoir avant le chantier :*`,
    prerequis,
    notesBlock,
    "Je vous appelle la veille pour finaliser les derniers détails.",
    "",
    `À bientôt,`,
    `${COMPANY.owner}`,
    `🌐 ${COMPANY.site}`,
    `📱 ${COMPANY.tel}`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Email plaintext — Chantier programmé
// ---------------------------------------------------------------------------

export function emailPlaintextChantier(payload: ChantierProgrammePayload): string {
  const config = TYPE_CONFIGS[familleDeVisite(payload.typeIntervention)];
  const dateRange = formatPlageLong(payload.dateDebut, payload.dateFin);

  const lines = [
    `Bonjour ${payload.clientName},`,
    "",
    `Suite à votre acceptation du devis, je vous confirme la planification de votre chantier ${config.chantierLabel}.`,
    "",
    "INFORMATIONS PRATIQUES",
    `Dates    : ${dateRange}`,
    `Horaires : ${formatHorairesJournaliers(payload.dateDebut, payload.dateFin, payload.heureDebut, payload.heureFin)}`,
  ];
  if (payload.address) lines.push(`Lieu     : ${payload.address}`);
  lines.push("");
  lines.push("AU PROGRAMME");
  config.programme.forEach((p) => lines.push(`- ${p}`));
  lines.push("");
  lines.push("À PRÉVOIR AVANT LE CHANTIER");
  config.prerequis.forEach((p) => lines.push(`- ${p}`));
  if (payload.notesClient) {
    lines.push("");
    lines.push("NOTE COMPLÉMENTAIRE");
    lines.push(payload.notesClient.trim());
  }
  lines.push("");
  lines.push("Je vous appelle la veille pour finaliser les derniers détails.");
  lines.push("");
  lines.push("En savoir plus sur ce service :");
  lines.push(`${COMPANY.siteUrl}${config.servicePath}`);
  lines.push("");
  lines.push("Bien cordialement,");
  lines.push(COMPANY.ownerFirstName);
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Email HTML — Chantier programmé
// ---------------------------------------------------------------------------

export function emailHtmlChantier(payload: ChantierProgrammePayload): string {
  const config = TYPE_CONFIGS[familleDeVisite(payload.typeIntervention)];
  const dateRange = formatPlageLong(payload.dateDebut, payload.dateFin);
  const horaires = formatHorairesJournaliers(
    payload.dateDebut,
    payload.dateFin,
    payload.heureDebut,
    payload.heureFin,
  );

  const programmeHtml = config.programme
    .map((p) => `<li style="margin-bottom: 6px;">${escapeHtml(p)}</li>`)
    .join("\n");

  const prerequisHtml = config.prerequis
    .map((p) => `<li style="margin-bottom: 6px;">${escapeHtml(p)}</li>`)
    .join("\n");

  const adresseRow = payload.address
    ? `<tr><td style="padding: 6px 0; color: #888; font-size: 13px;">📍 Lieu</td><td style="padding: 6px 0; font-weight: 600;">${escapeHtml(payload.address)}</td></tr>`
    : "";

  const notesBlock = payload.notesClient
    ? `<div style="margin: 24px 0; padding: 16px; background: ${COMPANY.creamColor}; border-left: 3px solid ${COMPANY.brandColor};">
        <p style="margin: 0 0 6px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #888;">Note complémentaire</p>
        <p style="margin: 0; font-size: 14px; color: #1a1a1a; line-height: 1.6;">${escapeHtml(payload.notesClient.trim())}</p>
      </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Confirmation chantier ${escapeHtml(config.shortLabel)}</title>
</head>
<body style="margin: 0; padding: 0; background: #f4f4f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff;">

    <div style="background: ${COMPANY.darkColor}; padding: 32px 24px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px; color: ${COMPANY.brandColor}; letter-spacing: -0.5px;">⚡ ${escapeHtml(COMPANY.name)}</h1>
      <p style="margin: 8px 0 0; color: #ccc; font-size: 13px;">Électricien indépendant · Brabant wallon · Bruxelles · Wallonie</p>
    </div>

    <div style="padding: 32px 24px; color: #1a1a1a; line-height: 1.6;">
      <p style="margin: 0 0 16px; font-size: 16px;">Bonjour <strong>${escapeHtml(payload.clientName)}</strong>,</p>
      <p style="margin: 0 0 24px; font-size: 15px;">Suite à votre acceptation du devis, je vous confirme la planification de votre chantier <strong>${escapeHtml(config.chantierLabel)}</strong>.</p>

      <table style="width: 100%; border-collapse: collapse; border-top: 2px solid ${COMPANY.brandColor}; border-bottom: 2px solid ${COMPANY.brandColor}; margin: 24px 0;">
        <tr><td style="padding: 6px 0; color: #888; font-size: 13px; width: 100px;">📅 Dates</td><td style="padding: 6px 0; font-weight: 600;">${escapeHtml(dateRange)}</td></tr>
        <tr><td style="padding: 6px 0; color: #888; font-size: 13px;">🕐 Horaires</td><td style="padding: 6px 0; font-weight: 600;">${escapeHtml(horaires)}</td></tr>
        ${adresseRow}
      </table>

      <h3 style="margin: 32px 0 12px; color: ${COMPANY.brandColor}; font-size: 16px; text-transform: uppercase; letter-spacing: 1px;">Au programme</h3>
      <ul style="margin: 0 0 24px; padding-left: 20px;">
        ${programmeHtml}
      </ul>

      <h3 style="margin: 24px 0 12px; color: ${COMPANY.brandColor}; font-size: 16px; text-transform: uppercase; letter-spacing: 1px;">À prévoir avant le chantier</h3>
      <ul style="margin: 0 0 24px; padding-left: 20px;">
        ${prerequisHtml}
      </ul>

      ${notesBlock}

      <p style="margin: 24px 0 16px; font-size: 14px; color: #555; font-style: italic;">Je vous appelle la veille pour finaliser les derniers détails.</p>

      <p style="margin: 24px 0 24px; font-size: 14px;">En savoir plus sur ce service : <a href="${COMPANY.siteUrl}${config.servicePath}" style="color: ${COMPANY.brandColor}; text-decoration: none; font-weight: 600;">${COMPANY.siteUrl}${config.servicePath}</a></p>

      <p style="margin: 32px 0 4px; font-size: 15px;">Bien cordialement,</p>
      <p style="margin: 0; font-size: 15px; font-weight: 600;">${escapeHtml(COMPANY.ownerFirstName)}</p>
    </div>
  </div>
</body>
</html>`;
}

export function emailSubjectChantier(payload: ChantierProgrammePayload): string {
  const config = TYPE_CONFIGS[familleDeVisite(payload.typeIntervention)];
  const range = formatPlageShort(payload.dateDebut, payload.dateFin);
  return `Confirmation chantier ${config.chantierLabel} — ${range}`;
}

// ===========================================================================
// CHANTIERS — Rectifications (modification de planning)
// ===========================================================================
// Ton mesuré "Mise à jour de votre planning" plutôt que "MODIFICATION".
// Évite l'effet alarmiste auprès du client.

export function smsTemplateChantierRectification(payload: ChantierProgrammePayload): string {
  const config = TYPE_CONFIGS[familleDeVisite(payload.typeIntervention)];
  const lines = [
    `🔌 ${COMPANY.name}`,
    `Bonjour ${payload.clientName}, mise à jour du planning de votre chantier ${config.chantierLabel} :`,
    `📅 ${formatPlageLongNoYear(payload.dateDebut, payload.dateFin)}`,
    `🕐 ${formatHorairesJournaliers(payload.dateDebut, payload.dateFin, payload.heureDebut, payload.heureFin)}`,
  ];
  if (payload.address) {
    lines.push(`📍 ${shortenAddress(payload.address)}`);
  }
  lines.push("Merci de noter ces nouvelles dates.");
  lines.push(`🌐 ${COMPANY.site}`);
  lines.push(`${COMPANY.owner} - ${COMPANY.tel}`);
  return lines.join("\n");
}

export function whatsappTemplateChantierRectification(payload: ChantierProgrammePayload): string {
  const config = TYPE_CONFIGS[familleDeVisite(payload.typeIntervention)];
  const adresseBlock = payload.address ? `\n📍 *${payload.address}*` : "";
  const notesBlock = payload.notesClient
    ? `\n📝 *Note :* ${payload.notesClient.trim()}\n`
    : "";

  return [
    `⚡ *${COMPANY.name}*`,
    "",
    `Bonjour ${payload.clientName} 👋`,
    "",
    `Je reviens vers vous pour une *mise à jour du planning* de votre chantier *${config.chantierLabel}*.`,
    "",
    `📅 *${formatPlageLong(payload.dateDebut, payload.dateFin)}*`,
    `🕐 *${formatHorairesJournaliers(payload.dateDebut, payload.dateFin, payload.heureDebut, payload.heureFin)}*${adresseBlock}`,
    notesBlock,
    "Le reste de l'organisation prévue ne change pas. Si une question, n'hésitez pas.",
    "",
    `À bientôt,`,
    `${COMPANY.owner}`,
    `🌐 ${COMPANY.site}`,
    `📱 ${COMPANY.tel}`,
  ].join("\n");
}

export function emailPlaintextChantierRectification(payload: ChantierProgrammePayload): string {
  const config = TYPE_CONFIGS[familleDeVisite(payload.typeIntervention)];
  const dateRange = formatPlageLong(payload.dateDebut, payload.dateFin);

  const lines = [
    `Bonjour ${payload.clientName},`,
    "",
    `Je reviens vers vous pour une mise à jour du planning de votre chantier ${config.chantierLabel}.`,
    "",
    "NOUVEAU PLANNING",
    `Dates    : ${dateRange}`,
    `Horaires : ${formatHorairesJournaliers(payload.dateDebut, payload.dateFin, payload.heureDebut, payload.heureFin)}`,
  ];
  if (payload.address) lines.push(`Lieu     : ${payload.address}`);
  if (payload.notesClient) {
    lines.push("");
    lines.push("NOTE COMPLÉMENTAIRE");
    lines.push(payload.notesClient.trim());
  }
  lines.push("");
  lines.push("Le reste de l'organisation prévue ne change pas — programme et points à prévoir restent identiques.");
  lines.push("");
  lines.push("Si une question, n'hésitez pas à me joindre.");
  lines.push("");
  lines.push("Bien cordialement,");
  lines.push(COMPANY.ownerFirstName);
  return lines.join("\n");
}

export function emailHtmlChantierRectification(payload: ChantierProgrammePayload): string {
  const config = TYPE_CONFIGS[familleDeVisite(payload.typeIntervention)];
  const dateRange = formatPlageLong(payload.dateDebut, payload.dateFin);
  const horaires = formatHorairesJournaliers(
    payload.dateDebut,
    payload.dateFin,
    payload.heureDebut,
    payload.heureFin,
  );

  const adresseRow = payload.address
    ? `<tr><td style="padding: 6px 0; color: #888; font-size: 13px;">📍 Lieu</td><td style="padding: 6px 0; font-weight: 600;">${escapeHtml(payload.address)}</td></tr>`
    : "";

  const notesBlock = payload.notesClient
    ? `<div style="margin: 24px 0; padding: 16px; background: ${COMPANY.creamColor}; border-left: 3px solid ${COMPANY.brandColor};">
        <p style="margin: 0 0 6px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #888;">Note complémentaire</p>
        <p style="margin: 0; font-size: 14px; color: #1a1a1a; line-height: 1.6;">${escapeHtml(payload.notesClient.trim())}</p>
      </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Mise à jour planning chantier ${escapeHtml(config.shortLabel)}</title>
</head>
<body style="margin: 0; padding: 0; background: #f4f4f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff;">

    <div style="background: ${COMPANY.darkColor}; padding: 32px 24px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px; color: ${COMPANY.brandColor}; letter-spacing: -0.5px;">⚡ ${escapeHtml(COMPANY.name)}</h1>
      <p style="margin: 8px 0 0; color: #ccc; font-size: 13px;">Mise à jour de votre planning</p>
    </div>

    <div style="padding: 32px 24px; color: #1a1a1a; line-height: 1.6;">
      <p style="margin: 0 0 16px; font-size: 16px;">Bonjour <strong>${escapeHtml(payload.clientName)}</strong>,</p>
      <p style="margin: 0 0 24px; font-size: 15px;">Je reviens vers vous pour une <strong>mise à jour du planning</strong> de votre chantier <strong>${escapeHtml(config.chantierLabel)}</strong>.</p>

      <h3 style="margin: 24px 0 12px; color: ${COMPANY.brandColor}; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Nouveau planning</h3>

      <table style="width: 100%; border-collapse: collapse; border-top: 2px solid ${COMPANY.brandColor}; border-bottom: 2px solid ${COMPANY.brandColor}; margin: 0 0 24px;">
        <tr><td style="padding: 6px 0; color: #888; font-size: 13px; width: 100px;">📅 Dates</td><td style="padding: 6px 0; font-weight: 600;">${escapeHtml(dateRange)}</td></tr>
        <tr><td style="padding: 6px 0; color: #888; font-size: 13px;">🕐 Horaires</td><td style="padding: 6px 0; font-weight: 600;">${escapeHtml(horaires)}</td></tr>
        ${adresseRow}
      </table>

      ${notesBlock}

      <p style="margin: 24px 0 16px; font-size: 14px; color: #555;">Le reste de l'organisation prévue ne change pas — programme et points à prévoir restent identiques.</p>

      <p style="margin: 16px 0 24px; font-size: 14px; color: #555;">Si une question, n'hésitez pas à me joindre.</p>

      <p style="margin: 32px 0 4px; font-size: 15px;">Bien cordialement,</p>
      <p style="margin: 0; font-size: 15px; font-weight: 600;">${escapeHtml(COMPANY.ownerFirstName)}</p>
    </div>
  </div>
</body>
</html>`;
}

export function emailSubjectChantierRectification(payload: ChantierProgrammePayload): string {
  const config = TYPE_CONFIGS[familleDeVisite(payload.typeIntervention)];
  const range = formatPlageShort(payload.dateDebut, payload.dateFin);
  return `Mise à jour planning ${config.chantierLabel} — ${range}`;
}

// ===========================================================================
// CHANTIERS — Annulations
// ===========================================================================
// Le payload conserve les anciennes dates pour permettre au client de retrouver
// le chantier dont on parle. La phrase explique simplement l'annulation, sans
// présumer de la raison ni proposer de date alternative (libre à Adrian de
// recontacter en personne pour reprogrammer).

export interface ChantierAnnulationPayload {
  clientName: string;
  typeIntervention: TypeIntervention;
  /** Anciennes dates avant annulation, YYYY-MM-DD */
  dateDebut: string;
  dateFin: string;
  /** Raison optionnelle exposable au client (ex: "imprévu personnel"). */
  raison?: string;
}

export function smsTemplateChantierAnnulation(payload: ChantierAnnulationPayload): string {
  const config = TYPE_CONFIGS[familleDeVisite(payload.typeIntervention)];
  const lines = [
    `🔌 ${COMPANY.name}`,
    `Bonjour ${payload.clientName}, je dois annuler le chantier ${config.chantierLabel} prévu ${formatPlageLongNoYear(payload.dateDebut, payload.dateFin)}.`,
  ];
  if (payload.raison) lines.push(`Raison : ${payload.raison.trim()}`);
  lines.push("Je vous recontacte rapidement pour reprogrammer.");
  lines.push(`Désolé pour la gêne,`);
  lines.push(`${COMPANY.owner} - ${COMPANY.tel}`);
  return lines.join("\n");
}

export function whatsappTemplateChantierAnnulation(payload: ChantierAnnulationPayload): string {
  const config = TYPE_CONFIGS[familleDeVisite(payload.typeIntervention)];
  const raisonBlock = payload.raison ? `\n_Raison : ${payload.raison.trim()}_\n` : "";

  return [
    `⚡ *${COMPANY.name}*`,
    "",
    `Bonjour ${payload.clientName},`,
    "",
    `Je dois malheureusement *annuler* le chantier *${config.chantierLabel}* prévu :`,
    "",
    `📅 *${formatPlageLong(payload.dateDebut, payload.dateFin)}*`,
    raisonBlock,
    "Je vous recontacte rapidement pour reprogrammer dès que possible.",
    "",
    "Désolé pour la gêne occasionnée,",
    `${COMPANY.owner}`,
    `📱 ${COMPANY.tel}`,
  ].join("\n");
}

export function emailPlaintextChantierAnnulation(payload: ChantierAnnulationPayload): string {
  const config = TYPE_CONFIGS[familleDeVisite(payload.typeIntervention)];
  const dateRange = formatPlageLong(payload.dateDebut, payload.dateFin);

  const lines = [
    `Bonjour ${payload.clientName},`,
    "",
    `Je dois malheureusement annuler le chantier ${config.chantierLabel} qui était prévu :`,
    "",
    `Dates : ${dateRange}`,
  ];
  if (payload.raison) {
    lines.push("");
    lines.push(`Raison : ${payload.raison.trim()}`);
  }
  lines.push("");
  lines.push("Je vous recontacte rapidement pour reprogrammer dès que mon planning le permet.");
  lines.push("");
  lines.push("Désolé pour la gêne occasionnée.");
  lines.push("");
  lines.push("Bien cordialement,");
  lines.push(COMPANY.ownerFirstName);
  return lines.join("\n");
}

export function emailHtmlChantierAnnulation(payload: ChantierAnnulationPayload): string {
  const config = TYPE_CONFIGS[familleDeVisite(payload.typeIntervention)];
  const dateRange = formatPlageLong(payload.dateDebut, payload.dateFin);

  const raisonBlock = payload.raison
    ? `<p style="margin: 16px 0; font-size: 14px; color: #555;"><strong>Raison :</strong> ${escapeHtml(payload.raison.trim())}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Annulation chantier ${escapeHtml(config.shortLabel)}</title>
</head>
<body style="margin: 0; padding: 0; background: #f4f4f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff;">

    <div style="background: ${COMPANY.darkColor}; padding: 32px 24px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px; color: ${COMPANY.brandColor}; letter-spacing: -0.5px;">⚡ ${escapeHtml(COMPANY.name)}</h1>
      <p style="margin: 8px 0 0; color: #ccc; font-size: 13px;">Annulation de chantier</p>
    </div>

    <div style="padding: 32px 24px; color: #1a1a1a; line-height: 1.6;">
      <p style="margin: 0 0 16px; font-size: 16px;">Bonjour <strong>${escapeHtml(payload.clientName)}</strong>,</p>

      <p style="margin: 0 0 16px; font-size: 15px;">Je dois malheureusement <strong>annuler</strong> le chantier <strong>${escapeHtml(config.chantierLabel)}</strong> qui était prévu :</p>

      <p style="margin: 16px 0; padding: 12px 16px; background: ${COMPANY.creamColor}; border-left: 3px solid ${COMPANY.brandColor}; font-size: 15px; font-weight: 600;">📅 ${escapeHtml(dateRange)}</p>

      ${raisonBlock}

      <p style="margin: 16px 0; font-size: 14px; color: #555;">Je vous recontacte rapidement pour reprogrammer dès que mon planning le permet.</p>

      <p style="margin: 16px 0 24px; font-size: 14px; color: #555;">Désolé pour la gêne occasionnée.</p>

      <p style="margin: 32px 0 4px; font-size: 15px;">Bien cordialement,</p>
      <p style="margin: 0; font-size: 15px; font-weight: 600;">${escapeHtml(COMPANY.ownerFirstName)}</p>
    </div>
  </div>
</body>
</html>`;
}

export function emailSubjectChantierAnnulation(payload: ChantierAnnulationPayload): string {
  const config = TYPE_CONFIGS[familleDeVisite(payload.typeIntervention)];
  const range = formatPlageShort(payload.dateDebut, payload.dateFin);
  return `Annulation chantier ${config.chantierLabel} — ${range}`;
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
  // RFC 6068 exige le percent-encoding (espaces → %20). URLSearchParams produit
  // de l'application/x-www-form-urlencoded (espaces → +), affiché littéralement
  // sur Gmail mobile et iOS Mail.
  const qs = `subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return email && email.length > 0
    ? `mailto:${encodeURIComponent(email)}?${qs}`
    : `mailto:?${qs}`;
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
