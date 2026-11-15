/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />
/// <reference types="vite-imagetools/client" />

// Réalisations publiées figées au build — voir vite.config.ts (realisationsSnapshot)
// et src/lib/chantiers/snapshot.ts.
declare module "virtual:realisations" {
  const snapshot: import("./lib/chantiers/types").RealisationsSnapshot;
  export default snapshot;
}
