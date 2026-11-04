import { describe, expect, it } from "vitest";
import {
  CSV_HEADER,
  calculerHeuresNettes,
  construireCsv,
  filtrerPourExport,
  formaterHeures,
  formulaireVide,
  kmParDefaut,
  ligneCsv,
  messageDoublon,
  moisDe,
  moisSuivant,
  nomFichierCsv,
  nomsChantiers,
  resumeParChantier,
  semaineDe,
  totaux,
  totauxParType,
  trouverDoublon,
  validerSaisie,
  versFormulaire,
  type Chantier,
  type Heure,
  type HeureFormValues,
} from "./heures";

const ligne = (p: Partial<Heure> & Pick<Heure, "date" | "chantier">): Heure => ({
  id: p.id ?? Math.random().toString(36).slice(2),
  type: "chantier",
  debut: "07:30:00",
  fin: "16:30:00",
  pause_min: 30,
  heures_nettes: 8.5,
  km: 40,
  forfait_eur: null,
  note: null,
  created_at: "2026-11-04T06:00:00Z",
  updated_at: "2026-11-04T06:00:00Z",
  ...p,
});

const saisie = (p: Partial<HeureFormValues> = {}): HeureFormValues => ({
  ...formulaireVide("2026-11-04"),
  chantier: "Wemmel",
  debut: "07:30",
  fin: "16:30",
  ...p,
});

describe("calculerHeuresNettes", () => {
  it("retire la pause et arrondit à 2 décimales", () => {
    expect(calculerHeuresNettes("07:30", "16:30", 30)).toBe(8.5);
    expect(calculerHeuresNettes("08:00", "12:20", 0)).toBe(4.33);
    expect(calculerHeuresNettes("07:30:00", "16:30:00", 30)).toBe(8.5); // format DB
  });
  it("nuit qui passe minuit : fin avant début = lendemain", () => {
    expect(calculerHeuresNettes("22:00", "01:30", 0)).toBe(3.5);
    expect(calculerHeuresNettes("23:00", "00:30", 30)).toBe(1);
  });
  it("retourne null si incomplet, durée nulle ou pause trop longue", () => {
    expect(calculerHeuresNettes("", "16:30", 30)).toBeNull();
    expect(calculerHeuresNettes("08:00", "08:00", 0)).toBeNull();
    expect(calculerHeuresNettes("08:00", "08:20", 30)).toBeNull();
  });
  it("formate en h et minutes", () => {
    expect(formaterHeures(8.5)).toBe("8 h 30");
    expect(formaterHeures(0)).toBe("0 h 00");
    expect(formaterHeures(4.33)).toBe("4 h 20");
  });
});

describe("semaineDe / moisDe", () => {
  it("donne lundi → dimanche avec le numéro ISO", () => {
    // 2026-11-04 est un mercredi, semaine ISO 45
    expect(semaineDe("2026-11-04")).toEqual({ from: "2026-11-02", to: "2026-11-08", label: "Semaine 45" });
    expect(semaineDe("2026-11-08")).toEqual({ from: "2026-11-02", to: "2026-11-08", label: "Semaine 45" });
    expect(semaineDe("2026-11-09").from).toBe("2026-11-09");
  });
  it("gère le passage d'année (semaine 1 ISO)", () => {
    expect(semaineDe("2027-01-01").label).toBe("Semaine 53");
    expect(semaineDe("2027-01-04").label).toBe("Semaine 1");
  });
  it("mois calendaire et navigation", () => {
    expect(moisDe("2026-11-15")).toEqual({ from: "2026-11-01", to: "2026-11-30", label: "Novembre 2026" });
    expect(moisDe("2028-02-10").to).toBe("2028-02-29");
    expect(moisSuivant("2026-12-31", 1)).toBe("2027-01-01");
    expect(moisSuivant("2026-03-31", -1)).toBe("2026-02-01");
  });
});

