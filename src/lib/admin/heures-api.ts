/**
 * Pointage des heures — accès Supabase (tables `heures` et `chantiers`).
 *
 * Les deux tables sont réservées à l'admin connecté (RLS, migration
 * 20261104120000_pointage_heures.sql). Le volume est faible (un électricien,
 * quelques centaines de lignes par an) : on charge tout et on calcule côté
 * client (semaine, mois, chantiers, suggestions) — cf. heures.ts.
 */

import { supabase } from "@/integrations/supabase/client";
import { cleChantier, type Chantier, type Heure, type HeureInput } from "@/lib/admin/heures";

const PAGE = 1000; // limite par défaut de PostgREST

/** Toutes les lignes de pointage, de la plus récente à la plus ancienne. */
export const fetchHeures = async (): Promise<Heure[]> => {
  const out: Heure[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("heures")
      .select("*")
      .order("date", { ascending: false })
      .order("debut", { ascending: false, nullsFirst: false })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    out.push(...((data ?? []) as Heure[]));
    if (!data || data.length < PAGE) break;
  }
  return out;
};

export const fetchChantiers = async (): Promise<Chantier[]> => {
  const { data, error } = await supabase.from("chantiers").select("*").order("nom");
  if (error) throw new Error(error.message);
  return (data ?? []) as Chantier[];
};

/** Code PostgreSQL d'une violation d'unicité (index heures_doublon_key). */
const UNIQUE_VIOLATION = "23505";

const traduireErreur = (message: string, code?: string): Error => {
  if (code === UNIQUE_VIOLATION) {
    return new Error("Déjà pointé : même date, même chantier, mêmes heures.");
  }
  return new Error(message);
};

/**
 * Crée le chantier dans le référentiel à la première saisie d'un nom et
 * mémorise les km par défaut. Ne bloque jamais la saisie des heures : une
 * erreur ici est remontée à l'appelant qui décide (toast discret).
 */
export const assurerChantier = async (
  nom: string,
  km: number | null,
  existants: Chantier[],
): Promise<void> => {
  const k = cleChantier(nom);
  const existant = existants.find((c) => cleChantier(c.nom) === k);
  if (!existant) {
    const { error } = await supabase
      .from("chantiers")
      .insert({ nom: nom.trim(), km_defaut: km });
    // 23505 : créé entre-temps (autre onglet) → rien à faire.
    if (error && error.code !== UNIQUE_VIOLATION) throw new Error(error.message);
    return;
  }
  if (km !== null && Number(existant.km_defaut) !== km) {
    const { error } = await supabase
      .from("chantiers")
      .update({ km_defaut: km })
      .eq("id", existant.id);
    if (error) throw new Error(error.message);
  }
};

export const insererHeure = async (valeur: HeureInput): Promise<Heure> => {
  const { data, error } = await supabase.from("heures").insert(valeur).select("*").single();
  if (error) throw traduireErreur(error.message, error.code);
  return data as Heure;
};

export const modifierHeure = async (id: string, valeur: HeureInput): Promise<Heure> => {
  const { data, error } = await supabase
    .from("heures")
    .update(valeur)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw traduireErreur(error.message, error.code);
  return data as Heure;
};

export const supprimerHeure = async (id: string): Promise<void> => {
  const { error } = await supabase.from("heures").delete().eq("id", id);
  if (error) throw new Error(error.message);
};

/**
 * Enregistre les heures prévues (estimation du devis) d'un chantier.
 * Si le chantier n'existe pas encore dans le référentiel (ancienne ligne
 * saisie avant sa création), il est créé à la volée.
 */
export const enregistrerHeuresPrevues = async (
  nom: string,
  chantierId: string | null,
  heuresPrevues: number | null,
): Promise<void> => {
  if (chantierId) {
    const { error } = await supabase
      .from("chantiers")
      .update({ heures_prevues: heuresPrevues })
      .eq("id", chantierId);
    if (error) throw new Error(error.message);
    return;
  }
  const { error } = await supabase
    .from("chantiers")
    .insert({ nom: nom.trim(), heures_prevues: heuresPrevues });
  if (!error) return;
  if (error.code !== UNIQUE_VIOLATION) throw new Error(error.message);
  // Créé entre-temps (autre onglet, autre casse) : on met à jour par nom.
  const motif = nom.trim().replace(/[\\%_]/g, (c) => `\\${c}`);
  const maj = await supabase
    .from("chantiers")
    .update({ heures_prevues: heuresPrevues })
    .ilike("nom", motif);
  if (maj.error) throw new Error(maj.error.message);
};
