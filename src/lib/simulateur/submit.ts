/**
 * Simulateur de prix — enregistrement du lead.
 *
 * Reprend exactement le flux du formulaire de contact (ContactSection) :
 * upload photo -> insert Supabase -> deux emails EmailJS. Chaque étape est
 * isolée : une photo qui ne part pas, ou un email qui échoue, ne doit jamais
 * faire perdre le lead. On ne remonte une erreur au visiteur que si TOUT a
 * échoué.
 */

import emailjs from "@emailjs/browser";
import imageCompression from "browser-image-compression";
import { supabase } from "@/integrations/supabase/client";
import {
  BESOINS,
  DISTANCES,
  INSTALLATIONS,
  USAGES,
  UPLOAD,
  type Besoin,
} from "./config";
import { formatFourchette, type Estimation, type ReponsesSimulateur } from "./calcul";

// Même service EmailJS que le formulaire de contact ; deux nouveaux templates
// dédiés au simulateur (à créer côté compte EmailJS — variables documentées
// dans le README de ce dossier).
const EMAILJS_SERVICE_ID = "service_ybjga5v";
const EMAILJS_PUBLIC_KEY = "8rgPz2Ls3kaYeRHY_";
export const EMAILJS_TEMPLATE_SIMULATEUR_ADRIAN = "template_simu_adrian";
export const EMAILJS_TEMPLATE_SIMULATEUR_CLIENT = "template_simu_client";

const SERVICES_PAR_BESOIN: Record<Besoin, string[]> = {
  borne: ["Borne de recharge voiture électrique"],
  rgie: ["Mise en conformité RGIE"],
  combine: ["Borne de recharge voiture électrique", "Mise en conformité RGIE"],
};

const libelle = <T extends string>(
  liste: { value: T; label: string }[],
  value: T | undefined,
): string => liste.find((c) => c.value === value)?.label ?? "Non précisé";

export interface CoordonneesSimulateur {
  nom: string;
  telephone: string;
  email: string;
}

export interface ContexteEnvoi {
  reponses: ReponsesSimulateur;
  estimation: Estimation;
  coordonnees: CoordonneesSimulateur;
  photo: File | null;
  /** Millisecondes écoulées entre l'ouverture du simulateur et l'envoi. */
  dureeMs: number;
  /** true si la durée est anormalement courte (probable automate). */
  suspect: boolean;
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
  const brut = input.replace(/[\s.\-/()]/g, "");
  const sansPrefixe = brut.replace(/^(\+32|0032|0)/, "");
  return `+32${sansPrefixe}`;
}

/** Upload de la photo du tableau, sous le préfixe `simulateur/` du bucket. */
async function uploadPhoto(photo: File): Promise<string> {
  let file = photo;
  if (file.size > UPLOAD.seuilCompressionMo * 1024 * 1024) {
    try {
      file = await imageCompression(file, {
        maxSizeMB: UPLOAD.seuilCompressionMo,
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

/** Résumé texte des réponses, réutilisé dans l'email, le message DB et WhatsApp. */
export function resumerSimulation(
  reponses: ReponsesSimulateur,
  estimation: Estimation,
): string {
  const lignes = [`Besoin : ${libelle(BESOINS, reponses.besoin)}`];

  if (reponses.distance) {
    lignes.push(`Distance borne / tableau : ${libelle(DISTANCES, reponses.distance)}`);
  }
  lignes.push(`Installation électrique : ${libelle(INSTALLATIONS, reponses.installation)}`);
  lignes.push(`Usage : ${libelle(USAGES, reponses.usage)}`);

  if (estimation.complexe) {
    lignes.push("Estimation : projet complexe, métré technique sur place requis");
    estimation.raisonsComplexe.forEach((r) => lignes.push(`  · ${r}`));
  } else {
    if (estimation.borne) lignes.push(`Borne de recharge : ${formatFourchette(estimation.borne)}`);
    if (estimation.rgie) lignes.push(`Mise en conformité RGIE : ${formatFourchette(estimation.rgie)}`);
    if (estimation.total && estimation.borne && estimation.rgie) {
      lignes.push(`Estimation globale : ${formatFourchette(estimation.total)}`);
    }
  }

  return lignes.join("\n");
}

export async function envoyerSimulation(ctx: ContexteEnvoi): Promise<ResultatEnvoi> {
  const { reponses, estimation, coordonnees, photo } = ctx;

  // 1. Photo (facultative) --------------------------------------------------
  let photoPath: string | null = null;
  let photoOk = true;
  if (photo) {
    try {
      photoPath = await uploadPhoto(photo);
    } catch {
      photoOk = false;
    }
  }

  const resume = resumerSimulation(reponses, estimation);
  const telephone = normaliserGsm(coordonnees.telephone);
  const email = coordonnees.email.trim();

  const payload = {
    besoin: reponses.besoin,
    besoin_label: libelle(BESOINS, reponses.besoin),
    distance: reponses.distance ?? null,
    distance_label: reponses.distance ? libelle(DISTANCES, reponses.distance) : null,
    installation: reponses.installation,
    installation_label: libelle(INSTALLATIONS, reponses.installation),
    usage: reponses.usage,
    usage_label: libelle(USAGES, reponses.usage),
    complexe: estimation.complexe,
    raisons_complexe: estimation.raisonsComplexe,
    fourchette_borne: estimation.borne ?? null,
    fourchette_rgie: estimation.rgie ?? null,
    fourchette_totale: estimation.total ?? null,
    fourchette_affichee: estimation.complexe
      ? "Métré technique requis"
      : estimation.total
        ? formatFourchette(estimation.total)
        : null,
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
      // La colonne est NOT NULL et l'email est facultatif ici : chaîne vide
      // explicitement autorisée par la policy de la branche simulateur.
      email,
      phone: telephone,
      // Le simulateur ne demande pas d'adresse (parcours < 45 s).
      address: "",
      client_type: reponses.usage === "societe" ? "Professionnel" : "Particulier",
      services: SERVICES_PAR_BESOIN[reponses.besoin],
      message: resume,
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

  const fourchetteTexte = estimation.complexe
    ? "Projet complexe — métré technique sur place"
    : estimation.total
      ? formatFourchette(estimation.total)
      : "Non calculée";

  const adrianParams = {
    from_name: coordonnees.nom.trim(),
    phone: telephone,
    // Format international sans « + » ni séparateur (ex. 32470123456), pour
    // construire https://wa.me/{{phone_wa}} dans le template EmailJS.
    phone_wa: telephone.replace(/\D/g, ""),
    from_email: email || "Non fourni",
    besoin: libelle(BESOINS, reponses.besoin),
    distance: reponses.distance ? libelle(DISTANCES, reponses.distance) : "Sans objet",
    installation: libelle(INSTALLATIONS, reponses.installation),
    usage: libelle(USAGES, reponses.usage),
    fourchette: fourchetteTexte,
    complexe: estimation.complexe ? "OUI — métré technique requis" : "Non",
    resume,
    photo: lienPhoto,
    suspect: ctx.suspect ? `OUI (envoi en ${Math.round(ctx.dureeMs / 1000)} s)` : "Non",
    db_status: dbOk ? "Enregistré" : "ECHEC BASE — lead à ré-encoder à la main",
    date: new Date().toLocaleString("fr-BE"),
  };

  const clientParams = {
    to_email: email,
    from_name: coordonnees.nom.trim(),
    besoin: libelle(BESOINS, reponses.besoin),
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
    // L'accusé de réception ne part que si le visiteur a laissé un email.
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
