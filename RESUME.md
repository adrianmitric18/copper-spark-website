# Branche `feat/cms-chantiers-phase-2` — Résumé

> Date : 2026-04-28
> Statut : ✅ Prêt à merger (déjà mergée 1 fois, ces commits sont la **suite**)
> Base : `main` (dernier merge = `81a560b`)

Cette branche a déjà été mergée une 1re fois (Phase 2 + dark mode fix). Depuis, **2 nouvelles tâches** ont été ajoutées au-dessus :

1. **Tâche 3** — Redesign éditorial copper-on-dark de `/realisations`
2. **Tâche 4** — Phase 3 : page admin "Import archives" + banner empty state

---

## TÂCHE 3 — Redesign éditorial copper-on-dark

### Justification du design

Le design de la Phase 2 (cards Bootstrap-like sur fond clair) ne matchait pas l'identité du site. J'ai aligné `/realisations` et `/realisations/:slug` sur le **vocabulaire visuel du Hero d'accueil** :

- **Fond `bg-anthracite`** (12% lightness) sur les sections hero et CTA
- **Glow orange `bg-primary/15`** flouté en arrière-plan, comme le hero principal
- **Titre `font-display`** avec partie en `text-gradient-copper`
- **Eyebrow** en `text-copper-light` uppercase, espacement `tracking-[0.25em]`
- **Cards sombres** `bg-anthracite` avec border qui passe en `border-copper/60` au hover, photo qui zoom (`scale-110` en 700ms), overlay tags pill en `bg-copper/90`, flèche d'indication clic qui apparait en haut-droite
- **Body de la page détail** sur fond clair `bg-background` pour la lecture du récit Markdown
- **Filtres** sur fond `bg-cream/50` avec pills custom (pas de Badge shadcn standard) et copper quand actif

Justification couleurs : tous les tokens utilisés (`anthracite`, `anthracite-light`, `copper`, `copper-light`, `copper-dark`, `cream`, `cream-dark`, `gradient-copper`) **existent déjà** dans `src/index.css` et `tailwind.config.ts`. Aucun nouveau token, aucune couleur en dur.

### Fichiers touchés (1 commit)

- `src/components/realisations/ProjectCard.tsx` — refait au look "tableau premium"
- `src/components/realisations/ProjectFilters.tsx` — carte cream/50 + pills copper
- `src/components/realisations/ProjectGrid.tsx` — empty states distincts
- `src/pages/Realisations.tsx` — hero éditorial sombre + grille remontée
- `src/pages/realisations/ChantierDetail.tsx` — hero sombre + body clair + CTA sombre final

Commit : **`070c661 feat(realisations): redesign éditorial copper-on-dark`**

---

## TÂCHE 4 — Phase 3 : Import des archives (98 photos)

### Comment ça marche

Une nouvelle page admin `/admin/chantiers/import-archives` orchestre la migration **côté navigateur**, sous la session admin (donc sans service-role-key Supabase) :

1. Pour chaque catégorie de l'ancien `galleryData.ts` :
   - Crée un chantier "Archives — …" en **brouillon**
   - Pose le tag adéquat (ex : "Rénovation tableau électrique")
   - Pour chaque photo : `fetch` de l'URL Vite → `Blob` → `File` → passe par `uploadChantierImage` (compression auto + Storage) → enregistre dans `project_images` avec `is_cover=true` sur la 1re et `sort_order` respecté
2. À la fin, **publie automatiquement 2 chantiers vitrines** :
   - "Archives — Tableaux et prises"
   - "Archives — Bornes de recharge VE"
3. Les 3 autres restent en brouillon — tu les publies à ton rythme depuis `/admin/chantiers`.

### UX

- Plan d'import affiché AVANT exécution (5 chantiers, nb photos, tag, badge "Publié"/"Brouillon").
- Banner d'avertissement sur les pièges (re-clic après import = échec d'unicité du slug, ne pas quitter pendant l'upload).
- Journal en direct des étapes (✓, ⚠, ★).
- Bouton désactivé pendant l'exécution.
- Toast de succès/erreur final.

### Banner empty state /admin/chantiers

Quand tu n'as encore aucun chantier en DB, la page liste affiche **en haut** une carte bordée primary qui pointe vers `/admin/chantiers/import-archives` avec un CTA "Importer les archives". Disparait dès qu'au moins 1 chantier existe.

