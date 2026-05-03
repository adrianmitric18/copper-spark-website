/**
 * Couche d'accès Supabase pour le CMS Chantiers.
 * Phase 1 : implémentations actives. Les RLS filtrent le rôle :
 *   - rôle anonymous : voit uniquement les chantiers publiés non supprimés.
 *   - rôle admin (is_admin()) : voit tout, peut écrire partout.
 */

import { supabase } from "@/integrations/supabase/client";
import type {
  ImageKind,
  Project,
  ProjectFaqItem,
  ProjectImage,
  ProjectStatus,
} from "./types";

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

export interface ProjectInput {
  slug: string;
  title: string;
  location: string;
  zone: string;
  completed_at: string;
  summary: string;
  story?: string | null;
  duration_days?: number | null;
  budget_range?: string | null;
  faq?: ProjectFaqItem[] | null;
  status?: ProjectStatus;
  featured?: boolean;
  meta_title?: string | null;
  meta_description?: string | null;
}

export type ProjectWithMeta = Project & {
  tags: string[];
  cover: ProjectImage | null;
};

export type PublishedProjectWithMeta = Project & {
  tags: string[];
  /** Image marquée is_cover par l'admin. */
  cover: ProjectImage | null;
  /** 1re image (sort_order le plus bas), utilisée si pas de cover. */
  fallbackImage: ProjectImage | null;
};

// ---------------------------------------------------------------------------
// Lecture publique (filtrée par RLS)
// ---------------------------------------------------------------------------

export async function fetchPublishedProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("status", "published")
    .is("deleted_at", null)
    .order("completed_at", { ascending: false })
    // Tie-breaker stable : si plusieurs chantiers partagent la même
    // completed_at, l'ordre d'insertion (created_at ASC) garantit un
    // affichage déterministe au lieu d'un ordre dépendant du plan
    // d'exécution Postgres.
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as Project[];
}

/**
 * Variante avec tags + cover + fallback (1re image) pour la grille publique.
 * 3 round-trips total grâce au IN(...).
 */
export async function fetchPublishedProjectsWithMeta(): Promise<
  PublishedProjectWithMeta[]
> {
  const projects = await fetchPublishedProjects();
  if (projects.length === 0) return [];

  const projectIds = projects.map((p) => p.id);

  const [tagsRes, imagesRes] = await Promise.all([
    supabase.from("project_tags").select("*").in("project_id", projectIds),
    supabase
      .from("project_images")
      .select("*")
      .in("project_id", projectIds)
      .order("sort_order", { ascending: true }),
  ]);
  if (tagsRes.error) throw tagsRes.error;
  if (imagesRes.error) throw imagesRes.error;

  const tagsByProject = new Map<string, string[]>();
  for (const row of tagsRes.data ?? []) {
    const arr = tagsByProject.get(row.project_id) ?? [];
    arr.push(row.tag);
    tagsByProject.set(row.project_id, arr);
  }

  const coverByProject = new Map<string, ProjectImage>();
  const firstByProject = new Map<string, ProjectImage>();
  for (const row of imagesRes.data ?? []) {
    const img = row as ProjectImage;
    if (img.is_cover) coverByProject.set(img.project_id, img);
    if (!firstByProject.has(img.project_id)) {
      firstByProject.set(img.project_id, img);
    }
  }

  return projects.map((p) => ({
    ...p,
    tags: tagsByProject.get(p.id) ?? [],
    cover: coverByProject.get(p.id) ?? null,
    fallbackImage: firstByProject.get(p.id) ?? null,
  }));
}

export async function fetchProjectBySlug(slug: string): Promise<{
  project: Project;
  images: ProjectImage[];
  tags: string[];
} | null> {
  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  if (!project) return null;

  const [imagesRes, tagsRes] = await Promise.all([
    supabase
      .from("project_images")
      .select("*")
      .eq("project_id", project.id)
      .order("sort_order", { ascending: true }),
    supabase.from("project_tags").select("tag").eq("project_id", project.id),
  ]);
  if (imagesRes.error) throw imagesRes.error;
  if (tagsRes.error) throw tagsRes.error;

  return {
    project: project as unknown as Project,
    images: (imagesRes.data ?? []) as ProjectImage[],
    tags: (tagsRes.data ?? []).map((r) => r.tag),
  };
}

