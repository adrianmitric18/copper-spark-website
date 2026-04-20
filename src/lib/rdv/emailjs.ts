// Wrapper EmailJS pour les emails de RDV.
// Architecture fusionnée compatible avec la limite EmailJS 6 templates.

import emailjs from "@emailjs/browser";
import { buildGoogleCalendarUrl } from "./googleCalendar";
import { formatDateLong, formatHeure, formatDuree } from "./formatters";
import { type RendezVous } from "./constants";

function getSectionPreparation(typeVisite: string): string {
  const typeNorm = typeVisite.toLowerCase();

  if (typeNorm.includes("rgie") || typeNorm.includes("conformité") || typeNorm.includes("conformite")) {
    return `
<h3 style="color: #E85D04; font-size: 18px; margin: 35px 0 15px 0; border-bottom: 2px solid #E85D04; padding-bottom: 8px;">POUR PREPARER VOTRE VISITE</h3>
<p style="color: #555; font-size: 15px; line-height: 1.6; margin: 15px 0;">Pour optimiser notre visite et vous proposer un devis precis, voici ce que vous pouvez preparer :</p>
<div style="background-color: #f9f9f9; padding: 20px; border-radius: 4px; margin: 15px 0;">
<p style="color: #E85D04; font-weight: bold; margin: 0 0 10px 0;">Documents utiles (si disponibles) :</p>
<ul style="color: #555; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
<li>Votre <strong>ancien certificat RGIE</strong> (si vous en avez deja un)</li>
<li>Le <strong>rapport de controle</strong> precedent (si l'installation a ete controlee)</li>
<li>Un <strong>plan de votre habitation</strong> (meme un simple croquis)</li>
</ul>
<p style="color: #E85D04; font-weight: bold; margin: 20px 0 10px 0;">Acces necessaire :</p>
<ul style="color: #555; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
<li>Le <strong>tableau electrique principal</strong></li>
<li>Le <strong>compteur electrique</strong> (generalement a l'interieur, dans un hall, une cave ou un placard technique)</li>
<li>Les <strong>pieces concernees</strong> par la mise en conformite</li>
<li>La <strong>cave</strong> et les <strong>combles</strong> si pertinent</li>
<li>L'<strong>exterieur</strong> si le projet concerne des prises, eclairages ou points electriques exterieurs</li>
</ul>
</div>`;
  }

  if (typeNorm.includes("photovoltaïque") || typeNorm.includes("photovoltaique") || typeNorm.includes("panneau") || typeNorm.includes("pv") || typeNorm.includes("solaire")) {
    return `
<h3 style="color: #E85D04; font-size: 18px; margin: 35px 0 15px 0; border-bottom: 2px solid #E85D04; padding-bottom: 8px;">POUR PREPARER VOTRE VISITE</h3>
<p style="color: #555; font-size: 15px; line-height: 1.6; margin: 15px 0;">Pour dimensionner au mieux votre installation photovoltaique et optimiser votre production :</p>
<div style="background-color: #f9f9f9; padding: 20px; border-radius: 4px; margin: 15px 0;">
<p style="color: #E85D04; font-weight: bold; margin: 0 0 10px 0;">Documents essentiels :</p>
<ul style="color: #555; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
<li>Vos <strong>factures d'electricite des 12 derniers mois</strong> (pour calculer votre consommation et dimensionner l'installation)</li>
<li>Un <strong>plan de votre maison</strong> (si disponible, meme un croquis)</li>
<li>Les informations sur votre <strong>toiture</strong> (annee de construction, etat, materiau si vous le savez)</li>
</ul>
<p style="color: #E85D04; font-weight: bold; margin: 20px 0 10px 0;">Acces necessaire :</p>
<ul style="color: #555; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
<li>Le <strong>tableau electrique principal</strong></li>
<li>Le <strong>compteur electrique</strong> (generalement a l'interieur - pour verifier la puissance et envisager l'injection reseau)</li>
<li>L'<strong>acces aux combles</strong> (pour verifier la charpente et le passage des cables)</li>
<li>L'<strong>exterieur</strong> (pour evaluer l'orientation de la toiture, l'ensoleillement et les ombres eventuelles)</li>
</ul>
</div>`;
  }

  if (typeNorm.includes("borne") || typeNorm.includes("recharge") || typeNorm.includes("vehicule") || typeNorm.includes("véhicule")) {
    return `
<h3 style="color: #E85D04; font-size: 18px; margin: 35px 0 15px 0; border-bottom: 2px solid #E85D04; padding-bottom: 8px;">POUR PREPARER VOTRE VISITE</h3>
<p style="color: #555; font-size: 15px; line-height: 1.6; margin: 15px 0;">Pour dimensionner au mieux votre borne de recharge et choisir le bon modele :</p>
<div style="background-color: #f9f9f9; padding: 20px; border-radius: 4px; margin: 15px 0;">
<p style="color: #E85D04; font-weight: bold; margin: 0 0 10px 0;">Informations a preparer :</p>
<ul style="color: #555; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
<li>La <strong>marque et le modele</strong> de votre vehicule electrique</li>
<li>Vos <strong>habitudes de recharge</strong> (quotidien, weekend, distance parcourue)</li>
<li>Vos <strong>preferences</strong> (puissance de charge souhaitee, fonctions connectees, badge RFID, etc.)</li>
</ul>
<p style="color: #E85D04; font-weight: bold; margin: 20px 0 10px 0;">Acces necessaire :</p>
<ul style="color: #555; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
<li>Le <strong>tableau electrique principal</strong></li>
<li>Le <strong>compteur electrique</strong> (generalement a l'interieur - pour verifier la puissance disponible)</li>
<li>L'<strong>emplacement prevu pour la borne</strong> (garage, carport, allee, facade)</li>
<li>Le <strong>parcours prevu</strong> entre le tableau et l'emplacement de la borne</li>
</ul>
</div>`;
  }

  if (typeNorm.includes("installation") || typeNorm.includes("renovation") || typeNorm.includes("rénovation") || typeNorm.includes("neuf")) {
    return `
<h3 style="color: #E85D04; font-size: 18px; margin: 35px 0 15px 0; border-bottom: 2px solid #E85D04; padding-bottom: 8px;">POUR PREPARER VOTRE VISITE</h3>
<p style="color: #555; font-size: 15px; line-height: 1.6; margin: 15px 0;">Pour vous proposer un devis precis et adapte a vos besoins :</p>
<div style="background-color: #f9f9f9; padding: 20px; border-radius: 4px; margin: 15px 0;">
<p style="color: #E85D04; font-weight: bold; margin: 0 0 10px 0;">Documents et informations utiles :</p>
<ul style="color: #555; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
<li>Un <strong>plan de votre habitation</strong> (meme un simple croquis)</li>
<li>Une <strong>liste des pieces</strong> concernees par les travaux</li>
<li>Vos <strong>besoins specifiques</strong> (nombre de prises, types d'eclairage, domotique, etc.)</li>
<li>Si renovation : des <strong>photos de l'existant</strong> peuvent aider</li>
</ul>
<p style="color: #E85D04; font-weight: bold; margin: 20px 0 10px 0;">Acces necessaire :</p>
<ul style="color: #555; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
<li>Le <strong>tableau electrique principal</strong></li>
<li>Le <strong>compteur electrique</strong> (generalement a l'interieur, dans un hall, une cave ou un placard technique)</li>
<li>Toutes les <strong>pieces</strong> concernees par le projet</li>
<li>La <strong>cave</strong> et les <strong>combles</strong> (pour le passage des cables)</li>
<li>L'<strong>exterieur</strong> si le projet concerne des prises, eclairages ou points electriques exterieurs</li>
</ul>
</div>`;
  }

  return `
<h3 style="color: #E85D04; font-size: 18px; margin: 35px 0 15px 0; border-bottom: 2px solid #E85D04; padding-bottom: 8px;">POUR PREPARER VOTRE VISITE</h3>
<p style="color: #555; font-size: 15px; line-height: 1.6; margin: 15px 0;">Pour optimiser notre visite et vous proposer la meilleure solution :</p>
<div style="background-color: #f9f9f9; padding: 20px; border-radius: 4px; margin: 15px 0;">
<p style="color: #E85D04; font-weight: bold; margin: 0 0 10px 0;">A preparer si possible :</p>
<ul style="color: #555; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
<li>Un <strong>descriptif clair</strong> de vos besoins ou du probleme rencontre</li>
<li>Si travaux existants : <strong>photos</strong> de l'installation actuelle</li>
<li>Vos <strong>attentes et preferences</strong></li>
</ul>
<p style="color: #E85D04; font-weight: bold; margin: 20px 0 10px 0;">Acces necessaire :</p>
<ul style="color: #555; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
<li>Le <strong>tableau electrique principal</strong></li>
<li>Le <strong>compteur electrique</strong> (generalement a l'interieur, dans un hall, une cave ou un placard technique)</li>
<li>La ou les <strong>zones concernees</strong> par l'intervention</li>
<li>L'<strong>exterieur</strong> si pertinent pour votre projet</li>
</ul>
</div>`;
}

