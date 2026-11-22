import { describe, expect, it } from "vitest";
import {
  SERVICE_BORNE,
  decompteParMois,
  estDemandeBorne,
  libelleMois,
  moisDe,
} from "./demandes-bornes";
import { actionDuLien } from "../compteur";

describe("demandes de bornes", () => {
  it("reconnaît une demande de borne à son service", () => {
    expect(estDemandeBorne({ created_at: "2026-11-21T10:00:00Z", services: [SERVICE_BORNE] })).toBe(true);
    expect(estDemandeBorne({ created_at: "2026-11-21T10:00:00Z", services: ["Dépannage urgent"] })).toBe(false);
    expect(estDemandeBorne({ created_at: "2026-11-21T10:00:00Z", services: null })).toBe(false);
  });

  it("range un lead dans le mois de Bruxelles, pas dans celui d'UTC", () => {
    // 30 novembre 23:30 UTC = 1er décembre 00:30 à Bruxelles.
    expect(moisDe("2026-11-30T23:30:00Z")).toBe("2026-12");
    expect(moisDe("2026-11-30T12:00:00Z")).toBe("2026-11");
  });

  it("compte par mois : formulaire, simulateur, clics", () => {
    const lignes = decompteParMois(
      [
        { created_at: "2026-11-21T10:00:00Z", source: "simulateur", services: [SERVICE_BORNE] },
        { created_at: "2026-11-22T10:00:00Z", source: null, services: [SERVICE_BORNE, "Autre"] },
        { created_at: "2026-11-23T10:00:00Z", source: "rdv_rapide", services: [SERVICE_BORNE] },
        { created_at: "2026-11-23T10:00:00Z", source: "simulateur", services: ["Mise en conformité RGIE"] },
        { created_at: "2026-12-02T10:00:00Z", source: "simulateur", services: [SERVICE_BORNE] },
        { created_at: "2026-12-03T10:00:00Z", source: "devis_borne", services: [SERVICE_BORNE] },
      ],
      [
        { jour: "2026-11-21", page: "bornes", action: "whatsapp", nombre: 3 },
        { jour: "2026-11-22", page: "bornes", action: "whatsapp", nombre: 2 },
        { jour: "2026-11-22", page: "bornes", action: "telephone", nombre: 4 },
        { jour: "2026-11-22", page: "autre", action: "telephone", nombre: 99 },
      ],
    );
    expect(lignes).toEqual([
      { mois: "2026-12", formulaire: 0, simulateur: 1, devisPhotos: 1, whatsapp: 0, telephone: 0 },
      { mois: "2026-11", formulaire: 2, simulateur: 1, devisPhotos: 0, whatsapp: 5, telephone: 4 },
    ]);
  });

  it("ne renvoie rien quand il n'y a rien", () => {
    expect(decompteParMois([], [])).toEqual([]);
  });

  it("écrit le mois en toutes lettres", () => {
    expect(libelleMois("2026-11")).toBe("novembre 2026");
  });
});

describe("compteur : action d'un lien", () => {
  it("ne compte que le téléphone et WhatsApp", () => {
    expect(actionDuLien("tel:+32485755227")).toBe("telephone");
    expect(actionDuLien("https://wa.me/32485755227?text=Bonjour")).toBe("whatsapp");
    expect(actionDuLien("/contact")).toBeNull();
    expect(actionDuLien("mailto:contact@cuivre-electrique.com")).toBeNull();
    expect(actionDuLien(null)).toBeNull();
  });
});
