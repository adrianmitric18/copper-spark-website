#!/usr/bin/env node
// Vérification one-shot du compteur d'avis approuvés dans Supabase.
// Lance avec : node scripts/count-testimonials.mjs

import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const envPath = resolve(ROOT, ".env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*(VITE_[A-Z_0-9]+)\s*=\s*"?([^"#\r\n]*?)"?\s*$/);
    if (m) process.env[m[1]] = m[2];
  }
}

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) {
  console.error("Missing VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key);

const { data, error } = await supabase
  .from("testimonials")
  .select("id, name, rating, approved, created_at")
  .order("created_at", { ascending: false });

if (error) {
  console.error("Query error:", error);
  process.exit(1);
}

const approved = data.filter((r) => r.approved);
const pending = data.filter((r) => !r.approved);
const sum = approved.reduce((acc, r) => acc + (r.rating ?? 0), 0);
const avg = approved.length > 0 ? sum / approved.length : 0;

console.log(`Total rows: ${data.length}`);
console.log(`Approved:   ${approved.length}`);
console.log(`Pending:    ${pending.length}`);
console.log(`Average rating: ${avg.toFixed(2)}`);
console.log(`\nFirst 3 approved:`);
for (const r of approved.slice(0, 3)) {
  console.log(`  - ${r.name} (${r.rating}/5) ${r.created_at.slice(0, 10)}`);
}
