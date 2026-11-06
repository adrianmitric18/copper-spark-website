/**
 * « Préparer le devis avec Claude » (lot 2b.1 du brief admin 2026-11) — logique pure.
 *
 * Assemble en TEXTE BRUT tout ce que la fiche sait du lead, pour qu'Adrian le
 * colle dans sa discussion Claude, qui prépare les postes Vertuoza. Aucun appel
 * d'API : la fonction ne fait que mettre en forme des données déjà chargées.
 */

import { hasUsableEmail } from "@/lib/admin/envois";
import type { Lead, Rdv } from "@/lib/admin/types";

type LeadDevis = Pick<
  Lead,
  | "name"
  | "phone"
  | "email"
  | "address"
  | "rue"
  | "numero"
  | "code_postal"
  | "commune"
  | "client_type"
  | "services"
  | "message"
  | "timing"
  | "source"
  | "notes_internes"
  | "notes"
  | "payload"
>;

type RdvDevis = Pick<Rdv, "date_rdv" | "heure_rdv" | "duree_minutes" | "type_visite" | "notes_internes">;

const dateLongue = (iso: string): string =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("fr-BE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const euros = (n: number): string => `${Math.round(n).toLocaleString("fr-BE")} €`;

const fourchette = (v: unknown): string | null => {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  const f = v as { min?: unknown; max?: unknown };
  if (typeof f.min !== "number" || typeof f.max !== "number") return null;
  return f.min === f.max ? euros(f.min) : `${euros(f.min)} – ${euros(f.max)}`;
};

/** Libellés lisibles des réponses du simulateur (clés du payload). */
const CHAMPS_SIMULATEUR: [string, string][] = [
  ["parcours_label", "Parcours"],
  ["besoin_label", "Besoin"],
  ["usage_label", "Usage"],
  ["contexte_rgie_label", "Contexte RGIE"],
  ["installation_label", "Installation"],
  ["tableau_label", "Tableau"],
  ["nombre_tableaux_label", "Nombre de tableaux"],
  ["age_logement_label", "Âge du logement"],
  ["distance_label", "Distance tableau → borne"],
  ["modele_borne", "Borne"],
  ["fournisseur_label", "Fournisseur"],
  ["preference_rappel_label", "Préférence de rappel"],
];

const STATUTS_LIGNE: Record<string, string> = {
  compris: "compris",
  aConfirmer: "à confirmer",
  surDevis: "sur devis",
};

/** Réponses du simulateur, en lignes « Libellé : valeur ». Vide si pas de payload. */
export const lignesSimulateur = (payload: unknown): string[] => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return [];
  const p = payload as Record<string, unknown>;
  const out: string[] = [];
  for (const [cle, libelle] of CHAMPS_SIMULATEUR) {
    const v = p[cle];
    if (typeof v === "string" && v.trim()) out.push(`${libelle} : ${v.trim()}`);
  }
  const total = fourchette(p.fourchette_totale) ?? fourchette(p.fourchette_borne) ?? fourchette(p.fourchette_rgie);
  if (total) out.push(`Estimation affichée au client : ${total}`);
  if (Array.isArray(p.lignes_devis)) {
    for (const l of p.lignes_devis) {
      if (!l || typeof l !== "object" || Array.isArray(l)) continue;
      const ligne = l as { libelle?: unknown; statut?: unknown; min?: unknown; max?: unknown };
      if (typeof ligne.libelle !== "string") continue;
      const montant = fourchette(ligne);
      const statut = typeof ligne.statut === "string" ? STATUTS_LIGNE[ligne.statut] ?? ligne.statut : null;
      out.push(`- ${ligne.libelle}${montant ? ` : ${montant}` : ""}${statut ? ` (${statut})` : ""}`);
    }
  }
  if (p.complexe === true) {
    const raisons = Array.isArray(p.raisons_complexe)
      ? p.raisons_complexe.filter((r): r is string => typeof r === "string")
      : [];
    out.push(`Cas complexe${raisons.length ? ` : ${raisons.join(" ; ")}` : ""}`);
  }
  return out;
};

export const adresseComplete = (lead: Pick<Lead, "address" | "rue" | "numero" | "code_postal" | "commune">): string => {
  const ligne1 = [lead.rue, lead.numero].filter(Boolean).join(" ");
  const ligne2 = [lead.code_postal, lead.commune].filter(Boolean).join(" ");
  return [ligne1, ligne2].filter(Boolean).join(", ") || (lead.address ?? "").trim();
};

/**
 * Le texte à coller dans Claude. Les rubriques vides sont omises ; les liens
 * de photos sont des liens signés, valables une heure.
 */
export const texteDevisPourClaude = (
  lead: LeadDevis,
  rdv: RdvDevis | null,
  liensPhotos: string[] = [],
): string => {
  const blocs: string[] = [];
  const bloc = (titre: string, lignes: (string | null | false | undefined)[]) => {
    const utiles = lignes.filter((l): l is string => typeof l === "string" && l.trim() !== "");
    if (utiles.length) blocs.push([titre, ...utiles].join("\n"));
  };

  const adresse = adresseComplete(lead);
  bloc("CLIENT", [
    `Nom : ${lead.name}`,
    `Téléphone : ${lead.phone}`,
    hasUsableEmail(lead.email) && `Email : ${lead.email}`,
    adresse && `Adresse : ${adresse}`,
    lead.client_type && `Type de client : ${lead.client_type}`,
  ]);

  bloc("BESOIN", [
    lead.services?.length ? `Services : ${lead.services.join(", ")}` : null,
    lead.message?.trim() ? `Message du client : ${lead.message.trim()}` : null,
    lead.timing?.trim() ? `Délai souhaité : ${lead.timing.trim()}` : null,
  ]);

  if (rdv) {
    bloc("VISITE", [
      `Date : ${dateLongue(rdv.date_rdv)} à ${rdv.heure_rdv.slice(0, 5)}`,
      `Type : ${rdv.type_visite}`,
      rdv.duree_minutes ? `Durée prévue : ${rdv.duree_minutes} min` : null,
      rdv.notes_internes?.trim() ? `Notes du rendez-vous : ${rdv.notes_internes.trim()}` : null,
    ]);
  }

  const notes = (lead.notes_internes || lead.notes || "").trim();
  bloc("NOTES INTERNES (dictées sur place)", [notes]);

  bloc(
    "PHOTOS (liens valables 1 heure)",
    liensPhotos.filter(Boolean).map((u, i) => `Photo ${i + 1} : ${u}`),
  );

  bloc("RÉPONSES DU SIMULATEUR", lignesSimulateur(lead.payload));

  return [
    "Prépare les postes du devis Vertuoza pour ce client à partir des informations ci-dessous.",
    "",
    blocs.join("\n\n"),
  ].join("\n");
};
