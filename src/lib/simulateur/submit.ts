/**
 * Simulateur de prix v2 — enregistrement du lead.
 *
 * Reprend exactement le flux du formulaire de contact (ContactSection) :
 * upload photo -> insert Supabase -> deux emails EmailJS. Chaque étape est
 * isolée : une photo qui ne part pas, ou un email qui échoue, ne doit jamais
 * faire perdre le lead. On ne remonte une erreur au visiteur que si TOUT a
 * échoué.
 *
 * Le parcours dépannage n'appelle jamais ce module : il n'enregistre aucun
 * lead, il affiche des prix puis un bouton d'appel (arbitrage du 2026-09-13).
 */

import emailjs from "@emailjs/browser";
import imageCompression from "browser-image-compression";
import { supabase } from "@/integrations/supabase/client";
import {
  AGES_LOGEMENT,
  CHOIX_PARCOURS,
  CONTEXTES_RGIE,
  DISTANCES,
  ETATS_TABLEAU,
  FOURNISSEURS,
  NOMBRES_TABLEAUX,
  PREFERENCES_RAPPEL,
  UPLOAD,
  USAGES,
  USAGE_PAR_CONTEXTE_RGIE,
  nettoyerGsm,
  type Parcours,
  type Usage,
} from "./config";
import { formatFourchette, formatLigne, type Devis, type Reponses } from "./calcul";

// Même service EmailJS que le formulaire de contact ; deux templates dédiés au
// simulateur (variables documentées dans le README de ce dossier).
const EMAILJS_SERVICE_ID = "service_ybjga5v";
const EMAILJS_PUBLIC_KEY = "8rgPz2Ls3kaYeRHY_";
export const EMAILJS_TEMPLATE_SIMULATEUR_ADRIAN = "template_simu_adrian";
export const EMAILJS_TEMPLATE_SIMULATEUR_CLIENT = "template_simu_client";

const SERVICES_PAR_PARCOURS: Record<Parcours, string[]> = {
  borne: ["Borne de recharge voiture électrique"],
  rgie: ["Mise en conformité RGIE"],
  // Jamais utilisé en pratique (le dépannage n'enregistre pas de lead), mais la
  // policy RLS exige un tableau non vide : autant qu'il soit juste.
  depannage: ["Dépannage électrique"],
};

const libelle = (
  liste: readonly { value: string; label: string }[],
  value: string | undefined,
): string => (value ? (liste.find((c) => c.value === value)?.label ?? value) : "Non précisé");

/** Usage effectif : sur le parcours RGIE, il est déduit du motif. */
export const usageEffectif = (r: Reponses): Usage | undefined =>
  r.usage ?? (r.contexteRgie ? USAGE_PAR_CONTEXTE_RGIE[r.contexteRgie] : undefined);

export interface CoordonneesSimulateur {
  nom: string;
  telephone: string;
  email: string;
}

export interface ContexteEnvoi {
  reponses: Reponses;
  devis: Devis;
  coordonnees: CoordonneesSimulateur;
  photo: File | null;
  /** Millisecondes écoulées entre l'ouverture du simulateur et l'envoi. */
  dureeMs: number;
  /** true si la durée est anormalement courte (probable automate). */
  suspect: boolean;
  /**
   * Signale l'étape en cours, pour que le bouton dise ce qu'il est en train de
   * faire. Le transfert d'une photo est la partie longue sur mobile : sans
   * indication, l'attente ressemble à un plantage.
   */
  onProgres?: (phase: "photo" | "enregistrement") => void;
}

export interface ResultatEnvoi {
  dbOk: boolean;
  emailOk: boolean;
  photoOk: boolean;
}

/**
 * Normalise un GSM belge en +324XXXXXXXX.
 * La contrainte RLS accepte les deux formes, mais stocker une forme unique
 * évite les doublons dans l'admin.
 */
export function normaliserGsm(input: string): string {
  // Même nettoyage que la validation côté écran : ce qui a été accepté à la
  // saisie doit être stockable, quel que soit le formatage d'origine.
  const brut = nettoyerGsm(input);
  const sansPrefixe = brut.replace(/^(\+32|0032|0)/, "");
  return `+32${sansPrefixe}`;
}

