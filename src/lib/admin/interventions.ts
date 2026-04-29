/**
 * Logique métier pour les interventions (chantiers programmés).
 *
 * Différence vs rendez_vous : une intervention est un chantier engageant
 * (devis accepté, dates bloquées, possiblement multi-jours). Les rendez_vous
 * restent dédiés aux RDV exploratoires (visite technique, dépannage).
 *
 * Une intervention peut optionnellement être liée à un project (CMS vitrine)
 * pour transformer le chantier réalisé en réalisation publique.
 */

import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { TYPE_VISITES, type TypeVisite } from "./rdv-rapide";

/** Réutilise les 7 valeurs de TYPE_VISITES (alignées avec rendez_vous). */
export const TYPE_INTERVENTIONS = TYPE_VISITES;
export type TypeIntervention = TypeVisite;

export const STATUTS_INTERVENTION = [
  "programme",
  "en_cours",
  "termine",
  "reporte",
  "annule",
] as const;

export type StatutIntervention = (typeof STATUTS_INTERVENTION)[number];

export const STATUT_LABELS: Record<StatutIntervention, string> = {
  programme: "Programmé",
  en_cours: "En cours",
  termine: "Terminé",
  reporte: "Reporté",
  annule: "Annulé",
};

export const STATUT_BADGE_CLASSES: Record<StatutIntervention, string> = {
  programme: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  en_cours: "bg-orange-500/15 text-orange-600 border-orange-500/30",
  termine: "bg-green-500/15 text-green-700 border-green-500/30",
  reporte: "bg-yellow-500/15 text-yellow-700 border-yellow-500/30",
  annule: "bg-destructive/10 text-destructive border-destructive/30",
};

// ---------------------------------------------------------------------------
// Schema zod (formulaire de saisie)
// ---------------------------------------------------------------------------

const HEURE_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const interventionFormSchema = z
  .object({
    typeIntervention: z.enum(TYPE_INTERVENTIONS),
    dateDebut: z.string().min(1, "Date de début requise"),
    dateFin: z.string().min(1, "Date de fin requise"),
    heureDebut: z.string().regex(HEURE_REGEX, "Format HH:MM"),
    heureFin: z.string().regex(HEURE_REGEX, "Format HH:MM"),
    notesClient: z.string().max(2000).optional().or(z.literal("")),
    notesInternes: z.string().max(2000).optional().or(z.literal("")),
  })
  .refine((v) => v.dateFin >= v.dateDebut, {
    message: "La date de fin doit être ≥ à la date de début",
    path: ["dateFin"],
  })
  .refine(
    (v) => v.dateFin > v.dateDebut || v.heureFin > v.heureDebut,
    {
      message: "L'heure de fin doit être > à l'heure de début (même jour)",
      path: ["heureFin"],
    },
  );

export type InterventionFormValues = z.infer<typeof interventionFormSchema>;

// ---------------------------------------------------------------------------
// Types BDD côté app
// ---------------------------------------------------------------------------

export interface Intervention {
  id: string;
  lead_id: string;
  project_id: string | null;
  type_intervention: TypeIntervention;
  date_debut: string;
  date_fin: string;
  heure_debut: string;
  heure_fin: string;
  notes_client: string | null;
  notes_internes: string | null;
  statut: StatutIntervention;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export interface CreateInterventionInput extends InterventionFormValues {
  leadId: string;
}

export async function createIntervention(
  input: CreateInterventionInput,
): Promise<Intervention> {
  const { data, error } = await supabase
    .from("interventions")
    .insert({
      lead_id: input.leadId,
      type_intervention: input.typeIntervention,
      date_debut: input.dateDebut,
      date_fin: input.dateFin,
      heure_debut: normalizeTime(input.heureDebut),
      heure_fin: normalizeTime(input.heureFin),
      notes_client: input.notesClient?.trim() || null,
      notes_internes: input.notesInternes?.trim() || null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as Intervention;
}

export interface UpdateInterventionInput extends InterventionFormValues {
  id: string;
}

export async function updateIntervention(
  input: UpdateInterventionInput,
): Promise<Intervention> {
  const { data, error } = await supabase
    .from("interventions")
    .update({
      type_intervention: input.typeIntervention,
      date_debut: input.dateDebut,
      date_fin: input.dateFin,
      heure_debut: normalizeTime(input.heureDebut),
      heure_fin: normalizeTime(input.heureFin),
      notes_client: input.notesClient?.trim() || null,
      notes_internes: input.notesInternes?.trim() || null,
    })
    .eq("id", input.id)
    .select("*")
    .single();
  if (error) throw error;
  return data as Intervention;
}

export async function updateInterventionStatut(
  id: string,
  statut: StatutIntervention,
): Promise<Intervention> {
  const { data, error } = await supabase
    .from("interventions")
    .update({ statut })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as Intervention;
}

export async function fetchInterventionsForLead(leadId: string): Promise<Intervention[]> {
  const { data, error } = await supabase
    .from("interventions")
    .select("*")
    .eq("lead_id", leadId)
    .order("date_debut", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Intervention[];
}

export async function fetchAllInterventions(): Promise<Intervention[]> {
  const { data, error } = await supabase
    .from("interventions")
    .select("*")
    .order("date_debut", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Intervention[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Indique si la plage de dates inclut un samedi ou dimanche.
 * Sert au warning visuel non-bloquant côté UI.
 */
export function inclutWeekend(dateDebut: string, dateFin: string): boolean {
  const [yd, md, dd] = dateDebut.split("-").map(Number);
  const [yf, mf, df] = dateFin.split("-").map(Number);
  const start = new Date(yd, md - 1, dd);
  const end = new Date(yf, mf - 1, df);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const day = d.getDay();
    if (day === 0 || day === 6) return true;
  }
  return false;
}

/**
 * Suggestions d'horaires par défaut selon le type d'intervention.
 */
export const HORAIRES_DEFAUT_PAR_TYPE: Record<
  TypeIntervention,
  { heureDebut: string; heureFin: string }
> = {
  Devis: { heureDebut: "10:00", heureFin: "11:00" },
  "Visite technique": { heureDebut: "10:00", heureFin: "11:00" },
  Dépannage: { heureDebut: "08:00", heureFin: "12:00" },
  "Inspection RGIE": { heureDebut: "09:00", heureFin: "12:00" },
  "Installation borne de recharge": { heureDebut: "08:00", heureFin: "17:00" },
  "Installation panneaux photovoltaïques": { heureDebut: "08:00", heureFin: "17:00" },
  Autre: { heureDebut: "09:00", heureFin: "17:00" },
};

/**
 * S'assure que l'heure est au format HH:MM:SS pour Postgres `time`.
 * Le navigateur retourne parfois HH:MM, on padding au besoin.
 */
function normalizeTime(t: string): string {
  return t.length === 5 ? `${t}:00` : t;
}
