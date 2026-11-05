import { describe, expect, it } from "vitest";
import { ajouterTrace, formatTraceEnvoi, hasUsableEmail } from "./envois";
import {
  buildWhatsappHref,
  smsTemplateAnnulationRdv,
  whatsappTemplateAnnulationRdv,
} from "./message-templates";

describe("hasUsableEmail", () => {
  it("accepte un vrai email", () => {
    expect(hasUsableEmail("client@example.be")).toBe(true);
    expect(hasUsableEmail("  Client@Example.be ")).toBe(true);
  });
  it("refuse null, vide, « Non fourni » et le placeholder local", () => {
    expect(hasUsableEmail(null)).toBe(false);
    expect(hasUsableEmail(undefined)).toBe(false);
    expect(hasUsableEmail("")).toBe(false);
    expect(hasUsableEmail("Non fourni")).toBe(false);
    expect(hasUsableEmail("rdv-1730000000@local.cuivre-electrique.com")).toBe(false);
    expect(hasUsableEmail("pas-un-email")).toBe(false);
  });
});

describe("trace d'envoi", () => {
  it("formate la ligne horodatée", () => {
    const quand = new Date(2026, 10, 4, 16, 30);
    expect(formatTraceEnvoi("WhatsApp", "Confirmation RDV", quand)).toBe(
      "04/11/2026 16:30 — WhatsApp : Confirmation RDV",
    );
    expect(formatTraceEnvoi("SMS", "  Rappel J-1 ", new Date(2026, 0, 9, 8, 5))).toBe(
      "09/01/2026 08:05 — SMS : Rappel J-1",
    );
  });
  it("ajoute en fin de notes, sans doubler les sauts de ligne", () => {
    expect(ajouterTrace(null, "L1")).toBe("L1");
    expect(ajouterTrace("", "L1")).toBe("L1");
    expect(ajouterTrace("Note existante\n\n", "L1")).toBe("Note existante\nL1");
    expect(ajouterTrace("A\nB", "C")).toBe("A\nB\nC");
  });
});

describe("annulation de RDV (SMS / WhatsApp)", () => {
  const p = { clientName: "Marie Dupont", dateIso: "2026-11-05", heure: "09:30" };
  it("SMS court, en mots simples, signé", () => {
    const sms = smsTemplateAnnulationRdv(p);
    expect(sms).toContain("Bonjour Marie");
    expect(sms).toContain("annuler");
    expect(sms).toContain("9h30");
    expect(sms).toContain("Adrian Mitric");
    expect(sms).toContain("0485 75 52 27");
    expect(sms.length).toBeLessThan(320);
  });
  it("WhatsApp reprend les mêmes informations", () => {
    const wa = whatsappTemplateAnnulationRdv(p);
    expect(wa).toContain("Marie");
    expect(wa).toContain("9h30");
    expect(wa).toContain("Le Cuivre Électrique");
  });
  it("lien WhatsApp au format international sans +", () => {
    expect(buildWhatsappHref("0485 75 52 27", "x")).toBe("https://wa.me/32485755227?text=x");
    expect(buildWhatsappHref("+32 485 75 52 27", "x")).toBe("https://wa.me/32485755227?text=x");
  });
});
