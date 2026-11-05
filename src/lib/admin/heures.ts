/**
 * Pointage des heures — logique pure (aucun accès réseau, aucun DOM).
 *
 * Tout ce qui se calcule à partir d'une liste de pointages vit ici :
 * heures nettes, semaine ISO, totaux semaine / mois / chantier, détection de
 * doublon, export CSV. La page /admin/heures et les tests vitest s'appuient
 * dessus ; la couche Supabase est dans heures-api.ts.
 *
 * Format CSV : reprend les 8 premières colonnes du pointage local de
 * vertuoza-tools (tools/hours.mjs → exports/heures.csv) :
 *   date;chantier;debut;fin;pause;heures_nettes;km;note
 * puis deux colonnes : type;forfait_eur.
 * Nombres décimaux à la virgule (Excel FR), BOM UTF-8, lignes CRLF.
 */

import type { Tables } from "@/integrations/supabase/types";
import { normaliserSaisieHeure } from "@/lib/admin/heure-saisie";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export const TYPES_HEURES = ["chantier", "forfait", "deplacement"] as const;
export type TypeHeure = (typeof TYPES_HEURES)[number];

export const TYPE_LABELS: Record<TypeHeure, string> = {
  chantier: "Chantier",
  forfait: "Forfait",
  deplacement: "Déplacement",
};

export const TYPE_DESCRIPTIONS: Record<TypeHeure, string> = {
  chantier: "Heures sur un de mes chantiers",
  forfait: "Journée payée au forfait (sous-traitance, client au forfait)",
  deplacement: "Visite devis, fournisseur, contrôle : surtout des km",
};

/** Ligne de la table `heures` (types générés ; `debut`/`fin` arrivent en "07:30:00"). */
export type Heure = Tables<"heures">;

/** Ligne de la table `chantiers` (référentiel des noms). */
export type Chantier = Tables<"chantiers">;

/** Valeurs du formulaire de saisie (toutes en chaînes, comme les inputs). */
export interface HeureFormValues {
  date: string;
  type: TypeHeure;
  chantier: string;
  debut: string; // "HH:MM" ou ""
  fin: string;
  pauseMin: string; // minutes, ex. "30"
  km: string;
  forfaitEur: string;
  note: string;
}

/** Payload prêt pour l'insertion / la mise à jour Supabase. */
export interface HeureInput {
  date: string;
  type: TypeHeure;
  chantier: string;
  debut: string | null; // "HH:MM"
  fin: string | null;
  pause_min: number;
  heures_nettes: number;
  km: number | null;
  forfait_eur: number | null;
  note: string | null;
}

// ---------------------------------------------------------------------------
// Dates & heures
// ---------------------------------------------------------------------------

const pad2 = (n: number): string => String(n).padStart(2, "0");

/** Date locale au format AAAA-MM-JJ (jamais via toISOString : fuseau). */
export const toIsoDate = (d: Date): string =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

export const todayIso = (): string => toIsoDate(new Date());

export const addDays = (iso: string, n: number): string => {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + n);
  return toIsoDate(d);
};

