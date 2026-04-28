# Branche `feat/cms-chantiers-phase-2` — Résumé

> Date : 2026-04-28
> Statut : ✅ Prêt à merger
> Base : `main` (Phase 1 déjà mergée)

Cette branche contient **2 tâches indépendantes** que tu peux tester séparément :

1. **Tâche 1** — Fix dark mode admin (texte blanc sur fond blanc)
2. **Tâche 2** — Phase 2 du CMS Chantiers (refonte front public `/realisations`)

---

## TÂCHE 1 — Fix dark mode admin

### Le bug
Dans `src/index.css`, la section `.dark` était cassée : toutes les surfaces (cards, popovers, sidebar, secondary, muted, accent) avaient gardé des **couleurs claires** (90-100% lightness) alors qu'on est en mode sombre. Résultat : sur la sidebar, les cards, les dropdowns, les badges secondaires, le texte clair (`text-foreground` à 98%) tombait sur des fonds clairs (`bg-card` à 100%) → invisible.

### Le fix (1 commit)

**`fix(admin): refait les variables CSS dark mode (texte blanc sur fond blanc)`**

J'ai réécrit complètement la palette `.dark` avec une logique cohérente :

| Token | Avant | Après |
|---|---|---|
| `--card` | 100% (blanc) | 12% (sombre) |
| `--popover` | 98% | 14% |
| `--sidebar` | 98% | 10% |
| `--secondary` | 92% | 16% |
| `--muted` | 88% | 16% |
| `--muted-foreground` | 40% (illisible) | 65% |
| `--accent` | teinte claire | copper sombre |
| `--border` | 88% | 20% |
| Shadows | opacité 0.05-0.1 | 0.4-0.6 |

Le mode clair (`:root`) **n'est PAS modifié**. L'identité copper (`--primary`, `--ring`) reste identique entre les modes.

