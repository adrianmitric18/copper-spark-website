// Couche d'accès Supabase centralisée pour les pages /admin.
// Encapsule le retry, le typage, et les opérations composites
// (ex: suppression d'un lead = effacement DB + photos storage).

import { supabase } from "@/integrations/supabase/client";
import {
  RDV_STATUTS_ACTIFS,
  STATUT_REACTIVATION,
  isStatutAvecRdv,
  isTerminal,
  todayIsoLocal,
  type Lead,
  type Rdv,
  type TerminalLeadStatus,
  type Testimonial,
  type UpcomingByLead,
} from "@/lib/admin/types";
import { ajouterTrace, formatTraceEnvoi, formatTraceNote, type CanalEnvoi } from "@/lib/admin/envois";
import {
  LIBELLE_RATTRAPAGE,
  TRACE_APPEL,
  TRACE_APPEL_JOINT,
  TRACE_APPEL_SANS_REPONSE,
  TRACE_DEJA_REPONDU,
  genreRdv,
  jourMois,
  statutApresMessage,
  type ActionAuto,
  type StatutRattrapage,
} from "@/lib/admin/statuts-auto";

// Source unique de « l'email est-il réel ? » pour toutes les pages admin.
export { hasUsableEmail } from "@/lib/admin/envois";

// =====================================================================
//  Helpers internes
// =====================================================================

const DEFAULT_RETRIES = 2;
const DEFAULT_RETRY_DELAY_MS = 900;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Wrapping retry simple pour les requêtes critiques (chargement initial). */
async function withRetry<T>(
  fn: () => Promise<T>,
  retries = DEFAULT_RETRIES,
  delayMs = DEFAULT_RETRY_DELAY_MS,
): Promise<T> {
  let lastErr: unknown = new Error("operation failed");
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (attempt < retries) await sleep(delayMs);
    }
  }
  throw lastErr;
}

/** Date du jour au format YYYY-MM-DD (Belgique). */
const todayDateStr = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// =====================================================================
//  Queries — Leads
// =====================================================================

/**
 * Charge tous les leads + une map des prochains RDV par lead.
 * Utilisé par le Dashboard. Retry automatique sur erreur réseau.
 */
export async function fetchLeadsWithUpcomingRdvs(): Promise<{
  leads: Lead[];
  upcomingByLead: UpcomingByLead;
}> {
  return withRetry(async () => {
    const today = todayDateStr();
    const [leadsRes, rdvRes] = await Promise.all([
      supabase.from("leads").select("*").order("created_at", { ascending: false }),
      supabase
        .from("rendez_vous")
        .select("lead_id, date_rdv, heure_rdv")
        .neq("statut", "annule")
        .gte("date_rdv", today)
        .order("date_rdv", { ascending: true })
        .order("heure_rdv", { ascending: true }),
    ]);

    if (leadsRes.error) throw leadsRes.error;
    if (rdvRes.error) throw rdvRes.error;

    const upcomingByLead: UpcomingByLead = {};
    for (const r of (rdvRes.data || []) as Array<Pick<Rdv, "lead_id" | "date_rdv" | "heure_rdv">>) {
      if (!upcomingByLead[r.lead_id]) {
        upcomingByLead[r.lead_id] = { date_rdv: r.date_rdv, heure_rdv: r.heure_rdv };
      }
    }

    return {
      leads: (leadsRes.data as Lead[]) || [],
      upcomingByLead,
    };
  });
}

/** Charge un lead par son ID. Retourne null si introuvable. */
export async function fetchLeadById(id: string): Promise<Lead | null> {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as Lead | null) ?? null;
}

/** Met à jour le statut d'un lead. */
export async function updateLeadStatus(leadId: string, status: string): Promise<void> {
  const { error } = await supabase.from("leads").update({ status }).eq("id", leadId);
  if (error) throw error;
}

