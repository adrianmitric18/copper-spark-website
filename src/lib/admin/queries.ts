// Couche d'accès Supabase centralisée pour les pages /admin.
// Encapsule le retry, le typage, et les opérations composites
// (ex: suppression d'un lead = effacement DB + photos storage).

import { supabase } from "@/integrations/supabase/client";
import type { Lead, Rdv, Testimonial, UpcomingByLead } from "@/lib/admin/types";

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

/** Met à jour les notes internes d'un lead. */
export async function updateLeadNotes(leadId: string, notes: string): Promise<void> {
  const { error } = await supabase.from("leads").update({ notes_internes: notes }).eq("id", leadId);
  if (error) throw error;
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
};

/** Charge tous les RDV avec les infos client (jointure leads). Utilisé par /admin/rdv. */
export async function fetchAllRdvs(): Promise<RdvWithLead[]> {
  const { data, error } = await supabase
    .from("rendez_vous")
    .select("id, lead_id, date_rdv, heure_rdv, type_visite, statut, leads(name, phone, commune)")
    .order("date_rdv", { ascending: true })
    .order("heure_rdv", { ascending: true });
  if (error) throw error;
  return ((data as Array<Record<string, unknown>>) || []).map((r) => {
    const leadJoin = r.leads as { name?: string; phone?: string; commune?: string | null } | null;
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
