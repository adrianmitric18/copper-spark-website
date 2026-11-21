/**
 * Statuts automatiques — logique pure, sans réseau (lot « statuts auto », 2026-11).
 *
 * « Je fais mon travail, l'admin suit tout seul. » Quatre mécanismes :
 *
 *  1. RDV passé : une visite devis se clôture dès le lendemain (le lead entre
 *     dans « Devis à faire ») ; une intervention reste 2 jours sur l'accueil
 *     (« C'est fait » / « À replanifier ») puis se clôture seule, lead Converti.
 *     Un RDV de type « Autre » ne bouge jamais tout seul.
 *  2. Un message envoyé fait avancer le statut (`statutApresMessage`), toujours
 *     vers l'avant ; un statut terminé ne bouge plus.
 *  3. Archivage : aucune action depuis 60 jours → « sans suite », sauf un devis
 *     envoyé depuis moins de 90 jours.
 *  4. Rattrapage : tout ce qui date d'AVANT la mise en service (`AUTO_DEPUIS`)
 *     n'est jamais touché automatiquement. C'est proposé dans l'écran « Mise à
 *     jour proposée », et rien ne s'applique sans validation.
 *
 * Pas de nouveau statut : « Devis à faire » se déduit (visite passée, pas de
 * devis daté). Aucune colonne, aucune table, aucune migration.
 */

import {
  ARCHIVE_APRES_JOURS,
  derniereActionMs,
  estArchivable,
  isRdvActif,
  isStatutAvecRdv,
  isTerminal,
  joursDepuis,
  libelleStatutLead,
  todayIsoLocal,
  type Lead,
} from "@/lib/admin/types";

// ---------------------------------------------------------------------
//  Réglages
// ---------------------------------------------------------------------

/**
 * Date de mise en service. Un RDV daté d'avant, ou un lead dont la dernière
 * action est antérieure, n'est JAMAIS modifié automatiquement : il passe par
 * l'écran « Mise à jour proposée ». À ajuster au jour du merge si besoin.
 */
export const AUTO_DEPUIS = "2026-11-21";

/** Une intervention passée reste ce nombre de jours sur l'accueil avant la clôture automatique. */
export const DELAI_CLOTURE_INTERVENTION_JOURS = 2;

/** Un devis envoyé depuis moins de 90 jours protège le lead de l'archivage. */
export const DEVIS_PROTEGE_JOURS = 90;

// ---------------------------------------------------------------------
//  Données d'entrée (sous-ensembles des lignes Supabase)
// ---------------------------------------------------------------------

export type LeadAuto = Pick<
  Lead,
  "id" | "name" | "status" | "created_at" | "devis_envoye_at" | "notes_internes"
> & { commune?: string | null };

export interface RdvAuto {
  id: string;
  lead_id: string;
  date_rdv: string;
  type_visite: string;
  statut: string;
}

export interface ChantierAuto {
  lead_id: string;
  statut: string;
  date_fin: string;
}

// ---------------------------------------------------------------------
//  Genre d'un RDV
// ---------------------------------------------------------------------

export type GenreRdv = "visite" | "intervention" | "autre";

/** 13 types de RDV : 10 « Visite devis - … », 2 « Intervention - … », et « Autre ». */
export const genreRdv = (typeVisite: string | null | undefined): GenreRdv => {
  const t = (typeVisite ?? "").trim();
  if (t.startsWith("Visite devis")) return "visite";
  if (t.startsWith("Intervention")) return "intervention";
  return "autre";
};

const isoMidi = (iso: string): number => {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d, 12).getTime();
};

/** Jours calendaires de `deIso` à `aIso` (positif si `aIso` est plus tard). */
export const joursEntre = (deIso: string, aIso: string): number =>
  Math.round((isoMidi(aIso) - isoMidi(deIso)) / 86_400_000);

/** « 03/10 » */
export const jourMois = (iso: string): string => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

// ---------------------------------------------------------------------
//  2 — Un message envoyé fait avancer le statut
// ---------------------------------------------------------------------

// Ordre du parcours. Un statut n'avance que vers un rang supérieur.
const RANG: Record<string, number> = {
  nouveau: 0,
  "traité": 1,
  "RDV annulé": 1,
  rdv_pris: 2,
  "RDV confirmé": 3,
  "devis envoyé": 4,
};

/**
 * `cible` si elle fait avancer `actuel`, sinon null. Un statut terminé
 * (converti / sans suite / perdu) ne bouge plus ; « converti » est toujours
 * une avancée pour un lead actif.
 */
