import { describe, expect, it } from "vitest";
import {
  demanderAccord,
  nettoyerTelephone,
  orienterVersZaptecPro,
  resumer,
  valider,
  type Coordonnees,
  type Textes,
} from "./config";

const coord = (c: Partial<Coordonnees> = {}): Coordonnees => ({
  nom: "Jean Dupont",
  telephone: "",
  email: "",
  codePostal: "1490",
  ...c,
});
const textes = (t: Partial<Textes> = {}): Textes => ({ modem: "", voiture: "", modeleBorne: "", message: "", ...t });

describe("devis borne : ce qui est obligatoire", () => {
  it("accepte un téléphone seul ou un e-mail seul", () => {
    expect(valider(coord({ telephone: "0485 75 52 27" }))).toEqual({});
    expect(valider(coord({ email: "jean@example.com" }))).toEqual({});
  });

  it("refuse quand il n'y a ni téléphone ni e-mail", () => {
    expect(valider(coord()).contact).toBeDefined();
  });

  it("exige le nom et un code postal à 4 chiffres", () => {
    expect(valider(coord({ nom: " ", telephone: "0485755227" })).nom).toBeDefined();
    expect(valider(coord({ codePostal: "149", telephone: "0485755227" })).codePostal).toBeDefined();
    expect(valider(coord({ codePostal: "B-1490", telephone: "0485755227" })).codePostal).toBeDefined();
  });

  it("signale un téléphone ou un e-mail incomplet, même si l'autre est bon", () => {
    expect(valider(coord({ telephone: "0485", email: "jean@example.com" })).telephone).toBeDefined();
    expect(valider(coord({ telephone: "0485755227", email: "jean@" })).email).toBeDefined();
  });

  it("ne garde du téléphone que les chiffres et le +", () => {
    expect(nettoyerTelephone("+32 485/75.52.27")).toBe("+32485755227");
    expect(nettoyerTelephone("   ")).toBe("");
  });
});

describe("devis borne : orientation et résumé", () => {
  it("oriente vers la Zaptec Pro pour une copropriété ou une entreprise seulement", () => {
    expect(orienterVersZaptecPro({ logement: "copropriete" })).toBe(true);
    expect(orienterVersZaptecPro({ logement: "entreprise" })).toBe(true);
    expect(orienterVersZaptecPro({ logement: "maison" })).toBe(false);
    expect(orienterVersZaptecPro({})).toBe(false);
  });

  it("ne demande l'accord qu'à un locataire ou en copropriété", () => {
    expect(demanderAccord({ statut: "locataire" })).toBe(true);
    expect(demanderAccord({ logement: "copropriete", statut: "proprietaire" })).toBe(true);
    expect(demanderAccord({ logement: "maison", statut: "proprietaire" })).toBe(false);
  });

  it("résume seulement ce qui a été répondu, sans lien vers les photos", () => {
    const texte = resumer(
      { logement: "maison", borne: "deja", wifi: "non", usage: "societe" },
      textes({ modeleBorne: "Wallbox Pulsar", modem: "au salon", voiture: "Tesla Model 3", message: "Merci" }),
      coord({ telephone: "0485755227" }),
      2,
      ["compteur", "trajet"],
    );
    expect(texte).toContain("Code postal : 1490");
    expect(texte).toContain("Lieu : Une maison");
    expect(texte).toContain("Borne souhaitée : J'ai déjà ma borne (Wallbox Pulsar)");
    expect(texte).toContain("Emplacement du modem : au salon");
    expect(texte).toContain("Marque et modèle : Tesla Model 3");
    expect(texte).toContain("Photos : 2, visibles dans l'admin (le compteur ; le trajet du câble).");
    expect(texte).toContain("Message du client :\nMerci");
    expect(texte).not.toContain("Statut");
    expect(texte).not.toMatch(/https?:\/\//);
  });

  it("dit qu'il n'y a pas de photo, et note l'orientation Zaptec Pro", () => {
    const texte = resumer({ logement: "entreprise" }, textes(), coord({ email: "a@b.be" }), 0, []);
    expect(texte).toContain("Photos : aucune.");
    expect(texte).toContain("Zaptec Pro");
  });
});
