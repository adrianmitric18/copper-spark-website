/**
 * « Avis à demander » — logique pure (lot 2b.2 du brief admin 2026-11).
 *
 * Un lead est à relancer pour un avis Google quand le travail est fait
 * (statut « converti », ou au moins un chantier programmé « terminé ») et que
 * ses notes ne portent encore aucune trace d'une demande d'avis. Pas de
 * nouvelle colonne en base : la trace est une ligne horodatée des notes
 * internes, comme tous les envois (helper du lot 1A).
 */

import type { Lead } from "@/lib/admin/types";

/** Titre de la trace quand le message d'avis est envoyé (SMS / WhatsApp). */
export const TRACE_AVIS_DEMANDE = "Avis demandé";

/** Trace du bouton « Ne pas demander ». */
export const TRACE_AVIS_REFUSE = "Avis : non";

// Une ligne de trace complète, horodatée, et rien d'autre : une note libre du
// genre « client venu par un avis Google » ne doit PAS sortir le lead de la liste.
const LIGNE_AVIS = new RegExp(
  "^" + "\\d{2}/\\d{2}/\\d{4} \\d{2}:\\d{2} — (?:(?:SMS|WhatsApp|Email) : (?:Avis demandé|Avis Google)|Avis : non)\\s*$",
  "m",
);

/**
 * Vrai si les notes portent déjà une décision sur l'avis : demandé depuis la
 * liste (« Avis demandé »), depuis la fiche (message « Avis Google »), ou
 * écarté (« Avis : non »).
 */
export const avisDejaTraite = (notes: string | null | undefined): boolean => LIGNE_AVIS.test(notes ?? "");

export const estAvisADemander = (
  lead: Pick<Lead, "status" | "notes_internes">,
  aUnChantierTermine: boolean,
): boolean => (lead.status === "converti" || aUnChantierTermine) && !avisDejaTraite(lead.notes_internes);

/** Leads à qui demander un avis, les plus récents d'abord. */
export const leadsAvisADemander = <L extends Pick<Lead, "id" | "status" | "notes_internes" | "created_at">>(
  leads: L[],
  chantiers: { lead_id: string; statut: string }[],
): L[] => {
  const termines = new Set(chantiers.filter((c) => c.statut === "termine").map((c) => c.lead_id));
  return leads
    .filter((l) => estAvisADemander(l, termines.has(l.id)))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
};
