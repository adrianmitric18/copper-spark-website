#!/usr/bin/env node
// Premier pas du build : fige les réalisations publiées dans
// `.generated/realisations.json` (voir scripts/realisations-data.mjs).
//
// Repli : si Supabase est injoignable ou les variables absentes, on GARDE le
// snapshot précédent s'il existe (poste de dev hors ligne), sinon on écrit un
// snapshot vide. Le build reste vert : les pages réalisation repartent alors
// en mode SPA (contenu chargé par React), comme avant ce script.
// `REALISATIONS_STRICT=1` transforme ce repli en erreur (debug / CI exigeante).

import { existsSync } from "node:fs";
import {
  EMPTY_SNAPSHOT,
  SNAPSHOT_PATH,
  fetchRealisations,
  loadRealisations,
  writeSnapshot,
} from "./realisations-data.mjs";

try {
  const snapshot = await fetchRealisations();
  writeSnapshot(snapshot);
  const nbImages = snapshot.projects.reduce((n, p) => n + p.images.length, 0);
  console.log(
    `realisations.json — ${snapshot.projects.length} réalisation(s) publiée(s), ${nbImages} photo(s)`,
  );
  console.log(
    snapshot.googleRating
      ? `note Google — ${snapshot.googleRating.rating} / 5 sur ${snapshot.googleRating.total} avis`
      : "  ⚠ note Google absente (table google_rating vide ou illisible) — valeur de secours du site",
  );
} catch (err) {
  const message = `Récupération des réalisations impossible (${err.message})`;
  if (process.env.REALISATIONS_STRICT === "1") {
    console.error(`✗ ${message}`);
    process.exit(1);
  }
  if (existsSync(SNAPSHOT_PATH)) {
    const previous = loadRealisations();
    console.warn(
      `  ⚠ ${message} — snapshot précédent conservé (${previous.projects.length} réalisation(s), ${previous.generatedAt ?? "date inconnue"})`,
    );
  } else {
    writeSnapshot({ ...EMPTY_SNAPSHOT, projects: [] });
    console.warn(`  ⚠ ${message} — snapshot vide écrit, pages réalisation en mode SPA`);
  }
}
