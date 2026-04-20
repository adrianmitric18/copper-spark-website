// Wrapper EmailJS pour les emails de RDV.
// Architecture fusionnée compatible avec la limite EmailJS 6 templates.

import emailjs from "@emailjs/browser";
import { buildGoogleCalendarUrl } from "./googleCalendar";
import { formatDateLong, formatHeure, formatDuree } from "./formatters";
import { getServiceFlags, type RendezVous } from "./constants";

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
      return [...REQUIRED_BASE_KEYS, "is_annulation"];
    default:
      return REQUIRED_BASE_KEYS;
  }
}

function validatePayload(templateId: string, toEmail: string, params: Record<string, string | boolean>): void {
  const fullParams: Record<string, string | boolean> = { to_email: toEmail, ...params };
  const missing = getRequiredKeys(templateId).filter((key) => {
    const value = fullParams[key];
    return value === undefined || value === null || (typeof value === "string" && value.trim() === "");
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
      Boolean(fullParams["is_rgie"]),
      Boolean(fullParams["is_pv"]),
      Boolean(fullParams["is_borne"]),
      Boolean(fullParams["is_installation"]),
      Boolean(fullParams["is_generique"]),
    ];
    const activeFlagsCount = serviceFlags.filter(Boolean).length;

    if (activeFlagsCount !== 1) {
      throw new Error(`template_rdv_client_fusion doit avoir exactement 1 booléen service à true (reçu: ${activeFlagsCount})`);
    }
  }

  if (templateId === TPL_RAPPEL_FUSION) {
    const isNotificationAdrian = Boolean(fullParams["is_notification_adrian"]);

    if (isNotificationAdrian && toEmail !== ADRIAN_EMAIL) {
      throw new Error("template_rdv_rappel_fusion (notification Adrian) doit cibler cuivre.electrique@gmail.com");
    }

    if (!isNotificationAdrian && toEmail !== String(fullParams["from_email"] ?? "")) {
      throw new Error("template_rdv_rappel_fusion (client) doit cibler l'email du client");
    }
  }
}

async function sendOne({ templateId, toEmail, params }: SendArgs): Promise<void> {
  const templateParams: Record<string, string | boolean> = { to_email: toEmail, ...params };

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

  const results = await Promise.allSettled([
    sendOne({
      templateId: TPL_CLIENT_FUSION,
      toEmail: lead.email,
      params: { ...base, ...flags },
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
    params: { ...base, is_notification_adrian: false },
  });

  await sendOne({
    templateId: TPL_RAPPEL_FUSION,
    toEmail: ADRIAN_EMAIL,
    params: { ...base, is_notification_adrian: true },
  });
}

export async function sendRdvModificationEmail(lead: LeadInfo, rdv: RendezVous): Promise<void> {
  await sendOne({
    templateId: TPL_CHANGEMENT,
    toEmail: lead.email,
    params: { ...buildBaseParams(lead, rdv), is_annulation: false },
  });
}

export async function sendRdvAnnulationEmail(lead: LeadInfo, rdv: RendezVous): Promise<void> {
  await sendOne({
    templateId: TPL_CHANGEMENT,
    toEmail: lead.email,
    params: { ...buildBaseParams(lead, rdv), is_annulation: true },
  });
}
