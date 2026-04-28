/**
 * Logique métier pour la page /admin/rdv-rapide.
 *
 * Un RDV rapide = 1 lead léger + 1 rendez_vous, créés en 2 INSERTs séquentiels
 * (Supabase JS ne supporte pas les transactions multi-table, on rollback à
 * la main si l'INSERT rendez_vous échoue).
 *
 * Pour respecter les contraintes NOT NULL côté schema `leads` (email,
 * address, client_type, services, message), on remplit avec des placeholders
 * sensibles. Adrian peut enrichir le lead plus tard via la fiche détail.
 */

import { supabase } from "@/integrations/supabase/client";

export const TYPE_VISITES = [
  "Devis",
  "Visite technique",
  "Dépannage",
  "Inspection RGIE",
  "Pose borne VE",
  "Autre",
] as const;

export type TypeVisite = (typeof TYPE_VISITES)[number];

/**
 * Durées par défaut selon le type de visite (en minutes).
 * Validé avec l'utilisateur le 2026-04-29.
 */
export const DUREE_DEFAUT_PAR_TYPE: Record<TypeVisite, number> = {
  Devis: 60,
  "Visite technique": 60,
  Dépannage: 90,
  "Inspection RGIE": 120,
  "Pose borne VE": 180,
  Autre: 60,
};

export interface RdvRapideInput {
  name: string;
  phone: string;
  /** YYYY-MM-DD */
  dateRdv: string;
  /** HH:MM */
  heureRdv: string;
  typeVisite: TypeVisite;
  dureeMinutes: number;
  /** Adresse du chantier, optionnelle. */
  address?: string;
  /** Notes internes courtes. */
  notes?: string;
}

export interface RdvRapideResult {
  leadId: string;
  rdvId: string;
}

/**
 * Crée un lead minimal puis un rendez_vous attaché. Si l'INSERT du rdv
 * échoue, on supprime le lead créé pour ne pas laisser de fantôme.
 */
export async function createRdvRapide(input: RdvRapideInput): Promise<RdvRapideResult> {
  // 1. INSERT lead minimal — placeholders pour les NOT NULL non saisis
  const placeholderEmail = `rdv-${Date.now()}@local.cuivre-electrique.com`;
  const adresseFinale = input.address?.trim() || "À préciser";
  const messageFinal =
    input.notes?.trim() ||
    `RDV ${input.typeVisite.toLowerCase()} pris par téléphone le ${new Date().toLocaleDateString("fr-BE")}.`;

  const { data: lead, error: leadErr } = await supabase
    .from("leads")
    .insert({
      name: input.name.trim(),
      phone: input.phone.trim(),
      email: placeholderEmail,
      address: adresseFinale,
      client_type: "Particulier",
      services: ["rdv_rapide"],
      message: messageFinal,
      gdpr_consent: true,
      source: "rdv_rapide",
      status: "rdv_pris",
    })
    .select("id")
    .single();

  if (leadErr) throw leadErr;

  // 2. INSERT rendez_vous
  const { data: rdv, error: rdvErr } = await supabase
    .from("rendez_vous")
    .insert({
      lead_id: lead.id,
      date_rdv: input.dateRdv,
      heure_rdv: input.heureRdv,
      type_visite: input.typeVisite,
      duree_minutes: input.dureeMinutes,
      notes_internes: input.notes?.trim() || null,
      statut: "confirme",
    })
    .select("id")
    .single();

  if (rdvErr) {
    // Rollback manuel : supprime le lead orphelin
    await supabase.from("leads").delete().eq("id", lead.id);
    throw rdvErr;
  }

  return { leadId: lead.id, rdvId: rdv.id };
}
