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
import {
  TYPES_VISITE,
  familleDeVisite,
  type TypeVisite,
  type ServiceFamily,
} from "@/lib/rdv/constants";

// Source unique : on réexporte la liste partagée sous l'ancien nom pour les
// imports existants. La vérité vit dans @/lib/rdv/constants.
export const TYPE_VISITES = TYPES_VISITE;
export type { TypeVisite };

/**
 * Durées par défaut (minutes) par FAMILLE de service.
 *   - Devis / Visite technique : 60 min
 *   - Dépannage                : 90 min
 *   - Inspection RGIE          : 120 min
 *   - Borne de recharge (sous-tableau + pose + mise en service) : 180 min
 *   - Panneaux PV (étude faisabilité + repérage)                : 240 min
 *   - Autre                    : 60 min (à ajuster)
 */
export const DUREE_DEFAUT_PAR_FAMILLE: Record<ServiceFamily, number> = {
  Devis: 60,
  "Visite technique": 60,
  Dépannage: 90,
  "Inspection RGIE": 120,
  "Installation borne de recharge": 180,
  "Installation panneaux photovoltaïques": 240,
  Autre: 60,
};

/**
 * Délai d'appel par défaut suggéré (minutes avant l'arrivée) par FAMILLE.
 *   - Dépannage       : 15 min (urgence, déplacement court à anticiper)
 *   - Borne / PV      : 45 min (gros chantier, accès à dégager)
 *   - Tous les autres : 30 min (standard)
 */
export const DELAI_APPEL_DEFAUT_PAR_FAMILLE: Record<ServiceFamily, number> = {
  Devis: 30,
  "Visite technique": 30,
  Dépannage: 15,
  "Inspection RGIE": 30,
  "Installation borne de recharge": 45,
  "Installation panneaux photovoltaïques": 45,
  Autre: 30,
};

/** Durée par défaut suggérée pour un type de visite (résolue via sa famille). */
export function dureeDefaut(type: string): number {
  return DUREE_DEFAUT_PAR_FAMILLE[familleDeVisite(type)];
}

/** Délai d'appel par défaut suggéré pour un type de visite (via sa famille). */
export function delaiDefaut(type: string): number {
  return DELAI_APPEL_DEFAUT_PAR_FAMILLE[familleDeVisite(type)];
}

/** Presets cliquables proposés sous le champ délai d'appel. */
export const DELAI_APPEL_PRESETS = [15, 30, 45, 60] as const;

export interface RdvRapideInput {
  name: string;
  phone: string;
  /** Email du client, optionnel. Si vide, on stocke un placeholder local. */
  email?: string;
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
  /**
   * Minutes avant l'arrivée pendant lesquelles Adrian appelle le client.
   * NULL/undefined = mention masquée dans les templates.
   */
  delaiAppelMinutes?: number | null;
}

export interface RdvRapideResult {
  leadId: string;
  rdvId: string;
}

/**
 * T1 — Lead express (appel sans RDV).
 * Entrée minimale d'un lead pris au téléphone quand AUCUNE date n'est encore
 * fixée. Mêmes placeholders que `createRdvRapide` pour respecter les NOT NULL
 * du schema `leads` (email/adresse/message), donc ZÉRO changement DB. Adrian
 * enrichit / cale le RDV plus tard depuis la fiche.
 */
export interface LeadRapideInput {
  name: string;
  phone: string;
  /** Email du client, optionnel. Si vide → placeholder local (hasUsableEmail le filtre). */
  email?: string;
  /** Adresse / commune, optionnelle. */
  address?: string;
  /** Notes internes courtes. */
  notes?: string;
}

export interface LeadRapideResult {
  leadId: string;
}

// T4 — Anti-doublon par téléphone.
// Normalise un numéro belge en digits significatifs (sans préfixe 0 / +32),
// pour comparer deux numéros saisis dans des formats différents.
export function normalizePhone(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("0032")) d = d.slice(4);
  else if (d.startsWith("32") && d.length > 9) d = d.slice(2);
  else if (d.startsWith("0")) d = d.slice(1);
  return d;
}

export interface LeadMatch {
  id: string;
  name: string;
  phone: string;
  status: string | null;
}

/**
 * Cherche les leads existants ayant le même numéro (anti-doublon, T4).
 * Pré-filtre serveur lâche (ilike sur les digits intercalés de "%", tolère les
 * séparateurs) puis comparaison EXACTE normalisée côté client. Aucune colonne
 * ni contrainte DB : pure lecture.
 */
export async function findLeadsByPhone(rawPhone: string): Promise<LeadMatch[]> {
  const norm = normalizePhone(rawPhone);
  if (norm.length < 6) return []; // trop court pour être fiable
  const pattern = "%" + norm.split("").join("%") + "%";
  const { data, error } = await supabase
    .from("leads")
    .select("id, name, phone, status")
    .ilike("phone", pattern)
    .limit(20);
  if (error) throw error;
  return (data ?? []).filter((l) => normalizePhone(l.phone) === norm);
}

/** Crée un lead minimal sans rendez-vous (lead express téléphone). */
export async function createLeadRapide(input: LeadRapideInput): Promise<LeadRapideResult> {
  const placeholderEmail = `lead-${Date.now()}@local.cuivre-electrique.com`;
  const emailFinal = input.email?.trim() || placeholderEmail;
  const adresseFinale = input.address?.trim() || "À préciser";
  const messageFinal =
    input.notes?.trim() ||
    `Lead créé par téléphone le ${new Date().toLocaleDateString("fr-BE")}.`;

  // La policy RLS d'INSERT minimale ("Admin can insert rdv_rapide leads",
  // migration 20260429100000) exige source='rdv_rapide' ET status='rdv_pris'.
  // On réutilise donc ces valeurs (mêmes que createRdvRapide, qui passe déjà) :
  // l'absence de rendez_vous distingue un lead express d'un RDV rapide, pas le
  // statut. Aligné ici pour rester SANS changement DB.
  const { data: lead, error } = await supabase
    .from("leads")
    .insert({
      name: input.name.trim(),
      phone: input.phone.trim(),
      email: emailFinal,
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

  if (error) throw error;
  return { leadId: lead.id };
}

/**
 * Crée un lead minimal puis un rendez_vous attaché. Si l'INSERT du rdv
 * échoue, on supprime le lead créé pour ne pas laisser de fantôme.
 */
export async function createRdvRapide(input: RdvRapideInput): Promise<RdvRapideResult> {
  // 1. INSERT lead minimal — placeholders pour les NOT NULL non saisis.
  // Si Adrian a saisi le vrai email du client, on l'utilise (utile pour
  // l'envoi futur de confirmation par email). Sinon on génère un placeholder
  // local unique pour respecter la contrainte NOT NULL du schema leads.
  const placeholderEmail = `rdv-${Date.now()}@local.cuivre-electrique.com`;
  const emailFinal = input.email?.trim() || placeholderEmail;
  const adresseFinale = input.address?.trim() || "À préciser";
  const messageFinal =
    input.notes?.trim() ||
    `RDV ${input.typeVisite.toLowerCase()} pris par téléphone le ${new Date().toLocaleDateString("fr-BE")}.`;

  const { data: lead, error: leadErr } = await supabase
    .from("leads")
    .insert({
      name: input.name.trim(),
      phone: input.phone.trim(),
      email: emailFinal,
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
      delai_appel_minutes: input.delaiAppelMinutes ?? null,
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
