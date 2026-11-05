import {
  Archive,
  Calendar,
  Clock,
  Hammer,
  HardHat,
  Home,
  Phone,
  Star,
  Users,
  type LucideIcon,
} from "lucide-react";

/**
 * Navigation de l'admin — SOURCE UNIQUE pour la barre du bas (téléphone) et la
 * barre latérale (lot 2.1 du brief admin 2026-11).
 *
 * Barre du bas : RDV rapide · Aujourd'hui · Leads · Heures · Plus.
 * « Plus » ouvre : Calendrier, Chantiers, Réalisations, Avis clients, Import
 * archives. Même ordre dans la barre latérale. Rien n'est supprimé, seulement
 * déplacé.
 */
export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Vrai si l'entrée correspond à l'URL courante. */
  match: (pathname: string) => boolean;
  /** Mise en avant (action n° 1 : le téléphone sonne). */
  highlight?: boolean;
}

const IMPORT_ARCHIVES = "/admin/chantiers/import-archives";

export const NAV_PRINCIPAL: NavItem[] = [
  {
    to: "/admin/rdv-rapide",
    label: "RDV rapide",
    icon: Phone,
    match: (p) => p.startsWith("/admin/rdv-rapide"),
    highlight: true,
  },
  { to: "/admin", label: "Aujourd'hui", icon: Home, match: (p) => p === "/admin" },
  {
    to: "/admin/pipeline",
    label: "Leads",
    icon: Users,
    // La fiche d'un lead fait partie de « Leads ».
    match: (p) => p.startsWith("/admin/pipeline") || p.startsWith("/admin/lead/"),
  },
  { to: "/admin/heures", label: "Heures", icon: Clock, match: (p) => p.startsWith("/admin/heures") },
];

export const NAV_PLUS: NavItem[] = [
  {
    to: "/admin/rdv",
    label: "Calendrier",
    icon: Calendar,
    match: (p) => p === "/admin/rdv" || p.startsWith("/admin/rdv/"),
  },
  {
    to: "/admin/interventions",
    label: "Chantiers",
    icon: HardHat,
    match: (p) => p.startsWith("/admin/interventions"),
  },
  {
    to: "/admin/chantiers",
    label: "Réalisations",
    icon: Hammer,
    match: (p) => p.startsWith("/admin/chantiers") && p !== IMPORT_ARCHIVES,
  },
  { to: "/admin/avis", label: "Avis clients", icon: Star, match: (p) => p.startsWith("/admin/avis") },
  { to: IMPORT_ARCHIVES, label: "Import archives", icon: Archive, match: (p) => p === IMPORT_ARCHIVES },
];

/** Vrai si la page courante se trouve derrière « Plus ». */
export const estDansPlus = (pathname: string): boolean => NAV_PLUS.some((i) => i.match(pathname));