const EMAILJS_SERVICE_ID = "service_ybjga5v";
const EMAILJS_PUBLIC_KEY = "8rgPz2Ls3kaYeRHY_";

const DRY_RUN = false;
const ADRIAN_EMAIL = "cuivre.electrique@gmail.com";

const EMAILJS_TEMPLATES = {
  clientFusion: "template_ig2r02h",
  memoAdrian: "template_km8rsgg",
  changement: "template_pu7fbij",
  rappelFusion: "template_17c69ex",
} as const;

const TPL_CLIENT_FUSION = EMAILJS_TEMPLATES.clientFusion;
const TPL_MEMO_ADRIAN = EMAILJS_TEMPLATES.memoAdrian;
const TPL_RAPPEL_FUSION = EMAILJS_TEMPLATES.rappelFusion;
const TPL_CHANGEMENT = EMAILJS_TEMPLATES.changement;

const REQUIRED_BASE_KEYS = [
  "from_name",
  "from_email",
  "phone",
  "rue",
  "numero",
  "code_postal",
  "commune",
  "date_rdv_formatee",
  "heure_rdv",
  "duree_formatee",
  "type_visite",
] as const;

let emailJsInitialized = false;

export interface LeadInfo {
  id: string;
  name: string;
  email: string;
  phone: string;
  rue: string | null;
  numero: string | null;
  code_postal: string | null;
  commune: string | null;
}

