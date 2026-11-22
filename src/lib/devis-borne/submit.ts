// Envoi d'une demande de devis de borne avec photos (page /devis-borne).
//
// Trois étapes, dans cet ordre : photos → fiche dans `leads` → e-mails.
// La demande part même si une photo échoue, et même sans photo.
//
// Vie privée (règles d'Adrian du 2026-11-22) :
//   - les photos vont dans le dossier privé `lead-photos`, lisible par l'admin
//     seulement ; la clé publique peut y déposer, jamais lire ;
//   - AUCUN lien vers une photo n'est créé ni envoyé par e-mail : l'e-mail dit
//     seulement combien il y en a, et qu'elles sont visibles dans l'admin.

import emailjs from "@emailjs/browser";
import imageCompression from "browser-image-compression";
import { supabase } from "@/integrations/supabase/client";
import {
  PHOTO_LIMITES,
  QUESTIONS,
  SERVICE_BORNE,
  SOURCE_DEVIS_BORNE,
  nettoyerTelephone,
  orienterVersZaptecPro,
  resumer,
  type Coordonnees,
  type IdPhoto,
  type Reponses,
  type Textes,
} from "./config";

// Mêmes service et modèles EmailJS que le formulaire de contact : aucun modèle
// à créer. Les noms de variables sont ceux de ces modèles, ne pas les renommer.
const EMAILJS_SERVICE_ID = "service_ybjga5v";
const EMAILJS_TEMPLATE_ID_ADRIAN = "template_8khdj35";
const EMAILJS_TEMPLATE_ID_PROSPECT = "template_ej9kepa";
const EMAILJS_PUBLIC_KEY = "8rgPz2Ls3kaYeRHY_";

export interface PhotoChoisie {
  id: IdPhoto;
  file: File;
}

export interface Demande {
  reponses: Reponses;
  textes: Textes;
  coordonnees: Coordonnees;
  photos: PhotoChoisie[];
  /** Temps passé sur le formulaire, et envoi anormalement rapide (anti-spam). */
  dureeMs: number;
  suspect: boolean;
}

export interface ResultatEnvoi {
  dbOk: boolean;
  emailOk: boolean;
  photosEnvoyees: number;
  photosEchouees: number;
}

/** Réduit la photo avant l'envoi. En cas d'échec, on envoie l'original. */
async function reduire(file: File): Promise<File> {
  try {
    return await imageCompression(file, {
      maxSizeMB: PHOTO_LIMITES.cibleMo,
      maxWidthOrHeight: PHOTO_LIMITES.coteMaxPx,
      useWebWorker: true,
      fileType: "image/jpeg",
    });
  } catch {
    return file;
  }
}

async function deposer(photo: PhotoChoisie): Promise<string | null> {
  const fichier = await reduire(photo.file);
  const type = fichier.type || "image/jpeg";
  const extension = type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
  const chemin = `devis-borne/${Date.now()}-${Math.random().toString(36).slice(2, 9)}-${photo.id}.${extension}`;
  const { error } = await supabase.storage
    .from(PHOTO_LIMITES.bucket)
    .upload(chemin, fichier, { contentType: type, upsert: false });
  return error ? null : chemin;
}

