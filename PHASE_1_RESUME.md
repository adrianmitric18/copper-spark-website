# Phase 1 — Admin MVP CMS Chantiers

> Branche : `feat/cms-chantiers`
> Date : 2026-04-28
> Statut : ✅ Terminée

## 1. Ce qui a été fait

### Côté admin

- **Sidebar** : nouvelle entrée **"Réalisations"** (icône Hammer) dans un nouveau groupe secondaire, séparé visuellement du groupe principal (Aujourd'hui · Pipeline · Calendrier).
- **Page liste** `/admin/chantiers` : table de tous les chantiers avec recherche, onglets (Tous · Publiés · Brouillons · Corbeille), filtres avancés (tags + zones), colonnes cover / titre / lieu / zone / date / statut / tags / actions.
- **Page éditeur** `/admin/chantiers/nouveau` et `/admin/chantiers/:id` : formulaire react-hook-form + zod, deux sections :
  - **Essentiel** (toujours visible) : titre · slug auto · lieu · zone · date · résumé · tags · photos.
  - **Détails du chantier (optionnel)** (Accordion replié par défaut) : récit Markdown · durée · budget · FAQ · meta SEO.
- **3 composants partagés** dans `src/admin/components/chantiers/` :
  - `TagInput` : autocomplete + multi-sélection en chips.
  - `ImageUploader` : drag & drop multi-photos avec compression et progression.
  - `ImageGalleryEditor` : édition inline (légende, kind, cover, ordre, suppression).

### Côté code

- **`src/lib/chantiers/queries.ts`** : implémentation complète (les stubs Phase 0 sont devenus fonctionnels). Couvre lecture publique, lecture admin avec méta, et toutes les écritures (CRUD chantiers + images + tags + soft delete + restauration intelligente).
- **`src/App.tsx`** : 3 nouvelles routes `/admin/chantiers/*` ajoutées sans toucher aux autres.
- **`src/admin/layout/Sidebar.tsx`** : seul fichier admin existant modifié (conformément à la consigne).
- **`src/integrations/supabase/types.ts`** : intact (mis à jour en Phase 0).

### Sécurité & qualité

- Garde `useAdminGuard()` sur les 2 nouvelles pages, alignée avec le reste de l'admin (redirige `/admin/login` si non authentifié, `/` + toast si non admin).
- Toasts d'erreur avec description Supabase pour toutes les mutations.
- Confirmation `window.confirm` avant action destructive (corbeille).
- Slug auto-généré + débrayable, validation `^[a-z0-9]+(-[a-z0-9]+)*$` côté zod alignée avec le CHECK SQL.
- Restauration intelligente d'un chantier en corbeille : si le slug est repris par un autre chantier actif, suffixage automatique en `-restaure` (puis `-restaure-2`, `-restaure-3`).

## 2. Comment tester (parcours complet, ~10 minutes)

> ⚠️ **Pré-requis** : être connecté avec **`cuivre.electrique@gmail.com`** (la fonction `is_admin()` ne reconnaît que cet email).

### Test 1 — Sidebar et accès

1. Va sur `/admin` (te connecter si besoin).
2. Vérifie qu'une entrée **"Réalisations"** apparaît en bas de la sidebar, après un séparateur, avec une icône marteau.
3. Clique dessus → tu arrives sur `/admin/chantiers` avec une table vide ("Aucun chantier ne correspond aux filtres.").

### Test 2 — Création d'un chantier rapide

1. Clique sur **"Nouveau chantier"** en haut à droite.
2. Remplis uniquement les champs essentiels :
   - Titre : *Test rapide*
   - Lieu : *Court-Saint-Étienne*
   - Zone : *Brabant wallon* (déjà sélectionné)
   - Date : aujourd'hui (déjà sélectionnée)
   - Résumé : *Petit chantier de test pour valider l'admin.*
3. Vérifie que le **slug** se génère automatiquement (`test-rapide`).
4. Ajoute 1 ou 2 tags via le champ "Ajouter un tag…" (sélectionne dans la liste ou tape).
5. Clique sur **"Créer le brouillon"**.
6. Tu devrais être redirigé vers `/admin/chantiers/<id>`. Toast : "Chantier créé".

### Test 3 — Upload de photos

1. Sur la page d'édition que tu viens d'ouvrir, scroll jusqu'à la section **"Photos du chantier"**.
2. Glisse 2-3 photos (ou clique "Choisir des fichiers").
3. La compression et l'upload se font séquentiellement, barre de progression affichée.
4. Les photos apparaissent en grille. La 1re a un badge **"Cover"**.
5. Pour chaque photo, teste : changement de légende (au blur), changement du type (photo/avant/après), définir comme cover (étoile), réordonnage (flèches haut/bas), suppression.

### Test 4 — Détails du chantier

1. Toujours sur la même page, clique sur **"Détails du chantier (optionnel)"** pour déplier.
2. Remplis quelques champs : récit, durée 2 jours, budget *2-5k€*.
3. Ajoute une question FAQ (bouton **"+ Ajouter une question"**).
4. Clique sur **"Enregistrer"** en bas. Toast : "Modifications enregistrées".
5. Recharge la page → tout doit être conservé.

### Test 5 — Publication / dépublication

1. Toujours sur l'édition, clique sur **"Enregistrer et publier"**.
2. Retour sur `/admin/chantiers` → ton chantier apparaît avec le badge **"Publié"** dans l'onglet "Publiés".
3. Clique sur l'œil barré (action "Dépublier") → bascule en "Brouillon".

### Test 6 — Corbeille et restauration

1. Sur la liste, clique sur l'icône poubelle d'un chantier → confirmer.
2. Le chantier disparaît, mais reste visible dans l'onglet **"Corbeille"**.
3. Dans Corbeille, clique sur l'icône restauration (flèche circulaire) → le chantier revient dans la liste active.

### Test 7 — Restauration avec conflit de slug (optionnel)

1. Crée un chantier `test-rapide`.
2. Mets-le à la corbeille.
3. Crée un nouveau chantier qui aura aussi le slug `test-rapide` (l'auto-slug le proposera comme `test-rapide-2`, **modifie-le manuellement** en `test-rapide`).
4. Restaure l'ancien chantier depuis la corbeille → toast affiche : "Slug renommé en `test-rapide-restaure`". ✅

### Test 8 — Vérifs techniques

```bash
npm run typecheck    # 0 erreur
npm run lint         # uniquement les 36 erreurs/warnings PRÉ-EXISTANTS
npm run build        # build OK
```

## 3. Ce qui reste à venir

### Phase 2 — Front public refonte (6-9h estimées)

- Refonte `/realisations` : grille de cards des chantiers publiés + filtres combinables (tags, zone, date).
- Page détail `/realisations/[slug]` avec rendu storytelling (Markdown via `react-markdown`), galerie, FAQ, breadcrumbs.
- Composant `BeforeAfterSlider` (lib `react-compare-image`).
- Redirections 301 des 5 anciennes sous-pages catégories (`/realisations/tableaux-et-prises`, etc.) vers `/realisations` filtré.
- Suppression progressive de `src/data/galleryData.ts` (gardé en backup pendant la transition).

### Phase 3 — Migration des 98 photos existantes (Stratégie C)

- Script de migration auto qui importe les photos comme 3-4 chantiers archives non publiés.
- Tu retraites ensuite à ton rythme.

### Phase 4 — SEO

- Meta dynamiques (extension du hook `SEO.tsx`).
- Schema.org `Project` ou `CreativeWork` par chantier.
- Génération sitemap au build-time via script Node.

### Phase 5 — Polish (optionnel)

- Featured chantiers sur Home.
- Vrai drag&drop d'images (lib `dnd-kit`) si les flèches ne suffisent pas.
- AlertDialog shadcn à la place des `window.confirm`.

## 4. Décisions techniques notables

- **Pas de nouvelle dépendance npm** en Phase 1 (rhf + zod + browser-image-compression déjà présents).
- **Réordonnage photos** : flèches haut/bas plutôt que vrai drag&drop. Suffit pour 10-20 photos par chantier, pas de lib supplémentaire.
- **Cover unique** : géré par index unique partial DB. La fonction `setProjectCover()` fait clear-then-set en 2 étapes pour respecter cette contrainte.
- **Suppression photo** : DB-first (CASCADE) puis Storage best-effort (un échec storage ne bloque pas la suppression DB).
- **Faq côté Supabase** : stocké en `jsonb`, casté `as unknown as ProjectFaqItem[]` côté lecture (cast safe car on contrôle l'écriture).
- **Markdown rendering** : Phase 1 = édition raw seulement, le rendu côté admin et public sera fait en Phase 2.

## 5. Avant de passer à la Phase 2

- [ ] Confirme que les 8 tests passent.
- [ ] Crée 1-2 vrais chantiers (par exemple le chantier vitrine **"4 bornes Hager Witty Pro à Court-Saint-Étienne"**) pour valider l'UX en conditions réelles.
- [ ] Donne ton OK explicite pour démarrer la Phase 2.
- [ ] Optionnel : ouvre la PR sur `feat/cms-chantiers` pour avoir un déploiement preview Lovable.
