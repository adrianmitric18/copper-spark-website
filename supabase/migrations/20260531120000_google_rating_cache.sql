-- 2026-05-31 — Cache de la note Google (Places API) pour l'affichage de la home.
--
-- Une seule ligne (id = 1) mise à jour par l'edge function `google-rating`
-- au plus une fois / 24h. Objectif : afficher la note Google LIVE (rating +
-- nombre d'avis) sans exposer la clé API côté client et sans appeler Places
-- API à chaque visite (coût + quota maîtrisés).
--
-- Lecture publique (anon) : la note est affichée sur la home.
-- Écriture : réservée au service role (l'edge function), qui bypass la RLS.
-- Aucune policy d'écriture => aucun client anon/authenticated ne peut écrire.

create table if not exists public.google_rating_cache (
  id smallint primary key default 1,
  rating numeric(2,1) not null,
  user_ratings_total integer not null,
  fetched_at timestamptz not null default now(),
  constraint google_rating_cache_single_row check (id = 1)
);

alter table public.google_rating_cache enable row level security;

drop policy if exists "google_rating_cache_public_read" on public.google_rating_cache;
create policy "google_rating_cache_public_read"
  on public.google_rating_cache
  for select
  using (true);

-- Valeur de départ : la home a toujours quelque chose à afficher avant le
-- premier rafraîchissement Google. À garder ≈ à la fiche Google réelle.
insert into public.google_rating_cache (id, rating, user_ratings_total)
values (1, 5.0, 25)
on conflict (id) do nothing;
