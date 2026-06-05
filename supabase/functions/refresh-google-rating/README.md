# refresh-google-rating — Mise à jour auto de la note Google

Affiche sur le site les **vrais chiffres de la fiche Google** (note moyenne +
nombre d'avis) et les tient à jour automatiquement, **sans exposer la clé API**
côté client.

## Architecture

```
[Google Places API]  ──(1x/jour, clé en secret)──►  [edge function refresh-google-rating]
                                                              │  UPSERT (service_role)
                                                              ▼
                                                     [table public.google_rating]  (singleton id=1)
                                                              ▲
                                                              │ lecture publique (RLS select)
                                              [front: useGoogleRating] ──► HomeReviewsBanner + KeyFiguresSection
```

- **Découplage SEO** : le JSON-LD `aggregateRating` (`StructuredData`) reste basé
  sur les avis **first-party** (`testimonials` / `useAggregateRating`). On ne
  marque **pas** en Schema.org une note agrégée tierce (interdit par Google).
- **Fallback gracieux** : tant que la table `google_rating` est vide, le front
  retombe sur `useAggregateRating`. Aucune régression possible.

## Déploiement (checklist)

### 1. Google Cloud
1. Créer (ou réutiliser) un projet Google Cloud + **activer la facturation**.
2. Activer **Places API** (l'ancienne, "Places API", endpoint `place/details/json`).
3. Créer une **clé API** ; la restreindre à l'API Places (recommandé).

### 2. Récupérer le `place_id`
- Via le [Place ID Finder](https://developers.google.com/maps/documentation/places/web-service/place-id)
  en cherchant « Le Cuivre Électrique ». C'est une valeur **publique** (pas un secret).

### 3. Migration (table cache)
Appliquer `supabase/migrations/20260605120000_google_rating_cache.sql`
(via votre flux habituel : `supabase db push`, dashboard, ou Lovable).

### 4. Secrets Supabase (jamais dans le code / le chat)
```
supabase secrets set GOOGLE_PLACES_API_KEY=<votre_clé>
supabase secrets set GOOGLE_PLACE_ID=<votre_place_id>
```
(`SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont injectés automatiquement.)

### 5. Déployer la fonction
Ajouter dans `supabase/config.toml` :
```toml
[functions.refresh-google-rating]
verify_jwt = true
```
Puis : `supabase functions deploy refresh-google-rating`

### 6. Amorcer + planifier
- **Amorçage** : invoquer une fois la fonction (token service_role) pour remplir
  le cache immédiatement.
- **Planification quotidienne** : via le planificateur Supabase (cron) ou `pg_cron`.
  1 appel/jour suffit largement — quota et coût Places API négligeables.

### 7. Régénérer les types (optionnel mais propre)
La table `google_rating` n'est pas encore dans les types générés (le hook lit via
un client non typé en attendant). Après migration :
```
npx supabase gen types typescript --project-id tipazyavmuteilmerfdl > src/integrations/supabase/types.ts
```
Puis remplacer le cast `supabase as unknown as SupabaseClient` dans
`src/hooks/useGoogleRating.ts` par le client typé.

## Vérification
Une fois la fonction invoquée, `SELECT * FROM public.google_rating;` doit
renvoyer une ligne avec `rating`, `user_ratings_total`, `fetched_at` à jour.
Le bandeau d'avis de la home et la « Note Google » des chiffres clés afficheront
alors automatiquement ces valeurs.