export async function envoyerDevisBorne(
  d: Demande,
  onProgression?: (faites: number, total: number) => void,
): Promise<ResultatEnvoi> {
  const { reponses, textes, coordonnees } = d;

  // 1. Photos : l'une après l'autre (une mauvaise connexion supporte mal cinq
  //    envois en parallèle), et sans jamais bloquer la demande.
  const chemins: string[] = [];
  const idsEnvoyes: IdPhoto[] = [];
  let echouees = 0;
  for (let i = 0; i < d.photos.length; i++) {
    let chemin: string | null = null;
    try {
      chemin = await deposer(d.photos[i]);
    } catch {
      chemin = null;
    }
    if (chemin) {
      chemins.push(chemin);
      idsEnvoyes.push(d.photos[i].id);
    } else {
      echouees++;
    }
    onProgression?.(i + 1, d.photos.length);
  }

  const telephone = nettoyerTelephone(coordonnees.telephone);
  const email = coordonnees.email.trim();
  let resume = resumer(reponses, textes, coordonnees, chemins.length, idsEnvoyes);
  if (echouees > 0) {
    resume += `\n\n⚠ ${echouees} photo(s) n'ont pas pu être envoyées : les redemander au client.`;
  }
  const quand = QUESTIONS.quand.choix.find((c) => c.value === reponses.quand)?.label ?? null;

  // 2. Fiche en base. Les valeurs doivent respecter le cas « devis_borne » de la
  //    policy d'insertion (migration 20261122120000) : voir config.ts.
  let dbOk = false;
  try {
    const { error } = await supabase.from("leads").insert({
      name: coordonnees.nom.trim().slice(0, 100),
      // La colonne téléphone n'accepte pas NULL : absent = chaîne vide.
      phone: telephone,
      email: email || null,
      code_postal: coordonnees.codePostal.trim(),
      client_type: reponses.logement === "entreprise" ? "Entreprise / Professionnel" : "Particulier",
      services: [SERVICE_BORNE],
      message: resume.slice(0, 5000),
      timing: quand,
      source: SOURCE_DEVIS_BORNE,
      photo_urls: chemins.length > 0 ? chemins : null,
      gdpr_consent: true,
      status: "nouveau",
      payload: {
        formulaire: "devis_borne",
        reponses,
        modem: textes.modem.trim() || null,
        voiture: textes.voiture.trim() || null,
        modele_borne: textes.modeleBorne.trim() || null,
        orientation_zaptec_pro: orienterVersZaptecPro(reponses),
        photos: idsEnvoyes,
        photos_echouees: echouees,
        duree_ms: d.dureeMs,
        soumission_suspecte: d.suspect,
        envoye_le: new Date().toISOString(),
      },
    } as never);
    if (error) throw error;
    dbOk = true;
  } catch {
    dbOk = false;
  }

  // 3. E-mails. Aucun lien vers les photos.
  const photosTexte =
    chemins.length === 0
      ? "Aucune photo"
      : `${chemins.length} photo${chemins.length > 1 ? "s" : ""}, visible${chemins.length > 1 ? "s" : ""} dans l'admin`;
  const alerte = dbOk ? "" : "⚠️ ÉCHEC BASE — lead à ré-encoder manuellement ⚠️\n\n";

  const adrianParams = {
    from_name: coordonnees.nom.trim(),
    from_email: email || "Non fourni",
    phone: telephone || "Non fourni",
    address: `Code postal ${coordonnees.codePostal.trim()}`,
    rue: "",
    numero: "",
    code_postal: coordonnees.codePostal.trim(),
    commune: "",
    client_type: reponses.logement === "entreprise" ? "Entreprise / Professionnel" : "Particulier",
    habitat_type: QUESTIONS.logement.choix.find((c) => c.value === reponses.logement)?.label ?? "Non précisé",
    build_year: "Non précisée",
    services: SERVICE_BORNE,
    message: alerte + resume,
    timing: quand ?? "Non précisé",
    source: "Formulaire devis borne avec photos",
    photos: photosTexte,
    date: new Date().toLocaleString("fr-BE"),
  };

  const envois = [
    emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID_ADRIAN, adrianParams, { publicKey: EMAILJS_PUBLIC_KEY }),
  ];
  if (email) {
    envois.push(
      emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID_PROSPECT,
        {
          from_name: coordonnees.nom.trim(),
          from_email: email,
          to_email: email,
          phone: telephone,
          address: `Code postal ${coordonnees.codePostal.trim()}`,
          rue: "",
          numero: "",
          code_postal: coordonnees.codePostal.trim(),
          commune: "",
          services: SERVICE_BORNE,
          timing: quand ?? "Non précisé",
          message: textes.message.trim(),
        },
        { publicKey: EMAILJS_PUBLIC_KEY },
      ),
    );
  }

  let emailOk = false;
  try {
    await Promise.all(envois);
    emailOk = true;
  } catch {
    emailOk = false;
  }

  return { dbOk, emailOk, photosEnvoyees: chemins.length, photosEchouees: echouees };
}