export const avancerStatut = (actuel: string | null | undefined, cible: string): string | null => {
  const a = actuel ?? "";
  if (isTerminal(a) || a === cible) return null;
  if (cible === "converti") return cible;
  const rangCible = RANG[cible];
  if (rangCible === undefined) return null;
  return rangCible > (RANG[a] ?? 0) ? cible : null;
};

/** Titre de la trace laissée quand Adrian tape « Appeler ». */
export const TRACE_APPEL = "Appel";

/** Titre de la trace du bouton « Déjà répondu » de l'accueil. */
export const TRACE_DEJA_REPONDU = "Déjà répondu (hors admin)";

/**
 * Statut visé par un message, d'après le titre tracé dans les notes :
 *  - « Confirmation RDV » (fiche, RDV rapide, courte ou complète) → RDV confirmé
 *  - « Démarrage chantier », « Avis Google », « Avis demandé » → converti
 *  - tout autre message, un appel, « Déjà répondu » → traité (un lead « nouveau »
 *    à qui on a écrit n'est plus nouveau)
 * « Devis envoyé » est géré à part : il date aussi l'envoi (`setLeadDevisEnvoye`).
 */
export const cibleDuMessage = (titre: string): string => {
  const t = titre.trim();
  if (/^Confirmation RDV/i.test(t)) return "RDV confirmé";
  if (/^(Démarrage chantier|Avis Google|Avis demandé)$/i.test(t)) return "converti";
  return "traité";
};

/** Nouveau statut du lead après l'envoi du message `titre`, ou null s'il ne change pas. */
export const statutApresMessage = (actuel: string | null | undefined, titre: string): string | null =>
  avancerStatut(actuel, cibleDuMessage(titre));

// ---------------------------------------------------------------------
//  Regroupements
// ---------------------------------------------------------------------

interface Contexte {
  today: string;
  rdvs: RdvAuto[];
  aUnRdvAVenir: boolean;
  /** Dernier RDV non annulé, toutes dates confondues. */
  dernierRdv: RdvAuto | null;
  /** Date du dernier RDV, annulés compris (compte comme une action). */
  dernierRdvIso: string | null;
  aUnChantierOuvert: boolean;
  aUnChantier: boolean;
  /** Un chantier programmé est « terminé » : le travail a été fait. */
  aUnChantierTermine: boolean;
  dernierChantierIso: string | null;
}

const grouper = <T extends { lead_id: string }>(lignes: T[]): Map<string, T[]> => {
  const m = new Map<string, T[]>();
  for (const l of lignes) {
    const liste = m.get(l.lead_id);
    if (liste) liste.push(l);
    else m.set(l.lead_id, [l]);
  }
  return m;
};

const contexteDe = (rdvs: RdvAuto[], chantiers: ChantierAuto[], today: string): Contexte => {
  let dernierRdv: RdvAuto | null = null;
  let dernierRdvIso: string | null = null;
  let aUnRdvAVenir = false;
  for (const r of rdvs) {
    if (!dernierRdvIso || r.date_rdv > dernierRdvIso) dernierRdvIso = r.date_rdv;
    if (r.statut === "annule") continue;
    if (r.date_rdv >= today) aUnRdvAVenir = true;
    if (!dernierRdv || r.date_rdv > dernierRdv.date_rdv) dernierRdv = r;
  }
  let dernierChantierIso: string | null = null;
  let aUnChantierOuvert = false;
  let aUnChantier = false;
  let aUnChantierTermine = false;
  for (const c of chantiers) {
    if (c.statut === "annule") continue;
    aUnChantier = true;
    if (c.statut === "termine") aUnChantierTermine = true;
    if (c.statut === "programme" || c.statut === "en_cours") aUnChantierOuvert = true;
    if (!dernierChantierIso || c.date_fin > dernierChantierIso) dernierChantierIso = c.date_fin;
  }
  return { today, rdvs, aUnRdvAVenir, dernierRdv, dernierRdvIso, aUnChantierOuvert, aUnChantier, aUnChantierTermine, dernierChantierIso };
};

const joursSansAction = (lead: LeadAuto, ctx: Contexte, now: Date): number =>
  joursDepuis(derniereActionMs(lead, ctx.dernierRdvIso, ctx.dernierChantierIso), now);

/** Dernière action du lead antérieure à la mise en service : relève du rattrapage. */
const estAncien = (lead: LeadAuto, ctx: Contexte): boolean =>
  derniereActionMs(lead, ctx.dernierRdvIso, ctx.dernierChantierIso) < isoMidi(AUTO_DEPUIS) - 12 * 3_600_000;

// ---------------------------------------------------------------------
//  3 — Archivage
// ---------------------------------------------------------------------