### Comment tester
1. Va sur `/admin` (n'importe quelle page).
2. Bouton "Sombre" en bas de la sidebar (lune) → vérifie que :
   - La sidebar est sombre, le texte clair lisible.
   - Les cards (Aujourd'hui, Pipeline, Calendrier, Avis, Réalisations) ont un fond sombre.
   - Les dropdowns (Select, autocomplete tags) sont sombres.
   - Les badges, inputs, bordures ont un contraste correct.
3. Repasse en mode clair → tout doit être identique à avant.

---

## TÂCHE 2 — Phase 2 CMS Chantiers (front public)

### Ce qui a été fait

**Composants partagés** (`src/components/realisations/`) :
- `ProjectCard` — card de la grille (cover ou 1re image en fallback, tags, lieu, date)
- `ProjectFilters` — recherche + multi-select tags + zones + reset
- `ProjectGrid` — orchestration : URL params, React Query staleTime 60s, états loading/empty/error
- `ProjectStory` — rendu Markdown avec `react-markdown` + `remark-gfm`
- `BeforeAfterSlider` — slider Avant/Après avec `react-compare-image`
- `ProjectFAQ` — accordéon shadcn sur les questions FAQ du chantier
- `ProjectGallery` — grille carrée + lightbox plein écran (Esc, ←, →)

**Pages publiques** :
- `/realisations` — refonte : grille filtrable depuis URL (`?q=&tag=&zone=`), tri `completed_at` DESC, hero + intro
- `/realisations/:slug` — nouvelle page détail avec storytelling : tags, hero (lieu/date/durée/budget), cover, récit Markdown, slider avant/après, galerie, FAQ, CTA contact

**Backend & SEO** :
- `fetchPublishedProjectsWithMeta()` dans `queries.ts` — charge projets + tags + cover + fallbackImage en 3 round-trips
- `StructuredData` étendu avec un type `ProjectArticle` qui émet du Schema.org `Article` (headline, description, image, datePublished, contentLocation, keywords)
- Meta SEO dynamiques par chantier (`title`, `description`, `canonical`, `og:image`)
- Schema.org `BreadcrumbList` + `Article` + `FAQPage` (conditionnel) sur la page chantier

**Routes & redirections** :
- 5 redirections client-side (`<Navigate replace>`) des anciennes URLs catégories vers `/realisations?tag=X` :
  | Ancienne URL | Nouveau filtre |
  |---|---|
  | `/realisations/tableaux-et-prises` | tag "Rénovation tableau électrique" |
  | `/realisations/ambiances-lumineuses` | tag "Éclairage LED" |
  | `/realisations/installation-reseaux` | tag "Réseau / VDI" |
  | `/realisations/decoration-de-noel` | tag "Décoration de Noël" |
  | `/realisations/bornes-de-recharge` | tag "Bornes de recharge VE" |

**Nettoyage** :
- Suppression de 7 fichiers devenus morts (les 5 anciennes pages catégories + `GallerySection.tsx` + `CategoryGallery.tsx`).
- `src/data/galleryData.ts` conservé mais marqué `@deprecated` (sera supprimé en Phase 3 après migration des photos vers Storage).
- Tag **"Décoration de Noël"** ajouté à la liste fixe `CHANTIER_TAGS`.

**Dépendances ajoutées** (3) :
- `react-markdown` 10.x
- `remark-gfm` 4.x
- `react-compare-image` 3.x

### Comment tester

> ⚠️ Tu as besoin d'au moins 1 chantier publié en DB pour bien tester. Si tu n'en as pas encore, va d'abord sur `/admin/chantiers/nouveau`, crée-en un, ajoute 2-3 photos (dont au moins 1 paire `before` + `after`), publie-le. Puis :

1. **Grille** : `/realisations`
   - Tu vois ton chantier publié en card.
   - Filtre par tag : clique un badge tag en haut → l'URL devient `?tag=...`, la grille se filtre.
   - Filtre par zone : pareil avec un badge zone.
   - Recherche : tape un bout du titre.
   - Bouton "Réinitialiser" : remet tout à zéro.

2. **Page détail** : `/realisations/<slug-de-ton-chantier>`
   - Hero : titre + summary + lieu + date + durée + budget (si remplis).
   - Cover en grand.
   - Récit Markdown (si tu en as écrit un).
   - Slider Avant/Après (si tu as marqué au moins 1 paire `before`/`after`).
   - Galerie photos avec lightbox au clic (← → Esc fonctionnent).
   - FAQ accordéon (si tu en as ajouté).
   - CTA "Demander un devis" + "Toutes les réalisations".

3. **Redirections 301** : visite chacune des 5 anciennes URLs :
   - `/realisations/tableaux-et-prises`
   - `/realisations/ambiances-lumineuses`
   - `/realisations/installation-reseaux`
   - `/realisations/decoration-de-noel`
   - `/realisations/bornes-de-recharge`
   → Tu dois être redirigé instantanément vers `/realisations?tag=...` correspondant.

4. **SEO** : sur la page détail d'un chantier, ouvre les DevTools, onglet Elements, regarde le `<head>` :
   - `<title>` correspond au chantier.
   - `<meta name="description">` correspond.
   - `<link rel="canonical">` pointe vers la bonne URL.
   - 3 `<script type="application/ld+json">` présents (BreadcrumbList, Article, et FAQPage si FAQ).

5. **Tests techniques** :
   ```bash
   npm run typecheck     # 0 erreur
   npm run lint          # 35 erreurs/warnings PRÉ-EXISTANTS (1 de moins qu'avant car suppression de code)
   npm run build         # OK
   ```

---

## 📦 Commits sur cette branche

```
a82cd1e feat(chantiers): redirections 301 anciennes catégories + nettoyage code mort
44b1b90 feat(chantiers): refonte page /realisations + nouvelle page /realisations/:slug
622e636 feat(chantiers): 7 composants front public realisations/*
b300441 feat(seo): type "ProjectArticle" dans StructuredData
c1b5d5f feat(chantiers): fetchPublishedProjectsWithMeta pour la grille publique
721f737 chore(deps): installe react-markdown + remark-gfm + react-compare-image
a4da6a2 feat(chantiers): ajoute tag "Décoration de Noël" + déprécie galleryData
0ad0fed fix(admin): refait les variables CSS dark mode (texte blanc sur fond blanc)
```

8 commits atomiques. Le 1er (le plus bas) est la Tâche 1, les 7 suivants sont la Tâche 2.

---

## 🚀 Comment merger

Quand tu valides, je peux faire le merge de la même façon que la Phase 1 :

```bash
# 1. Tag de sauvegarde sur main avant le merge
git tag backup-before-cms-phase-2-merge-2026-04-28
git push origin --tags

# 2. Merge --no-ff sur main
git checkout main
git merge --no-ff feat/cms-chantiers-phase-2 \
  -m "Merge Phase 2 CMS Chantiers + fix dark mode admin"
git push origin main
```

Dis simplement **"OK merge"** et je l'exécute.

---

## 🔄 Procédure de rollback

Si un problème apparaît en prod après le merge, **2 options** comme pour la Phase 1 :

### Option A — Revert (recommandée, propre)
```bash
git checkout main
git revert -m 1 <hash-du-commit-de-merge>
git push origin main
```
Lovable redéploie l'état d'avant. Historique préservé.

### Option B — Hard reset (radicale)
```bash
git checkout main
git reset --hard backup-before-cms-phase-2-merge-2026-04-28
git push --force-with-lease origin main
```
⚠️ Réécrit l'historique distant.

### Cas spécifique : rollback de la Tâche 1 uniquement
Si seul le dark mode pose problème, tu peux revert juste ce commit :
```bash
git checkout main
git revert 0ad0fed   # le commit du fix dark mode
git push origin main
```
Cela laisse la Phase 2 en place mais restaure les anciens tokens dark.

### Cas spécifique : rollback de la Tâche 2 uniquement
Plus complexe (8 commits liés). Le plus simple est de revert le merge entier (option A) puis de cherry-pick le commit dark mode :
```bash
git revert -m 1 <hash-merge>
git cherry-pick 0ad0fed
git push origin main
```

---

## ⚠️ Points d'attention

- **Redirections "301" sont en réalité du client-side** (`<Navigate>` React Router). Pour Google c'est OK car Googlebot exécute le JS, mais pas un vrai HTTP 301. Si tu veux un vrai 301 serveur plus tard, il faudra ajouter un fichier de redirections via Lovable (équivalent `_redirects` Netlify ou `vercel.json`). Phase 4 SEO le fera si besoin.
- **Les chantiers brouillons et la corbeille restent invisibles côté public** grâce aux RLS Supabase + filtres applicatifs. Aucun risque de fuite.
- **Cover de fallback** : si tu oublies de marquer une cover dans l'admin, on prend automatiquement la 1re image (sort_order le plus bas). Tu n'as donc jamais de placeholder gris si le chantier a au moins 1 photo.

---

## 🎯 Ce qui reste pour la suite

- **Phase 3** : script de migration des 98 photos `src/assets/gallery/*` vers Supabase Storage en chantiers archives.
- **Phase 4** : sitemap dynamique au build, vrai 301 serveur si besoin, schema.org enrichi.
- **Phase 5** : featured chantiers sur Home, drag&drop natif des images, AlertDialog à la place de `window.confirm`.
