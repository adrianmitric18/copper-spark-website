import { describe, expect, it } from "vitest";
import {
  ACCUEIL_MAX_AGE_JOURS,
  ARCHIVE_APRES_JOURS,
  LEAD_STATUSES,
  TERMINER_CHOIX,
  derniereActionMs,
  derniereTraceMs,
  estARappeler,
  estArchivable,
  estChantierATerminer,
  estChantierEnCours,
  isARelancerStatus,
  isRdvPasse,
  isTerminal,
  libelleStatutLead,
  todayIsoLocal,
} from "./types";

const NOW = new Date(2026, 10, 5, 10, 0); // 5 novembre 2026, 10 h
const TODAY = "2026-11-05";
const ilYA = (jours: number): string => new Date(NOW.getTime() - jours * 86400000).toISOString();

describe("statuts terminés", () => {
  it("converti, sans suite et perdu sont terminés ; le reste est actif", () => {
    expect(isTerminal("converti")).toBe(true);
    expect(isTerminal("sans suite")).toBe(true);
    expect(isTerminal("perdu")).toBe(true);
    for (const s of ["nouveau", "traité", "devis envoyé", "RDV confirmé", "RDV annulé", "rdv_pris", "", null, undefined]) {
      expect(isTerminal(s)).toBe(false);
    }
  });
  it("« sans suite » fait partie des statuts et des trois issues de « Terminer »", () => {
    expect(LEAD_STATUSES).toContain("sans suite");
    expect(TERMINER_CHOIX.map((c) => c.value)).toEqual(["converti", "sans suite", "perdu"]);
    expect(TERMINER_CHOIX.every((c) => isTerminal(c.value))).toBe(true);
  });
  it("à relancer : nouveau / traité / devis envoyé seulement", () => {
    expect(isARelancerStatus("nouveau")).toBe(true);
    expect(isARelancerStatus("devis envoyé")).toBe(true);
    expect(isARelancerStatus("RDV confirmé")).toBe(false);
    expect(isARelancerStatus("sans suite")).toBe(false);
  });
});

describe("RDV passé", () => {
  it("date avant aujourd'hui ET statut encore ouvert", () => {
    expect(isRdvPasse({ date_rdv: "2026-11-04", statut: "confirme" }, TODAY)).toBe(true);
    expect(isRdvPasse({ date_rdv: "2026-11-04", statut: "rappel_envoye" }, TODAY)).toBe(true);
  });
  it("pas « passé » si aujourd'hui, à venir, terminé, annulé ou absent", () => {
    expect(isRdvPasse({ date_rdv: TODAY, statut: "confirme" }, TODAY)).toBe(false);
    expect(isRdvPasse({ date_rdv: "2026-11-06", statut: "confirme" }, TODAY)).toBe(false);
    expect(isRdvPasse({ date_rdv: "2026-11-04", statut: "termine" }, TODAY)).toBe(false);
    expect(isRdvPasse({ date_rdv: "2026-11-04", statut: "annule" }, TODAY)).toBe(false);
    expect(isRdvPasse(null, TODAY)).toBe(false);
  });
  it("plus de « RDV confirmé » affiché pour un lead sans RDV à venir", () => {
    expect(libelleStatutLead("RDV confirmé", false)).toBe("RDV passé");
    expect(libelleStatutLead("RDV confirmé", true)).toBe("RDV confirmé");
    expect(libelleStatutLead("devis envoyé", false)).toBe("devis envoyé");
    // RDV rapide : statut technique rdv_pris, jamais affiché brut
    expect(libelleStatutLead("rdv_pris", false)).toBe("RDV passé");
    expect(libelleStatutLead("rdv_pris", true)).toBe("RDV pris");
  });
  it("todayIsoLocal donne la date locale", () => {
    expect(todayIsoLocal(new Date(2026, 0, 9, 0, 30))).toBe("2026-01-09");
  });
});

describe("leads à rappeler (accueil)", () => {
  const lead = (status: string, jours: number, phone = "0485755227") => ({ status, phone, created_at: ilYA(jours) });
  it("nouveau, sans RDV à venir, moins de 30 jours", () => {
    expect(estARappeler(lead("nouveau", 2), false, NOW)).toBe(true);
    expect(estARappeler(lead("nouveau", ACCUEIL_MAX_AGE_JOURS), false, NOW)).toBe(true);
  });
  it("exclut traité, RDV à venir, plus de 30 jours, sans téléphone", () => {
    expect(estARappeler(lead("traité", 2), false, NOW)).toBe(false);
    expect(estARappeler(lead("nouveau", 2), true, NOW)).toBe(false);
    expect(estARappeler(lead("nouveau", ACCUEIL_MAX_AGE_JOURS + 1), false, NOW)).toBe(false);
    expect(estARappeler(lead("nouveau", 2, ""), false, NOW)).toBe(false);
  });
});