### Fichiers (1 commit)

- `src/admin/pages/ImportArchives.tsx` — nouvelle page (341 lignes)
- `src/admin/pages/Chantiers.tsx` — banner empty state
- `src/App.tsx` — route `/admin/chantiers/import-archives`

Commit : **`8eceb67 feat(chantiers): page admin "Importer les archives" + banner empty state`**

---

## ⚠️ Action manuelle requise (1 clic, ~3-5 min)

Le code est livré et fonctionnel, **mais l'import doit être déclenché par toi** (un clic, sous ta session admin) car il s'exécute côté navigateur.

### Procédure post-merge

1. Va sur `/admin/chantiers` → tu verras le banner "Pas encore de chantier publié".
2. Clique sur **"Importer les archives"** (gros bouton primary).
3. Lis le plan, clique sur **"Lancer l'import des 98 photos"**.
4. **Attends 3 à 5 minutes** sans fermer l'onglet (le journal défile).
5. Toast vert "Import archives terminé" → clique "Voir les chantiers importés".
6. Va sur `/realisations` → tu vois 2 chantiers vitrines (Tableaux + Bornes de recharge VE) avec photos.

> Si tu cliques sur "Lancer l'import" 2 fois (par accident ou par re-test), le 2e échouera proprement sur la contrainte d'unicité de slug (`archives-…`). Pour relancer un import propre : supprimer manuellement les chantiers déjà créés depuis `/admin/chantiers`.

---

## 📦 Commits sur cette branche (depuis le précédent merge)

```
8eceb67 feat(chantiers): page admin "Importer les archives" + banner empty state
070c661 feat(realisations): redesign éditorial copper-on-dark
```

2 nouveaux commits atomiques au-dessus du précédent merge `81a560b`.

---

## ✅ Vérifications

| Check | Résultat |
|---|---|
| `npm run typecheck` | 0 erreur |
| `npm run lint` (mes fichiers) | 0 erreur |
| `npm run build` | ✓ built in 19.82s |
| Bundle size | `+170 Ko` env. (galleryData re-bundlé temporairement) |

> Note : le bundle augmente parce que `galleryData.ts` ré-import les 98 photos statiques (Vite les re-bundle pour l'import depuis Storage). Une fois l'import fait, on pourra **vraiment** supprimer `galleryData.ts` (Phase 4) et reperdre ces ~170 Ko.

---

## 🚀 Procédure de merge

```bash
# 1. Tag de sauvegarde
git tag backup-before-phase3-merge-2026-04-28
git push origin --tags

# 2. Merge --no-ff sur main
git checkout main
git merge --no-ff feat/cms-chantiers-phase-2 \
  -m "Merge redesign /realisations + Phase 3 import archives"
git push origin main
```

## 🔄 Procédure de rollback

### Cas 1 — Le redesign ne plaît pas mais Phase 3 OK
```bash
git checkout main
git revert 070c661
git push origin main
```

### Cas 2 — Bug sur l'import archives
```bash
git checkout main
git revert 8eceb67
git push origin main
```

### Cas 3 — Tout péter et revenir à l'état d'avant
```bash
git checkout main
git revert -m 1 <hash-du-commit-de-merge>
git push origin main
```

### Cas 4 — Catastrophe nucléaire
```bash
git checkout main
git reset --hard backup-before-phase3-merge-2026-04-28
git push --force-with-lease origin main
```

### Note DB
Aucune migration SQL ajoutée. Si tu as déjà cliqué sur "Importer", les **5 chantiers en DB et les photos uploadées dans le bucket `chantiers`** restent. Pour les supprimer manuellement après rollback : utilise le SQL Editor de Lovable (`DELETE FROM projects WHERE slug LIKE 'archives-%'` cascade les images, puis `DELETE FROM storage.objects WHERE bucket_id = 'chantiers' AND name LIKE 'archives-%'`).

---

## 🎯 Ce qui reste pour la suite

- **Phase 4** : sitemap dynamique au build, vraie redirection HTTP 301 serveur, suppression définitive de `galleryData.ts` après l'import (gain de ~170 Ko bundle).
- **Phase 5** : Featured chantiers sur Home, drag&drop natif des images, AlertDialog à la place de `window.confirm`.
