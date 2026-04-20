// Wrapper EmailJS pour les emails de RDV.
// Architecture 3 templates fusionnés (plan EmailJS 9€/mois, 6 templates max) :
// - template_rdv_client_fusion : confirmation + préparation (5 services via booléens)
// - template_rdv_memo_adrian   : mémo interne Adrian (lien Google Calendar)
// - template_rdv_rappel_fusion : rappel J-1 client + notif Adrian (via booléen)
// - template_rdv_changement    : modification + annulation (via booléen)

import emailjs from "@emailjs/browser";
import { buildGoogleCalendarUrl } from "./googleCalendar";
import { formatDateLong, formatHeure, formatDuree } from "./formatters";
import { getServiceFlags, type RendezVous } from "./constants";

const EMAILJS_SERVICE_ID = "service_ybjga5v";
const EMAILJS_PUBLIC_KEY = "8rgPz2Ls3kaYeRHY_";

// Mode debug : tant que les templates EmailJS ne sont pas créés, on simule l'envoi.
// Mettre à false dès que les templates sont créés dans le dashboard EmailJS.
const DRY_RUN = false;

const ADRIAN_EMAIL = "cuivre.electrique@gmail.com";

// IDs des templates EmailJS
const TPL_CLIENT_FUSION = "template_rdv_client_fusion";
const TPL_MEMO_ADRIAN = "template_rdv_memo_adrian";
const TPL_RAPPEL_FUSION = "template_rdv_rappel_fusion";
const TPL_CHANGEMENT = "template_rdv_changement";

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
  params: Record<string, string | boolean>;
}

async function sendOne({ templateId, toEmail, params }: SendArgs): Promise<void> {
  const fullParams = { to_email: toEmail, ...params };
  if (DRY_RUN) {
    // eslint-disable-next-line no-console
    console.log(`📧 [DRY_RUN] EmailJS.send → ${templateId} → ${toEmail}`, fullParams);
    return;
  }
  // eslint-disable-next-line no-console
  console.log("📧 [EmailJS] Sending", {
    service_id: EMAILJS_SERVICE_ID,
    template_id: templateId,
    to_email: toEmail,
    params: fullParams,
  });
  try {
    const res = await emailjs.send(EMAILJS_SERVICE_ID, templateId, fullParams, {
      publicKey: EMAILJS_PUBLIC_KEY,
    });
    // eslint-disable-next-line no-console
    console.log(`✅ [EmailJS] OK ${templateId} → ${toEmail}`, res.status, res.text);
  } catch (err: unknown) {
    const e = err as { status?: number; text?: string };
    // eslint-disable-next-line no-console
    console.error(`❌ [EmailJS] FAIL ${templateId} → ${toEmail}`, {
      status: e?.status,
      text: e?.text,
      raw: err,
    });
    throw err;
  }
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

/**
 * Envoie les 2 emails immédiats à la confirmation d'un RDV :
 * 1. Email client FUSIONNÉ (template_rdv_client_fusion + booléens service)
 * 2. Mémo Adrian (template_rdv_memo_adrian + lien Google Calendar)
 */
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

/**
 * PHASE 3 — Rappel J-1.
 * Envoie le rappel au client puis, si succès, la notification à Adrian.
 * Les deux utilisent le MÊME template `template_rdv_rappel_fusion`,
 * différencié par le booléen `is_notification_adrian`.
 */
export async function sendRappelJ1Emails(lead: LeadInfo, rdv: RendezVous): Promise<void> {
  const base = buildBaseParams(lead, rdv);

  // 1) Rappel au client
  await sendOne({
    templateId: TPL_RAPPEL_FUSION,
    toEmail: lead.email,
    params: { ...base, is_notification_adrian: false },
  });

  // 2) Si succès → notification Adrian (même template, booléen inversé)
  await sendOne({
    templateId: TPL_RAPPEL_FUSION,
    toEmail: ADRIAN_EMAIL,
    params: { ...base, is_notification_adrian: true },
  });
}

/** Email envoyé au client lors d'une modification de RDV (template fusionné, is_annulation=false). */
export async function sendRdvModificationEmail(lead: LeadInfo, rdv: RendezVous): Promise<void> {
  await sendOne({
    templateId: TPL_CHANGEMENT,
    toEmail: lead.email,
    params: { ...buildBaseParams(lead, rdv), is_annulation: false },
  });
}

/** Email envoyé au client lors d'une annulation de RDV (template fusionné, is_annulation=true). */
export async function sendRdvAnnulationEmail(lead: LeadInfo, rdv: RendezVous): Promise<void> {
  await sendOne({
    templateId: TPL_CHANGEMENT,
    toEmail: lead.email,
    params: { ...buildBaseParams(lead, rdv), is_annulation: true },
  });
}
