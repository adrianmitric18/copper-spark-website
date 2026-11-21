import { describe, expect, it } from "vitest";
import {
  AUTO_DEPUIS,
  avancerStatut,
  calculerActionsAuto,
  calculerPropositions,
  estArchivableAuto,
  etatAppel,
  genreRdv,
  joursEntre,
  leadsDevisAFaire,
  rdvsAConfirmer,
  statutApresMessage,
  type ChantierAuto,
  type LeadAuto,
  type RdvAuto,
} from "./statuts-auto";

// Tous les scénarios se jouent APRÈS la mise en service (AUTO_DEPUIS = 21/11/2026).
const NOW = new Date(2026, 11, 10, 10, 0); // 10 décembre 2026, 10 h
const HIER = "2026-12-09";
const AVANT_HIER = "2026-12-08";
const IL_Y_A_3_JOURS = "2026-12-07";
const DEMAIN = "2026-12-11";

const lead = (p: Partial<LeadAuto> & { id: string }): LeadAuto => ({
  name: `Client ${p.id}`,
  status: "RDV confirmé",
  created_at: "2026-12-01T09:00:00",
  devis_envoye_at: null,
  notes_internes: null,
  commune: null,
  ...p,
});

let n = 0;
const rdv = (p: Partial<RdvAuto> & { lead_id: string; date_rdv: string }): RdvAuto => ({
  id: `r${++n}`,
  type_visite: "Visite devis - Rénovation électrique",
  statut: "confirme",
  ...p,
});

const VISITE = "Visite devis - Borne de recharge voiture électrique";
const DEPANNAGE = "Intervention - Dépannage";
const AUCUN_CHANTIER: ChantierAuto[] = [];

describe("genre d'un RDV", () => {
  it("classe les 13 types en visite, intervention ou autre", () => {
    expect(genreRdv("Visite devis - Mise en conformité RGIE")).toBe("visite");
    expect(genreRdv("Intervention - Dépannage")).toBe("intervention");
    expect(genreRdv("Intervention - Chantier confirmé")).toBe("intervention");
    expect(genreRdv("Autre")).toBe("autre");
    expect(genreRdv("")).toBe("autre");
    expect(genreRdv(null)).toBe("autre");
  });

  it("compte les jours calendaires", () => {
    expect(joursEntre("2026-12-07", "2026-12-10")).toBe(3);
    expect(joursEntre("2026-10-24", "2026-10-26")).toBe(2); // changement d'heure
  });
});

