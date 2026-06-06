/**
 * Backup local + répartition de la table `rendez_vous` AVANT migration.
 *
 * Lecture seule. N'écrit RIEN dans la base. Sauvegarde la table en JSON + CSV
 * dans ./backups/ et affiche le total + la répartition par type_visite.
 *
 * Sécurité : la clé service_role n'est JAMAIS écrite sur disque ni committée.
 * Elle est lue depuis l'environnement au moment de l'exécution.
 *
 * Usage (PowerShell) :
 *   $env:SUPABASE_SERVICE_ROLE_KEY = "<clé service_role depuis le dashboard>"
 *   node scripts/backup-rendez-vous.mjs
 *
 * La clé service_role se trouve dans : Supabase Dashboard → Project Settings →
 * API → Project API keys → `service_role` (secret). NE PAS la committer.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

// --- Récupère l'URL Supabase depuis .env (VITE_SUPABASE_URL) ---
function readEnvVar(name) {
  if (process.env[name]) return process.env[name];
  try {
    const env = readFileSync(new URL("../.env", import.meta.url), "utf8");
    for (const line of env.split(/\r?\n/)) {
      const m = line.match(new RegExp(`^${name}=(.*)$`));
      if (m) return m[1].trim().replace(/^["']|["']$/g, "");
    }
  } catch {
    /* .env absent : on retombe sur process.env uniquement */
  }
  return undefined;
}

const SUPABASE_URL = readEnvVar("VITE_SUPABASE_URL");
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  console.error("❌ VITE_SUPABASE_URL introuvable (.env ou env).");
  process.exit(1);
}
if (!SERVICE_ROLE_KEY) {
  console.error(
    "❌ SUPABASE_SERVICE_ROLE_KEY absente de l'environnement.\n" +
      '   PowerShell : $env:SUPABASE_SERVICE_ROLE_KEY = "<clé service_role>"\n' +
      "   (Dashboard → Project Settings → API → service_role)",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

// --- 1. Dump complet de la table (lecture seule) ---
const { data: rows, error } = await supabase
  .from("rendez_vous")
  .select("*")
  .order("created_at", { ascending: true });

if (error) {
  console.error("❌ Échec de lecture de rendez_vous :", error);
  process.exit(1);
}

mkdirSync(new URL("../backups/", import.meta.url), { recursive: true });

const jsonPath = new URL(`../backups/rendez_vous_${stamp}.json`, import.meta.url);
writeFileSync(jsonPath, JSON.stringify(rows, null, 2), "utf8");

// CSV simple (toutes colonnes, échappement minimal des guillemets)
const columns = rows.length ? Object.keys(rows[0]) : [];
const csvEscape = (v) => {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const csv = [
  columns.join(","),
  ...rows.map((r) => columns.map((c) => csvEscape(r[c])).join(",")),
].join("\n");
const csvPath = new URL(`../backups/rendez_vous_${stamp}.csv`, import.meta.url);
writeFileSync(csvPath, csv, "utf8");

// --- 2. Total + répartition par type_visite ---
const distribution = {};
for (const r of rows) {
  const t = r.type_visite ?? "(null)";
  distribution[t] = (distribution[t] ?? 0) + 1;
}

console.log("\n==================== BACKUP rendez_vous ====================");
console.log(`Total lignes : ${rows.length}`);
console.log(`Backup JSON  : ${jsonPath.pathname}`);
console.log(`Backup CSV   : ${csvPath.pathname}`);
console.log("\n--- Répartition par type_visite ---");
const sorted = Object.entries(distribution).sort((a, b) => b[1] - a[1]);
for (const [type, count] of sorted) {
  console.log(`${String(count).padStart(5)}  ${type}`);
}
console.log("============================================================\n");