/** Normalise "07:30:00" / "7:30" → "07:30". Retourne null si vide/invalide. */
export const normaliserHeure = (s: string | null | undefined): string | null => {
  if (!s) return null;
  const m = /^(\d{1,2}):(\d{2})/.exec(s.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const mn = Number(m[2]);
  if (h > 23 || mn > 59) return null;
  return `${pad2(h)}:${m[2]}`;
};

export const heureEnMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

export const minutesEnHeure = (min: number): string =>
  `${pad2(Math.floor(min / 60))}:${pad2(min % 60)}`;

/**
 * Heures nettes = (fin − début) − pause, en heures décimales arrondies à 2.
 * Retourne null si début/fin absents ou si le résultat n'est pas calculable.
 */
export const calculerHeuresNettes = (
  debut: string | null | undefined,
  fin: string | null | undefined,
  pauseMin: number,
): number | null => {
  const d = normaliserHeure(debut);
  const f = normaliserHeure(fin);
  if (!d || !f) return null;
  // fin < début = fin le lendemain (dépannage de nuit 22:00 → 01:30).
  let brut = heureEnMinutes(f) - heureEnMinutes(d);
  if (brut === 0) return null;
  if (brut < 0) brut += 24 * 60;
  const net = brut - Math.max(0, pauseMin || 0);
  if (net < 0) return null;
  return Math.round((net / 60) * 100) / 100;
};

/** "8.5" → "8 h 30" ; "0" → "0 h 00". */
export const formaterHeures = (heures: number): string => {
  const totalMin = Math.round(heures * 60);
  return `${Math.floor(totalMin / 60)} h ${pad2(totalMin % 60)}`;
};

/** Nombre décimal à la française : 8.5 → "8,50" (n décimales). */
export const decimalFr = (n: number, decimales = 2): string =>
  n.toFixed(decimales).replace(".", ",");

/** Montant pour l'écran : entier tel quel, sinon les centimes (450 / 450,50). */
export const eurosTexte = (n: number): string =>
  Number.isInteger(n) ? String(n) : decimalFr(n, 2);

// ---------------------------------------------------------------------------
// Semaine / mois
// ---------------------------------------------------------------------------

export interface Periode {
  from: string; // inclus
  to: string; // inclus
  label: string;
}

/** Semaine lundi → dimanche contenant la date, avec numéro ISO. */
export const semaineDe = (iso: string): Periode => {
  const d = new Date(`${iso}T12:00:00`);
  const jour = (d.getDay() + 6) % 7; // lundi = 0
  const lundi = new Date(d);
  lundi.setDate(d.getDate() - jour);
  const dimanche = new Date(lundi);
  dimanche.setDate(lundi.getDate() + 6);

  // Numéro de semaine ISO 8601 (semaine du jeudi).
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
  const numero = Math.ceil(
    ((t.getTime() - Date.UTC(t.getUTCFullYear(), 0, 1)) / 86400000 + 1) / 7,
  );

  return {
    from: toIsoDate(lundi),
    to: toIsoDate(dimanche),
    label: `Semaine ${numero}`,
  };
};

const MOIS_FR = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

/** Mois calendaire contenant la date. */
export const moisDe = (iso: string): Periode => {
  const [y, m] = iso.split("-").map(Number);
  const dernier = new Date(y, m, 0).getDate();
  const mois = MOIS_FR[m - 1];
  return {
    from: `${y}-${pad2(m)}-01`,
    to: `${y}-${pad2(m)}-${pad2(dernier)}`,
    label: `${mois.charAt(0).toUpperCase()}${mois.slice(1)} ${y}`,
  };
};

/** Décale une date d'un mois (jour ramené au 1er pour éviter les 31 → 03). */
export const moisSuivant = (iso: string, n: number): string => {
  const [y, m] = iso.split("-").map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return toIsoDate(d);
};

export const dansPeriode = (date: string, p: { from: string; to: string }): boolean =>
  date >= p.from && date <= p.to;

const JOURS_COURTS = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"];

/** "2026-11-04" → "mer 04/11". */
export const formaterDateCourte = (iso: string): string => {
  const d = new Date(`${iso}T12:00:00`);
  return `${JOURS_COURTS[d.getDay()]} ${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`;
};

// ---------------------------------------------------------------------------
// Totaux
// ---------------------------------------------------------------------------

export interface Totaux {
  heures: number;
  km: number;
  forfait: number;
  jours: number; // dates distinctes
  lignes: number;
}

const arrondi2 = (n: number): number => Math.round(n * 100) / 100;

export const totaux = (lignes: Heure[]): Totaux => {
  const dates = new Set<string>();
  let heures = 0;
  let km = 0;
  let forfait = 0;
  for (const l of lignes) {
    dates.add(l.date);
    heures += Number(l.heures_nettes) || 0;
    km += Number(l.km) || 0;
    forfait += Number(l.forfait_eur) || 0;
  }
  return {
    heures: arrondi2(heures),
    km: arrondi2(km),
    forfait: arrondi2(forfait),
    jours: dates.size,
    lignes: lignes.length,
  };
};

export type TotauxParType = Record<TypeHeure, Totaux> & { total: Totaux };

export const totauxParType = (lignes: Heure[]): TotauxParType => ({
  chantier: totaux(lignes.filter((l) => l.type === "chantier")),
  forfait: totaux(lignes.filter((l) => l.type === "forfait")),
  deplacement: totaux(lignes.filter((l) => l.type === "deplacement")),
  total: totaux(lignes),
});

/** Clé de regroupement : « Wemmel » et « wemmel » sont le même chantier. */
export const cleChantier = (nom: string): string => nom.trim().toLowerCase();

export interface ChantierResume {
  cle: string;
  nom: string; // libellé le plus récent
  jours: number;
  heures: number;
  km: number;
  forfait: number;
  derniereDate: string;
  heuresPrevues: number | null;
  /** Réalisé / prévu en %, null si pas d'estimation. */
  pourcentage: number | null;
  depasse: boolean;
  chantierId: string | null;
}

/**
 * Un résumé par chantier, trié par activité la plus récente. Les chantiers du
 * référentiel sans aucun pointage n'apparaissent que s'ils ont des heures prévues.
 */
export const resumeParChantier = (lignes: Heure[], chantiers: Chantier[]): ChantierResume[] => {
  const parCle = new Map<string, Heure[]>();
  for (const l of lignes) {
    const k = cleChantier(l.chantier);
    const arr = parCle.get(k);
    if (arr) arr.push(l);
    else parCle.set(k, [l]);
  }

  const refParCle = new Map<string, Chantier>();
  for (const c of chantiers) refParCle.set(cleChantier(c.nom), c);

  // Un chantier du référentiel sans aucun pointage n'apparaît que s'il porte
  // une estimation : une faute de frappe corrigée dans la ligne disparaît
  // ainsi toute seule au lieu de rester une carte « 0 h » à vie.
  const cles = new Set<string>([...parCle.keys()]);
  for (const c of chantiers) {
    if (c.actif && c.heures_prevues !== null) cles.add(cleChantier(c.nom));
  }

  const resumes: ChantierResume[] = [];
  for (const cle of cles) {
    const ls = (parCle.get(cle) ?? []).slice().sort((a, b) => b.date.localeCompare(a.date));
    const ref = refParCle.get(cle) ?? null;
    const t = totaux(ls);
    const prevues = ref?.heures_prevues ?? null;
    const pct =
      prevues && prevues > 0 ? Math.round((t.heures / Number(prevues)) * 100) : null;
    resumes.push({
      cle,
      nom: ls[0]?.chantier ?? ref?.nom ?? cle,
      jours: t.jours,
      heures: t.heures,
      km: t.km,
      forfait: t.forfait,
      derniereDate: ls[0]?.date ?? "",
      heuresPrevues: prevues !== null ? Number(prevues) : null,
      pourcentage: pct,
      depasse: pct !== null && pct > 100,
      chantierId: ref?.id ?? null,
    });
  }
  return resumes.sort((a, b) => b.derniereDate.localeCompare(a.derniereDate) || a.nom.localeCompare(b.nom));
};

/** Noms de chantier distincts, du plus récent au plus ancien. */
export const nomsChantiers = (lignes: Heure[], chantiers: Chantier[]): string[] => {
  const vus = new Set<string>();
  const out: string[] = [];
  const tries = lignes.slice().sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at));
  for (const l of tries) {
    const k = cleChantier(l.chantier);
    if (!vus.has(k)) {
      vus.add(k);
      out.push(l.chantier.trim());
    }
  }
  // Même règle que resumeParChantier : pas de suggestion pour un nom du
  // référentiel qui n'a ni pointage ni estimation (faute de frappe corrigée).
  for (const c of chantiers) {
    const k = cleChantier(c.nom);
    if (c.actif && c.heures_prevues !== null && !vus.has(k)) {
      vus.add(k);
      out.push(c.nom);
    }
  }
  return out;
};