describe("un message envoyé fait avancer le statut", () => {
  it("« Bien reçu » passe un lead nouveau en traité, et ne touche pas le reste", () => {
    expect(statutApresMessage("nouveau", "Bien reçu")).toBe("traité");
    expect(statutApresMessage("nouveau", "Bien reçu — rappel demain")).toBe("traité");
    expect(statutApresMessage("nouveau", "Réponse rapide : Bien reçu")).toBe("traité");
    expect(statutApresMessage("traité", "Bien reçu")).toBeNull();
    expect(statutApresMessage("devis envoyé", "Bien reçu")).toBeNull();
    expect(statutApresMessage("RDV confirmé", "Bien reçu")).toBeNull();
  });

  it("un message quelconque, « Déjà répondu » ou un appel abouti : nouveau → traité", () => {
    expect(statutApresMessage("nouveau", "Message rapide")).toBe("traité");
    expect(statutApresMessage("nouveau", "Déjà répondu (hors admin)")).toBe("traité");
    expect(statutApresMessage("nouveau", "Appel : client joint")).toBe("traité");
    expect(statutApresMessage("traité", "Appel : client joint")).toBeNull();
  });

  it("taper « Appeler » ou « Pas de réponse » ne change pas le statut", () => {
    expect(statutApresMessage("nouveau", "Appel")).toBeNull();
    expect(statutApresMessage("nouveau", "Appel sans réponse")).toBeNull();
    expect(statutApresMessage("traité", "Appel")).toBeNull();
  });

  it("« Tu l'as eu ? » reste posée tant que le dernier appel n'a pas de réponse", () => {
    const nouveau = (notes: string | null) => etatAppel({ status: "nouveau", notes_internes: notes });
    expect(nouveau(null)).toEqual({ question: false, essais: 0, mention: null });
    expect(nouveau("Client rencontré au salon\n21/11/2026 09:10 — Appel").question).toBe(true);
    // Répondu « Pas de réponse » : plus de question, un essai compté.
    expect(nouveau("21/11/2026 09:10 — Appel\n21/11/2026 09:11 — Appel sans réponse")).toEqual({
      question: false,
      essais: 1,
      mention: "à rappeler · 1 essai · le 21/11",
    });
    // Deuxième appel lancé : la question revient, l'essai précédent reste compté.
    const rappel = nouveau(
      "21/11/2026 09:10 — Appel\r\n21/11/2026 09:11 — Appel sans réponse\r\n23/11/2026 17:00 — Appel",
    );
    expect(rappel.question).toBe(true);
    expect(rappel.essais).toBe(1);
    expect(
      nouveau(
        "21/11/2026 09:10 — Appel\n21/11/2026 09:11 — Appel sans réponse\n23/11/2026 17:00 — Appel\n23/11/2026 17:01 — Appel sans réponse",
      ).mention,
    ).toBe("à rappeler · 2 essais · dernier le 23/11");
  });

  it("le suivi des appels ne concerne que les leads nouveaux", () => {
    const notes = "21/11/2026 09:10 — Appel\n21/11/2026 09:11 — Appel sans réponse\n22/11/2026 08:00 — Appel";
    expect(etatAppel({ status: "traité", notes_internes: notes })).toEqual({ question: false, essais: 0, mention: null });
    expect(etatAppel({ status: "devis envoyé", notes_internes: notes }).question).toBe(false);
  });

  it("« Confirmation RDV » (fiche ou RDV rapide) → RDV confirmé, jamais en arrière", () => {
    expect(statutApresMessage("rdv_pris", "Confirmation RDV")).toBe("RDV confirmé");
    expect(statutApresMessage("nouveau", "Confirmation RDV (courte)")).toBe("RDV confirmé");
    expect(statutApresMessage("RDV annulé", "Confirmation RDV")).toBe("RDV confirmé");
    expect(statutApresMessage("RDV confirmé", "Confirmation RDV")).toBeNull();
    expect(statutApresMessage("devis envoyé", "Confirmation RDV")).toBeNull();
  });

  it("« Démarrage chantier » et l'avis Google convertissent un lead actif", () => {
    expect(statutApresMessage("devis envoyé", "Démarrage chantier")).toBe("converti");
    expect(statutApresMessage("traité", "Avis Google")).toBe("converti");
    expect(statutApresMessage("RDV confirmé", "Avis demandé")).toBe("converti");
  });

  it("un statut terminé ne bouge plus", () => {
    for (const s of ["converti", "sans suite", "perdu"]) {
      expect(statutApresMessage(s, "Avis Google")).toBeNull();
      expect(statutApresMessage(s, "Démarrage chantier")).toBeNull();
      expect(statutApresMessage(s, "Bien reçu")).toBeNull();
      expect(avancerStatut(s, "converti")).toBeNull();
    }
  });
});

