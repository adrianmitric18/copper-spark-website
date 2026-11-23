#!/usr/bin/env node
// Vérifie par de VRAIES insertions, avec la clé publique du site, que la base
// accepte ce que les formulaires envoient — et refuse ce qu'elle doit refuser.
//
// Pourquoi ce script existe : d'août à novembre 2026, le simulateur n'a enregistré
// aucune demande. Les e-mails partaient, donc personne ne l'a vu ; la base, elle,
// refusait l'origine « simulateur ». Un parcours qui écrit en base se vérifie par
// une insertion réelle, pas par l'e-mail reçu.
//
// Usage :
//   node scripts/test-insertion-leads.mjs devis      → cas du formulaire /devis-borne
//   node scripts/test-insertion-leads.mjs tout       → + simulateur et formulaire de contact
//   node scripts/test-insertion-leads.mjs stockage   → limites du dossier de photos
//
// ⚠ Chaque insertion acceptée crée une fiche « TEST … (à supprimer) » dans les
// leads : la clé publique ne peut ni lire ni supprimer, c'est à Adrian de le
// faire dans l'admin. Aucun e-mail n'est envoyé par ce script.

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const env = Object.fromEntries(
  readFileSync(resolve(ROOT, ".env"), "utf8")
    .split(/\r?\n/)
    .map((l) => l.match(/^\s*(VITE_[A-Z_0-9]+)\s*=\s*"?([^"#\r\n]*?)"?\s*$/))
    .filter(Boolean)
    .map((m) => [m[1], m[2]]),
);
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false },
});

const mode = process.argv[2] ?? "devis";
const jour = new Date().toISOString().slice(0, 10);
const SERVICE_BORNE = "Borne de recharge voiture électrique";
let echecs = 0;

/** attendu : true = la base doit accepter, false = elle doit refuser. */
async function essai(nom, ligne, attendu) {
  const { error } = await supabase.from("leads").insert(ligne);
  const accepte = !error;
  const ok = accepte === attendu;
  if (!ok) echecs++;
  console.log(
    `${ok ? "OK   " : "ECHEC"} ${nom} → ${accepte ? "accepté" : `refusé (${error.code} ${error.message.slice(0, 90)})`}` +
      `${ok ? "" : ` — attendu : ${attendu ? "accepté" : "refusé"}`}`,
  );
}

const devis = {
  name: `TEST devis borne ${jour} (à supprimer)`,
  phone: "",
  email: "test@example.com",
  code_postal: "1490",
  client_type: "Particulier",
  services: [SERVICE_BORNE],
  message: null,
  source: "devis_borne",
  photo_urls: null,
  gdpr_consent: true,
  status: "nouveau",
  payload: { test: true, envoye_le: new Date().toISOString() },
};

if (mode === "devis" || mode === "tout") {
  console.log("— Formulaire /devis-borne (origine « devis_borne ») —");
  await essai("e-mail seul, sans téléphone, sans photo", devis, true);
  await essai("téléphone seul, 5 photos", { ...devis, name: `TEST devis borne tel ${jour} (à supprimer)`, email: null, phone: "0485755227", photo_urls: ["t1.jpg", "t2.jpg", "t3.jpg", "t4.jpg", "t5.jpg"] }, true);
  await essai("ni téléphone ni e-mail", { ...devis, email: null }, false);
  await essai("6 photos", { ...devis, photo_urls: ["1", "2", "3", "4", "5", "6"] }, false);
  await essai("code postal absent", { ...devis, code_postal: null }, false);
  await essai("code postal à 3 chiffres", { ...devis, code_postal: "149" }, false);
  await essai("autre service que la borne", { ...devis, services: ["Dépannage urgent"] }, false);
  await essai("e-mail mal formé", { ...devis, email: "pas-un-email" }, false);
  await essai("sans réponses (payload)", { ...devis, payload: null }, false);
}

if (mode === "tout") {
  console.log("— Simulateur (inchangé) —");
  const simu = {
    name: `TEST simulateur ${jour} (à supprimer)`,
    email: "test@example.com",
    phone: "0485755227",
    address: "",
    client_type: "Particulier",
    services: [SERVICE_BORNE],
    message: "TEST automatique, à supprimer.",
    source: "simulateur",
    photo_urls: null,
    gdpr_consent: true,
    status: "nouveau",
    payload: { test: true },
  };
  await essai("demande normale", simu, true);
  await essai("sans téléphone", { ...simu, phone: "" }, false);
  await essai("4 photos", { ...simu, photo_urls: ["1", "2", "3", "4"] }, false);

  console.log("— Formulaire de contact (inchangé) —");
  const contact = {
    name: `TEST contact ${jour} (à supprimer)`,
    email: "test@example.com",
    phone: "0485755227",
    address: "Rue du Test 1, 1490 Court-Saint-Étienne",
    rue: "Rue du Test",
    numero: "1",
    code_postal: "1490",
    commune: "Court-Saint-Étienne",
    client_type: "Particulier",
    services: [SERVICE_BORNE],
    message: "TEST automatique du formulaire de contact, à supprimer.",
    source: null,
    photo_urls: null,
    gdpr_consent: true,
    status: "nouveau",
  };
  await essai("demande normale", contact, true);
  await essai("sans téléphone", { ...contact, phone: "" }, false);
  await essai("sans rue", { ...contact, rue: null }, false);
  await essai("4 photos", { ...contact, photo_urls: ["1", "2", "3", "4"] }, false);
  await essai("origine inconnue", { ...contact, source: "origine_inconnue" }, false);
}

if (mode === "stockage") {
  console.log("— Dossier de photos « lead-photos » —");
  const envoi = async (nom, corps, type, attendu) => {
    const chemin = `test-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const { error } = await supabase.storage.from("lead-photos").upload(chemin, corps, { contentType: type, upsert: false });
    const accepte = !error;
    const ok = accepte === attendu;
    if (!ok) echecs++;
    console.log(`${ok ? "OK   " : "ECHEC"} ${nom} → ${accepte ? `accepté (${chemin})` : `refusé (${error.message.slice(0, 90)})`}${ok ? "" : ` — attendu : ${attendu ? "accepté" : "refusé"}`}`);
    return accepte ? chemin : null;
  };
  // Plus petit JPEG valide (1 × 1 pixel).
  const jpeg = Buffer.from("/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/yQALCAABAAEBAREA/8wABgAQEAX/2gAIAQEAAD8A0s8g/9k=", "base64");
  const chemin = await envoi("petite image JPEG", jpeg, "image/jpeg", true);
  await envoi("fichier texte", Buffer.from("ceci n'est pas une image"), "text/plain", false);
  await envoi("PDF", Buffer.from("%PDF-1.4 test"), "application/pdf", false);
  await envoi("image de 9 Mo", Buffer.alloc(9 * 1024 * 1024, 0xff), "image/jpeg", false);
  if (chemin) {
    const lecture = await supabase.storage.from("lead-photos").download(chemin);
    const lisible = !lecture.error;
    if (lisible) echecs++;
    console.log(`${lisible ? "ECHEC" : "OK   "} lecture publique de la photo → ${lisible ? "LISIBLE (ne devrait pas)" : "refusée"}`);
    const signe = await supabase.storage.from("lead-photos").createSignedUrl(chemin, 60);
    console.log(`     lien temporaire créé par la clé publique → ${signe.error ? "refusé" : "ACCORDÉ"}`);
  }
}

console.log(echecs === 0 ? "\nTout est conforme." : `\n${echecs} écart(s) : voir les lignes ECHEC.`);
process.exit(echecs === 0 ? 0 : 1);
