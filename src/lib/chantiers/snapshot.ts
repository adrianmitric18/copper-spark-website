// Réalisations publiées, figées au build (module virtuel `virtual:realisations`,
// voir vite.config.ts et scripts/realisations-data.mjs).
//
// Rôle : fournir aux pages /realisations et /realisations/:slug des données
// initiales SANS requête réseau, pour que :
//   1. le HTML pré-rendu (scripts/prerender.mjs, Supabase coupé) contienne le
//      vrai contenu — titre, commune, récit, photos — lisible par Google et
//      par les IA sans JavaScript ;
//   2. le visiteur ne voie jamais de spinner sur une réalisation connue.
// React Query reçoit ces données comme déjà périmées (`initialDataUpdatedAt` =
// date du build) et les rafraîchit depuis Supabase au montage : une réalisation
// modifiée après le build s'affiche quand même à jour pour le visiteur.
//
// Snapshot vide (build sans accès Supabase) = comportement d'avant : chargement
// côté client.

import snapshot from "virtual:realisations";
import type { ProjectImage, RealisationsSnapshot, SnapshotProject } from "./types";
import type { PublishedProjectWithMeta } from "./queries";

export const SNAPSHOT: RealisationsSnapshot = snapshot;

/**
 * Horodatage du snapshot. Passé à React Query en `initialDataUpdatedAt` pour
 * qu'il considère les données initiales comme périmées et refetch tout de suite.
 * 0 quand il n'y a pas de snapshot (React Query ignore alors la valeur).
 */
export const SNAPSHOT_UPDATED_AT = SNAPSHOT.generatedAt
  ? Date.parse(SNAPSHOT.generatedAt)
  : 0;

const BUCKET = "chantiers";

/**
 * URL publique d'une photo du bucket `chantiers`, sans passer par le client
 * Supabase (même forme que `storage.from(BUCKET).getPublicUrl()`), pour ne
 * pas tirer le SDK dans les pages services/zones qui affichent des vignettes.
 */
export function snapshotImageUrl(storagePath: string): string {
  const base = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? SNAPSHOT.supabaseUrl ?? "";
  return `${base}/storage/v1/object/public/${BUCKET}/${storagePath}`;
}

/** Photo de couverture : celle cochée par l'admin, sinon la 1re « photo », sinon la 1re image. */
export function coverOf(p: SnapshotProject): ProjectImage | null {
  return (
    p.images.find((i) => i.is_cover) ??
    p.images.find((i) => i.kind === "photo") ??
    p.images[0] ??
    null
  );
}

/** Liste pour /realisations, même forme que `fetchPublishedProjectsWithMeta()`. */
export function snapshotProjectsWithMeta(): PublishedProjectWithMeta[] | undefined {
  if (SNAPSHOT.projects.length === 0) return undefined;
  return SNAPSHOT.projects.map(({ tags, images, ...project }) => ({
    ...project,
    tags,
    cover: images.find((i) => i.is_cover) ?? null,
    fallbackImage: images[0] ?? null,
  }));
}

/** Fiche pour /realisations/:slug, même forme que `fetchProjectBySlug()`. */
export function snapshotProjectBySlug(
  slug: string | undefined,
): { project: SnapshotProject; images: ProjectImage[]; tags: string[] } | undefined {
  if (!slug) return undefined;
  const found = SNAPSHOT.projects.find((p) => p.slug === slug);
  if (!found) return undefined;
  return { project: found, images: found.images, tags: found.tags };
}