describe("RDV passé : clôture automatique", () => {
  it("une visite se clôture dès le lendemain ; le lead « RDV confirmé » repasse en traité", () => {
    const r = rdv({ lead_id: "a", date_rdv: HIER, type_visite: VISITE });
    const [a] = calculerActionsAuto([lead({ id: "a" })], [r], AUCUN_CHANTIER, NOW);
    expect(a.rdvIds).toEqual([r.id]);
    expect(a.statutApres).toBe("traité");
    expect(a.trace).toBe("Clôturé automatiquement : visite du 09/12");
  });

  it("la visite du jour et celle de demain ne bougent pas", () => {
    const rdvs = [rdv({ lead_id: "a", date_rdv: "2026-12-10" }), rdv({ lead_id: "b", date_rdv: DEMAIN })];
    expect(calculerActionsAuto([lead({ id: "a" }), lead({ id: "b" })], rdvs, AUCUN_CHANTIER, NOW)).toEqual([]);
  });

  it("une visite clôturée ne change pas le statut d'un lead qui a un autre RDV ouvert", () => {
    const rdvs = [
      rdv({ lead_id: "a", date_rdv: HIER, type_visite: VISITE }),
      rdv({ lead_id: "a", date_rdv: DEMAIN, type_visite: DEPANNAGE }),
    ];
    const [a] = calculerActionsAuto([lead({ id: "a" })], rdvs, AUCUN_CHANTIER, NOW);
    expect(a.rdvIds).toHaveLength(1);
    expect(a.statutApres).toBeNull();
  });

  it("une visite clôturée ne rétrograde pas un lead « devis envoyé »", () => {
    const l = lead({ id: "a", status: "devis envoyé", devis_envoye_at: AVANT_HIER });
    const [a] = calculerActionsAuto([l], [rdv({ lead_id: "a", date_rdv: HIER })], AUCUN_CHANTIER, NOW);
    expect(a.statutApres).toBeNull();
  });

  it("une intervention attend 2 jours, puis se clôture et convertit le lead", () => {
    const leads = [lead({ id: "a" }), lead({ id: "b" }), lead({ id: "c" })];
    const rdvs = [
      rdv({ lead_id: "a", date_rdv: HIER, type_visite: DEPANNAGE }),
      rdv({ lead_id: "b", date_rdv: AVANT_HIER, type_visite: DEPANNAGE }),
      rdv({ lead_id: "c", date_rdv: IL_Y_A_3_JOURS, type_visite: "Intervention - Chantier confirmé" }),
    ];
    const actions = calculerActionsAuto(leads, rdvs, AUCUN_CHANTIER, NOW);
    expect(actions).toHaveLength(1);
    expect(actions[0].leadId).toBe("c");
    expect(actions[0].statutApres).toBe("converti");
    expect(actions[0].trace).toBe("Clôturé automatiquement : intervention du 07/12");
  });

  it("un RDV « Autre » ne bouge jamais tout seul", () => {
    const r = rdv({ lead_id: "a", date_rdv: "2026-11-25", type_visite: "Autre" });
    expect(calculerActionsAuto([lead({ id: "a" })], [r], AUCUN_CHANTIER, NOW)).toEqual([]);
  });

  it("un RDV d'avant la mise en service n'est jamais touché automatiquement", () => {
    const leads = [lead({ id: "a", created_at: "2026-09-01T09:00:00" }), lead({ id: "b", created_at: "2026-09-01T09:00:00" })];
    const rdvs = [
      rdv({ lead_id: "a", date_rdv: "2026-10-03", type_visite: DEPANNAGE }),
      rdv({ lead_id: "b", date_rdv: "2026-10-05", type_visite: VISITE }),
    ];
    expect(AUTO_DEPUIS > "2026-10-05").toBe(true);
    expect(calculerActionsAuto(leads, rdvs, AUCUN_CHANTIER, NOW)).toEqual([]);
  });

  it("lead déjà terminé : son RDV passé est fermé sans bruit, le statut ne bouge pas", () => {
    const r = rdv({ lead_id: "a", date_rdv: HIER, type_visite: DEPANNAGE });
    const [a] = calculerActionsAuto([lead({ id: "a", status: "perdu" })], [r], AUCUN_CHANTIER, NOW);
    expect(a.rdvIds).toEqual([r.id]);
    expect(a.statutApres).toBeNull();
    expect(a.trace).toBeNull();
    expect(a.resume).toBeNull();
  });

  it("un RDV annulé ou déjà terminé est ignoré", () => {
    const rdvs = [
      rdv({ lead_id: "a", date_rdv: HIER, statut: "annule" }),
      rdv({ lead_id: "a", date_rdv: AVANT_HIER, statut: "termine" }),
    ];
    expect(calculerActionsAuto([lead({ id: "a", status: "traité" })], rdvs, AUCUN_CHANTIER, NOW)).toEqual([]);
  });
});

