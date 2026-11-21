/**
 * Journal des mises à jour automatiques — sur l'appareil (localStorage), pour
 * le bandeau « 3 fiches mises à jour automatiquement » et l'écran « Mise à
 * jour proposée ». La trace durable est la ligne écrite dans les notes de
 * chaque lead ; ce journal n'est qu'un confort d'affichage (pas de table).
 */

const CLE = "cuivre-admin-journal-auto";
const MAX = 60;

export interface EntreeJournal {
  /** Date ISO de la mise à jour. */
  quand: string;
  leadId: string;
  nom: string;
  texte: string;
}

export interface JournalAuto {
  entrees: EntreeJournal[];
  /** Entrées pas encore vues (bandeau de l'accueil). */
  nonVus: number;
}

const VIDE: JournalAuto = { entrees: [], nonVus: 0 };

const ecouteurs = new Set<() => void>();
let cache: JournalAuto | null = null;

const lire = (): JournalAuto => {
  if (cache) return cache;
  try {
    const brut = localStorage.getItem(CLE);
    const j = brut ? (JSON.parse(brut) as Partial<JournalAuto>) : null;
    cache =
      j && Array.isArray(j.entrees)
        ? { entrees: j.entrees, nonVus: typeof j.nonVus === "number" ? j.nonVus : 0 }
        : VIDE;
  } catch {
    cache = VIDE;
  }
  return cache;
};

const ecrire = (j: JournalAuto): void => {
  cache = j;
  try {
    localStorage.setItem(CLE, JSON.stringify(j));
  } catch {
    // stockage indisponible (navigation privée) : le journal vit en mémoire
  }
  ecouteurs.forEach((f) => f());
};

/** Pour useSyncExternalStore. */
export const abonnerJournal = (f: () => void): (() => void) => {
  ecouteurs.add(f);
  return () => ecouteurs.delete(f);
};
export const lireJournal = (): JournalAuto => lire();

export const ajouterAuJournal = (nouvelles: Omit<EntreeJournal, "quand">[], quand: Date = new Date()): void => {
  if (nouvelles.length === 0) return;
  const j = lire();
  const iso = quand.toISOString();
  ecrire({
    entrees: [...nouvelles.map((n) => ({ ...n, quand: iso })), ...j.entrees].slice(0, MAX),
    nonVus: j.nonVus + nouvelles.length,
  });
};

export const marquerJournalVu = (): void => {
  const j = lire();
  if (j.nonVus > 0) ecrire({ ...j, nonVus: 0 });
};