describe("validerSaisie", () => {
  it("CHANTIER : début/fin obligatoires, heures nettes calculées", () => {
    const r = validerSaisie(saisie({ km: "40", note: "  tirage câbles " }));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.valeur).toEqual({
        date: "2026-11-04",
        type: "chantier",
        chantier: "Wemmel",
        debut: "07:30",
        fin: "16:30",
        pause_min: 30,
        heures_nettes: 8.5,
        km: 40,
        forfait_eur: null,
        note: "tirage câbles",
      });
    }
    const sans = validerSaisie(saisie({ debut: "", fin: "" }));
    expect(sans.ok).toBe(false);
    if (sans.ok === false) expect(sans.erreur).toMatch(/obligatoires/);
  });

  it("FORFAIT : montant accepté avec virgule, ignoré pour les autres types", () => {
    const r = validerSaisie(saisie({ type: "forfait", forfaitEur: "450,50" }));
    expect(r.ok && r.valeur.forfait_eur).toBe(450.5);
    const autre = validerSaisie(saisie({ type: "chantier", forfaitEur: "450" }));
    expect(autre.ok && autre.valeur.forfait_eur).toBeNull();
  });

  it("DÉPLACEMENT : début/fin facultatifs, 0 h si absents, km décimaux", () => {
    const r = validerSaisie(saisie({ type: "deplacement", debut: "", fin: "", km: "12,5" }));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.valeur.debut).toBeNull();
      expect(r.valeur.fin).toBeNull();
      expect(r.valeur.heures_nettes).toBe(0);
      expect(r.valeur.km).toBe(12.5);
    }
    const moitie = validerSaisie(saisie({ type: "deplacement", debut: "09:00", fin: "" }));
    expect(moitie.ok).toBe(false);
    if (moitie.ok === false) expect(moitie.erreur).toMatch(/début ET la fin/);
  });

  it("refuse chantier vide, fin avant début, pause trop longue, km négatif", () => {
    expect(validerSaisie(saisie({ chantier: "  " })).ok).toBe(false);
    const inv = validerSaisie(saisie({ debut: "08:00", fin: "08:00" }));
    expect(inv.ok === false && inv.erreur).toMatch(/identiques/);
    const nuit = validerSaisie(saisie({ debut: "22:00", fin: "01:30", pauseMin: "" }));
    expect(nuit.ok && nuit.valeur.heures_nettes).toBe(3.5);
    expect(nuit.ok && nuit.valeur.pause_min).toBe(0);
    const pause = validerSaisie(saisie({ debut: "08:00", fin: "08:15", pauseMin: "30" }));
    expect(pause.ok === false && pause.erreur).toMatch(/pause/i);
    expect(validerSaisie(saisie({ km: "-3" })).ok).toBe(false);
    expect(validerSaisie(saisie({ pauseMin: "abc" })).ok).toBe(false);
  });
});

describe("doublons", () => {
  const existantes = [
    ligne({ id: "a", date: "2026-11-04", chantier: "Wemmel" }),
    ligne({ id: "b", date: "2026-11-04", chantier: "Catinus", debut: null, fin: null, type: "deplacement", heures_nettes: 0 }),
  ];

  it("même date + même chantier (casse ignorée) + mêmes heures", () => {
    const d = trouverDoublon({ date: "2026-11-04", chantier: "wemmel", debut: "07:30", fin: "16:30" }, existantes);
    expect(d?.id).toBe("a");
    expect(messageDoublon(d!)).toContain("Déjà pointé");
    expect(messageDoublon(d!)).toContain("07:30–16:30");
  });
  it("pas de doublon si heures différentes, autre date ou ligne en cours d'édition", () => {
    expect(trouverDoublon({ date: "2026-11-04", chantier: "Wemmel", debut: "08:00", fin: "16:30" }, existantes)).toBeUndefined();
    expect(trouverDoublon({ date: "2026-11-05", chantier: "Wemmel", debut: "07:30", fin: "16:30" }, existantes)).toBeUndefined();
    expect(trouverDoublon({ date: "2026-11-04", chantier: "Wemmel", debut: "07:30", fin: "16:30" }, existantes, "a")).toBeUndefined();
  });
  it("couvre un déplacement sans horaire", () => {
    expect(trouverDoublon({ date: "2026-11-04", chantier: "Catinus", debut: null, fin: null }, existantes)?.id).toBe("b");
  });
});

