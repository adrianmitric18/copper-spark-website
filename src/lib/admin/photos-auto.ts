/**
 * Suppression automatique des photos des demandes — logique pure, sans réseau.
 *
 * Règle validée par Adrian (passation du 23/11/2026). Les photos d'une demande
 * sont effacées quand TOUT est vrai :
 *   1. la demande a plus de 6 mois ;
 *   2. son statut n'est pas « converti » ;
 *   3. elle n'a aucun chantier, ni programmé, ni en cours, ni terminé
 *      (un chantier annulé ne compte pas) ;
 *   4. elle n'a aucun rendez-vous à venir ;
 *   5. aucun devis n'a été envoyé, ou le dernier date de plus de 6 mois.
 *
 * Seules les photos partent. La fiche reste, avec une ligne « Photos supprimées
 * automatiquement » datée dans ses notes. Aucune colonne, aucune migration.
 *
 * Vérification à l'ouverture de l'admin (même passage que les statuts
 * automatiques, `useStatutsAuto`). Contrairement aux statuts, cette règle
 * s'applique aussi aux fiches d'avant `AUTO_DEPUIS` : elle vise par nature les
 * vieilles demandes.
 */

import { isRdvActif, todayIsoLocal, type Lead } from "@/lib/admin/types";
import type { ChantierAuto, RdvAuto } from "@/lib/admin/statuts-auto";

/**
 * Interrupteur. À `false`, RIEN n'est supprimé : la règle est calculée, jamais
 * appliquée. Activé le 23/11/2026 sur l'accord d'Adrian (« active »), d'abord
 * sur la branche pour un essai sur une fiche TEST depuis l'aperçu.
 */
export const SUPPRESSION_PHOTOS_ACTIVE = true;

/** Les photos d'une demande sont gardées ce nombre de mois. */
export const PHOTOS_CONSERVEES_MOIS = 6;

/** Ligne laissée dans les notes de la fiche (précédée de la date et de l'heure). */
export const TRACE_PHOTOS_SUPPRIMEES = "Photos supprimées automatiquement (demande de plus de 6 mois)";

export type LeadPhotos = Pick<Lead, "id" | "name" | "status" | "created_at" | "devis_envoye_at" | "photo_urls">;

export interface PhotosASupprimer {
  leadId: string;
  leadName: string;
  /** Chemins des fichiers dans le dossier privé `lead-photos`. */
  chemins: string[];
}

const pad = (n: number): string => String(n).padStart(2, "0");

/**
 * Date limite (YYYY-MM-JJ, locale) : aujourd'hui moins 6 mois. Tout ce qui est
 * daté AVANT ce jour a « plus de 6 mois ». Si le jour n'existe pas dans le mois
 * visé (31 août → « 31 février »), on prend le dernier jour de ce mois : jamais
 * une suppression en avance.
 */
export const dateLimitePhotos = (now: Date = new Date()): string => {
  const cible = new Date(now.getFullYear(), now.getMonth() - PHOTOS_CONSERVEES_MOIS, 1);
  const dernierJour = new Date(cible.getFullYear(), cible.getMonth() + 1, 0).getDate();
  const jour = Math.min(now.getDate(), dernierJour);
  return `${cible.getFullYear()}-${pad(cible.getMonth() + 1)}-${pad(jour)}`;
};

/** Jour local (YYYY-MM-JJ) d'un instant enregistré en base. */
const jourLocal = (iso: string): string | null => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : todayIsoLocal(d);
};

/**
 * Fiches dont les photos doivent être effacées aujourd'hui. Dans le doute
 * (date illisible), on garde les photos.
 */
export const photosASupprimer = (
  leads: LeadPhotos[],
  rdvs: Pick<RdvAuto, "lead_id" | "date_rdv" | "statut">[],
  chantiers: Pick<ChantierAuto, "lead_id" | "statut">[],
  now: Date = new Date(),
): PhotosASupprimer[] => {
  const today = todayIsoLocal(now);
  const limite = dateLimitePhotos(now);

  // 4 — fiches avec un rendez-vous à venir (ouvert, aujourd'hui ou plus tard).
  const avecRdvAVenir = new Set<string>();
  for (const r of rdvs) {
    if (isRdvActif(r.statut) && r.date_rdv >= today) avecRdvAVenir.add(r.lead_id);
  }
  // 3 — fiches avec un chantier programmé, en cours ou terminé.
  const avecChantier = new Set<string>();
  for (const c of chantiers) {
    if (c.statut !== "annule") avecChantier.add(c.lead_id);
  }

  const out: PhotosASupprimer[] = [];
  for (const lead of leads) {
    const chemins = (lead.photo_urls ?? []).filter(Boolean);
    if (chemins.length === 0) continue;
    // 1 — la demande a plus de 6 mois.
    const recue = jourLocal(lead.created_at);
    if (!recue || recue >= limite) continue;
    // 2 — pas un client.
    if (lead.status === "converti") continue;
    if (avecChantier.has(lead.id)) continue;
    if (avecRdvAVenir.has(lead.id)) continue;
    // 5 — aucun devis, ou un devis de plus de 6 mois.
    if (lead.devis_envoye_at && lead.devis_envoye_at.slice(0, 10) >= limite) continue;
    out.push({ leadId: lead.id, leadName: lead.name, chemins });
  }
  return out;
};
