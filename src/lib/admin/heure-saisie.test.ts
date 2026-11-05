import { describe, expect, it } from "vitest";
import { estHeureValide, formaterSaisieHeure, normaliserSaisieHeure } from "./heure-saisie";

describe("formaterSaisieHeure (au fil de la frappe)", () => {
  it("ajoute le « : » tout seul sur une heure à deux chiffres", () => {
    expect(formaterSaisieHeure("0")).toBe("0");
    expect(formaterSaisieHeure("07")).toBe("07");
    expect(formaterSaisieHeure("073")).toBe("07:3");
    expect(formaterSaisieHeure("0730")).toBe("07:30");
    expect(formaterSaisieHeure("1630")).toBe("16:30");
    expect(formaterSaisieHeure("2359")).toBe("23:59");
  });
  it("comprend une heure tapée sur un seul chiffre", () => {
    expect(formaterSaisieHeure("7")).toBe("7");
    expect(formaterSaisieHeure("73")).toBe("7:3");
    expect(formaterSaisieHeure("730")).toBe("7:30");
    expect(formaterSaisieHeure("25")).toBe("2:5");
  });
  it("respecte un séparateur déjà saisi et ignore le reste", () => {
    expect(formaterSaisieHeure("7:3")).toBe("7:3");
    expect(formaterSaisieHeure("16h30")).toBe("16:30");
    expect(formaterSaisieHeure("07:30")).toBe("07:30");
    expect(formaterSaisieHeure("07305")).toBe("07:30");
    expect(formaterSaisieHeure("ab")).toBe("");
  });
});

describe("normaliserSaisieHeure (à la sortie du champ)", () => {
  it("complète en HH:MM sur 24 h", () => {
    expect(normaliserSaisieHeure("7")).toBe("07:00");
    expect(normaliserSaisieHeure("7:3")).toBe("07:30");
    expect(normaliserSaisieHeure("7:30")).toBe("07:30");
    expect(normaliserSaisieHeure("730")).toBe("07:30");
    expect(normaliserSaisieHeure("0730")).toBe("07:30");
    expect(normaliserSaisieHeure("16h")).toBe("16:00");
    expect(normaliserSaisieHeure("16h30")).toBe("16:30");
    expect(normaliserSaisieHeure("22:30")).toBe("22:30");
    expect(normaliserSaisieHeure("00:00")).toBe("00:00");
  });
  it("renvoie vide pour une heure impossible ou du texte", () => {
    expect(normaliserSaisieHeure("")).toBe("");
    expect(normaliserSaisieHeure("24:00")).toBe("");
    expect(normaliserSaisieHeure("12:75")).toBe("");
    expect(normaliserSaisieHeure("midi")).toBe("");
    expect(normaliserSaisieHeure("3 PM")).toBe("");
  });
});

describe("estHeureValide", () => {
  it("n'accepte que HH:MM sur 24 h", () => {
    expect(estHeureValide("06:30")).toBe(true);
    expect(estHeureValide("22:30")).toBe(true);
    expect(estHeureValide("7:30")).toBe(false);
    expect(estHeureValide("24:00")).toBe(false);
    expect(estHeureValide("")).toBe(false);
    expect(estHeureValide(null)).toBe(false);
  });
});
