// Constantes partagées pour le module RDV

export const TYPES_VISITE = [
  "Visite devis - Mise en conformité RGIE",
  "Visite devis - Installation électrique complète",
  "Visite devis - Rénovation électrique",
  "Visite devis - Remplacement tableau électrique",
  "Visite devis - Borne de recharge voiture électrique",
  "Visite devis - Panneaux photovoltaïques",
  "Visite devis - Éclairage intérieur/extérieur",
  "Visite devis - Câblage informatique RJ45",
  "Visite devis - Parlophonie/vidéophonie",
  "Visite devis - Contrat de maintenance Pro",
  "Intervention - Dépannage",
  "Intervention - Chantier confirmé",
  "Autre",
] as const;

export type TypeVisite = (typeof TYPES_VISITE)[number];

export const DUREES_OPTIONS = [
  { value: 30, label: "30 minutes" },
  { value: 45, label: "45 minutes" },
  { value: 60, label: "1 heure" },
  { value: 90, label: "1h30" },
  { value: 120, label: "2 heures" },
] as const;

export const RDV_STATUTS = ["confirme", "rappel_envoye", "termine", "annule"] as const;
export type RdvStatut = (typeof RDV_STATUTS)[number];

export interface RendezVous {
  id: string;
  lead_id: string;
  date_rdv: string;     // "YYYY-MM-DD"
  heure_rdv: string;    // "HH:MM:SS"
  duree_minutes: number;
  type_visite: string;
  notes_internes: string | null;
  statut: RdvStatut;
  rappel_envoye_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Mappe un type de visite au template EmailJS CLIENT FUSIONNÉ
 * (détails du RDV + préparation spécifique au service).
 * Un seul email envoyé au client à la confirmation.
 */
export function getTemplateClient(typeVisite: string): string {
  const t = typeVisite.toLowerCase();
  if (t.includes("rgie") || t.includes("rénovation") || t.includes("remplacement tableau")) {
    return "template_rdv_client_rgie";
  }
  if (t.includes("installation électrique complète")) {
    return "template_rdv_client_installation";
  }
  if (t.includes("borne de recharge")) {
    return "template_rdv_client_borne";
  }
  if (t.includes("photovoltaïque") || t.includes("panneaux")) {
    return "template_rdv_client_pv";
  }
  return "template_rdv_client_generique";
}