describe("archivage automatique", () => {
  const FEVRIER = new Date(2027, 1, 15, 10, 0); // 15 février 2027

  it("60 jours sans action → sans suite, RDV « Autre » resté ouvert compris", () => {
    const l = lead({ id: "a", status: "traité", created_at: "2026-11-25T09:00:00" });
    const r = rdv({ lead_id: "a", date_rdv: "2026-11-30", type_visite: "Autre" });
    const [a] = calculerActionsAuto([l], [r], AUCUN_CHANTIER, FEVRIER);
    expect(a.statutApres).toBe("sans suite");
    expect(a.rdvIds).toEqual([r.id]);
    expect(a.trace).toMatch(/^Archivé automatiquement : aucune action depuis \d+ jours$/);
  });

  it("chantier terminé : le lead oublié est archivé en converti, pas en sans suite", () => {
    const l = lead({ id: "a", status: "devis envoyé", created_at: "2026-11-25T09:00:00", devis_envoye_at: "2026-11-26" });
    const chantier: ChantierAuto = { lead_id: "a", statut: "termine", date_fin: "2026-12-05" };
    const [a] = calculerActionsAuto([l], [], [chantier], new Date(2027, 2, 11, 10, 0));
    expect(a.statutApres).toBe("converti");
  });

  it("un devis envoyé depuis moins de 90 jours protège le lead", () => {
    const l = lead({ id: "a", status: "devis envoyé", created_at: "2026-11-25T09:00:00", devis_envoye_at: "2026-12-01" });
    // 76 jours après le devis, plus de 60 jours sans action : protégé.
    expect(calculerActionsAuto([l], [], AUCUN_CHANTIER, FEVRIER)).toEqual([]);
    // 100 jours après : archivé.
    const [a] = calculerActionsAuto([l], [], AUCUN_CHANTIER, new Date(2027, 2, 11, 10, 0));
    expect(a.statutApres).toBe("sans suite");
  });

  it("estArchivableAuto reprend la règle des 60 jours et ses exclusions", () => {
    const l = { status: "traité", created_at: "2026-11-25T09:00:00", devis_envoye_at: null, notes_internes: null };
    expect(estArchivableAuto(l, { aUnRdvAVenir: false }, FEVRIER)).toBe(true);
    expect(estArchivableAuto(l, { aUnRdvAVenir: true }, FEVRIER)).toBe(false);
    expect(estArchivableAuto(l, { aUnRdvAVenir: false, aUnChantierOuvert: true }, FEVRIER)).toBe(false);
    expect(estArchivableAuto({ ...l, status: "converti" }, { aUnRdvAVenir: false }, FEVRIER)).toBe(false);
  });

  it("un lead sans action depuis avant la mise en service n'est pas archivé tout seul", () => {
    const l = lead({ id: "a", status: "nouveau", created_at: "2026-08-01T09:00:00" });
    expect(calculerActionsAuto([l], [], AUCUN_CHANTIER, NOW)).toEqual([]);
    // … mais il est proposé dans « Mise à jour proposée ».
    const [p] = calculerPropositions([l], [], AUCUN_CHANTIER, NOW);
    expect(p.propose).toBe("sans suite");
    expect(p.coche).toBe(true);
  });

  it("une action après la mise en service remet un ancien lead dans l'automatique", () => {
    const l = lead({
      id: "a",
      status: "traité",
      created_at: "2026-08-01T09:00:00",
      notes_internes: "25/11/2026 16:30 — WhatsApp : Message rapide",
    });
    const [a] = calculerActionsAuto([l], [], AUCUN_CHANTIER, FEVRIER);
    expect(a.statutApres).toBe("sans suite");
  });
});