/** Clôt (statut `termine`) les RDV passés encore ouverts d'un ou plusieurs leads. */
async function cloreRdvPasses(leadIds: string[]): Promise<boolean> {
  const { error } = await supabase
    .from("rendez_vous")
    .update({ statut: "termine" })
    .in("lead_id", leadIds)
    .in("statut", [...RDV_STATUTS_ACTIFS])
    .lt("date_rdv", todayIsoLocal());
  if (error) console.warn("RDV passés non clôturés :", error.message);
  return !error;
}

/**
 * « Terminer » un lead (converti / sans suite / perdu), quel que soit son état.
 * Ferme aussi ses RDV pour qu'aucun ne traîne :
 *  - RDV passés encore ouverts → `termine` ;
 *  - RDV du jour ou à venir → `annule` si le lead est perdu ou sans suite (un
 *    lead converti garde son RDV : la pose peut être à venir). Aucun message
 *    n'est envoyé au client.
 * Le statut du lead est écrit d'abord ; `rdvOk` dit si les RDV ont suivi.
 */
export async function terminerLead(
  leadId: string,
  status: TerminalLeadStatus,
): Promise<{ rdvOk: boolean }> {
  await updateLeadStatus(leadId, status);
  let rdvOk = await cloreRdvPasses([leadId]);
  if (status !== "converti") {
    const { error } = await supabase
      .from("rendez_vous")
      .update({ statut: "annule" })
      .eq("lead_id", leadId)
      .in("statut", [...RDV_STATUTS_ACTIFS])
      .gte("date_rdv", todayIsoLocal());
    if (error) {
      console.warn("RDV à venir non annulés :", error.message);
      rdvOk = false;
    }
  }
  return { rdvOk };
}

/** Passe un RDV en « terminé » (bouton « Terminer » du bloc « RDV passé »). */
export async function terminerRdv(rdvId: string): Promise<void> {
  const { error } = await supabase.from("rendez_vous").update({ statut: "termine" }).eq("id", rdvId);
  if (error) throw error;
}

// Toutes les écritures de notes (enregistrement manuel + traces d'envoi)
// passent par cette file : deux boutons tapés coup sur coup, ou une trace
// pendant un enregistrement, ne s'écrasent plus (lecture-puis-écriture non
// atomique sinon). Un échec ne casse pas la file pour les suivants.
let fileNotes: Promise<unknown> = Promise.resolve();
function enFileNotes<T>(tache: () => Promise<T>): Promise<T> {
  const suite = fileNotes.then(tache, tache);
  fileNotes = suite.catch(() => undefined);
  return suite;
}

/** Met à jour les notes internes d'un lead. */
export async function updateLeadNotes(leadId: string, notes: string): Promise<void> {
  return enFileNotes(async () => {
    const { error } = await supabase.from("leads").update({ notes_internes: notes }).eq("id", leadId);
    if (error) throw error;
  });
}

/**
 * Règle 6 du brief admin : taper SMS / WhatsApp / Email ajoute une ligne
 * horodatée aux notes internes du lead (« 04/11/2026 16:30 — WhatsApp :
 * Confirmation RDV »). Ne lève jamais : un échec de trace ne doit pas gêner
 * l'ouverture du message. Retourne la ligne ajoutée, ou null si non écrite.
 */
export async function traceEnvoi(leadId: string, canal: CanalEnvoi, titre: string): Promise<string | null> {
  // Lot « statuts auto » : le message envoyé fait aussi avancer le statut
  // (Bien reçu → traité, Confirmation RDV → RDV confirmé, Démarrage chantier
  // et Avis → converti), dans la même écriture que la trace.
  return ajouterLigneAuxNotes(leadId, formatTraceEnvoi(canal, titre), titre);
}

/**
 * Taper « Appeler » : trace l'appel, sans toucher au statut (le client n'a
 * peut-être pas décroché). Sur un lead « nouveau », l'écran pose ensuite
 * « Tu l'as eu ? » (`repondreAppel`). Ne lève jamais.
 */
export async function traceAppel(leadId: string): Promise<string | null> {
  return ajouterLigneAuxNotes(leadId, formatTraceNote(TRACE_APPEL), TRACE_APPEL);
}

