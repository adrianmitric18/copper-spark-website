/**
 * Types métier du CMS Chantiers.
 *
 * Définis ici (et non importés depuis `@/integrations/supabase/types`)
 * pour que la Phase 0 compile avant la régénération des types Supabase.
 * La Phase 1 alignera ces interfaces avec les Row types générés.
 */

export type ProjectStatus = "draft" | "published";
export type ImageKind = "photo" | "before" | "after";

export interface ProjectFaqItem {
  question: string;
  answer: string;
}

export interface Project {
  id: string;
  slug: string;
  title: string;
  location: string;
  zone: string;
  completed_at: string;
  summary: string;
  story: string | null;
  duration_days: number | null;
  budget_range: string | null;
  faq: ProjectFaqItem[] | null;
  status: ProjectStatus;
  featured: boolean;
  meta_title: string | null;
  meta_description: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectImage {
  id: string;
  project_id: string;
  storage_path: string;
  caption: string | null;
  kind: ImageKind;
  is_cover: boolean;
  sort_order: number;
  width: number | null;
  height: number | null;
  created_at: string;
}

export interface ProjectTag {
  project_id: string;
  tag: string;
}

/**
 * Liste fixe de tags du CMS, validée le 2026-04-28.
 * Sert à l'autocomplete admin et aux filtres front public.
 */
export const CHANTIER_TAGS = [
  "Bornes de recharge VE",
  "Mise en conformité RGIE",
  "Panneaux photovoltaïques",
  "Rénovation tableau électrique",
  "Installation neuve",
  "Dépannage urgence",
  "Éclairage LED",
  "Domotique",
  "Réseau / VDI",
] as const;

export type ChantierTag = (typeof CHANTIER_TAGS)[number];

/**
 * Zones géographiques utilisées comme filtre. La liste pourra
 * grandir, mais on commence par celles couvertes aujourd'hui.
 */
export const CHANTIER_ZONES = [
  "Brabant wallon",
  "Bruxelles",
  "Brabant flamand",
  "Hainaut",
  "Namur",
  "Liège",
  "Autre",
] as const;

export type ChantierZone = (typeof CHANTIER_ZONES)[number];
