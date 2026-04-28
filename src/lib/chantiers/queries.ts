/**
 * Couche d'accès Supabase pour le CMS Chantiers.
 *
 * Phase 0 : signatures et structure. Les implémentations sont activées
 * en Phase 1, une fois les types Supabase régénérés (la table `projects`
 * doit être visible côté typage). Chaque stub jette pour rendre tout
 * appel accidentel évident en dev.
 */

import type { Project, ProjectImage, ProjectTag } from "./types";

const NOT_IMPLEMENTED = "queries Phase 0 — implémentation prévue Phase 1";

// ---------------------------------------------------------------------------
// Lecture publique
// ---------------------------------------------------------------------------

export async function fetchPublishedProjects(): Promise<Project[]> {
  throw new Error(NOT_IMPLEMENTED);
}

export async function fetchProjectBySlug(_slug: string): Promise<{
  project: Project;
  images: ProjectImage[];
  tags: ProjectTag[];
} | null> {
  throw new Error(NOT_IMPLEMENTED);
}

// ---------------------------------------------------------------------------
// Admin — lecture
// ---------------------------------------------------------------------------

export async function fetchAllProjectsAdmin(): Promise<Project[]> {
  throw new Error(NOT_IMPLEMENTED);
}

export async function fetchTakenSlugs(): Promise<Set<string>> {
  throw new Error(NOT_IMPLEMENTED);
}

// ---------------------------------------------------------------------------
// Admin — écriture
// ---------------------------------------------------------------------------

export async function createProject(_input: Partial<Project>): Promise<Project> {
  throw new Error(NOT_IMPLEMENTED);
}

export async function updateProject(
  _id: string,
  _patch: Partial<Project>,
): Promise<Project> {
  throw new Error(NOT_IMPLEMENTED);
}

export async function publishProject(_id: string): Promise<void> {
  throw new Error(NOT_IMPLEMENTED);
}

export async function unpublishProject(_id: string): Promise<void> {
  throw new Error(NOT_IMPLEMENTED);
}

export async function softDeleteProject(_id: string): Promise<void> {
  throw new Error(NOT_IMPLEMENTED);
}

export async function restoreProject(_id: string): Promise<void> {
  throw new Error(NOT_IMPLEMENTED);
}