describe("archiver les anciens", () => {
  const lead = (p: Partial<{ status: string; created_at: string; devis_envoye_at: string | null; notes_internes: string | null }>) => ({
    status: "traité",
    created_at: ilYA(200),
    devis_envoye_at: null,
    notes_internes: null,
    ...p,
  });

  it("lit la dernière ligne de trace des notes", () => {
    const notes = "Client pressé\n01/09/2026 09:00 — SMS : Bien reçu\n20/10/2026 16:30 — WhatsApp : Relance devis 2";
    expect(derniereTraceMs(notes)).toBe(new Date(2026, 9, 20, 16, 30).getTime());
    expect(derniereTraceMs("juste une note")).toBeNull();
    expect(derniereTraceMs(null)).toBeNull();
  });

  it("dernière action = max(création, devis, trace, dernier RDV)", () => {
    const l = lead({ devis_envoye_at: "2026-08-01", notes_internes: "20/10/2026 16:30 — WhatsApp : Relance" });
    expect(derniereActionMs(l)).toBe(new Date(2026, 9, 20, 16, 30).getTime());
    expect(derniereActionMs(l, "2026-11-01")).toBe(new Date(2026, 10, 1, 12).getTime());
    expect(derniereActionMs(lead({}))).toBe(new Date(ilYA(200)).getTime());
    expect(derniereActionMs(lead({}), null, "2026-10-28")).toBe(new Date(2026, 9, 28, 12).getTime());
  });

  it("archivable : actif, sans RDV à venir, sans action depuis 60 jours", () => {
    expect(estArchivable(lead({ created_at: ilYA(ARCHIVE_APRES_JOURS) }), { aUnRdvAVenir: false }, NOW)).toBe(true);
    expect(estArchivable(lead({ status: "RDV confirmé" }), { aUnRdvAVenir: false, dernierRdvIso: "2026-06-01" }, NOW)).toBe(true);
  });

  it("jamais proposé : RDV à venir, action récente, déjà terminé", () => {
    expect(estArchivable(lead({}), { aUnRdvAVenir: true }, NOW)).toBe(false);
    expect(estArchivable(lead({ created_at: ilYA(59) }), { aUnRdvAVenir: false }, NOW)).toBe(false);
    expect(estArchivable(lead({ devis_envoye_at: "2026-10-20" }), { aUnRdvAVenir: false }, NOW)).toBe(false);
    expect(estArchivable(lead({ notes_internes: "01/11/2026 08:00 — SMS : Rappel lead" }), { aUnRdvAVenir: false }, NOW)).toBe(false);
    expect(estArchivable(lead({}), { aUnRdvAVenir: false, dernierRdvIso: "2026-10-30" }, NOW)).toBe(false);
    // un chantier programmé ou en cours, ou terminé récemment : jamais proposé
    expect(estArchivable(lead({}), { aUnRdvAVenir: false, aUnChantierOuvert: true }, NOW)).toBe(false);
    expect(estArchivable(lead({}), { aUnRdvAVenir: false, dernierChantierIso: "2026-10-15" }, NOW)).toBe(false);
    for (const status of ["converti", "sans suite", "perdu"]) {
      expect(estArchivable(lead({ status }), { aUnRdvAVenir: false }, NOW)).toBe(false);
    }
  });
});

describe("chantiers programmés", () => {
  const c = (statut: string, date_debut: string, date_fin: string) => ({ statut, date_debut, date_fin });
  it("un chantier programmé dont la date de fin est passée est « en cours » (plus invisible)", () => {
    expect(estChantierEnCours(c("programme", "2026-10-20", "2026-10-22"), TODAY)).toBe(true);
    expect(estChantierATerminer(c("programme", "2026-10-20", "2026-10-22"), TODAY)).toBe(true);
  });
  it("en cours : statut en_cours ou programmé déjà démarré", () => {
    expect(estChantierEnCours(c("en_cours", "2026-11-10", "2026-11-12"), TODAY)).toBe(true);
    expect(estChantierEnCours(c("programme", "2026-11-04", "2026-11-06"), TODAY)).toBe(true);
    expect(estChantierEnCours(c("programme", "2026-11-06", "2026-11-07"), TODAY)).toBe(false);
    expect(estChantierEnCours(c("termine", "2026-10-20", "2026-10-22"), TODAY)).toBe(false);
    expect(estChantierEnCours(c("annule", "2026-10-20", "2026-10-22"), TODAY)).toBe(false);
  });
  it("bouton « Terminer » seulement quand la date de fin est atteinte", () => {
    expect(estChantierATerminer(c("en_cours", "2026-11-04", TODAY), TODAY)).toBe(true);
    expect(estChantierATerminer(c("programme", "2026-11-04", "2026-11-06"), TODAY)).toBe(false);
    expect(estChantierATerminer(c("termine", "2026-10-20", "2026-10-22"), TODAY)).toBe(false);
  });
});
