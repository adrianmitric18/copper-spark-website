// Types et constantes partagés entre les pages /admin.
// Source de vérité unique — évite la duplication entre Dashboard,
// LeadDetail, Rdv, AvisManager et ManualLeadDialog.

import type { Tables } from "@/integrations/supabase/types";
import { TON } from "@/lib/admin/badges";

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
  "sans suite",
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
  "sans suite",
  "perdu",
] as const;

// ---------------------------------------------------------------------
//  Statuts terminés — DÉFINITION UNIQUE (lot 1B du brief admin 2026-11)
//  Utilisée par Pipeline, Aujourd'hui, la fiche, le calendrier. Ne pas
//  recréer de liste locale dans une page.
// ---------------------------------------------------------------------

/** Un lead terminé sort de toutes les listes actives (onglet « Terminés »). */
export const TERMINAL_LEAD_STATUSES = ["converti", "sans suite", "perdu"] as const;
export type TerminalLeadStatus = (typeof TERMINAL_LEAD_STATUSES)[number];

const TERMINAL_SET: ReadonlySet<string> = new Set(TERMINAL_LEAD_STATUSES);

export const isTerminal = (status: string | null | undefined): boolean =>
  TERMINAL_SET.has(status ?? "");

/** Les trois issues proposées par le bouton « Terminer ». */
export const TERMINER_CHOIX: { value: TerminalLeadStatus; label: string; aide: string }[] = [
  { value: "converti", label: "Converti", aide: "Chantier signé / fait" },
  { value: "sans suite", label: "Sans suite", aide: "Plus de nouvelles, on classe" },
  { value: "perdu", label: "Perdu", aide: "Refus ou parti ailleurs" },
];

/** Statut repris quand on réactive un lead terminé (actif, sans le remettre « à rappeler »). */
export const STATUT_REACTIVATION: LeadStatus = "traité";

/** Statuts du pipeline actif susceptibles d'être « à relancer ». */
const A_RELANCER_SET: ReadonlySet<string> = new Set(["nouveau", "traité", "devis envoyé"]);
export const isARelancerStatus = (status: string | null | undefined): boolean =>
  A_RELANCER_SET.has(status ?? "");

// ---------------------------------------------------------------------
//  « RDV passé » — DÉFINITION UNIQUE
// ---------------------------------------------------------------------

/** Date locale du jour, YYYY-MM-DD (jamais via toISOString : décalage UTC). */
export const todayIsoLocal = (now: Date = new Date()): string =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

/** Un RDV encore « ouvert » : ni terminé ni annulé. */
export const RDV_STATUTS_ACTIFS = ["confirme", "rappel_envoye"] as const;
export const isRdvActif = (statut: string | null | undefined): boolean =>
  statut === "confirme" || statut === "rappel_envoye";

/**
 * RDV passé = sa date est avant aujourd'hui ET il est encore ouvert
 * (confirmé / rappel envoyé). À afficher « RDV passé », jamais « RDV confirmé ».
 */
export const isRdvPasse = (
  rdv: { date_rdv: string; statut: string } | null | undefined,
  today: string = todayIsoLocal(),
): boolean => Boolean(rdv) && isRdvActif(rdv.statut) && rdv.date_rdv < today;

/**
 * Statuts de lead qui veulent dire « un RDV est calé » : « RDV confirmé »
 * (calé depuis la fiche) et `rdv_pris` (créé par RDV rapide).
 */
const STATUTS_AVEC_RDV: ReadonlySet<string> = new Set(["RDV confirmé", "rdv_pris"]);
export const isStatutAvecRdv = (status: string | null | undefined): boolean =>
  STATUTS_AVEC_RDV.has(status ?? "");

/**
 * Libellé de statut à l'écran : un lead « RDV confirmé » / `rdv_pris` qui n'a
 * plus de RDV à venir est un lead dont le RDV est passé — on ne l'affiche
 * jamais « confirmé ».
 */
export const libelleStatutLead = (status: string, aUnRdvAVenir: boolean): string => {
  if (!isStatutAvecRdv(status)) return status;
  if (!aUnRdvAVenir) return "RDV passé";
  return status === "rdv_pris" ? "RDV pris" : status;
};

// ---------------------------------------------------------------------
//  Page d'accueil : « Leads à rappeler » et ancienneté maximale
// ---------------------------------------------------------------------

const JOUR_MS = 24 * 60 * 60 * 1000;

/** Au-delà, un lead sort des listes de l'accueil (il reste dans Leads). */
export const ACCUEIL_MAX_AGE_JOURS = 30;

/** Jours entiers écoulés depuis un instant (ms). */
export const joursDepuis = (refMs: number, now: Date = new Date()): number =>
  Math.floor((now.getTime() - refMs) / JOUR_MS);