/** Km de la dernière ligne (date la plus récente) du même chantier, sinon km_defaut. */
export const kmParDefaut = (
  nom: string,
  lignes: Heure[],
  chantiers: Chantier[],
): number | null => {
  const k = cleChantier(nom);
  if (!k) return null;
  const derniere = lignes
    .filter((l) => cleChantier(l.chantier) === k && l.km !== null)
    .sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at))[0];
  if (derniere) return Number(derniere.km);
  const ref = chantiers.find((c) => cleChantier(c.nom) === k);
  return ref?.km_defaut !== null && ref?.km_defaut !== undefined ? Number(ref.km_defaut) : null;
};

// ---------------------------------------------------------------------------
// Validation du formulaire
// ---------------------------------------------------------------------------

export type ResultatValidation =
  | { ok: true; valeur: HeureInput }
  | { ok: false; erreur: string };

const parseNombre = (s: string): number | null => {
  const t = s.trim().replace(",", ".");
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : NaN;
};

/**
 * Valide les valeurs du formulaire et produit le payload DB.
 * Les messages sont destinés à l'écran (français, courts).
 */
export const validerSaisie = (v: HeureFormValues): ResultatValidation => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v.date)) return { ok: false, erreur: "Choisis une date." };
  if (!TYPES_HEURES.includes(v.type)) return { ok: false, erreur: "Choisis un type." };

  const chantier = v.chantier.trim();
  if (!chantier) return { ok: false, erreur: "Indique le chantier ou le client." };
  if (chantier.length > 120) return { ok: false, erreur: "Nom de chantier trop long (120 max)." };

  // Saisie libre (champ HH:MM) : "7", "730", "7:3" sont complétés ; ce qui
  // n'est pas une heure est SIGNALÉ, jamais traité comme un champ vide.
  const debutSaisi = v.debut.trim();
  const finSaisie = v.fin.trim();
  const debut = debutSaisi ? normaliserSaisieHeure(debutSaisi) || null : null;
  const fin = finSaisie ? normaliserSaisieHeure(finSaisie) || null : null;
  if (debutSaisi && !debut) return { ok: false, erreur: "Heure de début invalide : format HH:MM (ex. 07:30)." };
  if (finSaisie && !fin) return { ok: false, erreur: "Heure de fin invalide : format HH:MM (ex. 16:30)." };
  if ((debut === null) !== (fin === null)) {
    return { ok: false, erreur: "Indique le début ET la fin (ou aucun des deux)." };
  }
  if (v.type !== "deplacement" && !debut) {
    return { ok: false, erreur: "Début et fin sont obligatoires pour ce type." };
  }

  const pause = v.pauseMin.trim() === "" ? 0 : parseNombre(v.pauseMin);
  if (pause === null || Number.isNaN(pause) || pause < 0 || !Number.isInteger(pause)) {
    return { ok: false, erreur: "Pause : nombre de minutes entier (0 si aucune)." };
  }

  let heuresNettes = 0;
  if (debut && fin) {
    if (heureEnMinutes(fin) === heureEnMinutes(debut)) {
      return { ok: false, erreur: "Début et fin identiques : indique une vraie durée." };
    }
    const h = calculerHeuresNettes(debut, fin, pause);
    if (h === null) return { ok: false, erreur: "La pause dépasse la durée de la journée." };
    heuresNettes = h;
  }

  const km = parseNombre(v.km);
  if (km !== null && (Number.isNaN(km) || km < 0)) {
    return { ok: false, erreur: "Km : nombre positif attendu." };
  }

  let forfait: number | null = null;
  if (v.type === "forfait") {
    forfait = parseNombre(v.forfaitEur);
    if (forfait !== null && (Number.isNaN(forfait) || forfait < 0)) {
      return { ok: false, erreur: "Forfait : montant positif attendu." };
    }
  }

  const note = v.note.trim();
  if (note.length > 1000) return { ok: false, erreur: "Note trop longue (1000 max)." };

  return {
    ok: true,
    valeur: {
      date: v.date,
      type: v.type,
      chantier,
      debut,
      fin,
      pause_min: pause,
      heures_nettes: heuresNettes,
      km: km === null ? null : Math.round(km * 10) / 10,
      forfait_eur: forfait === null ? null : Math.round(forfait * 100) / 100,
      note: note || null,
    },
  };
};