// ---------------------------------------------------------------------------
// Lecture admin (voit tout grâce à is_admin())
// ---------------------------------------------------------------------------

export async function fetchAllProjectsAdmin(): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("completed_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Project[];
}

/**
 * Retourne tous les chantiers + leurs tags + leur photo de couverture
 * en un minimum de requêtes (3 round-trips). Utilisé par la table admin.
 */
export async function fetchAllProjectsWithMetaAdmin(): Promise<ProjectWithMeta[]> {
  const projects = await fetchAllProjectsAdmin();
  if (projects.length === 0) return [];

  const projectIds = projects.map((p) => p.id);

  const [tagsRes, coversRes] = await Promise.all([
    supabase.from("project_tags").select("*").in("project_id", projectIds),
    supabase
      .from("project_images")
      .select("*")
      .in("project_id", projectIds)
      .eq("is_cover", true),
  ]);
  if (tagsRes.error) throw tagsRes.error;
  if (coversRes.error) throw coversRes.error;

  const tagsByProject = new Map<string, string[]>();
  for (const row of tagsRes.data ?? []) {
    const arr = tagsByProject.get(row.project_id) ?? [];
    arr.push(row.tag);
    tagsByProject.set(row.project_id, arr);
  }

  const coverByProject = new Map<string, ProjectImage>();
  for (const row of coversRes.data ?? []) {
    coverByProject.set(row.project_id, row as ProjectImage);
  }

  return projects.map((p) => ({
    ...p,
    tags: tagsByProject.get(p.id) ?? [],
    cover: coverByProject.get(p.id) ?? null,
  }));
}

export async function fetchProjectByIdAdmin(id: string): Promise<{
  project: Project;
  images: ProjectImage[];
  tags: string[];
} | null> {
  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!project) return null;

  const [imagesRes, tagsRes] = await Promise.all([
    supabase
      .from("project_images")
      .select("*")
      .eq("project_id", id)
      .order("sort_order", { ascending: true }),
    supabase.from("project_tags").select("tag").eq("project_id", id),
  ]);
  if (imagesRes.error) throw imagesRes.error;
  if (tagsRes.error) throw tagsRes.error;

  return {
    project: project as unknown as Project,
    images: (imagesRes.data ?? []) as ProjectImage[],
    tags: (tagsRes.data ?? []).map((r) => r.tag),
  };
}

/**
 * Retourne l'ensemble des slugs déjà pris par les chantiers actifs
 * (non supprimés). Utilisé pour garantir l'unicité côté UI.
 */
export async function fetchTakenSlugs(): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("projects")
    .select("slug")
    .is("deleted_at", null);
  if (error) throw error;
  return new Set((data ?? []).map((d) => d.slug));
}

// ---------------------------------------------------------------------------
// Écriture admin — chantiers
// ---------------------------------------------------------------------------