/** « À rappeler » = nouveau (un lead traité est traité), sans RDV à venir, < 30 jours. */
export const estARappeler = (
  lead: Pick<Lead, "status" | "phone" | "created_at">,
  aUnRdvAVenir: boolean,
  now: Date = new Date(),
): boolean =>
  lead.status === "nouveau" &&
  !aUnRdvAVenir &&
  Boolean(lead.phone) &&
  joursDepuis(new Date(lead.created_at).getTime(), now) <= ACCUEIL_MAX_AGE_JOURS;

// ---------------------------------------------------------------------
//  « Archiver les anciens » : dernière action et éligibilité
// ---------------------------------------------------------------------

/** Sans action depuis ce nombre de jours → proposé à l'archivage. */
export const ARCHIVE_APRES_JOURS = 60;

/** Date (ms) de la dernière ligne de trace « 04/11/2026 16:30 — … » des notes, ou null. */
export const derniereTraceMs = (notes: string | null | undefined): number | null => {
  if (!notes) return null;
  let max: number | null = null;
  const re = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}) — /gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(notes)) !== null) {
    const t = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), Number(m[4]), Number(m[5])).getTime();
    if (!Number.isNaN(t) && (max === null || t > max)) max = t;
  }
  return max;
};

const isoMidi = (iso: string): number => {
  const [y, mo, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, mo - 1, d, 12).getTime();
};

/**
 * Dernière action connue sur un lead : création, envoi du devis, dernier
 * message tracé, dernier RDV, dernier chantier programmé (passés ou non).
 * Pas de colonne updated_at en base.
 */
export const derniereActionMs = (
  lead: Pick<Lead, "created_at" | "devis_envoye_at" | "notes_internes">,
  dernierRdvIso?: string | null,
  dernierChantierIso?: string | null,
): number => {
  const refs = [new Date(lead.created_at).getTime()];
  if (lead.devis_envoye_at) refs.push(isoMidi(lead.devis_envoye_at));
  const trace = derniereTraceMs(lead.notes_internes);
  if (trace !== null) refs.push(trace);
  if (dernierRdvIso) refs.push(isoMidi(dernierRdvIso));
  if (dernierChantierIso) refs.push(isoMidi(dernierChantierIso));
  return Math.max(...refs.filter((n) => !Number.isNaN(n)));
};

export interface ContexteArchivage {
  aUnRdvAVenir: boolean;
  dernierRdvIso?: string | null;
  /** Un chantier programmé ou en cours : jamais proposé à l'archivage. */
  aUnChantierOuvert?: boolean;
  /** Date de fin du dernier chantier (compte comme une action). */
  dernierChantierIso?: string | null;
}

/** Lead actif, sans RDV à venir, sans chantier ouvert, sans action depuis 60 jours. */
export const estArchivable = (
  lead: Pick<Lead, "status" | "created_at" | "devis_envoye_at" | "notes_internes">,
  ctx: ContexteArchivage,
  now: Date = new Date(),
): boolean =>
  !isTerminal(lead.status) &&
  !ctx.aUnRdvAVenir &&
  !ctx.aUnChantierOuvert &&
  joursDepuis(derniereActionMs(lead, ctx.dernierRdvIso, ctx.dernierChantierIso), now) >= ARCHIVE_APRES_JOURS;

// ---------------------------------------------------------------------
//  Chantiers programmés (interventions)
// ---------------------------------------------------------------------

type ChantierDates = { statut: string; date_debut: string; date_fin: string };

/**
 * « En cours » = démarré et pas clôturé : statut en_cours, ou programmé dont la
 * date de début est atteinte — Y COMPRIS quand la date de fin est dépassée
 * (avant, ce cas n'apparaissait dans aucun filtre).
 */
export const estChantierEnCours = (i: ChantierDates, today: string = todayIsoLocal()): boolean =>
  i.statut === "en_cours" || (i.statut === "programme" && i.date_debut <= today);

/** Date de fin atteinte ou dépassée, chantier pas encore clôturé → bouton « Terminer ». */
export const estChantierATerminer = (i: ChantierDates, today: string = todayIsoLocal()): boolean =>
  (i.statut === "en_cours" || i.statut === "programme") && i.date_fin <= today;

/**
 * Classes du badge d'un statut de lead (clair + sombre). Six statuts, six
 * teintes distinctes : nouveau orange, traité violet, devis envoyé bleu,
 * converti vert, perdu rouge, sans suite gris. Palette : @/lib/admin/badges.
 */
export const leadStatusColor = (status: string): string => {
  switch (status) {
    case "nouveau":
      return TON.orange;
    case "traité":
      return TON.violet;
    case "devis envoyé":
      return TON.bleu;
    case "converti":
      return TON.vert;
    case "perdu":
      return TON.rouge;
    case "sans suite":
      return TON.gris;
    case "RDV confirmé":
    case "rdv_pris":
      return TON.sarcelle;
    case "RDV annulé":
      return TON.ambre;
    default:
      return TON.gris;
  }
};

// =====================================================================
//  Sources de lead
// =====================================================================

export const LEAD_SOURCE_LABELS: Record<string, string> = {
  formulaire_site: "Site web",
  rdv_rapide: "RDV rapide",
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