/**
 * Doublon = même date + même chantier (insensible à la casse) + mêmes heures.
 * `ignorerId` exclut la ligne en cours de modification.
 */
export const trouverDoublon = (
  saisie: Pick<HeureInput, "date" | "chantier" | "debut" | "fin">,
  lignes: Heure[],
  ignorerId?: string | null,
): Heure | undefined => {
  const k = cleChantier(saisie.chantier);
  const d = saisie.debut ?? "00:00";
  const f = saisie.fin ?? "00:00";
  return lignes.find(
    (l) =>
      l.id !== ignorerId &&
      l.date === saisie.date &&
      cleChantier(l.chantier) === k &&
      (normaliserHeure(l.debut) ?? "00:00") === d &&
      (normaliserHeure(l.fin) ?? "00:00") === f,
  );
};

/** Message affiché quand un doublon est détecté. */
export const messageDoublon = (d: Heure): string => {
  const horaires = d.debut && d.fin ? ` ${normaliserHeure(d.debut)}–${normaliserHeure(d.fin)}` : "";
  return `Déjà pointé : ${formaterDateCourte(d.date)}${horaires} sur « ${d.chantier} ». Modifie la ligne existante plutôt que d'en ajouter une.`;
};

/** Convertit une ligne DB en valeurs de formulaire (pour la modification). */
export const versFormulaire = (l: Heure): HeureFormValues => ({
  date: l.date,
  type: (TYPES_HEURES.includes(l.type as TypeHeure) ? l.type : "chantier") as TypeHeure,
  chantier: l.chantier,
  debut: normaliserHeure(l.debut) ?? "",
  fin: normaliserHeure(l.fin) ?? "",
  pauseMin: String(l.pause_min ?? 0),
  km: l.km === null || l.km === undefined ? "" : String(Number(l.km)),
  forfaitEur: l.forfait_eur === null || l.forfait_eur === undefined ? "" : String(Number(l.forfait_eur)),
  note: l.note ?? "",
});