/**
 * Archivable automatiquement : la règle des 60 jours (`estArchivable`), sauf
 * un lead « devis envoyé » dont le devis a moins de 90 jours.
 */
export const estArchivableAuto = (
  lead: Pick<Lead, "status" | "created_at" | "devis_envoye_at" | "notes_internes">,
  ctx: {
    aUnRdvAVenir: boolean;
    dernierRdvIso?: string | null;
    aUnChantierOuvert?: boolean;
    dernierChantierIso?: string | null;
  },
  now: Date = new Date(),
): boolean => {
  if (!estArchivable(lead, ctx, now)) return false;
  if (lead.status === "devis envoyé" && lead.devis_envoye_at) {
    if (joursEntre(lead.devis_envoye_at, todayIsoLocal(now)) < DEVIS_PROTEGE_JOURS) return false;
  }
  return true;
};

// ---------------------------------------------------------------------
//  1 + 3 — Actions automatiques (appliquées à l'ouverture de l'admin)
// ---------------------------------------------------------------------

export interface ActionAuto {
  leadId: string;
  leadName: string;
  /** RDV à passer en « terminé ». */
  rdvIds: string[];
  statutAvant: string;
  /** Nouveau statut du lead, ou null s'il ne change pas. */
  statutApres: string | null;
  /** Ligne ajoutée aux notes du lead ; null = ménage silencieux. */
  trace: string | null;
  /** Texte du bandeau et du journal ; null = non affiché. */
  resume: string | null;
}

export const calculerActionsAuto = (
  leads: LeadAuto[],
  rdvs: RdvAuto[],
  chantiers: ChantierAuto[],
  now: Date = new Date(),
): ActionAuto[] => {
  const today = todayIsoLocal(now);
  const rdvsParLead = grouper(rdvs);
  const chantiersParLead = grouper(chantiers);
  const actions: ActionAuto[] = [];

  for (const lead of leads) {
    const ctx = contexteDe(rdvsParLead.get(lead.id) ?? [], chantiersParLead.get(lead.id) ?? [], today);
    // RDV passés encore ouverts, datés d'après la mise en service.
    const passes = ctx.rdvs
      .filter((r) => isRdvActif(r.statut) && r.date_rdv < today && r.date_rdv >= AUTO_DEPUIS)
      .sort((a, b) => a.date_rdv.localeCompare(b.date_rdv));

    // Lead déjà terminé : ses RDV passés n'ont plus à rester ouverts.
    if (isTerminal(lead.status)) {
      if (passes.length > 0) {
        actions.push({
          leadId: lead.id,
          leadName: lead.name,
          rdvIds: passes.map((r) => r.id),
          statutAvant: lead.status,
          statutApres: null,
          trace: null,
          resume: null,
        });
      }
      continue;
    }

    const visites = passes.filter((r) => genreRdv(r.type_visite) === "visite");
    const interventions = passes.filter(
      (r) =>
        genreRdv(r.type_visite) === "intervention" &&
        joursEntre(r.date_rdv, today) > DELAI_CLOTURE_INTERVENTION_JOURS,
    );

    if (interventions.length > 0) {
      const derniere = interventions[interventions.length - 1];
      actions.push({
        leadId: lead.id,
        leadName: lead.name,
        rdvIds: [...interventions, ...visites].map((r) => r.id),
        statutAvant: lead.status,
        statutApres: "converti",
        trace: `Clôturé automatiquement : intervention du ${jourMois(derniere.date_rdv)}`,
        resume: `Intervention du ${jourMois(derniere.date_rdv)} clôturée → converti`,
      });
      continue;
    }

    if (visites.length > 0) {
      const derniere = visites[visites.length - 1];
      // « RDV confirmé » / rdv_pris sans plus aucun RDV ouvert → « traité »
      // (le lead apparaît alors dans « Devis à faire »).
      const resteUnRdvOuvert = ctx.rdvs.some(
        (r) => isRdvActif(r.statut) && !visites.some((v) => v.id === r.id),
      );
      const statutApres = isStatutAvecRdv(lead.status) && !resteUnRdvOuvert ? "traité" : null;
      actions.push({
        leadId: lead.id,
        leadName: lead.name,
        rdvIds: visites.map((r) => r.id),
        statutAvant: lead.status,
        statutApres,
        trace: `Clôturé automatiquement : visite du ${jourMois(derniere.date_rdv)}`,
        resume: `Visite du ${jourMois(derniere.date_rdv)} clôturée → devis à faire`,
      });
      continue;
    }

    // Archivage : 60 jours sans action, et une dernière action postérieure à la
    // mise en service (sinon : rattrapage, sur validation).
    if (estArchivableAuto(lead, ctx, now) && !estAncien(lead, ctx)) {
      const jours = joursSansAction(lead, ctx, now);
      actions.push({
        leadId: lead.id,
        leadName: lead.name,
        // Tous ses RDV passés encore ouverts, « Autre » compris.
        rdvIds: ctx.rdvs.filter((r) => isRdvActif(r.statut) && r.date_rdv < today).map((r) => r.id),
        statutAvant: lead.status,
        // Chantier terminé : le travail a été fait, le lead est gagné, pas « sans suite ».
        statutApres: ctx.aUnChantierTermine ? "converti" : "sans suite",
        trace: `Archivé automatiquement : aucune action depuis ${jours} jours`,
        resume: `Aucune action depuis ${jours} jours → ${ctx.aUnChantierTermine ? "converti" : "sans suite"}`,
      });
    }
  }
  return actions;
};