interface SendArgs {
  templateId: string;
  toEmail: string;
  params: Record<string, string>;
}

/** EmailJS/Handlebars n'accepte pas les booléens natifs : "1" = true, "" = false. */
function boolStr(value: boolean): string {
  return value ? "1" : "";
}

function ensureEmailJsInitialized(): void {
  if (emailJsInitialized || DRY_RUN) return;

  if (!EMAILJS_PUBLIC_KEY?.trim()) {
    throw new Error("EmailJS PUBLIC_KEY manquante");
  }

  emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
  emailJsInitialized = true;

  // eslint-disable-next-line no-console
  console.log("[EmailJS] init OK", {
    serviceId: EMAILJS_SERVICE_ID,
    publicKeySource: "hardcoded",
    hasPublicKey: Boolean(EMAILJS_PUBLIC_KEY),
  });
}

function buildBaseParams(lead: LeadInfo, rdv: RendezVous): Record<string, string> {
  return {
    from_name: lead.name,
    from_email: lead.email,
    phone: lead.phone,
    rue: lead.rue ?? "",
    numero: lead.numero ?? "",
    code_postal: lead.code_postal ?? "",
    commune: lead.commune ?? "",
    date_rdv_formatee: formatDateLong(rdv.date_rdv),
    heure_rdv: formatHeure(rdv.heure_rdv),
    duree_minutes: String(rdv.duree_minutes),
    duree_formatee: formatDuree(rdv.duree_minutes),
    type_visite: rdv.type_visite,
  };
}