describe("totaux et chantiers", () => {
  const lignes = [
    ligne({ date: "2026-11-02", chantier: "Wemmel", heures_nettes: 8.5, km: 40 }),
    ligne({ date: "2026-11-02", chantier: "wemmel", debut: "17:00:00", fin: "18:00:00", heures_nettes: 1, km: null }),
    ligne({ date: "2026-11-03", chantier: "Wemmel", heures_nettes: 8, km: 40, created_at: "2026-11-03T06:00:00Z" }),
    ligne({ date: "2026-11-04", chantier: "Catinus", type: "forfait", heures_nettes: 7, km: 25, forfait_eur: 450 }),
    ligne({ date: "2026-11-04", chantier: "Cebeo", type: "deplacement", debut: null, fin: null, heures_nettes: 0, km: 18.5 }),
  ];
  const chantiers: Chantier[] = [
    { id: "c1", nom: "Wemmel", heures_prevues: 15, km_defaut: 40, actif: true, created_at: "" },
    { id: "c2", nom: "Van Damme", heures_prevues: 20, km_defaut: 12, actif: true, created_at: "" },
    // faute de frappe corrigée : ni pointage ni estimation → invisible
    { id: "c3", nom: "Wemel", heures_prevues: null, km_defaut: 40, actif: true, created_at: "" },
  ];

  it("totaux : jours = dates distinctes", () => {
    expect(totaux(lignes)).toEqual({ heures: 24.5, km: 123.5, forfait: 450, jours: 3, lignes: 5 });
    const parType = totauxParType(lignes);
    expect(parType.chantier.heures).toBe(17.5);
    expect(parType.forfait.forfait).toBe(450);
    expect(parType.deplacement.km).toBe(18.5);
    expect(parType.total.jours).toBe(3);
  });

  it("résumé par chantier : cumuls, % prévu, dépassement, chantiers du référentiel", () => {
    const r = resumeParChantier(lignes, chantiers);
    const wemmel = r.find((x) => x.cle === "wemmel")!;
    expect(wemmel.jours).toBe(2);
    expect(wemmel.heures).toBe(17.5);
    expect(wemmel.km).toBe(80);
    expect(wemmel.heuresPrevues).toBe(15);
    expect(wemmel.pourcentage).toBe(117);
    expect(wemmel.depasse).toBe(true);
    expect(wemmel.chantierId).toBe("c1");
    const catinus = r.find((x) => x.cle === "catinus")!;
    expect(catinus.pourcentage).toBeNull();
    expect(catinus.chantierId).toBeNull();
    expect(r.find((x) => x.cle === "van damme")?.heures).toBe(0);
    expect(r.find((x) => x.cle === "wemel")).toBeUndefined();
    // le plus récent d'abord
    expect(r[0].derniereDate).toBe("2026-11-04");
  });

  it("suggestions du plus récent au plus ancien, sans doublon de casse", () => {
    expect(nomsChantiers(lignes, chantiers)).toEqual(["Catinus", "Cebeo", "Wemmel", "Van Damme"]);
  });

  it("km par défaut : dernière ligne du chantier, sinon km_defaut, sinon null", () => {
    expect(kmParDefaut("wemmel", lignes, chantiers)).toBe(40);
    expect(kmParDefaut("Van Damme", lignes, chantiers)).toBe(12);
    expect(kmParDefaut("Inconnu", lignes, chantiers)).toBeNull();
    expect(kmParDefaut("", lignes, chantiers)).toBeNull();
  });
});

describe("export CSV", () => {
  it("en-tête = 8 colonnes de heures.csv + type;forfait_eur", () => {
    expect(CSV_HEADER.join(";")).toBe("date;chantier;debut;fin;pause;heures_nettes;km;note;type;forfait_eur");
  });
  it("formate comme hours.mjs : HH:MM, pause HH:MM, décimales à la virgule", () => {
    expect(ligneCsv(ligne({ date: "2026-11-04", chantier: "Wemmel", note: "tirage" }))).toBe(
      "2026-11-04;Wemmel;07:30;16:30;00:30;8,50;40;tirage;chantier;",
    );
    expect(
      ligneCsv(ligne({ date: "2026-11-04", chantier: "Catinus", type: "forfait", heures_nettes: 7, pause_min: 0, km: 12.5, forfait_eur: 450 })),
    ).toBe("2026-11-04;Catinus;07:30;16:30;00:00;7,00;12,5;;forfait;450,00");
    expect(
      ligneCsv(ligne({ date: "2026-11-04", chantier: "Cebeo", type: "deplacement", debut: null, fin: null, heures_nettes: 0, km: null })),
    ).toBe("2026-11-04;Cebeo;;;00:30;0,00;;;deplacement;");
  });
  it("échappe les ; guillemets et retours ligne", () => {
    const l = ligne({ date: "2026-11-04", chantier: 'Client "Dupont"; Bxl', note: "ligne 1\nligne 2" });
    expect(ligneCsv(l)).toBe('2026-11-04;"Client ""Dupont""; Bxl";07:30;16:30;00:30;8,50;40;"ligne 1\nligne 2";chantier;');
  });
  it("BOM + CRLF, filtre période + chantier, nom de fichier", () => {
    const lignes = [
      ligne({ date: "2026-10-31", chantier: "Wemmel" }),
      ligne({ date: "2026-11-04", chantier: "Wemmel" }),
      ligne({ date: "2026-11-05", chantier: "Catinus" }),
    ];
    const f = { from: "2026-11-01", to: "2026-11-30", chantier: "wemmel" };
    const sel = filtrerPourExport(lignes, f);
    expect(sel).toHaveLength(1);
    const csv = construireCsv(sel);
    expect(csv.startsWith("﻿date;chantier")).toBe(true);
    expect(csv.split("\r\n")).toHaveLength(3); // en-tête, 1 ligne, fin de fichier
    expect(nomFichierCsv(f)).toBe("heures-2026-11-01_2026-11-30-wemmel.csv");
    expect(filtrerPourExport(lignes, { ...f, chantier: "" })).toHaveLength(2);
  });
});

describe("versFormulaire", () => {
  it("convertit une ligne DB en valeurs d'inputs", () => {
    const v = versFormulaire(ligne({ date: "2026-11-04", chantier: "Wemmel", km: 40, note: null }));
    expect(v).toEqual({
      date: "2026-11-04",
      type: "chantier",
      chantier: "Wemmel",
      debut: "07:30",
      fin: "16:30",
      pauseMin: "30",
      km: "40",
      forfaitEur: "",
      note: "",
    });
  });
});
