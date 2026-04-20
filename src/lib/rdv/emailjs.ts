// Wrapper EmailJS pour les emails de RDV.
// PHASE 1 : pour l'instant on log juste les paramètres dans la console.
// Une fois les templates créés dans le dashboard EmailJS, on remplacera
// les console.log par de vrais emailjs.send().

import emailjs from "@emailjs/browser";
import { buildGoogleCalendarUrl } from "./googleCalendar";
import { formatDateLong, formatHeure, formatDuree } from "./formatters";
import { getTemplateClient, type RendezVous } from "./constants";

const EMAILJS_SERVICE_ID = "service_ybjga5v";
const EMAILJS_PUBLIC_KEY = "8rgPz2Ls3kaYeRHY_";

// Mode debug : tant que les templates EmailJS ne sont pas créés, on simule l'envoi.
// Mettre à false dès que les templates sont créés dans le dashboard EmailJS.
const DRY_RUN = true;

const ADRIAN_EMAIL = "cuivre.electrique@gmail.com";

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

async function sendOne({ templateId, toEmail, params }: SendArgs): Promise<void> {
  const fullParams = { to_email: toEmail, ...params };
  if (DRY_RUN) {
    // eslint-disable-next-line no-console
    console.log(`📧 [DRY_RUN] EmailJS.send → ${templateId} → ${toEmail}`, fullParams);
    return;
  }
  await emailjs.send(EMAILJS_SERVICE_ID, templateId, fullParams, {
    publicKey: EMAILJS_PUBLIC_KEY,
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

/**
 * Envoie les 2 emails immédiats à la confirmation d'un RDV :
 * 1. Email client FUSIONNÉ (détails RDV + préparation spécifique au service)
 * 2. Mémo Adrian (avec lien Google Calendar + lien fiche lead)
 */
export async function sendRdvConfirmationEmails(lead: LeadInfo, rdv: RendezVous): Promise<void> {
  const base = buildBaseParams(lead, rdv);
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

  const templateClient = getTemplateClient(rdv.type_visite);

  // Envoi en parallèle, on log les erreurs individuellement
  const results = await Promise.allSettled([
    sendOne({
      templateId: templateClient,
      toEmail: lead.email,
      params: base,
    }),
    sendOne({
      templateId: "template_rdv_memo_adrian",
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
 * PHASE 3 — Envoie la notification interne à Adrian confirmant
 * que le rappel J-1 a bien été envoyé au client.
 * À appeler depuis le cron juste après l'envoi réussi du rappel client.
 */
export async function sendRappelAdrianNotification(lead: LeadInfo, rdv: RendezVous): Promise<void> {
  await sendOne({
    templateId: "template_rdv_rappel_adrian",
    toEmail: ADRIAN_EMAIL,
    params: {
      from_name: lead.name,
      from_email: lead.email,
      phone: lead.phone,
      commune: lead.commune ?? "",
      date_rdv_formatee: formatDateLong(rdv.date_rdv),
      heure_rdv: formatHeure(rdv.heure_rdv),
      type_visite: rdv.type_visite,
    },
  });
}

/** Email envoyé au client lors d'une modification de RDV. */
export async function sendRdvModificationEmail(lead: LeadInfo, rdv: RendezVous): Promise<void> {
  await sendOne({
    templateId: "template_rdv_modification",
    toEmail: lead.email,
    params: buildBaseParams(lead, rdv),
  });
}

/** Email envoyé au client lors d'une annulation de RDV. */
export async function sendRdvAnnulationEmail(lead: LeadInfo, rdv: RendezVous): Promise<void> {
  await sendOne({
    templateId: "template_rdv_annulation",
    toEmail: lead.email,
    params: buildBaseParams(lead, rdv),
  });
}