function getRequiredKeys(templateId: string): readonly string[] {
  switch (templateId) {
    case TPL_CLIENT_FUSION:
      return [
        ...REQUIRED_BASE_KEYS,
        "is_rgie",
        "is_pv",
        "is_borne",
        "is_installation",
        "is_generique",
      ];
    case TPL_MEMO_ADRIAN:
      return [
        ...REQUIRED_BASE_KEYS,
        "notes_internes",
        "lien_google_calendar",
        "url_fiche_lead",
      ];
    case TPL_RAPPEL_FUSION:
      return [...REQUIRED_BASE_KEYS, "is_notification_adrian"];
    case TPL_CHANGEMENT:
      return [...REQUIRED_BASE_KEYS, "statut_rdv", "message_principal", "titre_contact", "texte_contact"];
    default:
      return REQUIRED_BASE_KEYS;
  }
}

function validatePayload(templateId: string, toEmail: string, params: Record<string, string>): void {
  const fullParams: Record<string, string> = { to_email: toEmail, ...params };
  const missing = getRequiredKeys(templateId).filter((key) => {
    const value = fullParams[key];
    return value === undefined || value === null || (typeof value === "string" && value.trim() === "" && !key.startsWith("is_"));
  });

  if (missing.length > 0) {
    // eslint-disable-next-line no-console
    console.error("[EmailJS] paramètres manquants", {
      templateId,
      toEmail,
      missing,
      params: fullParams,
    });
    throw new Error(`Paramètres EmailJS manquants pour ${templateId}: ${missing.join(", ")}`);
  }

  if (templateId === TPL_MEMO_ADRIAN && toEmail !== "cuivre.electrique@gmail.com") {
    throw new Error(`template_rdv_memo_adrian doit être envoyé à cuivre.electrique@gmail.com (reçu: ${toEmail})`);
  }

  if (templateId === TPL_CLIENT_FUSION) {
    if (toEmail !== String(fullParams["from_email"] ?? "")) {
      throw new Error("template_rdv_client_fusion doit utiliser l'email du client dans to_email");
    }

    const serviceFlags = [
      fullParams["is_rgie"] === "1",
      fullParams["is_pv"] === "1",
      fullParams["is_borne"] === "1",
      fullParams["is_installation"] === "1",
      fullParams["is_generique"] === "1",
    ];
    const activeFlagsCount = serviceFlags.filter(Boolean).length;

    if (activeFlagsCount !== 1) {
      throw new Error(`template_rdv_client_fusion doit avoir exactement 1 booléen service à true (reçu: ${activeFlagsCount})`);
    }
  }

  if (templateId === TPL_RAPPEL_FUSION) {
    const isNotificationAdrian = fullParams["is_notification_adrian"] === "1";

    if (isNotificationAdrian && toEmail !== ADRIAN_EMAIL) {
      throw new Error("template_rdv_rappel_fusion (notification Adrian) doit cibler cuivre.electrique@gmail.com");
    }

    if (!isNotificationAdrian && toEmail !== String(fullParams["from_email"] ?? "")) {
      throw new Error("template_rdv_rappel_fusion (client) doit cibler l'email du client");
    }
  }
}

async function sendOne({ templateId, toEmail, params }: SendArgs): Promise<void> {
  const templateParams: Record<string, string> = { to_email: toEmail, ...params };

  validatePayload(templateId, toEmail, params);

  // eslint-disable-next-line no-console
  console.log("=== EMAILJS ENVOI ===");
  // eslint-disable-next-line no-console
  console.log("Template ID:", templateId);
  // eslint-disable-next-line no-console
  console.log("Service ID:", EMAILJS_SERVICE_ID);
  // eslint-disable-next-line no-console
  console.log("Params:", JSON.stringify(templateParams, null, 2));

  if (DRY_RUN) {
    return;
  }

  ensureEmailJsInitialized();

  try {
    await emailjs.send(EMAILJS_SERVICE_ID, templateId, templateParams, {
      publicKey: EMAILJS_PUBLIC_KEY,
    });
  } catch (error: unknown) {
    const typedError = error as { status?: number; text?: string };
    // eslint-disable-next-line no-console
    console.error("=== EMAILJS ERREUR ===");
    // eslint-disable-next-line no-console
    console.error("Status:", typedError?.status);
    // eslint-disable-next-line no-console
    console.error("Text:", typedError?.text);
    // eslint-disable-next-line no-console
    console.error("Error complet:", error);
    throw error;
  }
}