/** Upload de la photo du tableau, sous le préfixe `simulateur/` du bucket. */
async function uploadPhoto(photo: File): Promise<string> {
  let file = photo;
  if (file.size > UPLOAD.seuilCompressionMo * 1024 * 1024) {
    try {
      file = await imageCompression(file, {
        maxSizeMB: UPLOAD.cibleCompressionMo,
        maxWidthOrHeight: UPLOAD.maxWidthOrHeight,
        useWebWorker: true,
      });
    } catch {
      /* on envoie l'original : une photo lourde vaut mieux que pas de photo */
    }
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `simulateur/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
  const { error } = await supabase.storage.from(UPLOAD.bucket).upload(path, file, {
    contentType: file.type || "image/jpeg",
    upsert: false,
  });
  if (error) throw error;
  return path;
}

/**
 * Résumé texte des réponses et du devis, réutilisé dans l'email, le message
 * enregistré en base et le message WhatsApp pré-rempli.
 *
 * Chaque parcours n'écrit que ses propres lignes : afficher « Usage : ma
 * voiture personnelle » sur une mise en conformité induirait Adrian en erreur
 * au moment du rappel.
 */
export function resumerSimulation(reponses: Reponses, devis: Devis): string {
  const r = reponses;
  const lignes: string[] = [`Parcours : ${libelle(CHOIX_PARCOURS, r.parcours)}`];

  if (r.parcours === "borne") {
    lignes.push(`Fourniture de la borne : ${libelle(FOURNISSEURS, r.fournisseur)}`);
    if (r.modeleBorne?.trim()) {
      lignes.push(`Modèle indiqué par le client : ${r.modeleBorne.trim()}`);
    }
    lignes.push(`Distance borne / tableau : ${libelle(DISTANCES, r.distance)}`);
    lignes.push(`État du tableau : ${libelle(ETATS_TABLEAU, r.tableau)}`);
    lignes.push(`Âge du logement : ${libelle(AGES_LOGEMENT, r.age)}`);
    lignes.push(`Usage : ${libelle(USAGES, r.usage)}`);
  }

  if (r.parcours === "rgie") {
    lignes.push(`Motif de la mise en conformité : ${libelle(CONTEXTES_RGIE, r.contexteRgie)}`);
    lignes.push(`Nombre de tableaux : ${libelle(NOMBRES_TABLEAUX, r.nombreTableaux)}`);
    lignes.push(`État de l'installation : ${libelle(ETATS_TABLEAU, r.tableau)}`);
    lignes.push(`Âge du logement : ${libelle(AGES_LOGEMENT, r.age)}`);
  }

  if (r.preferenceRappel) {
    lignes.push(`Préférence : ${libelle(PREFERENCES_RAPPEL, r.preferenceRappel)}`);
  }

  lignes.push("");

  if (devis.complexe) {
    lignes.push("Estimation : aucun prix affiché, visite sur place proposée");
    devis.raisonsComplexe.forEach((raison) => lignes.push(`  · ${raison}`));
  } else {
    lignes.push("Devis indicatif affiché :");
    devis.lignes.forEach((l) => lignes.push(`  · ${l.libelle} : ${formatLigne(l)}`));
    if (devis.total) {
      lignes.push(`  = ${devis.intituleTotal} : ${formatFourchette(devis.total)}`);
    }
    if (devis.aConfirmer) {
      lignes.push("  (postes « à confirmer » non compris dans ce total)");
    }
  }

  return lignes.join("\n");
}

/** Fourchette affichée, en une ligne, pour l'email et l'admin. */
const totalAffiche = (devis: Devis): string => {
  if (devis.complexe) return "Aucun prix affiché — visite sur place proposée";
  return devis.total ? formatFourchette(devis.total) : "Non calculée";
};

