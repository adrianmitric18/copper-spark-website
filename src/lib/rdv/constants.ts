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
 * Renvoie les 5 booléens Handlebars correspondant au type de visite,
 * à passer au template fusionné `template_rdv_client_fusion`.
 * Un seul booléen est `true`, les 4 autres `false`.
 */
export function getServiceFlags(typeVisite: string): {
  is_rgie: boolean;
  is_pv: boolean;
  is_borne: boolean;
  is_installation: boolean;
  is_generique: boolean;
} {
  const t = typeVisite.toLowerCase();
  const is_rgie =
    t.includes("rgie") ||
    t.includes("rénovation") ||
    t.includes("remplacement tableau");
  const is_pv = !is_rgie && (t.includes("photovoltaïque") || t.includes("panneaux"));
  const is_borne = !is_rgie && !is_pv && t.includes("borne de recharge");
  const is_installation =
    !is_rgie && !is_pv && !is_borne && t.includes("installation électrique complète");
  const is_generique = !is_rgie && !is_pv && !is_borne && !is_installation;
  return { is_rgie, is_pv, is_borne, is_installation, is_generique };
}