export async function sendRdvConfirmationEmails(lead: LeadInfo, rdv: RendezVous): Promise<void> {
  const base = buildBaseParams(lead, rdv);
  const flags = getServiceFlags(rdv.type_visite);
  const lienGCal = buildGoogleCalendarUrl({
    date_rdv: rdv.date_rdv,
    heure_rdv: rdv.heure_rdv,
    duree_minutes: rdv.duree_minutes,
    type_visite: rdv.type_visite,
    client_name: lead.name,
    client_phone: lead.phone,
    notes_internes: rdv.notes_internes,
    rue: lead.rue,
    numero: lead.numero,
    code_postal: lead.code_postal,
    commune: lead.commune,
  });
  const urlFicheLead = `${window.location.origin}/admin/lead/${lead.id}`;

  const flagsStr = {
    is_rgie: boolStr(flags.is_rgie),
    is_pv: boolStr(flags.is_pv),
    is_borne: boolStr(flags.is_borne),
    is_installation: boolStr(flags.is_installation),
    is_generique: boolStr(flags.is_generique),
  };

  const results = await Promise.allSettled([
    sendOne({
      templateId: TPL_CLIENT_FUSION,
      toEmail: lead.email,
      params: { ...base, ...flagsStr },
    }),
    sendOne({
      templateId: TPL_MEMO_ADRIAN,
      toEmail: ADRIAN_EMAIL,
      params: {
        ...base,
        notes_internes: rdv.notes_internes ?? "",
        lien_google_calendar: lienGCal,
        url_fiche_lead: urlFicheLead,
      },
    }),
  ]);

  const failed = results.filter((r) => r.status === "rejected");
  if (failed.length > 0) {
    failed.forEach((f) =>
      // eslint-disable-next-line no-console
      console.error("Email RDV échoué :", (f as PromiseRejectedResult).reason)
    );
    throw new Error(`${failed.length} email(s) sur 2 n'ont pas pu être envoyés`);
  }
}

export async function sendRappelJ1Emails(lead: LeadInfo, rdv: RendezVous): Promise<void> {
  const base = buildBaseParams(lead, rdv);

  await sendOne({
    templateId: TPL_RAPPEL_FUSION,
    toEmail: lead.email,
    params: { ...base, is_notification_adrian: "" },
  });

  await sendOne({
    templateId: TPL_RAPPEL_FUSION,
    toEmail: ADRIAN_EMAIL,
    params: { ...base, is_notification_adrian: "1" },
  });
}

export async function sendRdvModificationEmail(lead: LeadInfo, rdv: RendezVous): Promise<void> {
  await sendOne({
    templateId: TPL_CHANGEMENT,
    toEmail: lead.email,
    params: {
      ...buildBaseParams(lead, rdv),
      statut_rdv: "Votre rendez-vous a été déplacé",
      message_principal:
        "Je vous informe que votre rendez-vous a été déplacé à une nouvelle date. Voici les détails mis à jour. Les autres détails restent identiques.",
      titre_contact: "EMPÊCHEMENT ?",
      texte_contact: "En cas de changement ou d'imprévu, prévenez-moi dès que possible :",
    },
  });
}

export async function sendRdvAnnulationEmail(lead: LeadInfo, rdv: RendezVous): Promise<void> {
  await sendOne({
    templateId: TPL_CHANGEMENT,
    toEmail: lead.email,
    params: {
      ...buildBaseParams(lead, rdv),
      statut_rdv: "Votre rendez-vous a été annulé",
      message_principal:
        "Je vous informe que notre rendez-vous a été annulé. Si vous souhaitez reprogrammer notre visite à un autre moment, je reste à votre disposition.",
      titre_contact: "REPRENDRE CONTACT",
      texte_contact: "Pour reprogrammer un rendez-vous ou toute question :",
    },
  });
}
