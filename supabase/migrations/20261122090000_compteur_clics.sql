-- ============================================================================
-- COMPTEUR_CLICS — compteur anonyme des clics WhatsApp et téléphone
-- ============================================================================
-- Pourquoi : depuis le 2026-11-21, Google Analytics n'est chargé qu'après
-- l'accord du visiteur. Pour compter les demandes de bornes sur 2 mois, Adrian
-- a besoin d'un décompte qui ne dépende pas de cet accord.
--
-- Ce que la table contient : un NOMBRE par jour, par page et par action.
-- Ce qu'elle ne contient PAS : aucune adresse IP, aucun identifiant, aucun
-- navigateur, aucune heure, aucune donnée sur la personne. Une ligne dit
-- seulement « le 22/11, 3 clics WhatsApp sur la page bornes ».
-- Rien n'est déposé sur l'appareil du visiteur (ni cookie ni stockage).
--
-- Aucune table existante n'est modifiée. Pour revenir en arrière :
--   DROP FUNCTION IF EXISTS public.compter_clic(text, text);
--   DROP TABLE IF EXISTS public.compteur_clics;
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.compteur_clics (
  jour    date    NOT NULL DEFAULT (now() AT TIME ZONE 'Europe/Brussels')::date,
  page    text    NOT NULL,
  action  text    NOT NULL,
  nombre  integer NOT NULL DEFAULT 0,
  CONSTRAINT compteur_clics_pkey PRIMARY KEY (jour, page, action),
  CONSTRAINT compteur_clics_page_connue   CHECK (page   IN ('bornes')),
  CONSTRAINT compteur_clics_action_connue CHECK (action IN ('whatsapp', 'telephone')),
  CONSTRAINT compteur_clics_nombre_positif CHECK (nombre >= 0)
);

COMMENT ON TABLE public.compteur_clics IS
  'Compteur anonyme : nombre de clics par jour, page et action. Aucune donnée personnelle.';

-- Personne ne lit ni n'écrit la table directement, sauf l'admin en lecture.
ALTER TABLE public.compteur_clics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "compteur_clics admin read" ON public.compteur_clics;
CREATE POLICY "compteur_clics admin read"
  ON public.compteur_clics FOR SELECT
  TO authenticated
  USING (is_admin());

-- Seule façon d'écrire : cette fonction, qui ajoute 1 au compteur du jour.
-- Elle n'accepte que les pages et actions connues ; toute autre valeur est
-- ignorée sans erreur. Elle ne reçoit et n'enregistre rien d'autre.
CREATE OR REPLACE FUNCTION public.compter_clic(p_page text, p_action text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_page NOT IN ('bornes') OR p_action NOT IN ('whatsapp', 'telephone') THEN
    RETURN;
  END IF;

  INSERT INTO public.compteur_clics AS c (jour, page, action, nombre)
  VALUES ((now() AT TIME ZONE 'Europe/Brussels')::date, p_page, p_action, 1)
  ON CONFLICT (jour, page, action)
  DO UPDATE SET nombre = c.nombre + 1;
END;
$$;

REVOKE ALL ON FUNCTION public.compter_clic(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.compter_clic(text, text) TO anon, authenticated;

-- ============================================================================
-- FIN MIGRATION
-- ============================================================================