export async function envoyerSimulation(ctx: ContexteEnvoi): Promise<ResultatEnvoi> {
  const { reponses: r, devis, coordonnees, photo } = ctx;

  // 1. Photo (facultative) --------------------------------------------------
  let photoPath: string | null = null;
  let photoOk = true;
  if (photo) {
    ctx.onProgres?.("photo");
    try {
      photoPath = await uploadPhoto(photo);
    } catch {
      photoOk = false;
    }
  }
  ctx.onProgres?.("enregistrement");

  const resume = resumerSimulation(r, devis);
  const telephone = normaliserGsm(coordonnees.telephone);
  const email = coordonnees.email.trim();
  const usage = usageEffectif(r);

  const payload = {
    version: 2,
    parcours: r.parcours,
    parcours_label: libelle(CHOIX_PARCOURS, r.parcours),

    fournisseur: r.fournisseur ?? null,
    fournisseur_label: r.fournisseur ? libelle(FOURNISSEURS, r.fournisseur) : null,
    modele_borne: r.modeleBorne?.trim() || null,
    distance: r.distance ?? null,
    distance_label: r.distance ? libelle(DISTANCES, r.distance) : null,
    tableau: r.tableau ?? null,
    tableau_label: r.tableau ? libelle(ETATS_TABLEAU, r.tableau) : null,
    age_logement: r.age ?? null,
    age_logement_label: r.age ? libelle(AGES_LOGEMENT, r.age) : null,
    usage: usage ?? null,
    usage_label: usage ? libelle(USAGES, usage) : null,
    contexte_rgie: r.contexteRgie ?? null,
    contexte_rgie_label: r.contexteRgie ? libelle(CONTEXTES_RGIE, r.contexteRgie) : null,
    nombre_tableaux: r.nombreTableaux ?? null,
    nombre_tableaux_label: r.nombreTableaux
      ? libelle(NOMBRES_TABLEAUX, r.nombreTableaux)
      : null,
    preference_rappel: r.preferenceRappel ?? null,
    preference_rappel_label: r.preferenceRappel
      ? libelle(PREFERENCES_RAPPEL, r.preferenceRappel)
      : null,

    complexe: devis.complexe,
    raisons_complexe: devis.raisonsComplexe,
    // Le devis tel qu'il a été affiché : c'est la seule version qui compte le
    // jour où le client rappelle en disant « votre site m'annonçait… ».
    lignes_devis: devis.lignes.map((l) => ({
      libelle: l.libelle,
      statut: l.statut,
      min: l.montant?.min ?? null,
      max: l.montant?.max ?? null,
    })),
    total: devis.total ?? null,
    total_affiche: totalAffiche(devis),
    postes_a_confirmer: devis.aConfirmer,

    photo_path: photoPath,
    duree_ms: ctx.dureeMs,
    soumission_suspecte: ctx.suspect,
    envoye_le: new Date().toISOString(),
  };

  // 2. Lead en base ---------------------------------------------------------
  let dbOk = false;
  try {
    const { error } = await supabase.from("leads").insert({
      name: coordonnees.nom.trim(),
      // Obligatoire depuis 2026-08-16, côté client comme côté policy RLS :
      // l'accusé de réception avec l'estimation détaillée doit toujours partir.
      email,
      phone: telephone,
      // Le simulateur ne demande pas d'adresse (parcours court).
      address: "",
      client_type: usage === "societe" ? "Professionnel" : "Particulier",
      services: SERVICES_PAR_PARCOURS[r.parcours],
      message: resume,
      // NE JAMAIS changer cette valeur : la policy RLS d'insertion publique
      // bascule sur la branche « formulaire de contact » (adresse, rue, numéro,
      // code postal et commune obligatoires) pour toute autre source, et tous
      // les leads du simulateur seraient rejetés.
      source: "simulateur",
      photo_urls: photoPath ? [photoPath] : null,
      gdpr_consent: true,
      status: "nouveau",
      payload,
    } as never);
    if (error) throw error;
    dbOk = true;
  } catch {
    dbOk = false;
  }

  // 3. Emails ---------------------------------------------------------------
  // URL nue et non balise <a> : selon la configuration du template, EmailJS
  // peut échapper le HTML d'une variable, ce qui afficherait le code source au
  // lieu du lien. Une URL brute est transformée en lien cliquable par tous les
  // clients mail, sans dépendre de ce comportement.
  let lienPhoto = "Aucune photo transmise";
  if (photoPath) {
    try {
      const { data } = await supabase.storage
        .from(UPLOAD.bucket)
        .createSignedUrl(photoPath, 604800);
      lienPhoto =
        data?.signedUrl ?? "Photo reçue (lien indisponible, visible dans l'admin)";
    } catch {
      lienPhoto = "Photo reçue (lien indisponible, visible dans l'admin)";
    }
  }

  const fourchetteTexte = totalAffiche(devis);

  // Les noms de variables sont ceux des deux templates EmailJS existants : ne
  // pas les renommer sans refaire les templates côté compte EmailJS.
  const adrianParams = {
    from_name: coordonnees.nom.trim(),
    phone: telephone,
    // Format international sans « + » ni séparateur (ex. 32470123456), pour
    // construire https://wa.me/{{phone_wa}} dans le template EmailJS.
    phone_wa: telephone.replace(/\D/g, ""),
    from_email: email,
    besoin: libelle(CHOIX_PARCOURS, r.parcours),
    distance: r.distance ? libelle(DISTANCES, r.distance) : "Sans objet",
    installation: r.tableau ? libelle(ETATS_TABLEAU, r.tableau) : "Non précisé",
    // Sur le parcours RGIE, cette ligne porte le motif de la mise en conformité
    // — la question d'usage (véhicule) n'y est pas posée.
    usage: r.contexteRgie
      ? libelle(CONTEXTES_RGIE, r.contexteRgie)
      : libelle(USAGES, r.usage),
    fourchette: fourchetteTexte,
    complexe: devis.complexe ? "OUI — visite sur place proposée" : "Non",
    resume,
    photo: lienPhoto,
    suspect: ctx.suspect ? `OUI (envoi en ${Math.round(ctx.dureeMs / 1000)} s)` : "Non",
    db_status: dbOk ? "Enregistré" : "ECHEC BASE — lead à ré-encoder à la main",
    date: new Date().toLocaleString("fr-BE"),
  };

  const clientParams = {
    to_email: email,
    from_name: coordonnees.nom.trim(),
    besoin: libelle(CHOIX_PARCOURS, r.parcours),
    fourchette: fourchetteTexte,
    resume,
  };

  let emailOk = false;
  try {
    const envois = [
      emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_SIMULATEUR_ADRIAN, adrianParams, {
        publicKey: EMAILJS_PUBLIC_KEY,
      }),
    ];
    // L'email est obligatoire depuis 2026-08-16 : la garde ne sert plus qu'à
    // ne jamais appeler EmailJS avec un destinataire vide si la validation
    // client venait à être contournée.
    if (email) {
      envois.push(
        emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_SIMULATEUR_CLIENT, clientParams, {
          publicKey: EMAILJS_PUBLIC_KEY,
        }),
      );
    }
    await Promise.all(envois);
    emailOk = true;
  } catch {
    emailOk = false;
  }

  return { dbOk, emailOk, photoOk };
}
