import { describe, expect, it } from "vitest";
import { avisDejaTraite, estAvisADemander, leadsAvisADemander } from "./avis";
import {
  MARGE_MATERIEL_POURCENT,
  SIGNATURE_DEPANNAGE,
  prixDepannage,
  texteWhatsappDepannage,
  zoneDeLaCommune,
} from "./depannage";
import { adresseComplete, lignesSimulateur, texteDevisPourClaude } from "./devis-claude";
import { formatTraceNote } from "./envois";
import { messageDemandeAvis, COMPANY } from "./message-templates";

describe("dépannage au téléphone — grille du 25/10/2026 (lue dans config.ts)", () => {
  it("forfait déplacement + 1re heure par zone, en journée", () => {
    expect(prixDepannage("zone1", "jour").forfait).toBe(110);
    expect(prixDepannage("zone2", "jour").forfait).toBe(130);
    expect(prixDepannage("zone3", "jour").forfait).toBe(150);
  });
  it("soir, nuit, dimanche : + 100 € dans chaque zone", () => {
    for (const z of ["zone1", "zone2", "zone3"] as const) {
      const jour = prixDepannage(z, "jour");
      const nuit = prixDepannage(z, "nuitWeekend");
      expect(nuit.forfait - jour.forfait).toBe(100);
      expect(jour.supplementHorsJour).toBe(100);
    }
  });
  it("demi-heure supplémentaire : 40 € le jour, 50 € la nuit", () => {
    expect(prixDepannage("zone1", "jour").demiHeure).toBe(40);
    expect(prixDepannage("zone3", "nuitWeekend").demiHeure).toBe(50);
  });
  it("marge matériel de 30 % (interne)", () => {
    expect(MARGE_MATERIEL_POURCENT).toBe(30);
  });
  it("retrouve la zone d'une commune, sans accent ni majuscule", () => {
    expect(zoneDeLaCommune("ottignies")).toBe("zone1");
    expect(zoneDeLaCommune("Court-Saint-Etienne")).toBe("zone1");
    expect(zoneDeLaCommune("wavre")).toBe("zone2");
    expect(zoneDeLaCommune("WATERLOO")).toBe("zone3");
    expect(zoneDeLaCommune("Bruxelles")).toBeNull();
    expect(zoneDeLaCommune("wa")).toBeNull();
  });
  it("WhatsApp : prix, ce qui est compris, matériel après accord, paiement sur place, signature", () => {
    const t = texteWhatsappDepannage("zone2", "nuitWeekend", "Marie Dupont");
    expect(t).toContain("Bonjour Marie,");
    expect(t).toContain("230 € HTVA");
    expect(t).toContain("déplacement et première heure compris");
    expect(t).toContain("50 € HTVA par demi-heure");
    expect(t).toContain("après votre accord");
    expect(t).toContain("Paiement immédiat sur place");
    expect(t.endsWith(SIGNATURE_DEPANNAGE)).toBe(true);
    expect(SIGNATURE_DEPANNAGE).toBe("Adrian Mitric – Le Cuivre Électrique / 0485 755 227");
    // la marge sur le matériel est interne : jamais dans le message au client
    expect(t).not.toContain("30 %");
    expect(texteWhatsappDepannage("zone1", "jour")).toContain("Bonjour, voici");
    expect(texteWhatsappDepannage("zone1", "jour")).toContain("110 € HTVA");
  });
});

describe("avis à demander", () => {
  it("converti ou chantier terminé, sans trace d'avis", () => {
    expect(estAvisADemander({ status: "converti", notes_internes: null }, false)).toBe(true);
    expect(estAvisADemander({ status: "devis envoyé", notes_internes: "note" }, true)).toBe(true);
    expect(estAvisADemander({ status: "devis envoyé", notes_internes: null }, false)).toBe(false);
    expect(estAvisADemander({ status: "perdu", notes_internes: null }, false)).toBe(false);
  });
  it("sort de la liste dès qu'une trace existe (demandé, depuis la fiche, ou « ne pas demander »)", () => {
    expect(avisDejaTraite("05/11/2026 16:30 — WhatsApp : Avis demandé")).toBe(true);
    expect(avisDejaTraite("05/11/2026 16:30 — SMS : Avis Google")).toBe(true);
    expect(avisDejaTraite(formatTraceNote("Avis : non", new Date(2026, 10, 5, 16, 30)))).toBe(true);
    expect(avisDejaTraite("Client très content")).toBe(false);
    // une mention dans une note libre n'est pas une trace : le lead reste dans la liste
    expect(avisDejaTraite("Client venu par un avis Google")).toBe(false);
    expect(avisDejaTraite("Avis demandé au voisin, à rappeler")).toBe(false);
    expect(avisDejaTraite("Note\n05/11/2026 16:30 — SMS : Avis demandé\nAutre note")).toBe(true);
    expect(estAvisADemander({ status: "converti", notes_internes: "05/11/2026 16:30 — SMS : Avis demandé" }, true)).toBe(false);
  });
  it("liste triée, les plus récents d'abord", () => {
    const leads = [
      { id: "a", status: "converti", notes_internes: null, created_at: "2026-10-01T10:00:00Z" },
      { id: "b", status: "traité", notes_internes: null, created_at: "2026-10-20T10:00:00Z" },
      { id: "c", status: "converti", notes_internes: "01/11/2026 09:00 — Avis : non", created_at: "2026-10-25T10:00:00Z" },
      { id: "d", status: "nouveau", notes_internes: null, created_at: "2026-10-28T10:00:00Z" },
    ];
    const chantiers = [
      { lead_id: "b", statut: "termine" },
      { lead_id: "d", statut: "programme" },
    ];
    expect(leadsAvisADemander(leads, chantiers).map((l) => l.id)).toEqual(["b", "a"]);
  });
  it("le texte d'avis contient le prénom et le lien Google", () => {
    const t = messageDemandeAvis("Marie", "votre borne");
    expect(t).toContain("Bonjour Marie");
    expect(t).toContain("votre borne");
    expect(t).toContain(COMPANY.reviewUrl);
  });
  it("trace sans canal : date, heure, texte", () => {
    expect(formatTraceNote("Avis : non", new Date(2026, 10, 5, 8, 5))).toBe("05/11/2026 08:05 — Avis : non");
  });
});