describe("accueil : devis à faire", () => {
  it("visite passée, pas de devis daté → devis à faire", () => {
    const l = lead({ id: "a", status: "traité" });
    const r = rdv({ lead_id: "a", date_rdv: HIER, type_visite: VISITE, statut: "termine" });
    const liste = leadsDevisAFaire([l], [r], AUCUN_CHANTIER, NOW);
    expect(liste).toHaveLength(1);
    expect(liste[0].visite.id).toBe(r.id);
  });

  it("sort de la liste dès que le devis est daté, ou que le lead est terminé", () => {
    const r = rdv({ lead_id: "a", date_rdv: HIER, type_visite: VISITE, statut: "termine" });
    const envoye = lead({ id: "a", status: "devis envoyé", devis_envoye_at: "2026-12-10" });
    expect(leadsDevisAFaire([envoye], [r], AUCUN_CHANTIER, NOW)).toEqual([]);
    expect(leadsDevisAFaire([lead({ id: "a", status: "sans suite" })], [r], AUCUN_CHANTIER, NOW)).toEqual([]);
  });

  it("pas de devis à faire si un RDV est à venir, si un chantier existe, ou si le dernier RDV est une intervention", () => {
    const l = lead({ id: "a", status: "traité" });
    const visite = rdv({ lead_id: "a", date_rdv: AVANT_HIER, type_visite: VISITE, statut: "termine" });
    const aVenir = rdv({ lead_id: "a", date_rdv: DEMAIN, type_visite: DEPANNAGE });
    expect(leadsDevisAFaire([l], [visite, aVenir], AUCUN_CHANTIER, NOW)).toEqual([]);
    const chantier: ChantierAuto = { lead_id: "a", statut: "programme", date_fin: "2026-12-20" };
    expect(leadsDevisAFaire([l], [visite], [chantier], NOW)).toEqual([]);
    const depannage = rdv({ lead_id: "a", date_rdv: HIER, type_visite: DEPANNAGE, statut: "termine" });
    expect(leadsDevisAFaire([l], [visite, depannage], AUCUN_CHANTIER, NOW)).toEqual([]);
  });

  it("une ancienne visite (avant la mise en service) ne va pas dans « Devis à faire »", () => {
    const l = lead({ id: "a", status: "traité", created_at: "2026-09-01T09:00:00" });
    const r = rdv({ lead_id: "a", date_rdv: "2026-10-05", type_visite: VISITE, statut: "termine" });
    expect(leadsDevisAFaire([l], [r], AUCUN_CHANTIER, NOW)).toEqual([]);
    // Elle est proposée dans l'écran de rattrapage.
    expect(calculerPropositions([l], [r], AUCUN_CHANTIER, NOW)).toHaveLength(1);
  });
});

describe("accueil : RDV passés à confirmer", () => {
  const avecLead = (r: RdvAuto, lead_status = "RDV confirmé") => ({ ...r, lead_status });

  it("intervention : affichée 2 jours, avec le délai avant clôture", () => {
    const hier = avecLead(rdv({ lead_id: "a", date_rdv: HIER, type_visite: DEPANNAGE }));
    const avantHier = avecLead(rdv({ lead_id: "b", date_rdv: AVANT_HIER, type_visite: DEPANNAGE }));
    const liste = rdvsAConfirmer([hier, avantHier], NOW);
    expect(liste.map((x) => [x.rdv.lead_id, x.joursRestants])).toEqual([
      ["b", 1],
      ["a", 2],
    ]);
  });

  it("« Autre » reste affiché sans délai ; une visite n'est jamais à confirmer", () => {
    const autre = avecLead(rdv({ lead_id: "a", date_rdv: "2026-11-25", type_visite: "Autre" }));
    const visite = avecLead(rdv({ lead_id: "b", date_rdv: HIER, type_visite: VISITE }));
    const liste = rdvsAConfirmer([autre, visite], NOW);
    expect(liste).toHaveLength(1);
    expect(liste[0].genre).toBe("autre");
    expect(liste[0].joursRestants).toBeNull();
  });

  it("ignore les RDV du jour, à venir, anciens, fermés, ou d'un lead terminé", () => {
    const rdvs = [
      avecLead(rdv({ lead_id: "a", date_rdv: "2026-12-10", type_visite: DEPANNAGE })),
      avecLead(rdv({ lead_id: "b", date_rdv: DEMAIN, type_visite: DEPANNAGE })),
      avecLead(rdv({ lead_id: "c", date_rdv: "2026-10-03", type_visite: DEPANNAGE })),
      avecLead(rdv({ lead_id: "d", date_rdv: HIER, type_visite: DEPANNAGE, statut: "termine" })),
      avecLead(rdv({ lead_id: "e", date_rdv: HIER, type_visite: DEPANNAGE }), "perdu"),
    ];
    expect(rdvsAConfirmer(rdvs, NOW)).toEqual([]);
  });
});

