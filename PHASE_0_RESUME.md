# Phase 0 — Fondations CMS Chantiers

> Branche : `feat/cms-chantiers`
> Date : 2026-04-28
> Statut : ✅ Terminée

## 1. Ce qui a été fait

### Base de données (Supabase, appliquée)

Migration `supabase/migrations/20260428120000_chantiers_cms_phase_0.sql` :

- **3 nouvelles tables**
  - `projects` : 1 ligne par chantier. Contient titre, lieu, zone, date, récit, FAQ (jsonb), durée, budget, statut (`draft` / `published`), featured, meta SEO et `deleted_at` (soft delete).
  - `project_images` : photos d'un chantier. Champs `kind` (`photo` / `before` / `after`), `is_cover` (1 max par projet), `sort_order`, dimensions.
  - `project_tags` : table de jonction projet ↔ tag.
- **Bucket Storage** `chantiers` : lecture publique, write réservé à l'admin via la fonction `is_admin()` existante.
- **RLS strictes** : public ne voit que les chantiers `published` non supprimés ; admin voit tout.
- **Index ciblés** pour les filtres front (`completed_at`, `zone`, `featured`, slug unique parmi actifs).
- **Trigger `updated_at`** réutilisant la fonction `set_updated_at()` existante.
- **Aucune table existante n'a été touchée** (`leads`, `rendez_vous`, `testimonials`, `checklist_items` intactes, buckets `assets` et `lead-photos` intacts).

### Code front

- `src/lib/chantiers/types.ts` : interfaces `Project`, `ProjectImage`, `ProjectTag`, `ProjectFaqItem` + listes `CHANTIER_TAGS` (9 tags validés) et `CHANTIER_ZONES`.
- `src/lib/chantiers/slug.ts` : `slugify()`, `isValidSlug()` (miroir du CHECK SQL), `uniqueSlug()` (suffixe `-2`, `-3` en cas de collision).
- `src/lib/chantiers/upload.ts` : `uploadChantierImage()` (compression `browser-image-compression` 0.5 Mo / 1920 px puis envoi vers le bucket), `getChantierImageUrl()`, `deleteChantierImage()`.
- `src/lib/chantiers/queries.ts` : signatures publiques + admin en **stubs Phase 0**, prêts pour implémentation Phase 1.
- `src/integrations/supabase/types.ts` : types des 3 nouvelles tables ajoutés (Row / Insert / Update / Relationships).

### Tooling

- Script `npm run typecheck` (= `tsc -b --noEmit`) ajouté dans `package.json`.
- `*.tsbuildinfo` ajouté au `.gitignore`.

## 2. Comment tester

### Test 1 — Vérifier que les tables existent côté Supabase

Dans le SQL Editor de Supabase, exécuter :

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('projects', 'project_images', 'project_tags');
```

→ Tu dois voir les 3 lignes.

### Test 2 — Vérifier que le bucket `chantiers` existe

```sql
SELECT id, name, public FROM storage.buckets WHERE id = 'chantiers';
```

→ Tu dois voir `chantiers | chantiers | true`.

### Test 3 — Vérifier que les RLS sont actives

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('projects', 'project_images', 'project_tags');
```

→ `rowsecurity` doit être `true` pour les 3.

### Test 4 — Insertion factice (ne pas commit en DB, c'est juste pour valider)

```sql
INSERT INTO public.projects (slug, title, location, zone, completed_at, summary)
VALUES ('test-phase-0', 'Test Phase 0', 'Court-Saint-Étienne', 'Brabant wallon',
        '2026-04-28', 'Chantier de test à supprimer');
SELECT * FROM public.projects;
DELETE FROM public.projects WHERE slug = 'test-phase-0';
```

→ Doit fonctionner sans erreur. La ligne sera créée puis effacée. À noter : pour insérer/supprimer côté SQL Editor en tant qu'admin, tu peux désactiver temporairement la session RLS si besoin (`SET LOCAL ROLE postgres;`).

### Test 5 — Code front

À la racine du projet :

```bash
npm run typecheck   # 0 erreur attendu
npm run lint        # uniquement les 36 erreurs/warnings PRÉ-EXISTANTS (shadcn, tailwind.config)
npm run build       # build OK
```

→ Aucun changement visible côté front public ni admin (rien n'est encore connecté à ces tables).

## 3. Ce qui vient en Phase 1 — Admin MVP

Une fois la Phase 0 validée, on attaque l'admin :

1. **Sidebar admin** : nouvelle entrée "Réalisations" → page `/admin/chantiers`.
2. **Page liste** `/admin/chantiers` :
   - Table de tous les chantiers (publiés + brouillons + corbeille).
   - Filtres recherche / statut / tag.
   - Bouton "Nouveau chantier".
   - Actions inline : éditer / publier ↔ dépublier / mettre à la corbeille.
3. **Page éditeur** `/admin/chantiers/nouveau` et `/admin/chantiers/:id` :
   - Mode "Chantier rapide" (titre, lieu, date, photos, tags) en 30 secondes.
   - Mode "Chantier complet" (récit markdown, FAQ, durée, budget, avant/après).
   - Upload drag & drop multi-photos avec compression et barre de progression.
   - Slug auto-généré depuis le titre, modifiable, validation unicité.
   - Réordonnage des photos par drag & drop.
4. **Implémentation des `queries.ts`** (les stubs Phase 0 deviennent fonctionnels).

Effort estimé Phase 1 : 8-12h.

## 4. Avant de passer à la Phase 1

- [ ] Confirme que les tests 1 à 3 passent côté Supabase.
- [ ] Donne ton OK explicite pour démarrer la Phase 1.
- [ ] Optionnel : tu peux ouvrir une PR sur `feat/cms-chantiers` pour avoir un déploiement preview Lovable et constater que le site public est inchangé.
