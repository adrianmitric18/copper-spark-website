-- Lève la limite message des avis (testimonials) de 500 → 1000 caractères.
--
-- Raison : l'admin UI (AvisManager.tsx) autorise déjà 1000 chars (maxLength=1000,
-- compteur "/1000"), mais la contrainte DB rejetait les inserts > 500 chars
-- avec une erreur check_violation. Conséquence : les avis Google longs
-- (>500 chars, fréquent) étaient impossibles à coller depuis /admin/avis.
--
-- Cette migration aligne :
--   1) la CHECK constraint au niveau table       (admin insert/update)
--   2) la policy RLS "Anyone can submit"          (formulaire public futur)
-- sur la même valeur 1000, pour éviter toute désynchro à l'avenir.
--
-- 1000 reste un plafond anti-abus raisonnable (un avis Google humain dépasse
-- très rarement 1000 chars).

-- 1) CHECK constraint table-level
ALTER TABLE public.testimonials
  DROP CONSTRAINT IF EXISTS testimonials_message_len;

ALTER TABLE public.testimonials
  ADD CONSTRAINT testimonials_message_len CHECK (char_length(message) BETWEEN 1 AND 1000);

-- 2) Public INSERT policy (anon + authenticated non-admin)
DROP POLICY IF EXISTS "Anyone can submit a valid testimonial" ON public.testimonials;

CREATE POLICY "Anyone can submit a valid testimonial"
ON public.testimonials
FOR INSERT
TO anon, authenticated
WITH CHECK (
  char_length(name) BETWEEN 1 AND 50
  AND char_length(message) BETWEEN 1 AND 1000
  AND rating BETWEEN 1 AND 5
  AND (city IS NULL OR char_length(city) <= 50)
  AND (service IS NULL OR char_length(service) <= 100)
  AND approved = false
);