describe("rattrapage : « Mise à jour proposée »", () => {
  const ancien = (p: Partial<LeadAuto> & { id: string }) => lead({ created_at: "2026-06-01T09:00:00", ...p });

  it("intervention ancienne jamais clôturée → Converti, cochée", () => {
    const r = rdv({ lead_id: "a", date_rdv: "2026-10-03", type_visite: DEPANNAGE });
    const [p] = calculerPropositions([ancien({ id: "a" })], [r], AUCUN_CHANTIER, NOW);
    expect(p).toMatchObject({ propose: "converti", coche: true, statutAvant: "RDV passé" });
    expect(p.raison).toBe("Intervention du 03/10 passée");
  });

  it("visite ancienne récente → Devis envoyé, daté du jour de la visite", () => {
    const r = rdv({ lead_id: "a", date_rdv: "2026-11-10", type_visite: VISITE });
    const [p] = calculerPropositions([ancien({ id: "a" })], [r], AUCUN_CHANTIER, NOW);
    expect(p).toMatchObject({ propose: "devis envoyé", coche: true, dateDevis: "2026-11-10" });
  });

  it("visite de plus de 60 jours → Sans suite", () => {
    const r = rdv({ lead_id: "a", date_rdv: "2026-07-05", type_visite: VISITE });
    const [p] = calculerPropositions([ancien({ id: "a" })], [r], AUCUN_CHANTIER, NOW);
    expect(p.propose).toBe("sans suite");
  });

  it("RDV « Autre » ancien : proposé mais décoché", () => {
    const r = rdv({ lead_id: "a", date_rdv: "2026-11-02", type_visite: "Autre" });
    const [p] = calculerPropositions([ancien({ id: "a" })], [r], AUCUN_CHANTIER, NOW);
    expect(p.coche).toBe(false);
  });

  it("ne propose rien pour un lead terminé, avec RDV à venir, ou avec chantier ouvert", () => {
    const vieux = rdv({ lead_id: "a", date_rdv: "2026-10-03", type_visite: DEPANNAGE });
    expect(calculerPropositions([ancien({ id: "a", status: "converti" })], [vieux], AUCUN_CHANTIER, NOW)).toEqual([]);
    const aVenir = rdv({ lead_id: "a", date_rdv: DEMAIN });
    expect(calculerPropositions([ancien({ id: "a" })], [vieux, aVenir], AUCUN_CHANTIER, NOW)).toEqual([]);
    const chantier: ChantierAuto = { lead_id: "a", statut: "en_cours", date_fin: "2026-12-20" };
    expect(calculerPropositions([ancien({ id: "a" })], [vieux], [chantier], NOW)).toEqual([]);
  });

  it("ne propose rien pour un devis envoyé et suivi depuis moins de 90 jours", () => {
    const l = ancien({ id: "a", status: "devis envoyé", devis_envoye_at: "2026-10-01" });
    const r = rdv({ lead_id: "a", date_rdv: "2026-09-25", type_visite: VISITE, statut: "termine" });
    expect(calculerPropositions([l], [r], AUCUN_CHANTIER, NOW)).toEqual([]);
  });

  it("un RDV daté d'après la mise en service ne relève pas du rattrapage", () => {
    const r = rdv({ lead_id: "a", date_rdv: HIER, type_visite: DEPANNAGE });
    expect(calculerPropositions([lead({ id: "a" })], [r], AUCUN_CHANTIER, NOW)).toEqual([]);
  });

  it("les plus anciennes d'abord, une ligne par lead", () => {
    const leads = [ancien({ id: "a" }), ancien({ id: "b" })];
    const rdvs = [
      rdv({ lead_id: "a", date_rdv: "2026-11-10", type_visite: VISITE }),
      rdv({ lead_id: "b", date_rdv: "2026-10-03", type_visite: DEPANNAGE }),
      rdv({ lead_id: "b", date_rdv: "2026-09-01", type_visite: VISITE, statut: "termine" }),
    ];
    expect(calculerPropositions(leads, rdvs, AUCUN_CHANTIER, NOW).map((p) => p.leadId)).toEqual(["b", "a"]);
  });
});