describe("préparer le devis avec Claude", () => {
  const lead = {
    name: "Marie Dupont",
    phone: "0485 12 34 56",
    email: "marie@exemple.be",
    address: null,
    rue: "Rue de l'Exemple",
    numero: "12",
    code_postal: "1340",
    commune: "Ottignies",
    client_type: "Particulier",
    services: ["Borne de recharge voiture électrique"],
    message: "Je voudrais une borne dans le garage.",
    timing: "Dans le mois",
    source: "simulateur",
    notes: null,
    notes_internes: "Tableau au sous-sol, 12 m de câble.\n05/11/2026 09:12 — WhatsApp : Bien reçu",
    payload: {
      parcours_label: "Borne de recharge",
      distance_label: "Entre 10 et 20 m",
      fourchette_totale: { min: 2650, max: 3000 },
      lignes_devis: [
        { libelle: "Borne Alfen fournie et posée", statut: "compris", min: 2650, max: 3000 },
        { libelle: "Adaptation du tableau", statut: "aConfirmer", min: null, max: null },
      ],
      complexe: true,
      raisons_complexe: ["Tableau ancien"],
    },
  };
  const rdv = { date_rdv: "2026-11-05", heure_rdv: "09:30:00", duree_minutes: 60, type_visite: "Visite technique", notes_internes: "Digicode 1234" };

  it("assemble client, besoin, visite, notes, photos et simulateur", () => {
    const t = texteDevisPourClaude(lead, rdv, ["https://exemple.test/p1.jpg", ""]);
    expect(t).toContain("Nom : Marie Dupont");
    expect(t).toContain("Téléphone : 0485 12 34 56");
    expect(t).toContain("Adresse : Rue de l'Exemple 12, 1340 Ottignies");
    expect(t).toContain("Services : Borne de recharge voiture électrique");
    expect(t).toContain("Message du client : Je voudrais une borne dans le garage.");
    expect(t).toContain("Date : jeudi 5 novembre 2026 à 09:30");
    expect(t).toContain("Type : Visite technique");
    expect(t).toContain("Notes du rendez-vous : Digicode 1234");
    expect(t).toContain("Tableau au sous-sol, 12 m de câble.");
    expect(t).toContain("Photo 1 : https://exemple.test/p1.jpg");
    expect(t).not.toContain("Photo 2");
    expect(t).toContain("Distance tableau → borne : Entre 10 et 20 m");
    expect(t).toContain("- Borne Alfen fournie et posée");
    expect(t).toContain("- Adaptation du tableau (à confirmer)");
    expect(t).toContain("Cas complexe : Tableau ancien");
  });

  it("omet les rubriques vides et n'écrit jamais un email factice", () => {
    const t = texteDevisPourClaude(
      { ...lead, email: "rdv-1@local.cuivre-electrique.com", services: [], message: null, timing: null, notes_internes: null, payload: null, rue: null, numero: null, code_postal: null, commune: null, client_type: null },
      null,
    );
    expect(t).toContain("Nom : Marie Dupont");
    expect(t).not.toContain("Email");
    expect(t).not.toContain("BESOIN");
    expect(t).not.toContain("VISITE");
    expect(t).not.toContain("NOTES INTERNES");
    expect(t).not.toContain("PHOTOS");
    expect(t).not.toContain("SIMULATEUR");
    expect(t).not.toMatch(/null|undefined/);
  });

  it("adresse : champs structurés, sinon adresse libre", () => {
    expect(adresseComplete({ address: "Chez lui", rue: null, numero: null, code_postal: null, commune: null })).toBe("Chez lui");
    expect(adresseComplete({ address: null, rue: null, numero: null, code_postal: "1300", commune: "Wavre" })).toBe("1300 Wavre");
    // même priorité que la fiche : l'adresse libre d'abord
    expect(adresseComplete({ address: "Rue du Moulin 12, 1340 Ottignies", rue: null, numero: null, code_postal: null, commune: "Ottignies" })).toBe("Rue du Moulin 12, 1340 Ottignies");
    expect(lignesSimulateur(null)).toEqual([]);
    expect(lignesSimulateur("texte")).toEqual([]);
  });
});