/**
 * Réponse à « Tu l'as eu ? » : « Oui » → traité ; « Pas de réponse » → le lead
 * reste « nouveau », l'essai est compté dans ses notes. Ne lève jamais.
 */
export async function repondreAppel(leadId: string, joint: boolean): Promise<string | null> {
  const titre = joint ? TRACE_APPEL_JOINT : TRACE_APPEL_SANS_REPONSE;
  return ajouterLigneAuxNotes(leadId, formatTraceNote(titre), titre);
}

/** Bouton « Déjà répondu » de l'accueil : réponse donnée hors admin → « traité ». */
export async function marquerDejaRepondu(leadId: string): Promise<string | null> {
  return ajouterLigneAuxNotes(leadId, formatTraceNote(TRACE_DEJA_REPONDU), TRACE_DEJA_REPONDU);
}

/**
 * Trace d'une décision sans envoi (ex. « Avis : non ») : même ligne horodatée
 * dans les notes internes, sans canal. Ne lève jamais.
 */
export async function traceNote(leadId: string, texte: string): Promise<string | null> {
  return ajouterLigneAuxNotes(leadId, formatTraceNote(texte));
}

/**
 * `titreMessage` fourni → le statut du lead avance selon le message
 * (`statutApresMessage`), dans la même écriture. Jamais de retour en arrière,
 * un statut terminé ne bouge pas.
 */
async function ajouterLigneAuxNotes(leadId: string, ligne: string, titreMessage?: string): Promise<string | null> {
  try {
    return await enFileNotes(async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("notes_internes, notes, status")
        .eq("id", leadId)
        .maybeSingle();
      if (error) throw error;
      // Même repli que la fiche (notes_internes || notes) : un vieux lead dont
      // seule la colonne historique `notes` est remplie ne perd pas sa note.
      const base = data?.notes_internes || data?.notes || "";
      const patch: { notes_internes: string; status?: string } = { notes_internes: ajouterTrace(base, ligne) };
      const suivant = titreMessage && data ? statutApresMessage(data.status, titreMessage) : null;
      if (suivant) patch.status = suivant;
      const { error: upErr } = await supabase.from("leads").update(patch).eq("id", leadId);
      if (upErr) throw upErr;
      return ligne;
    });
  } catch (e) {
    console.warn("Trace d'envoi non enregistrée :", e);
    return null;
  }
}

/**
 * Tier 1 / Phase 3.1 — marque (ou efface) la date d'envoi du devis.
 * Cette date `devis_envoye_at` est la base des relances J+3/7/14 (carte cockpit).
 * Quand on stampe une date, on bascule aussi le statut sur "devis envoyé" pour
 * que le lead apparaisse bien dans le suivi des relances. `null` efface la date.
 */
export async function setLeadDevisEnvoye(leadId: string, dateStr: string | null): Promise<void> {
  const patch: { devis_envoye_at: string | null; status?: string } = { devis_envoye_at: dateStr };
  if (dateStr) patch.status = "devis envoyé";
  const { error } = await supabase.from("leads").update(patch).eq("id", leadId);
  if (error) throw error;
}

// =====================================================================
//  Statuts automatiques (lot 2026-11) — écritures
// =====================================================================

/** Passe des RDV encore ouverts en « terminé », par identifiant. */
async function cloreRdvs(rdvIds: string[]): Promise<void> {
  if (rdvIds.length === 0) return;
  const { error } = await supabase
    .from("rendez_vous")
    .update({ statut: "termine" })
    .in("id", rdvIds)
    .in("statut", [...RDV_STATUTS_ACTIFS]);
  if (error) throw error;
}

/**
 * Applique les actions calculées par `calculerActionsAuto`. Le statut n'est
 * écrit que si le lead a toujours le statut vu au calcul (un changement fait
 * entre-temps gagne). Ne lève jamais ; retourne les actions réellement faites.
 */