// ---------------------------------------------------------------------
//  Accueil — ce que l'automatique laisse à faire, en 1 tap
// ---------------------------------------------------------------------

/**
 * « Devis à faire » : lead actif, pas de devis daté, dont le dernier RDV est
 * une visite passée (depuis la mise en service), sans RDV à venir ni chantier.
 */
export const leadsDevisAFaire = <L extends LeadAuto>(
  leads: L[],
  rdvs: RdvAuto[],
  chantiers: ChantierAuto[],
  now: Date = new Date(),
): { lead: L; visite: RdvAuto }[] => {
  const today = todayIsoLocal(now);
  const rdvsParLead = grouper(rdvs);
  const chantiersParLead = grouper(chantiers);
  const out: { lead: L; visite: RdvAuto }[] = [];
  for (const lead of leads) {
    if (isTerminal(lead.status) || lead.status === "devis envoyé" || lead.devis_envoye_at) continue;
    const ctx = contexteDe(rdvsParLead.get(lead.id) ?? [], chantiersParLead.get(lead.id) ?? [], today);
    const r = ctx.dernierRdv;
    if (!r || ctx.aUnRdvAVenir || ctx.aUnChantier) continue;
    if (genreRdv(r.type_visite) !== "visite" || r.date_rdv < AUTO_DEPUIS) continue;
    out.push({ lead, visite: r });
  }
  return out.sort((a, b) => a.visite.date_rdv.localeCompare(b.visite.date_rdv));
};

export interface RdvAConfirmer<R extends RdvAuto> {
  rdv: R;
  genre: "intervention" | "autre";
  /** Jours avant la clôture automatique (intervention) ; null pour « Autre ». */
  joursRestants: number | null;
}

/**
 * RDV passés à confirmer sur l'accueil (« C'est fait » / « À replanifier ») :
 * interventions pendant le délai de 2 jours, et RDV « Autre » jusqu'au clic.
 */
export const rdvsAConfirmer = <R extends RdvAuto & { lead_status: string }>(
  rdvs: R[],
  now: Date = new Date(),
): RdvAConfirmer<R>[] => {
  const today = todayIsoLocal(now);
  const out: RdvAConfirmer<R>[] = [];
  for (const r of rdvs) {
    if (!isRdvActif(r.statut) || r.date_rdv >= today || r.date_rdv < AUTO_DEPUIS) continue;
    if (isTerminal(r.lead_status)) continue;
    const genre = genreRdv(r.type_visite);
    if (genre === "visite") continue;
    out.push({
      rdv: r,
      genre,
      joursRestants:
        genre === "intervention"
          ? Math.max(0, DELAI_CLOTURE_INTERVENTION_JOURS + 1 - joursEntre(r.date_rdv, today))
          : null,
    });
  }
  return out.sort((a, b) => a.rdv.date_rdv.localeCompare(b.rdv.date_rdv));
};

// ---------------------------------------------------------------------
//  4 — Rattrapage : « Mise à jour proposée »
// ---------------------------------------------------------------------

export const STATUTS_RATTRAPAGE = ["converti", "devis envoyé", "sans suite", "perdu"] as const;
export type StatutRattrapage = (typeof STATUTS_RATTRAPAGE)[number];

export const LIBELLE_RATTRAPAGE: Record<StatutRattrapage, string> = {
  converti: "Converti",
  "devis envoyé": "Devis envoyé",
  "sans suite": "Sans suite",
  perdu: "Perdu",
};