export async function createProject(input: ProjectInput): Promise<Project> {
  const { data, error } = await supabase
    .from("projects")
    .insert({
      slug: input.slug,
      title: input.title,
      location: input.location,
      zone: input.zone,
      completed_at: input.completed_at,
      summary: input.summary,
      story: input.story ?? null,
      duration_days: input.duration_days ?? null,
      budget_range: input.budget_range ?? null,
      faq: (input.faq ?? null) as never,
      status: input.status ?? "draft",
      featured: input.featured ?? false,
      meta_title: input.meta_title ?? null,
      meta_description: input.meta_description ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as unknown as Project;
}

export async function updateProject(
  id: string,
  patch: Partial<ProjectInput>,
): Promise<Project> {
  const { data, error } = await supabase
    .from("projects")
    .update(patch as never)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as Project;
}

export async function publishProject(id: string): Promise<void> {
  const { error } = await supabase
    .from("projects")
    .update({ status: "published" })
    .eq("id", id);
  if (error) throw error;
}

export async function unpublishProject(id: string): Promise<void> {
  const { error } = await supabase
    .from("projects")
    .update({ status: "draft" })
    .eq("id", id);
  if (error) throw error;
}

export async function softDeleteProject(id: string): Promise<void> {
  const { error } = await supabase
    .from("projects")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

/**
 * Restaure un chantier mis à la corbeille. Si son slug d'origine est
 * désormais pris par un autre chantier actif, on suffixe automatiquement
 * (-restaure, puis -restaure-2, -restaure-3, etc.).
 */
export async function restoreProject(id: string): Promise<{ slugChanged: boolean; slug: string }> {
  const { data: project, error: fetchErr } = await supabase
    .from("projects")
    .select("id, slug")
    .eq("id", id)
    .single();
  if (fetchErr) throw fetchErr;
  if (!project) throw new Error("Chantier introuvable");

  const taken = await fetchTakenSlugs();
  taken.delete(project.slug);

  let newSlug = project.slug;
  if (taken.has(newSlug)) {
    const candidate = `${project.slug}-restaure`;
    if (!taken.has(candidate)) {
      newSlug = candidate;
    } else {
      let n = 2;
      while (taken.has(`${candidate}-${n}`)) n += 1;
      newSlug = `${candidate}-${n}`;
    }
  }

  const { error } = await supabase
    .from("projects")
    .update({ deleted_at: null, slug: newSlug })
    .eq("id", id);
  if (error) throw error;

  return { slugChanged: newSlug !== project.slug, slug: newSlug };
}

// ---------------------------------------------------------------------------
// Écriture admin — images
// ---------------------------------------------------------------------------

export async function addProjectImage(input: {
  project_id: string;
  storage_path: string;
  width?: number | null;
  height?: number | null;
  caption?: string | null;
  kind?: ImageKind;
  sort_order?: number;
  is_cover?: boolean;
}): Promise<ProjectImage> {
  const { data, error } = await supabase
    .from("project_images")
    .insert({
      project_id: input.project_id,
      storage_path: input.storage_path,
      width: input.width ?? null,
      height: input.height ?? null,
      caption: input.caption ?? null,
      kind: input.kind ?? "photo",
      sort_order: input.sort_order ?? 0,
      is_cover: input.is_cover ?? false,
    })
    .select()
    .single();
  if (error) throw error;
  return data as ProjectImage;
}

export async function removeProjectImage(id: string): Promise<void> {
  const { error } = await supabase.from("project_images").delete().eq("id", id);
  if (error) throw error;
}

export async function reorderProjectImages(
  items: Array<{ id: string; sort_order: number }>,
): Promise<void> {
  await Promise.all(
    items.map((i) =>
      supabase
        .from("project_images")
        .update({ sort_order: i.sort_order })
        .eq("id", i.id),
    ),
  );
}

/**
 * Désigne une image comme couverture du chantier. Garantit l'unicité
 * (l'index unique partial DB casserait sinon) en désactivant d'abord
 * la cover précédente.
 */
export async function setProjectCover(
  projectId: string,
  imageId: string,
): Promise<void> {
  const { error: clearErr } = await supabase
    .from("project_images")
    .update({ is_cover: false })
    .eq("project_id", projectId)
    .eq("is_cover", true);
  if (clearErr) throw clearErr;

  const { error: setErr } = await supabase
    .from("project_images")
    .update({ is_cover: true })
    .eq("id", imageId);
  if (setErr) throw setErr;
}

export async function setImageKind(imageId: string, kind: ImageKind): Promise<void> {
  const { error } = await supabase
    .from("project_images")
    .update({ kind })
    .eq("id", imageId);
  if (error) throw error;
}

export async function setImageCaption(
  imageId: string,
  caption: string | null,
): Promise<void> {
  const { error } = await supabase
    .from("project_images")
    .update({ caption })
    .eq("id", imageId);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Écriture admin — tags
// ---------------------------------------------------------------------------

/**
 * Remplace l'ensemble des tags d'un chantier. Stratégie delete + insert
 * (volume très faible, < 10 tags par chantier).
 */
export async function setProjectTags(projectId: string, tags: string[]): Promise<void> {
  const { error: delErr } = await supabase
    .from("project_tags")
    .delete()
    .eq("project_id", projectId);
  if (delErr) throw delErr;

  if (tags.length === 0) return;

  const rows = tags.map((tag) => ({ project_id: projectId, tag }));
  const { error: insErr } = await supabase.from("project_tags").insert(rows);
  if (insErr) throw insErr;
}