export async function appliquerActionsAuto(actions: ActionAuto[]): Promise<ActionAuto[]> {
  const faites: ActionAuto[] = [];
  for (const a of actions) {
    try {
      if (a.statutApres) {
        const { data, error } = await supabase
          .from("leads")
          .update({ status: a.statutApres })
          .eq("id", a.leadId)
          .eq("status", a.statutAvant)
          .select("id");
        if (error) throw error;
        if (!data || data.length === 0) continue;
      }
      await cloreRdvs(a.rdvIds);
      if (a.trace) await traceNote(a.leadId, a.trace);
      faites.push(a);
    } catch (e) {
      console.warn("Mise à jour automatique non appliquée :", a.leadName, e);
    }
  }
  return faites;
}

/**
 * « C'est fait » sur un RDV passé (accueil, calendrier) : le RDV passe en
 * « terminé ». Une intervention convertit le lead ; sinon un lead « RDV
 * confirmé » / rdv_pris repasse en « traité ». Retourne le nouveau statut du
 * lead, ou null s'il n'a pas changé.
 */
export async function marquerRdvFait(r: {
  id: string;
  lead_id: string;
  date_rdv: string;
  type_visite: string;
  lead_status: string;
}): Promise<string | null> {
  // Le statut du lead d'abord : si la suite échoue, le RDV reste ouvert et
  // réapparaît sur l'accueil (l'inverse perdrait la conversion sans bruit).
  if (isTerminal(r.lead_status)) {
    await terminerRdv(r.id);
    return null;
  }
  if (genreRdv(r.type_visite) === "intervention") {
    await terminerLead(r.lead_id, "converti");
    await terminerRdv(r.id);
    void traceNote(r.lead_id, `Intervention du ${jourMois(r.date_rdv)} : c'est fait`);
    return "converti";
  }
  if (isStatutAvecRdv(r.lead_status)) {
    await updateLeadStatus(r.lead_id, STATUT_REACTIVATION);
    await terminerRdv(r.id);
    return STATUT_REACTIVATION;
  }
  await terminerRdv(r.id);
  return null;
}

export interface LigneRattrapage {
  leadId: string;
  leadName: string;
  statutAvant: string;
  statut: StatutRattrapage;
  /** Date du devis si la ligne passe en « devis envoyé ». */
  dateDevis: string | null;
}

/**
 * Écran « Mise à jour proposée » : applique les lignes validées par Adrian.
 * Chaque lead reçoit son statut, ses RDV passés sont clôturés, et une ligne
 * est tracée dans ses notes. Retourne les noms en échec (liste vide = tout bon).
 */
export async function appliquerRattrapage(lignes: LigneRattrapage[]): Promise<string[]> {
  const echecs: string[] = [];
  for (const l of lignes) {
    try {
      if (l.statut === "devis envoyé") {
        await setLeadDevisEnvoye(l.leadId, l.dateDevis ?? todayIsoLocal());
        await cloreRdvPasses([l.leadId]);
      } else {
        await terminerLead(l.leadId, l.statut);
      }
      await traceNote(l.leadId, `Mise à jour validée : ${l.statutAvant} → ${LIBELLE_RATTRAPAGE[l.statut]}`);
    } catch (e) {
      console.warn("Rattrapage non appliqué :", l.leadName, e);
      echecs.push(l.leadName);
    }
  }
  return echecs;
}

/**
 * Supprime un lead + ses photos associées dans le storage.
 * Logique précédemment dupliquée entre Dashboard et LeadDetail.
 * Les erreurs de storage sont loggées mais n'empêchent pas la suppression DB.
 */
export async function deleteLeadWithPhotos(lead: Pick<Lead, "id" | "photo_urls">): Promise<void> {
  if (lead.photo_urls?.length) {
    const { error: storageErr } = await supabase.storage
      .from("lead-photos")
      .remove(lead.photo_urls);
    if (storageErr) {
      // Non bloquant — on continue avec la suppression DB
      console.warn("Photos non supprimées:", storageErr.message);
    }
  }
  const { error } = await supabase.from("leads").delete().eq("id", lead.id);
  if (error) throw error;
}

