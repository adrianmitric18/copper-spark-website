import {
  Archive,
  Calendar,
  Clock,
  Hammer,
  HardHat,
  Home,
  Phone,
  Star,
  ThumbsUp,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";

/**
 * Navigation de l'admin — SOURCE UNIQUE pour la barre du bas (téléphone) et la
 * barre latérale (lot 2.1 du brief admin 2026-11).
 *
 * Barre du bas : RDV rapide · Aujourd'hui · Leads · Heures · Plus.
 * « Plus » ouvre : Dépannage au téléphone, Calendrier, Chantiers, Réalisations,
 * Avis à demander, Avis clients, Import archives. Même ordre dans la barre
 * latérale. Rien n'est supprimé, seulement déplacé.
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

const AVIS_A_DEMANDER = "/admin/avis-a-demander";

export const NAV_PLUS: NavItem[] = [
  // Lot 2 bis : le prix à annoncer quand le téléphone sonne pour une panne.
  {
    to: "/admin/depannage",
    label: "Dépannage au téléphone",
    icon: Wrench,
    match: (p) => p.startsWith("/admin/depannage"),
  },
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
  // Lot 2 bis : clients dont le chantier est fini, sans demande d'avis Google.
  { to: AVIS_A_DEMANDER, label: "Avis à demander", icon: ThumbsUp, match: (p) => p.startsWith(AVIS_A_DEMANDER) },
  { to: "/admin/avis", label: "Avis clients", icon: Star, match: (p) => p === "/admin/avis" },
  { to: IMPORT_ARCHIVES, label: "Import archives", icon: Archive, match: (p) => p === IMPORT_ARCHIVES },
];

/** Vrai si la page courante se trouve derrière « Plus ». */
export const estDansPlus = (pathname: string): boolean => NAV_PLUS.some((i) => i.match(pathname));