export interface Proposition {
  leadId: string;
  leadName: string;
  commune: string | null;
  /** Statut actuel, tel qu'affiché (« RDV passé », « nouveau »…). */
  statutAvant: string;
  /** Statut proposé ; modifiable ligne par ligne dans l'écran. */
  propose: StatutRattrapage;
  /** Cochée par défaut ? (« Autre » : non, à Adrian de dire.) */
  coche: boolean;
  raison: string;
  /** Date retenue pour le devis si la ligne passe en « devis envoyé ». */
  dateDevis: string | null;
}

/**
 * Fiches d'avant la mise en service à remettre d'aplomb. Rien n'est appliqué
 * ici : l'écran « Mise à jour proposée » montre la liste, Adrian valide.
 *  - dernier RDV (avant `AUTO_DEPUIS`) passé, lead toujours ouvert :
 *      intervention → converti ; visite → devis envoyé (ou sans suite après
 *      60 jours) ; autre → décochée ;
 *  - sinon, aucune action depuis 60 jours → sans suite.
 */
export const calculerPropositions = (
  leads: LeadAuto[],
  rdvs: RdvAuto[],
  chantiers: ChantierAuto[],
  now: Date = new Date(),
): Proposition[] => {
  const today = todayIsoLocal(now);
  const rdvsParLead = grouper(rdvs);
  const chantiersParLead = grouper(chantiers);
  const out: (Proposition & { tri: number })[] = [];

  for (const lead of leads) {
    if (isTerminal(lead.status)) continue;
    const ctx = contexteDe(rdvsParLead.get(lead.id) ?? [], chantiersParLead.get(lead.id) ?? [], today);
    if (ctx.aUnRdvAVenir || ctx.aUnChantierOuvert) continue;

    const base = {
      leadId: lead.id,
      leadName: lead.name,
      commune: lead.commune ?? null,
      statutAvant: libelleStatutLead(lead.status, false),
    };
    const jours = joursSansAction(lead, ctx, now);
    const r = ctx.dernierRdv;
    const rdvAncien = r && r.date_rdv < AUTO_DEPUIS && r.date_rdv < today ? r : null;

    // Un RDV d'avant la mise en service reste proposé tant qu'il n'est pas
    // réglé, même si le lead a bougé depuis (sinon il resterait « RDV passé »).
    if (rdvAncien) {
      const genre = genreRdv(rdvAncien.type_visite);
      const ouvert = isRdvActif(rdvAncien.statut);
      const quand = jourMois(rdvAncien.date_rdv);
      const vieux = joursEntre(rdvAncien.date_rdv, today) >= ARCHIVE_APRES_JOURS;
      if (genre === "intervention") {
        out.push({
          ...base,
          propose: "converti",
          coche: true,
          raison: `Intervention du ${quand} passée`,
          dateDevis: rdvAncien.date_rdv,
          tri: jours,
        });
        continue;
      }
      if (genre === "visite") {
        // Devis déjà daté et suivi (« devis envoyé ») : rien à rattraper ici,
        // sauf s'il est archivable (traité plus bas).
        if (!(lead.status === "devis envoyé" && lead.devis_envoye_at)) {
          const propose: StatutRattrapage = lead.devis_envoye_at || !vieux ? "devis envoyé" : "sans suite";
          out.push({
            ...base,
            propose,
            coche: true,
            raison:
              propose === "devis envoyé"
                ? `Visite du ${quand} passée`
                : `Visite du ${quand}, sans nouvelles depuis ${jours} jours`,
            dateDevis: lead.devis_envoye_at ?? rdvAncien.date_rdv,
            tri: jours,
          });
          continue;
        }
      } else if (ouvert) {
        out.push({
          ...base,
          propose: vieux ? "sans suite" : "converti",
          coche: false,
          raison: `RDV « ${rdvAncien.type_visite || "Autre"} » du ${quand} : à toi de dire`,
          dateDevis: rdvAncien.date_rdv,
          tri: jours,
        });
        continue;
      }
    }

    if (estArchivableAuto(lead, ctx, now) && estAncien(lead, ctx)) {
      out.push({
        ...base,
        propose: ctx.aUnChantierTermine ? "converti" : "sans suite",
        coche: true,
        raison: ctx.aUnChantierTermine
          ? `Chantier terminé, aucune action depuis ${jours} jours`
          : `Aucune action depuis ${jours} jours`,
        dateDevis: lead.devis_envoye_at ?? null,
        tri: jours,
      });
    }
  }
  return out
    .sort((a, b) => b.tri - a.tri)
    .map((p): Proposition => ({
      leadId: p.leadId,
      leadName: p.leadName,
      commune: p.commune,
      statutAvant: p.statutAvant,
      propose: p.propose,
      coche: p.coche,
      raison: p.raison,
      dateDevis: p.dateDevis,
    }));
};