/**
 * Génère des URLs signées (1h) pour afficher les photos d'un lead.
 * Filtre les URLs invalides.
 */
export async function fetchLeadPhotoSignedUrls(paths: string[]): Promise<string[]> {
  if (!paths.length) return [];
  const urls = await Promise.all(
    paths.map(async (path) => {
      const { data } = await supabase.storage.from("lead-photos").createSignedUrl(path, 3600);
      return data?.signedUrl || "";
    }),
  );
  return urls.filter(Boolean);
}

// =====================================================================
//  Queries — Rendez-vous
// =====================================================================

/** Type retourné par fetchAllRdvs : RDV joint avec quelques infos lead. */
export type RdvWithLead = {
  id: string;
  lead_id: string;
  date_rdv: string;
  heure_rdv: string;
  type_visite: string;
  statut: string;
  lead_name: string;
  lead_phone: string;
  lead_commune: string | null;
  // Adresse précise pour le bouton « Itinéraire » du cockpit (Phase 1.2).
  // Colonnes déjà présentes sur `leads` — simple extension de la jointure.
  lead_rue: string | null;
  lead_numero: string | null;
  lead_code_postal: string | null;
  // Phase 2.1 — nécessaires au rappel J-1 (email client via sendRappelJ1Emails).
  duree_minutes: number;
  lead_email: string;
  /** Statut du lead (pour le bouton « Terminer » du calendrier). */
  lead_status: string;
};

/** Charge tous les RDV avec les infos client (jointure leads). Utilisé par /admin/rdv. */
export async function fetchAllRdvs(): Promise<RdvWithLead[]> {
  const { data, error } = await supabase
    .from("rendez_vous")
    .select(
      "id, lead_id, date_rdv, heure_rdv, duree_minutes, type_visite, statut, leads(name, phone, email, commune, rue, numero, code_postal, status)",
    )
    .order("date_rdv", { ascending: true })
    .order("heure_rdv", { ascending: true });
  if (error) throw error;
  return ((data as Array<Record<string, unknown>>) || []).map((r) => {
    const leadJoin = r.leads as {
      name?: string;
      phone?: string;
      email?: string;
      commune?: string | null;
      rue?: string | null;
      numero?: string | null;
      code_postal?: string | null;
      status?: string | null;
    } | null;
    return {
      id: r.id as string,
      lead_id: r.lead_id as string,
      date_rdv: r.date_rdv as string,
      heure_rdv: r.heure_rdv as string,
      type_visite: r.type_visite as string,
      statut: r.statut as string,
      lead_name: leadJoin?.name ?? "—",
      lead_phone: leadJoin?.phone ?? "",
      lead_commune: leadJoin?.commune ?? null,
      lead_rue: leadJoin?.rue ?? null,
      lead_numero: leadJoin?.numero ?? null,
      lead_code_postal: leadJoin?.code_postal ?? null,
      duree_minutes: (r.duree_minutes as number) ?? 60,
      lead_email: leadJoin?.email ?? "",
      lead_status: leadJoin?.status ?? "",
    };
  });
}

/**
 * Charge le RDV actif (confirmé ou en rappel) pour un lead donné.
 * Utilisé par LeadDetail. Retourne null si aucun RDV actif.
 */
export async function fetchActiveRdvForLead(leadId: string): Promise<Rdv | null> {
  const { data, error } = await supabase
    .from("rendez_vous")
    .select("*")
    .eq("lead_id", leadId)
    .in("statut", ["confirme", "rappel_envoye"])
    .order("date_rdv", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as Rdv | null) ?? null;
}

// =====================================================================
//  Queries — Testimonials
// =====================================================================

/** Charge tous les avis (publiés ou non), triés par date décroissante. */
export async function fetchTestimonials(): Promise<Testimonial[]> {
  const { data, error } = await supabase
    .from("testimonials")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as Testimonial[]) || [];
}

/** Supprime un témoignage. */
export async function deleteTestimonial(id: string): Promise<void> {
  const { error } = await supabase.from("testimonials").delete().eq("id", id);
  if (error) throw error;
}
