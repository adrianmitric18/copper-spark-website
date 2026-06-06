// Constantes partagées pour le module RDV.
//
// ⚠️ SOURCE UNIQUE des types de visite. Cette liste est utilisée par :
//   - la fiche lead (RendezVousForm)
//   - la page RDV rapide (rdv-rapide.ts / RdvRapide.tsx)
//   - la contrainte DB `rdv_type_visite_valide` (migration alignée dessus)
// Toute valeur hors liste est rejetée par Postgres à l'INSERT (code 23514).
// Les interventions/chantiers ont leur PROPRE liste (voir interventions.ts).

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

// ---------------------------------------------------------------------------
// Familles de templates / métadonnées
// ---------------------------------------------------------------------------
// Les 13 types de visite (granulaires, orientés UX admin) sont rattachés à
// 7 familles. Les familles portent la copie éditoriale (message-templates.ts)
// et les défauts de durée/délai (rdv-rapide.ts). Ça évite de dupliquer du
// contenu client pour chaque sous-type. Les noms de familles sont aussi les
// 7 valeurs de la table interventions, d'où l'identité côté interventions.

export const SERVICE_FAMILIES = [
  "Devis",
  "Visite technique",
  "Dépannage",
  "Inspection RGIE",
  "Installation borne de recharge",
  "Installation panneaux photovoltaïques",
  "Autre",
] as const;

export type ServiceFamily = (typeof SERVICE_FAMILIES)[number];

/** Chaque libellé de visite (13) → la famille de template la plus proche (7). */
export const FAMILLE_PAR_TYPE_VISITE: Record<TypeVisite, ServiceFamily> = {
  "Visite devis - Mise en conformité RGIE": "Inspection RGIE",
  "Visite devis - Installation électrique complète": "Devis",
  "Visite devis - Rénovation électrique": "Devis",
  "Visite devis - Remplacement tableau électrique": "Devis",
  "Visite devis - Borne de recharge voiture électrique": "Installation borne de recharge",
  "Visite devis - Panneaux photovoltaïques": "Installation panneaux photovoltaïques",
  "Visite devis - Éclairage intérieur/extérieur": "Devis",
  "Visite devis - Câblage informatique RJ45": "Devis",
  "Visite devis - Parlophonie/vidéophonie": "Devis",
  "Visite devis - Contrat de maintenance Pro": "Devis",
  "Intervention - Dépannage": "Dépannage",
  "Intervention - Chantier confirmé": "Visite technique",
  "Autre": "Autre",
};

const SERVICE_FAMILY_SET = new Set<string>(SERVICE_FAMILIES);

/**
 * Résout la famille de template d'un type, qu'il vienne de la liste des
 * visites (13 libellés) OU des interventions (7 libellés = noms de familles).
 * Tolérant : tout libellé inconnu retombe sur "Autre".
 */
export function familleDeVisite(type: string): ServiceFamily {
  if (SERVICE_FAMILY_SET.has(type)) return type as ServiceFamily;
  return FAMILLE_PAR_TYPE_VISITE[type as TypeVisite] ?? "Autre";
}

// ---------------------------------------------------------------------------
// Durées & statuts
// ---------------------------------------------------------------------------

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
