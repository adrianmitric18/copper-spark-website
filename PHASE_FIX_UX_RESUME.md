# Phase Fix Bugs + UX Mobile/Desktop — Résumé livrable

**Branche** : `feat/fix-bugs-et-ux-mobile-desktop` (depuis `main` à `8ee9664`)
**Statut** : prêt à valider, pas encore mergé sur `main`

## 📋 Sommaire

1. [Liste des commits](#liste-des-commits)
2. [Chantier 1 — Bug acronymes interventions](#chantier-1--bug-acronymes-interventions)
3. [Chantier 2 — Bug input délai bloque presets](#chantier-2--bug-input-délai-bloque-presets)
4. [Chantier 3 — Améliorations UX mobile + desktop](#chantier-3--améliorations-ux-mobile--desktop)
5. [Aperçus](#aperçus)
6. [Procédure de tests mobile](#procédure-de-tests-mobile-10-tests)
7. [Procédure de tests desktop](#procédure-de-tests-desktop-10-tests)
8. [Procédure de rollback](#procédure-de-rollback)
9. [Notes implémentation](#notes-implémentation)

---

## Liste des commits

10 commits atomiques (le 11e étant ce résumé).

| # | Hash | Catégorie | Sujet |
|---|------|-----------|-------|
| 1 | `d3ec755` | 🐛 Fix bug | fix(messages): templates chantier — casse acronymes via chantierLabel |
| 2 | `17a8ea9` | 🐛 Fix bug | fix(rdv-rapide): input délai d'appel — accepter les presets en saisie libre |
| 3 | `35aa2e8` | 🔧 Cohérence | chore(leads): cohérence encodage mailto fiche lead (Email rapide) |
| 4 | `6dd098e` | 📱 UX mobile | feat(admin): FAB mobile respecte la safe area iOS + focus visible |
| 5 | `c464c77` | 📱 UX mobile | feat(admin): topbar mobile — bouton retour automatique sur sous-pages |
| 6 | `d028fec` | 🖥️ UX dual | feat(admin/aujourdhui): KPIs responsive 2/3/5 cols |
| 7 | `18a63a0` | 📱 UX mobile | feat(admin/intervention-dialog): adaptation très petits écrans (<380px) |
| 8 | `9a00011` | 📱 UX mobile | feat(admin/intervention-card): boutons accessibles 40px+ et reflow mobile |
| 9 | `12714b5` | 📱 UX mobile | feat(admin/interventions-list): UX mobile + filtres sticky |
| 10 | `15c3c9a` | 📱 UX mobile | feat(admin/rdv-rapide): grid Date/Heure sous 380px + safe area bottom |

**Validations** : typecheck OK · lint OK (5 errors + 7 warnings pré-existants, non touchés par mes commits) · build prod OK (~14s).

---

## Chantier 1 — Bug acronymes interventions

### Avant
```
Bonjour Véronique, votre chantier inspection rgie est planifié    ← rgie en min.
votre chantier panneaux pv est planifié                           ← pv en min., abrégé
votre chantier pose borne est planifié                            ← formulation cassée
```

### Après (commit `d3ec755`)
```
Bonjour Véronique, votre chantier inspection RGIE est planifié
votre chantier installation de panneaux photovoltaïques est planifié
votre chantier installation de borne de recharge est planifié
```

### Solution technique
Nouveau champ `chantierLabel` ajouté à `TYPE_CONFIGS` (parallèle au `confirmedLabel` existant pour les RDV), avec une formulation par type qui préserve la casse des acronymes et déroule les abréviations :

| Type | chantierLabel |
|---|---|
| Devis | `RDV pour devis` |
| Visite technique | `visite technique` |
| Dépannage | `dépannage` |
| **Inspection RGIE** | `inspection RGIE` |
| **Installation borne de recharge** | `installation de borne de recharge` |
| **Installation panneaux photovoltaïques** | `installation de panneaux photovoltaïques` |
| Autre | `rendez-vous` |

15 occurrences de `config.shortLabel.toLowerCase()` remplacées par `config.chantierLabel` dans les 3 modes (confirmation × rectification × annulation) sur les 3 supports (SMS / WhatsApp / Email) + email subjects.

Le `confirmedLabel` de Borne aussi mis à jour pour cohérence (`borne` → `borne de recharge`).

> ⚠️ **Note importante** : la branche `feat/fix-acronymes-chantier` poussée précédemment (avant cette session) faisait essentiellement le même fix mais avec une valeur Borne moins complète (`installation de borne` sans `de recharge`). Cette branche-ci la **remplace** — tu peux abandonner et supprimer `feat/fix-acronymes-chantier` après merge.

---

## Chantier 2 — Bug input délai bloque presets

### Diagnostic exact

L'input `<input type="number" min={1} step={5}>` du champ "Délai d'appel" sur `/admin/rdv-rapide` rejetait les valeurs des boutons preset (15, 30, 45, 60) tapées manuellement.

**Cause racine** : avec `min=1` et `step=5`, HTML5 considère valides UNIQUEMENT les valeurs `1, 6, 11, 16, 21, 26, 31, 36, 41, 46, ...` (de la forme `1 + n×5`). Donc 15, 30, 45, 60 sont **invalides** selon HTML5 — le navigateur peut afficher un message d'erreur, refuser la valeur ou la corriger silencieusement vers la plus proche multiple valide.

C'était un piège classique HTML5 où `min` doit être aligné sur `step` (ex: `min=0 step=5` valide 0,5,10,15,20... incluant les presets).

### Fix (commit `17a8ea9`)

```diff
- step={5}
+ step={1}
```

L'utilisateur peut maintenant taper **n'importe quel entier de 1 à 240**, y compris exactement les valeurs des presets. Comportement attendu rétabli.

> 💡 **Note** : seul le champ `delaiAppelMinutes` était affecté. Les autres champs number du formulaire (durée RDV avec `min=15 step=15`) sont OK car `15+n*15` couvre tous les multiples de 15.

---

## Chantier 3 — Améliorations UX mobile + desktop

### Audit synthétique (15 problèmes identifiés, 7 fixés en priorité)

| # | Problème | Fichier | Fixé ? |
|---|---|---|---|
| 1 | Mailto fiche lead non aligné sur RFC 6068 (encodage email) | `LeadDetail.tsx` | ✅ commit 3 |
| 2 | FAB mobile sans safe-area iOS (recouvert par home indicator iPhone 14+) | `RdvRapideFab.tsx` | ✅ commit 4 |
| 3 | Topbar mobile sans bouton retour sur sous-pages | `AdminShell.tsx` | ✅ commit 5 |
| 4 | KPIs Aujourd'hui : 5 cols dès `md` (768px+), illisible sur tablette | `Aujourdhui.tsx` | ✅ commit 6 |
| 5 | InterventionDialog grid 2-col sur tout mobile (écrasé sur iPhone SE) | `InterventionDialog.tsx` | ✅ commit 7 |
| 6 | InterventionCard boutons `size="sm"` ~32px sous WCAG 44px | `InterventionCard.tsx` | ✅ commit 8 |
| 7 | Page Interventions : filtres non sticky, cards sans feedback tap | `Interventions.tsx` | ✅ commit 9 |
| 8 | RdvRapide grid Date/Heure écrasée <380px + bouton submit safe-area | `RdvRapide.tsx` | ✅ commit 10 |
| 9 | Pipeline kanban : tap targets cards à vérifier | `Pipeline.tsx` | ⚠️ noté V2 |
| 10 | ChantierEditor : énorme formulaire, responsive à auditer | `ChantierEditor.tsx` | ⚠️ noté V2 |
| 11 | Rdv.tsx : Pré-existant warning ESLint sur `rdvs ?? []` (deps useMemo) | `Rdv.tsx` | ⚠️ noté V2 |
| 12 | UpcomingRdvCard.tsx : pré-existant `any` ESLint error | `UpcomingRdvCard.tsx` | ⚠️ noté V2 |
| 13 | Aujourdhui : 4 warnings exhaustive-deps (state spreads dans useMemo) | `Aujourdhui.tsx` | ⚠️ noté V2 |
| 14 | CommandPalette : pas de découvrabilité Cmd+K (pas de hint UI) | `CommandPalette.tsx` | ⚠️ noté V2 |
| 15 | Pas de raccourcis clavier desktop (N nouveau RDV, etc.) | divers | ⚠️ noté V2 |

### Top 5 améliorations livrées

#### 1. ⚙️ Topbar mobile intelligente (commit 5)
La topbar mobile détecte automatiquement si tu es sur une **route racine** (Aujourd'hui, Pipeline, Calendrier, RDV rapide, Interventions, Chantiers, Avis) ou une **sous-page** (fiche lead, éditeur chantier...).

- **Route racine** : bouton menu hamburger à gauche (comme avant)
- **Sous-page** : bouton retour ← à gauche + menu en bout de barre

Avant : devais ouvrir le menu pour revenir à une page racine, ou utiliser le swipe back du navigateur (peu fiable). Maintenant : 1 tap retour visible.

Tap targets garantis 44×44px (WCAG AA).

#### 2. 📱 Safe area iOS (commits 4 + 10)
Le FAB et les boutons submit en bas de page utilisent maintenant `env(safe-area-inset-bottom)` pour ne pas être masqués par le home indicator des iPhones 14+ et autres téléphones avec gestures barre.

Concrètement :
- FAB : `bottom: max(1.25rem, env(safe-area-inset-bottom) + 0.75rem)`
- Container RdvRapide : `pb-[max(1rem,env(safe-area-inset-bottom))]`

#### 3. 🖥️ KPIs Aujourd'hui responsive (commit 6)
Avant : `grid-cols-2 md:grid-cols-5` → 5 cards écrasées en 5 colonnes dès 768px (tablette), illisible.

Après : `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5` → progression naturelle :
- **Mobile** (<640px) : 2 cols, 5 cards = 2/2/1 lignes
- **Tablette** (640-1023px) : 3 cols, 5 cards = 3/2 lignes
- **Desktop large** (≥1024px) : 5 cols sur 1 ligne

#### 4. 📐 Dialogs mobile-first (commits 7 + 10)
Les dialogs et formulaires utilisaient des grids 2-col fixes qui écrasaient les inputs date/time sur **iPhone SE** et **Galaxy A** (~360px de viewport). Maintenant `grid-cols-1 [@media(min-width:380px)]:grid-cols-2` : empilage vertical sous 380px, 2 col au-dessus.

#### 5. 🎯 Tap targets et feedback (commits 8 + 9)
- InterventionCard : tous les boutons d'action `min-h-[40px]` avec `flex-1 sm:flex-none` (largeur égale sur mobile, taille naturelle sur desktop).
- Page Interventions : cards avec `min-h-[88px]`, `active:bg-muted/40` (feedback visuel au tap), focus-visible ring (a11y), date/heure stack en colonne sur mobile pour ne pas couper les dates longues comme "lundi 4 mai → mardi 5 mai".
- Filtres temporels : `sticky top-14 md:top-0` pour rester accessibles au scroll mobile, scroll horizontal si plus de filtres que de largeur.

---

## Aperçus

### Aperçu 1 — SMS intervention RGIE après fix bug 1

**Cas Véronique, Inspection RGIE, 4-5 mai 2026, 8h-17h** :

```
🔌 Le Cuivre Électrique
Bonjour Véronique Fauvarque, votre chantier inspection RGIE est planifié :
📅 lundi 4 mai → mardi 5 mai
🕐 8h - 17h chaque jour
📍 Rue X 12, Wavre
Je vous appelle la veille pour finaliser.
🌐 cuivre-electrique.com
Adrian Mitric - 0485 75 52 27
```

✅ "RGIE" en majuscules — fix appliqué.
✅ Pour Borne : "installation de borne de recharge" (plus pose borne)
✅ Pour PV : "installation de panneaux photovoltaïques" (plus panneaux pv)

### Aperçu 2 — Description fix bug 2

Sur `/admin/rdv-rapide`, dans le champ "Délai d'appel avant arrivée" :

| Action | Avant | Après |
|---|---|---|
| Cliquer preset 30 | ✅ valeur = 30 | ✅ valeur = 30 |
| Cliquer preset 45 | ✅ valeur = 45 | ✅ valeur = 45 |
| Effacer + taper "30" dans l'input | ❌ HTML5 rejette | ✅ valeur = 30 |
| Effacer + taper "45" dans l'input | ❌ HTML5 rejette | ✅ valeur = 45 |
| Effacer + taper "44" dans l'input | ✅ valeur = 44 | ✅ valeur = 44 |
| Effacer + taper "20" dans l'input | ✅ valeur = 20 | ✅ valeur = 20 |

Tous les entiers de 1 à 240 sont désormais acceptés (au lieu d'un sous-ensemble bizarre).

### Aperçu 3 — Top 5 améliorations UX

1. **Topbar mobile intelligente** : bouton retour ← auto sur sous-pages
2. **Safe area iOS** : FAB et bouton submit ne sont plus masqués par home indicator
3. **KPIs Aujourd'hui responsive 2/3/5** : lisible sur mobile, tablette et desktop
4. **Dialogs adaptés iPhone SE** : grid 2-col devient 1-col sous 380px
5. **Tap targets 40-44px partout** : conforme WCAG AA mobile, faisable au gant en chantier

---

## Procédure de tests mobile (10 tests)

À faire idéalement sur un **iPhone réel** ou en **DevTools mode mobile** (375×667 iPhone SE et 430×932 iPhone 14 Pro Max minimum).

| # | Test | Résultat attendu |
|---|---|---|
| 1 | Ouvrir `/admin/lead/<id>` sur mobile | Topbar avec bouton retour ← à gauche, menu hamburger à droite |
| 2 | Cliquer le bouton retour ← | Retour à la page précédente (ou Aujourd'hui) |
| 3 | Sur iPhone 14+, scroller jusqu'en bas de `/admin` | Le FAB orange n'est PAS recouvert par la barre de geste système |
| 4 | Ouvrir `/admin` sur mobile | 5 KPIs en grid 2 cols : 2/2/1 lignes |
| 5 | Ouvrir `/admin/rdv-rapide`, créer un RDV avec délai d'appel | Pouvoir taper 30, 45 dans l'input délai (pas que via boutons preset) |
| 6 | Sur `/admin/lead/<id>`, cliquer "Programmer le chantier" | Dialog avec largeur full-width moins petite marge (≠ recouvert) |
| 7 | Dans le dialog, sur viewport 360px (DevTools), regarder Date/Heure | Stacks en colonne (1 par ligne), pas écrasés |
| 8 | Sur `/admin/lead/<id>` avec une intervention créée, regarder la carte | Boutons "Renvoyer / Modifier / Annuler" en flex-1 (largeur égale) |
| 9 | Ouvrir `/admin/interventions` sur mobile | Filtres sticky en haut au scroll, cards avec feedback tap orange clair |
| 10 | Tapper une date longue type "lundi 4 mai → mardi 5 mai" | Pas de coupure ni overflow horizontal — date stack en colonne |

## Procédure de tests desktop (10 tests)

À faire dans un navigateur en **plein écran 1920×1080** ou minimum **1280px**.

| # | Test | Résultat attendu |
|---|---|---|
| 1 | Ouvrir `/admin` sur desktop | KPIs en grid 5 cols sur une ligne, sidebar à gauche |
| 2 | Réduire la fenêtre à ~900px | KPIs basculent en grid 3 cols (3+2 lignes) |
| 3 | Cliquer un KPI "Chantiers" | Navigation vers `/admin/interventions?filter=upcoming` |
| 4 | Sur `/admin/interventions`, cliquer chaque filtre | URL change avec `?filter=...`, compteur reflète la sélection |
| 5 | Ouvrir une fiche lead | Pas de bouton retour topbar (la sidebar suffit sur desktop) |
| 6 | Sur fiche lead, cliquer "Programmer le chantier" | Dialog centré max-w-lg, bien lisible |
| 7 | Dans le dialog, focus tab navigation (clavier) | Focus visible sur chaque champ, accessible Enter/Tab |
| 8 | Cmd+K (Mac) / Ctrl+K (Win) sur n'importe quelle page admin | Command palette s'ouvre |
| 9 | Hover sur une card d'intervention | Border passe à orange clair, ombre légère |
| 10 | Sur `/admin/interventions`, ChevronRight visible à droite des cards | Indicateur cliquable clair |

---

## Procédure de rollback

### Si pas encore mergé sur main (situation actuelle)
Rien à faire. La branche n'affecte pas `main`.

### Si déjà mergé (procédure standard à venir)

```bash
# Tag de sauvegarde avant le merge (à faire AVANT le merge)
git tag -a backup-before-fix-bugs-ux-2026-04-29 -m "Backup avant fix bugs + UX"
git push origin backup-before-fix-bugs-ux-2026-04-29

# Merge --no-ff puis push standard
git merge --no-ff feat/fix-bugs-et-ux-mobile-desktop
git push origin main

# Rollback ultérieur si besoin :
# Option A — Revert (recommandé)
git revert -m 1 <merge-commit-hash>
git push origin main

# Option B — Reset hard (force-push, à éviter)
git reset --hard backup-before-fix-bugs-ux-2026-04-29
git push --force-with-lease origin main
```

### Côté Supabase
**Aucune migration SQL** dans cette phase. Pure UI + bug fixes côté code. Rollback = simple revert du merge.

---

## Notes implémentation

### Conventions appliquées
- Tap targets : minimum 40px sur les boutons d'action interne, 44px sur les éléments principaux (topbar, FAB, primary CTAs).
- Safe area iOS : `env(safe-area-inset-*)` via inline `style` (Tailwind n'a pas d'utility natif `env()` sans plugin).
- Custom breakpoint pour très petits écrans : `[@media(min-width:380px)]:` (Tailwind arbitrary syntax). Plus précis que `sm:` (640px) qui est trop large pour ce cas.
- Focus-visible : `focus-visible:ring-2 ring-primary ring-offset-2` pattern cohérent (a11y).

### Hors-scope (notés mais non fixés)
- **Pipeline** : kanban 4 cols, à auditer pour tablette
- **ChantierEditor** : énorme formulaire, responsive à passer en revue
- **Pré-existants** : 5 errors + 7 warnings ESLint dans `Rdv.tsx`, `UpcomingRdvCard.tsx`, `Aujourdhui.tsx` (logique `?? []` deps useMemo). Pas touché car non lié à cette phase.
- **CommandPalette** : Cmd+K existe mais pas de hint UI pour découvrabilité.
- **Raccourcis clavier desktop** : aucun pour création RDV rapide / intervention.

### Branche obsolète à supprimer
La branche `feat/fix-acronymes-chantier` (poussée pendant la session précédente, jamais mergée) est rendue **obsolète** par cette nouvelle branche qui contient le même fix avec une valeur Borne plus complète. Après merge de `feat/fix-bugs-et-ux-mobile-desktop`, tu peux supprimer la branche obsolète :

```bash
git push origin --delete feat/fix-acronymes-chantier
git branch -D feat/fix-acronymes-chantier
```

---

**Branche prête à merger.** Quand tu auras testé en prod, dis-moi GO et je lance la procédure de merge standard.
