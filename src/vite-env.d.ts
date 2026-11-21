/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />
/// <reference types="vite-imagetools/client" />

// Réalisations publiées figées au build — voir vite.config.ts (realisationsSnapshot)
// et src/lib/chantiers/snapshot.ts.
/**
 * Note Google figée au build (vite.config.ts → googleRatingDuBuild). `null`
 * quand le build n'a pas pu lire la table `google_rating`. Non définie sous
 * vitest : toujours tester `typeof __GOOGLE_RATING__`.
 */
declare const __GOOGLE_RATING__: { rating: number; total: number } | null;

declare module "virtual:realisations" {
  const snapshot: import("./lib/chantiers/types").RealisationsSnapshot;
  export default snapshot;
}
