// Types et constantes partagés entre les pages /admin.
// Source de vérité unique — évite la duplication entre Dashboard,
// LeadDetail, Rdv, AvisManager et ManualLeadDialog.

import type { Tables } from "@/integrations/supabase/types";

// =====================================================================
//  Types métier
// =====================================================================

/** Un lead tel que stocké dans la table `leads`. */
export type Lead = Tables<"leads">;

/** Un rendez-vous tel que stocké dans la table `rendez_vous`. */
export type Rdv = Tables<"rendez_vous">;

/** Un témoignage / avis client tel que stocké dans la table `testimonials`. */
export type Testimonial = Tables<"testimonials">;

/** Map { lead_id -> prochain RDV } utilisée pour décorer la liste des leads. */
export type UpcomingByLead = Record<string, Pick<Rdv, "date_rdv" | "heure_rdv">>;

// =====================================================================
//  Statuts de lead
// =====================================================================

export const LEAD_STATUSES = [
  "nouveau",
  "traité",
  "devis envoyé",
  "converti",
  "perdu",
  "RDV confirmé",
  "RDV annulé",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

/** Statuts proposés dans le filtre du Dashboard (sans les statuts RDV automatiques). */
export const LEAD_STATUS_FILTERS = [
  "nouveau",
  "traité",
  "devis envoyé",
  "converti",
  "perdu",
] as const;

/** Couleur Tailwind associée à un statut de lead (badge). */
export const leadStatusColor = (status: string): string => {
  switch (status) {
    case "nouveau":
      return "bg-orange-500/15 text-orange-600 border-orange-500/30";
    case "traité":
      return "bg-yellow-500/15 text-yellow-700 border-yellow-500/30";
    case "devis envoyé":
      return "bg-blue-500/15 text-blue-600 border-blue-500/30";
    case "converti":
      return "bg-green-500/15 text-green-700 border-green-500/30";
    case "perdu":
      return "bg-muted text-muted-foreground border-border";
    case "RDV confirmé":
      return "bg-green-500/15 text-green-700 border-green-500/30";
    case "RDV annulé":
      return "bg-destructive/10 text-destructive border-destructive/30";
    default:
      return "";
  }
};

// =====================================================================
//  Sources de lead
// =====================================================================

export const LEAD_SOURCE_LABELS: Record<string, string> = {
  formulaire_site: "Site web",
  simulateur: "Simulateur",
  telephone: "Téléphone",
  whatsapp: "WhatsApp",
  facebook: "Facebook",
  recommandation: "Recommandation",
  chantier: "Chantier",
  autre: "Autre",
};

export const leadSourceLabel = (source?: string | null): string =>
  LEAD_SOURCE_LABELS[source || ""] || source || "Site web";

// =====================================================================
//  Services proposés
// =====================================================================

/** Liste utilisée pour le filtre Dashboard (alignée sur le formulaire public). */
export const LEAD_SERVICES = [
  "Installation électrique / Rénovation",
  "Dépannage urgent",
  "Mise en conformité RGIE",
  "Borne de recharge voiture électrique",
  "Panneaux photovoltaïques",
  "Éclairage intérieur / extérieur",
  "Autre (préciser dans le message)",
] as const;
