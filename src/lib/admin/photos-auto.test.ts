import { describe, expect, it } from "vitest";
import {
  SUPPRESSION_PHOTOS_ACTIVE,
  dateLimitePhotos,
  photosASupprimer,
  type LeadPhotos,
} from "./photos-auto";

const NOW = new Date(2027, 5, 10, 10, 0); // 10 juin 2027 → limite : 10 décembre 2026

const lead = (p: Partial<LeadPhotos> & { id: string }): LeadPhotos => ({
  name: `Client ${p.id}`,
  status: "sans suite",
  created_at: "2026-11-23T09:00:00",
  devis_envoye_at: null,
  photo_urls: ["devis-borne/a.jpg", "devis-borne/b.jpg"],
  ...p,
});

const ids = (r: { leadId: string }[]) => r.map((x) => x.leadId);

describe("interrupteur", () => {
  // Garde-fou : ce test se modifie en même temps que l'interrupteur, qui ne
  // change que sur l'accord d'Adrian (activé le 23/11/2026).
  it("la suppression est activée", () => {
    expect(SUPPRESSION_PHOTOS_ACTIVE).toBe(true);
  });
});

describe("date limite : aujourd'hui moins 6 mois", () => {
  it("même jour, 6 mois plus tôt", () => {
    expect(dateLimitePhotos(NOW)).toBe("2026-12-10");
    expect(dateLimitePhotos(new Date(2027, 0, 15))).toBe("2026-07-15");
  });
  it("un jour qui n'existe pas donne le dernier jour du mois, jamais plus tard", () => {
    expect(dateLimitePhotos(new Date(2027, 7, 31))).toBe("2027-02-28"); // 31 août → 28 février
    expect(dateLimitePhotos(new Date(2026, 11, 31))).toBe("2026-06-30"); // 31 décembre → 30 juin
  });
});

describe("photos à supprimer", () => {
  it("demande de plus de 6 mois, sans suite, rien d'autre : photos supprimées", () => {
    const r = photosASupprimer([lead({ id: "a" })], [], [], NOW);
    expect(r).toEqual([{ leadId: "a", leadName: "Client a", chemins: ["devis-borne/a.jpg", "devis-borne/b.jpg"] }]);
  });

  it("6 mois jour pour jour : gardées ; un jour de plus : supprimées", () => {
    const pile = lead({ id: "pile", created_at: "2026-12-10T08:00:00" });
    const veille = lead({ id: "veille", created_at: "2026-12-09T23:00:00" });
    expect(ids(photosASupprimer([pile, veille], [], [], NOW))).toEqual(["veille"]);
  });

  it("une demande récente garde ses photos", () => {
    expect(photosASupprimer([lead({ id: "a", created_at: "2027-03-01T09:00:00" })], [], [], NOW)).toEqual([]);
  });

  it("un client (converti) garde ses photos, quel que soit l'âge", () => {
    expect(photosASupprimer([lead({ id: "a", status: "converti", created_at: "2025-01-01T09:00:00" })], [], [], NOW)).toEqual([]);
  });

  it("tous les autres statuts sont concernés, même une fiche encore active", () => {
    const statuts = ["nouveau", "traité", "devis envoyé", "sans suite", "perdu", "RDV confirmé", "rdv_pris", "RDV annulé"];
    const leads = statuts.map((s, i) => lead({ id: `l${i}`, status: s }));
    expect(photosASupprimer(leads, [], [], NOW)).toHaveLength(statuts.length);
  });

  it("un chantier programmé, en cours ou terminé protège les photos ; un chantier annulé non", () => {
    const leads = ["prog", "cours", "fini", "annule"].map((id) => lead({ id }));
    const chantiers = [
      { lead_id: "prog", statut: "programme" },
      { lead_id: "cours", statut: "en_cours" },
      { lead_id: "fini", statut: "termine" },
      { lead_id: "annule", statut: "annule" },
    ];
    expect(ids(photosASupprimer(leads, [], chantiers, NOW))).toEqual(["annule"]);
  });

  it("un rendez-vous à venir protège les photos ; un rendez-vous passé ou annulé non", () => {
    const leads = ["avenir", "aujourdhui", "passe", "annule", "termine"].map((id) => lead({ id }));
    const rdvs = [
      { lead_id: "avenir", date_rdv: "2027-06-20", statut: "confirme" },
      { lead_id: "aujourdhui", date_rdv: "2027-06-10", statut: "rappel_envoye" },
      { lead_id: "passe", date_rdv: "2027-06-01", statut: "confirme" },
      { lead_id: "annule", date_rdv: "2027-06-20", statut: "annule" },
      { lead_id: "termine", date_rdv: "2027-06-20", statut: "termine" },
    ];
    expect(ids(photosASupprimer(leads, rdvs, [], NOW))).toEqual(["passe", "annule", "termine"]);
  });

  it("un devis envoyé depuis moins de 6 mois protège les photos ; un devis plus ancien non", () => {
    const recent = lead({ id: "recent", devis_envoye_at: "2027-02-01" });
    const pile = lead({ id: "pile", devis_envoye_at: "2026-12-10" });
    const vieux = lead({ id: "vieux", devis_envoye_at: "2026-12-09" });
    expect(ids(photosASupprimer([recent, pile, vieux], [], [], NOW))).toEqual(["vieux"]);
  });

  it("une fiche sans photo n'est jamais listée", () => {
    const leads = [lead({ id: "nul", photo_urls: null }), lead({ id: "vide", photo_urls: [] })];
    expect(photosASupprimer(leads, [], [], NOW)).toEqual([]);
  });

  it("une date illisible : dans le doute, on garde les photos", () => {
    expect(photosASupprimer([lead({ id: "a", created_at: "pas une date" })], [], [], NOW)).toEqual([]);
  });
});
