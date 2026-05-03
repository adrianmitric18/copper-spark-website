-- =============================================
-- Schema cuivre-electrique-prod (Supabase perso)
-- Généré le 2026-05-03 depuis les 24 migrations Lovable Cloud
-- À exécuter dans le SQL Editor du nouveau projet Supabase
-- =============================================

-- ============================================================================
-- SCHÉMA CONSOLIDÉ — cuivre-electrique.com
-- ============================================================================
-- Cible : nouveau projet Supabase (tipazyavmuteilmerfdl) — fresh DB
-- Source : 24 migrations supabase/migrations/*.sql (état final 2026-04-30)
-- Tables actives : leads, testimonials, rendez_vous, checklist_items,
--                  projects, project_images, project_tags, interventions
-- Fonctions : is_admin, set_updated_at, validate_rdv_date, touch_interventions_updated_at
-- Storage buckets : assets, lead-photos, chantiers
--
-- Idempotent : peut être rejoué sans erreur (CREATE … IF NOT EXISTS,
-- DROP IF EXISTS + CREATE pour les policies/triggers, ON CONFLICT pour
-- les buckets storage).
--
-- Tables historiques NON recréées (DROP'd dans la chronologie originale) :
-- contact_requests, contact_rate_limits, cleanup_old_rate_limits().
-- ============================================================================


-- ============================================================================
-- 1. EXTENSIONS (déjà présentes par défaut sur Supabase, no-op si re-run)
-- ============================================================================
-- gen_random_uuid() vient de pgcrypto, présent par défaut. Pas de CREATE EXTENSION.


-- ============================================================================
-- 2. FONCTIONS UTILITAIRES
-- ============================================================================

-- 2.1 — is_admin() : vérifie l'email JWT vs l'email admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'email') = 'cuivre.electrique@gmail.com',
    false
  );
$$;

-- 2.2 — set_updated_at() : trigger générique BEFORE UPDATE
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 2.3 — validate_rdv_date() : refuse les RDV passés + maj updated_at
CREATE OR REPLACE FUNCTION public.validate_rdv_date()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.date_rdv < CURRENT_DATE THEN
    RAISE EXCEPTION 'La date du rendez-vous ne peut pas être dans le passé';
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 2.4 — touch_interventions_updated_at() : trigger interventions (clone)
CREATE OR REPLACE FUNCTION public.touch_interventions_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


-- ============================================================================
-- 3. TABLES (état FINAL après toutes les ALTER TABLE)
-- ============================================================================

-- 3.1 — leads
CREATE TABLE IF NOT EXISTS public.leads (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  name            text NOT NULL,
  email           text NOT NULL,
  phone           text NOT NULL,
  address         text NOT NULL,
  rue             text,
  numero          text,
  code_postal     text,
  commune         text,
  client_type     text NOT NULL,
  services        text[] NOT NULL,
  message         text NOT NULL,
  timing          text,
  source          text DEFAULT 'formulaire_site',
  photo_urls      text[],
  status          text NOT NULL DEFAULT 'nouveau',
  notes           text,
  notes_internes  text,
  gdpr_consent    boolean NOT NULL DEFAULT false
);

-- CHECK constraint sur leads.source — état final post-migration #21 (rdv_rapide ajouté)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'leads_source_allowed') THEN
    ALTER TABLE public.leads
      ADD CONSTRAINT leads_source_allowed CHECK (
        source IS NULL OR source IN (
          'formulaire_site',
          'telephone',
          'whatsapp',
          'facebook',
          'recommandation',
          'chantier',
          'autre',
          'Recherche Google',
          'Bouche-à-oreille / Recommandation',
          'Google Maps',
          'Réseaux sociaux',
          'Publicité en ligne',
          'Plateforme (TrustUp, Bobex, Solvari...)',
          'Autre',
          'rdv_rapide'
        )
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_status     ON public.leads (status);


-- 3.2 — testimonials
CREATE TABLE IF NOT EXISTS public.testimonials (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  city        text,
  service     text,
  rating      integer NOT NULL DEFAULT 5,
  message     text NOT NULL,
  approved    boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'testimonials_name_len') THEN
    ALTER TABLE public.testimonials
      ADD CONSTRAINT testimonials_name_len    CHECK (char_length(name) BETWEEN 1 AND 50),
      ADD CONSTRAINT testimonials_message_len CHECK (char_length(message) BETWEEN 1 AND 500),
      ADD CONSTRAINT testimonials_city_len    CHECK (city IS NULL OR char_length(city) <= 50),
      ADD CONSTRAINT testimonials_service_len CHECK (service IS NULL OR char_length(service) <= 100),
      ADD CONSTRAINT testimonials_rating_range CHECK (rating BETWEEN 1 AND 5);
  END IF;
END $$;


-- 3.3 — rendez_vous
CREATE TABLE IF NOT EXISTS public.rendez_vous (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id               uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  date_rdv              date NOT NULL,
  heure_rdv             time NOT NULL,
  duree_minutes         integer NOT NULL DEFAULT 60,
  type_visite           text NOT NULL,
  notes_internes        text,
  statut                text NOT NULL DEFAULT 'confirme',
  rappel_envoye_at      timestamptz,
  delai_appel_minutes   integer,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rdv_statut_valide  CHECK (statut IN ('confirme','rappel_envoye','termine','annule')),
  CONSTRAINT rdv_duree_valide   CHECK (duree_minutes BETWEEN 15 AND 480),
  CONSTRAINT rdv_heure_valide   CHECK (heure_rdv >= '07:00:00' AND heure_rdv <= '22:00:00'),
  CONSTRAINT rdv_delai_appel_positif CHECK (
    delai_appel_minutes IS NULL
    OR (delai_appel_minutes > 0 AND delai_appel_minutes <= 240)
  )
);

-- CHECK type_visite — état FINAL post-migration #24
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'rdv_type_visite_valide') THEN
    ALTER TABLE public.rendez_vous
      ADD CONSTRAINT rdv_type_visite_valide CHECK (
        type_visite IN (
          'Devis',
          'Visite technique',
          'Dépannage',
          'Inspection RGIE',
          'Installation borne de recharge',
          'Installation panneaux photovoltaïques',
          'Autre'
        )
      );
  END IF;
END $$;

COMMENT ON COLUMN public.rendez_vous.delai_appel_minutes IS
  'Délai en minutes avant arrivée pendant lequel Adrian appelle le client. NULL = mention masquée dans les templates.';

CREATE INDEX IF NOT EXISTS idx_rdv_lead_id      ON public.rendez_vous (lead_id);
CREATE INDEX IF NOT EXISTS idx_rdv_date_statut  ON public.rendez_vous (date_rdv, statut);


-- 3.4 — checklist_items
CREATE TABLE IF NOT EXISTS public.checklist_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id         uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  checklist_type  text NOT NULL CHECK (checklist_type IN ('rgie','pv','borne','installation','generique')),
  item_key        text NOT NULL,
  item_label      text NOT NULL,
  is_checked      boolean NOT NULL DEFAULT false,
  item_order      integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lead_id, item_key)
);

CREATE INDEX IF NOT EXISTS idx_checklist_items_lead_id ON public.checklist_items (lead_id);


-- 3.5 — projects (CMS chantiers)
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

CREATE UNIQUE INDEX IF NOT EXISTS projects_slug_unique_active
  ON public.projects (slug)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS projects_published_completed_idx
  ON public.projects (completed_at DESC)
  WHERE status = 'published' AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS projects_zone_idx
  ON public.projects (zone)
  WHERE status = 'published' AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS projects_featured_idx
  ON public.projects (featured)
  WHERE status = 'published' AND deleted_at IS NULL AND featured = true;

CREATE INDEX IF NOT EXISTS projects_deleted_at_idx
  ON public.projects (deleted_at)
  WHERE deleted_at IS NOT NULL;


-- 3.6 — project_images
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

CREATE UNIQUE INDEX IF NOT EXISTS project_images_one_cover
  ON public.project_images (project_id)
  WHERE is_cover = true;


-- 3.7 — project_tags
CREATE TABLE IF NOT EXISTS public.project_tags (
  project_id  uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  tag         text NOT NULL,
  PRIMARY KEY (project_id, tag),
  CONSTRAINT project_tags_tag_length CHECK (char_length(tag) BETWEEN 1 AND 60)
);

CREATE INDEX IF NOT EXISTS project_tags_tag_idx ON public.project_tags (tag);


-- 3.8 — interventions
CREATE TABLE IF NOT EXISTS public.interventions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id           uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  project_id        uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  type_intervention text NOT NULL,
  date_debut        date NOT NULL,
  date_fin          date NOT NULL,
  heure_debut       time NOT NULL,
  heure_fin         time NOT NULL,
  notes_client      text,
  notes_internes    text,
  statut            text NOT NULL DEFAULT 'programme',
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT interventions_type_valide CHECK (
    type_intervention IN (
      'Devis',
      'Visite technique',
      'Dépannage',
      'Inspection RGIE',
      'Installation borne de recharge',
      'Installation panneaux photovoltaïques',
      'Autre'
    )
  ),
  CONSTRAINT interventions_statut_valide CHECK (
    statut IN ('programme', 'en_cours', 'termine', 'reporte', 'annule')
  ),
  CONSTRAINT interventions_dates_coherentes CHECK (date_fin >= date_debut),
  CONSTRAINT interventions_heures_coherentes CHECK (
    date_fin > date_debut OR heure_fin > heure_debut
  ),
  CONSTRAINT interventions_notes_client_length CHECK (
    notes_client IS NULL OR char_length(notes_client) <= 2000
  ),
  CONSTRAINT interventions_notes_internes_length CHECK (
    notes_internes IS NULL OR char_length(notes_internes) <= 2000
  )
);

CREATE INDEX IF NOT EXISTS idx_interventions_lead_id    ON public.interventions (lead_id);
CREATE INDEX IF NOT EXISTS idx_interventions_project_id ON public.interventions (project_id);
CREATE INDEX IF NOT EXISTS idx_interventions_date_debut ON public.interventions (date_debut DESC);
CREATE INDEX IF NOT EXISTS idx_interventions_statut     ON public.interventions (statut);


-- ============================================================================
-- 4. TRIGGERS (DROP IF EXISTS + CREATE pour idempotence)
-- ============================================================================

DROP TRIGGER IF EXISTS trg_validate_rdv_date ON public.rendez_vous;
CREATE TRIGGER trg_validate_rdv_date
  BEFORE INSERT OR UPDATE ON public.rendez_vous
  FOR EACH ROW EXECUTE FUNCTION public.validate_rdv_date();

DROP TRIGGER IF EXISTS update_checklist_items_updated_at ON public.checklist_items;
CREATE TRIGGER update_checklist_items_updated_at
  BEFORE UPDATE ON public.checklist_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS interventions_set_updated_at ON public.interventions;
CREATE TRIGGER interventions_set_updated_at
  BEFORE UPDATE ON public.interventions
  FOR EACH ROW EXECUTE FUNCTION public.touch_interventions_updated_at();


-- ============================================================================
-- 5. STORAGE BUCKETS
-- ============================================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('assets',      'assets',      true)  ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('lead-photos', 'lead-photos', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('chantiers',   'chantiers',   true)  ON CONFLICT (id) DO NOTHING;


-- ============================================================================
-- 6. ROW LEVEL SECURITY — enable
-- ============================================================================

ALTER TABLE public.leads            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rendez_vous      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_images   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tags     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interventions    ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- 7. POLICIES — leads
-- ============================================================================

-- Public INSERT (formulaire de contact public)
DROP POLICY IF EXISTS "Anyone can submit a valid lead" ON public.leads;
CREATE POLICY "Anyone can submit a valid lead"
ON public.leads FOR INSERT TO anon, authenticated
WITH CHECK (
  char_length(name) BETWEEN 1 AND 100
  AND char_length(email) BETWEEN 3 AND 255
  AND char_length(phone) BETWEEN 6 AND 30
  AND char_length(address) BETWEEN 3 AND 300
  AND rue IS NOT NULL AND char_length(rue) BETWEEN 1 AND 150
  AND numero IS NOT NULL AND char_length(numero) BETWEEN 1 AND 20
  AND code_postal IS NOT NULL AND char_length(code_postal) = 4 AND code_postal ~ '^[0-9]{4}$'
  AND commune IS NOT NULL AND char_length(commune) BETWEEN 1 AND 100
  AND char_length(client_type) BETWEEN 1 AND 50
  AND array_length(services, 1) BETWEEN 1 AND 10
  AND char_length(message) BETWEEN 10 AND 5000
  AND (timing IS NULL OR char_length(timing) <= 100)
  AND (source IS NULL OR char_length(source) <= 100)
  AND (photo_urls IS NULL OR array_length(photo_urls, 1) <= 3)
  AND gdpr_consent = true
  AND status = 'nouveau'
);

-- Admin INSERT (création manuelle depuis l'admin)
DROP POLICY IF EXISTS "Admin can insert leads" ON public.leads;
CREATE POLICY "Admin can insert leads"
ON public.leads FOR INSERT TO authenticated
WITH CHECK (
  is_admin()
  AND char_length(name) >= 1 AND char_length(name) <= 100
  AND char_length(email) >= 3 AND char_length(email) <= 255
  AND char_length(phone) >= 6 AND char_length(phone) <= 30
  AND char_length(address) >= 3 AND char_length(address) <= 300
  AND rue IS NOT NULL AND char_length(rue) >= 1 AND char_length(rue) <= 150
  AND numero IS NOT NULL AND char_length(numero) >= 1 AND char_length(numero) <= 20
  AND code_postal IS NOT NULL AND char_length(code_postal) = 4 AND code_postal ~ '^[0-9]{4}$'
  AND commune IS NOT NULL AND char_length(commune) >= 1 AND char_length(commune) <= 100
  AND char_length(client_type) >= 1 AND char_length(client_type) <= 50
  AND array_length(services, 1) >= 1 AND array_length(services, 1) <= 10
  AND char_length(message) >= 1 AND char_length(message) <= 5000
  AND (timing IS NULL OR char_length(timing) <= 100)
  AND (source IS NULL OR source IN ('formulaire_site', 'telephone', 'whatsapp', 'facebook', 'recommandation', 'chantier', 'autre'))
  AND (notes_internes IS NULL OR char_length(notes_internes) <= 2000)
  AND (photo_urls IS NULL OR array_length(photo_urls, 1) <= 3)
  AND gdpr_consent = true
  AND status = 'nouveau'
);

-- Admin INSERT light pour RDV rapide (payload minimal autorisé)
DROP POLICY IF EXISTS "Admin can insert rdv_rapide leads" ON public.leads;
CREATE POLICY "Admin can insert rdv_rapide leads"
ON public.leads FOR INSERT TO authenticated
WITH CHECK (
  is_admin()
  AND source = 'rdv_rapide'
  AND status = 'rdv_pris'
  AND char_length(name) BETWEEN 1 AND 100
  AND char_length(phone) BETWEEN 6 AND 30
  AND gdpr_consent = true
);

-- Admin SELECT/UPDATE/DELETE
DROP POLICY IF EXISTS "Admin can select leads" ON public.leads;
CREATE POLICY "Admin can select leads"
ON public.leads FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Admin can update leads" ON public.leads;
CREATE POLICY "Admin can update leads"
ON public.leads FOR UPDATE TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin can delete leads" ON public.leads;
CREATE POLICY "Admin can delete leads"
ON public.leads FOR DELETE TO authenticated USING (public.is_admin());

-- Deny anon explicit
DROP POLICY IF EXISTS "Deny anon select on leads" ON public.leads;
CREATE POLICY "Deny anon select on leads" ON public.leads FOR SELECT TO anon USING (false);
DROP POLICY IF EXISTS "Deny anon update on leads" ON public.leads;
CREATE POLICY "Deny anon update on leads" ON public.leads FOR UPDATE TO anon USING (false);
DROP POLICY IF EXISTS "Deny anon delete on leads" ON public.leads;
CREATE POLICY "Deny anon delete on leads" ON public.leads FOR DELETE TO anon USING (false);


-- ============================================================================
-- 8. POLICIES — testimonials
-- ============================================================================

-- Public read (approved only)
DROP POLICY IF EXISTS "Public can read approved testimonials" ON public.testimonials;
CREATE POLICY "Public can read approved testimonials"
ON public.testimonials FOR SELECT TO anon, authenticated
USING (approved = true OR public.is_admin());

-- Public INSERT (avec validation longueur)
DROP POLICY IF EXISTS "Anyone can submit a valid testimonial" ON public.testimonials;
CREATE POLICY "Anyone can submit a valid testimonial"
ON public.testimonials FOR INSERT TO anon, authenticated
WITH CHECK (
  char_length(name) BETWEEN 1 AND 50
  AND char_length(message) BETWEEN 1 AND 500
  AND rating BETWEEN 1 AND 5
  AND (city IS NULL OR char_length(city) <= 50)
  AND (service IS NULL OR char_length(service) <= 100)
  AND approved = false
);

-- Admin
DROP POLICY IF EXISTS "Admin can insert testimonials" ON public.testimonials;
CREATE POLICY "Admin can insert testimonials"
ON public.testimonials FOR INSERT TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin can update testimonials" ON public.testimonials;
CREATE POLICY "Admin can update testimonials"
ON public.testimonials FOR UPDATE TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin can delete testimonials" ON public.testimonials;
CREATE POLICY "Admin can delete testimonials"
ON public.testimonials FOR DELETE TO authenticated USING (public.is_admin());


-- ============================================================================
-- 9. POLICIES — rendez_vous
-- ============================================================================

DROP POLICY IF EXISTS "Admin can select rdv" ON public.rendez_vous;
CREATE POLICY "Admin can select rdv" ON public.rendez_vous FOR SELECT TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "Admin can insert rdv" ON public.rendez_vous;
CREATE POLICY "Admin can insert rdv" ON public.rendez_vous FOR INSERT TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admin can update rdv" ON public.rendez_vous;
CREATE POLICY "Admin can update rdv" ON public.rendez_vous FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admin can delete rdv" ON public.rendez_vous;
CREATE POLICY "Admin can delete rdv" ON public.rendez_vous FOR DELETE TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "Deny anon all on rdv" ON public.rendez_vous;
CREATE POLICY "Deny anon all on rdv" ON public.rendez_vous FOR ALL TO anon USING (false) WITH CHECK (false);


-- ============================================================================
-- 10. POLICIES — checklist_items
-- ============================================================================

DROP POLICY IF EXISTS "Admin can select checklist_items" ON public.checklist_items;
CREATE POLICY "Admin can select checklist_items" ON public.checklist_items FOR SELECT TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "Admin can insert checklist_items" ON public.checklist_items;
CREATE POLICY "Admin can insert checklist_items" ON public.checklist_items FOR INSERT TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admin can update checklist_items" ON public.checklist_items;
CREATE POLICY "Admin can update checklist_items" ON public.checklist_items FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admin can delete checklist_items" ON public.checklist_items;
CREATE POLICY "Admin can delete checklist_items" ON public.checklist_items FOR DELETE TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "Deny anon all on checklist_items" ON public.checklist_items;
CREATE POLICY "Deny anon all on checklist_items" ON public.checklist_items FOR ALL TO anon USING (false) WITH CHECK (false);


-- ============================================================================
-- 11. POLICIES — projects / project_images / project_tags
-- ============================================================================

-- projects
DROP POLICY IF EXISTS "Public read published projects" ON public.projects;
CREATE POLICY "Public read published projects"
  ON public.projects FOR SELECT TO anon, authenticated
  USING (status = 'published' AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Admin full access projects" ON public.projects;
CREATE POLICY "Admin full access projects"
  ON public.projects FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- project_images
DROP POLICY IF EXISTS "Public read images of published projects" ON public.project_images;
CREATE POLICY "Public read images of published projects"
  ON public.project_images FOR SELECT TO anon, authenticated
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
  ON public.project_images FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- project_tags
DROP POLICY IF EXISTS "Public read tags of published projects" ON public.project_tags;
CREATE POLICY "Public read tags of published projects"
  ON public.project_tags FOR SELECT TO anon, authenticated
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
  ON public.project_tags FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());


-- ============================================================================
-- 12. POLICIES — interventions
-- ============================================================================

DROP POLICY IF EXISTS "Admin full access on interventions" ON public.interventions;
CREATE POLICY "Admin full access on interventions"
  ON public.interventions FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());


-- ============================================================================
-- 13. POLICIES STORAGE — bucket 'assets'
-- ============================================================================

DROP POLICY IF EXISTS "Public read individual assets" ON storage.objects;
CREATE POLICY "Public read individual assets"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'assets' AND name IS NOT NULL);

DROP POLICY IF EXISTS "Service role can upload assets" ON storage.objects;
CREATE POLICY "Service role can upload assets"
ON storage.objects FOR INSERT TO service_role WITH CHECK (bucket_id = 'assets');

DROP POLICY IF EXISTS "Service role can update assets" ON storage.objects;
CREATE POLICY "Service role can update assets"
ON storage.objects FOR UPDATE TO service_role
USING (bucket_id = 'assets') WITH CHECK (bucket_id = 'assets');

DROP POLICY IF EXISTS "Service role can delete assets" ON storage.objects;
CREATE POLICY "Service role can delete assets"
ON storage.objects FOR DELETE TO service_role USING (bucket_id = 'assets');

DROP POLICY IF EXISTS "Deny anon update assets" ON storage.objects;
CREATE POLICY "Deny anon update assets"
ON storage.objects FOR UPDATE TO anon, authenticated
USING (bucket_id = 'assets' AND false);

DROP POLICY IF EXISTS "Deny anon delete assets" ON storage.objects;
CREATE POLICY "Deny anon delete assets"
ON storage.objects FOR DELETE TO anon, authenticated
USING (bucket_id = 'assets' AND false);


-- ============================================================================
-- 14. POLICIES STORAGE — bucket 'lead-photos' (privé)
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can upload lead photos" ON storage.objects;
CREATE POLICY "Anyone can upload lead photos"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'lead-photos');

DROP POLICY IF EXISTS "Deny anon read lead photos" ON storage.objects;
CREATE POLICY "Deny anon read lead photos"
ON storage.objects FOR SELECT TO anon
USING (bucket_id <> 'lead-photos');

DROP POLICY IF EXISTS "Deny authenticated read lead photos" ON storage.objects;
CREATE POLICY "Deny authenticated read lead photos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id <> 'lead-photos');

DROP POLICY IF EXISTS "Admin can read lead photos" ON storage.objects;
CREATE POLICY "Admin can read lead photos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'lead-photos' AND public.is_admin());

DROP POLICY IF EXISTS "Admin can delete lead photos" ON storage.objects;
CREATE POLICY "Admin can delete lead photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'lead-photos' AND public.is_admin());


-- ============================================================================
-- 15. POLICIES STORAGE — bucket 'chantiers' (public read, admin write)
-- ============================================================================

DROP POLICY IF EXISTS "Public read chantiers photos" ON storage.objects;
CREATE POLICY "Public read chantiers photos"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'chantiers');

DROP POLICY IF EXISTS "Admin upload chantiers photos" ON storage.objects;
CREATE POLICY "Admin upload chantiers photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'chantiers' AND public.is_admin());

DROP POLICY IF EXISTS "Admin update chantiers photos" ON storage.objects;
CREATE POLICY "Admin update chantiers photos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'chantiers' AND public.is_admin())
  WITH CHECK (bucket_id = 'chantiers' AND public.is_admin());

DROP POLICY IF EXISTS "Admin delete chantiers photos" ON storage.objects;
CREATE POLICY "Admin delete chantiers photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'chantiers' AND public.is_admin());


-- ============================================================================
-- FIN DU SCHÉMA
-- ============================================================================
-- Vérifications post-exécution recommandées dans le SQL Editor :
--   SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
--   SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' ORDER BY routine_name;
--   SELECT id, name, public FROM storage.buckets ORDER BY id;
--   SELECT tablename, policyname FROM pg_policies WHERE schemaname IN ('public','storage') ORDER BY tablename, policyname;
