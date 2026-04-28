-- ============================================================================
-- PHASE 0 — CMS CHANTIERS
-- ============================================================================
-- Fondations Supabase pour le CMS de chantiers de cuivre-electrique.com :
--   * Table projects        : 1 ligne par chantier (avec soft delete)
--   * Table project_images  : N images par chantier (cover, photo, before, after)
--   * Table project_tags    : N tags par chantier (filtres front)
--   * Bucket Storage 'chantiers' : photos hébergées hors src/assets
--   * RLS strictes via la fonction existante public.is_admin()
--   * Trigger updated_at via la fonction existante public.set_updated_at()
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Table : projects
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.projects (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              text NOT NULL,
  title             text NOT NULL,
  location          text NOT NULL,
  zone              text NOT NULL,
  completed_at      date NOT NULL,
  summary           text NOT NULL,
  story             text,
  duration_days     integer,
  budget_range      text,
  faq               jsonb,
  status            text NOT NULL DEFAULT 'draft',
  featured          boolean NOT NULL DEFAULT false,
  meta_title        text,
  meta_description  text,
  deleted_at        timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT projects_slug_format    CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  CONSTRAINT projects_slug_length    CHECK (char_length(slug) BETWEEN 3 AND 100),
  CONSTRAINT projects_title_length   CHECK (char_length(title) BETWEEN 3 AND 200),
  CONSTRAINT projects_summary_length CHECK (char_length(summary) BETWEEN 1 AND 500),
  CONSTRAINT projects_status_allowed CHECK (status IN ('draft', 'published'))
);

-- Slug unique parmi les chantiers non supprimés (autorise réutilisation après soft delete)
CREATE UNIQUE INDEX IF NOT EXISTS projects_slug_unique_active
  ON public.projects (slug)
  WHERE deleted_at IS NULL;

-- Index ciblés pour les filtres du front public
CREATE INDEX IF NOT EXISTS projects_published_completed_idx
  ON public.projects (completed_at DESC)
  WHERE status = 'published' AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS projects_zone_idx
  ON public.projects (zone)
  WHERE status = 'published' AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS projects_featured_idx
  ON public.projects (featured)
  WHERE status = 'published' AND deleted_at IS NULL AND featured = true;

-- Index pour la corbeille (soft delete) côté admin
CREATE INDEX IF NOT EXISTS projects_deleted_at_idx
  ON public.projects (deleted_at)
  WHERE deleted_at IS NOT NULL;

-- Trigger updated_at (réutilise la fonction existante)
DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ----------------------------------------------------------------------------
-- 2. Table : project_images
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.project_images (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  storage_path  text NOT NULL,
  caption       text,
  kind          text NOT NULL DEFAULT 'photo',
  is_cover      boolean NOT NULL DEFAULT false,
  sort_order    integer NOT NULL DEFAULT 0,
  width         integer,
  height        integer,
  created_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT project_images_kind_allowed   CHECK (kind IN ('photo', 'before', 'after')),
  CONSTRAINT project_images_caption_length CHECK (caption IS NULL OR char_length(caption) <= 300)
);

CREATE INDEX IF NOT EXISTS project_images_project_id_idx
  ON public.project_images (project_id, sort_order);

-- Au plus une cover par projet (contrainte via index unique partiel)
CREATE UNIQUE INDEX IF NOT EXISTS project_images_one_cover
  ON public.project_images (project_id)
  WHERE is_cover = true;


-- ----------------------------------------------------------------------------
-- 3. Table : project_tags
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.project_tags (
  project_id  uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  tag         text NOT NULL,
  PRIMARY KEY (project_id, tag),

  CONSTRAINT project_tags_tag_length CHECK (char_length(tag) BETWEEN 1 AND 60)
);

CREATE INDEX IF NOT EXISTS project_tags_tag_idx
  ON public.project_tags (tag);


-- ----------------------------------------------------------------------------
-- 4. RLS : projects
-- ----------------------------------------------------------------------------

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read published projects" ON public.projects;
CREATE POLICY "Public read published projects"
  ON public.projects FOR SELECT
  TO anon, authenticated
  USING (status = 'published' AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Admin full access projects" ON public.projects;
CREATE POLICY "Admin full access projects"
  ON public.projects FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ----------------------------------------------------------------------------
-- 5. RLS : project_images
-- ----------------------------------------------------------------------------

ALTER TABLE public.project_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read images of published projects" ON public.project_images;
CREATE POLICY "Public read images of published projects"
  ON public.project_images FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_images.project_id
        AND p.status = 'published'
        AND p.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Admin full access project_images" ON public.project_images;
CREATE POLICY "Admin full access project_images"
  ON public.project_images FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ----------------------------------------------------------------------------
-- 6. RLS : project_tags
-- ----------------------------------------------------------------------------

ALTER TABLE public.project_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read tags of published projects" ON public.project_tags;
CREATE POLICY "Public read tags of published projects"
  ON public.project_tags FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_tags.project_id
        AND p.status = 'published'
        AND p.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Admin full access project_tags" ON public.project_tags;
CREATE POLICY "Admin full access project_tags"
  ON public.project_tags FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ----------------------------------------------------------------------------
-- 7. Bucket Storage : chantiers
-- ----------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public)
VALUES ('chantiers', 'chantiers', true)
ON CONFLICT (id) DO NOTHING;

-- Lecture publique (front public + admin)
DROP POLICY IF EXISTS "Public read chantiers photos" ON storage.objects;
CREATE POLICY "Public read chantiers photos"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'chantiers');

-- Upload réservé à l'admin (plus strict que le bucket 'assets')
DROP POLICY IF EXISTS "Admin upload chantiers photos" ON storage.objects;
CREATE POLICY "Admin upload chantiers photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'chantiers' AND public.is_admin());

DROP POLICY IF EXISTS "Admin update chantiers photos" ON storage.objects;
CREATE POLICY "Admin update chantiers photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'chantiers' AND public.is_admin())
  WITH CHECK (bucket_id = 'chantiers' AND public.is_admin());

DROP POLICY IF EXISTS "Admin delete chantiers photos" ON storage.objects;
CREATE POLICY "Admin delete chantiers photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'chantiers' AND public.is_admin());


-- ============================================================================
-- FIN PHASE 0
-- ============================================================================