export const formulaireVide = (date = todayIso()): HeureFormValues => ({
  date,
  type: "chantier",
  chantier: "",
  debut: "",
  fin: "",
  pauseMin: "30",
  km: "",
  forfaitEur: "",
  note: "",
});

// ---------------------------------------------------------------------------
// Export CSV
// ---------------------------------------------------------------------------

export const CSV_HEADER = [
  "date",
  "chantier",
  "debut",
  "fin",
  "pause",
  "heures_nettes",
  "km",
  "note",
  "type",
  "forfait_eur",
] as const;

/** Échappement CSV : guillemets si ; " ou retour ligne (comme hours.mjs). */
export const celluleCsv = (v: string | number | null | undefined): string => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Km : entier tel quel, sinon une décimale à la virgule. Vide si absent. */
const kmCsv = (km: number | null): string => {
  if (km === null || km === undefined) return "";
  const n = Number(km);
  return Number.isInteger(n) ? String(n) : decimalFr(n, 1);
};

export const ligneCsv = (l: Heure): string =>
  [
    l.date,
    l.chantier,
    normaliserHeure(l.debut) ?? "",
    normaliserHeure(l.fin) ?? "",
    minutesEnHeure(l.pause_min ?? 0),
    decimalFr(Number(l.heures_nettes) || 0),
    kmCsv(l.km),
    l.note ?? "",
    l.type,
    l.forfait_eur === null || l.forfait_eur === undefined ? "" : decimalFr(Number(l.forfait_eur)),
  ]
    .map(celluleCsv)
    .join(";");

export interface FiltreExport {
  from: string;
  to: string;
  /** Clé de chantier (cleChantier) ou "" pour tous. */
  chantier: string;
}

export const filtrerPourExport = (lignes: Heure[], f: FiltreExport): Heure[] =>
  lignes
    .filter((l) => dansPeriode(l.date, f) && (!f.chantier || cleChantier(l.chantier) === f.chantier))
    .sort((a, b) => a.date.localeCompare(b.date) || (a.debut ?? "").localeCompare(b.debut ?? ""));

/** Contenu complet du fichier : BOM + en-tête + lignes, CRLF. */
export const construireCsv = (lignes: Heure[]): string =>
  "﻿" + [CSV_HEADER.join(";"), ...lignes.map(ligneCsv)].join("\r\n") + "\r\n";

export const nomFichierCsv = (f: FiltreExport): string => {
  const suffixe = f.chantier ? `-${f.chantier.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "")}` : "";
  return `heures-${f.from}_${f.to}${suffixe}.csv`;
};
