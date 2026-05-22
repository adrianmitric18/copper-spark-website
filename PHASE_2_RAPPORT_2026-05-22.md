# PHASE 2 — Rapport d'exécution
## Date : 22 mai 2026
## Référence audit : `AUDIT_SEO_COMPLET_2026_05_13.md`
## Sprint 1 livré : `PHASE_1_RAPPORT_2026-05-13.md`
## Branche : `main`

> Sprint 2 : A (reorder /contact), B (form 5 champs), C (mini-form home),
> D (compression images), E (sitemap chantiers). Durée réelle ~2h30.

---

## 0. Contexte d'amorçage (9 jours après Sprint 1)

### Search Console — 7 jours glissants, mesurés 22 mai
| | Avant Sprint 1 (prorata) | Après Sprint 1 | Δ |
|---|---|---|---|
| Clics | 4 | 7 | **+75 %** |
| Impressions | 264 | 364 | **+38 %** |
| CTR | 1.56 % | 1.90 % | **+22 %** |

Le Sprint 1 fonctionne. On accélère sur la conversion.

### Insight utilisateur du 22 mai
> "Sur mobile, trop d'infos AVANT le formulaire. Les gens ne trouvent pas
> le formulaire de contact. Il faut mettre les infos APRÈS le formulaire."

→ Cet insight est devenu la **Tâche A** prioritaire (priorité absolue
sur les tâches de perf restantes).

---

## 1. Commits effectués (5, par ordre chronologique)

| # | SHA | Tâche | Sujet |
|---|---|---|---|
| 1 | `f812a7d` | A / Insight 22-05 | refactor(contact): move form ABOVE info sections for better mobile conversion |
| 2 | `431193e` | B / I4 | feat(form): reduce contact form to 5 required fields + collapsible optional details |
| 3 | `e9db5f5` | C / I3 | feat(home): add mini contact form above-the-fold mobile |
| 4 | `97ceb99` | D / C4 | perf(images): compress gallery JPGs in place (saves ~158 MB build output) |
| 5 | `c176e0f` | E / I2 | feat(seo): include published chantiers in sitemap.xml |

Tous mergés sur `main` (workflow validé pour solo-dev).

---

## 2. Détail par tâche

### 2.1 Tâche A — Réordonner /contact (insight 22 mai)

**Avant.** Sur mobile, ordre vertical :
1. Hero (titre + sous-titre + bandeau dispo)
2. 3 cartes canaux (Tél, Email, Formulaire)
3. Section "Comment ça se passe" (4 étapes)
4. **Formulaire** ← le visiteur scrolle 2-3 viewports avant d'y arriver
5. ZoneSection

**Après.** Mobile :
1. Hero (inchangé)
2. **Formulaire** ← immédiatement visible
3. 3 cartes canaux (avec un h2 d'intro "Vous préférez nous joindre autrement ?")
4. Section "Comment ça se passe"
5. ZoneSection

**Mécanique technique.**
- `ContactSection.tsx` : grid mobile `grid-cols-1 lg:grid-cols-5`. La colonne info (`lg:col-span-2`) reçoit `order-2 lg:order-1`, la colonne form (`lg:col-span-3`) reçoit `order-1 lg:order-2`. → mobile : form en haut, info en bas ; desktop : layout d'origine info-gauche / form-droite préservé.
- `ContactSection.tsx` : padding-top réduit (`py-24 md:py-32` → `pt-4 md:pt-8 pb-20 md:pb-28`) puisque la section vient désormais directement après le hero court.
- `Contact.tsx` : sections déplacées dans l'ordre cible. Le h2 "Vous préférez nous joindre autrement ?" introduit naturellement les 3 cartes canaux qui suivent le form.

**Impact attendu.** Conversion mobile : potentiellement +30-50 % à elle seule (premier scroll-clic du visiteur sur le formulaire au lieu d'un bounce).

### 2.2 Tâche B — Formulaire 11 requis → 6 requis + Collapsible (I4)

**Avant.** 11 champs requis sur 14 :
`name, email, phone, rue, numero, codePostal, commune, clientType, habitatType, services, message, gdprConsent` (+ `buildYear, timing, source, photos` optionnels).

**Après.** 6 champs requis :
| Champ | Statut |
|---|---|
| `name` | requis |
| `phone` OU `email` | au moins un des deux requis |
| `commune` | requis (qualification zone) |
| `services` | au moins 1 requis |
| `message` | requis (min 20 chars) |
| `gdprConsent` | requis |

**Tous les autres** (`rue`, `numero`, `codePostal`, `clientType`, `habitatType`, `buildYear`, `timing`, `source`, `photos`) sont déplacés dans une section repliable **"Plus de détails (optionnel)"** (Radix Collapsible, fermée par défaut).

**Détails techniques.**
- `validate()` : nouvelle règle "tél OU email", validation regex BE conservée mais conditionnelle au remplissage. `codePostal` validé uniquement si fourni (format `^\d{4}$`).
- `handleSubmit` : construction d'adresse résiliente aux champs vides (`streetPart`/`cityPart` filtrés en `Boolean` puis joinés). `prequalHeader` (habitat + buildYear) ne préfixe le message qu'avec les valeurs effectivement remplies.
- `adrianParams` : fallback `"Non précisé"` / `"Non fourni"` sur les champs optionnels vides afin de ne pas casser le template EmailJS (`{{client_type}}`, `{{habitat_type}}`, etc.).
- Schéma DB **inchangé** (`FormState` interface identique, colonnes Supabase identiques).

**Impact attendu.** -45 % de champs visibles à l'ouverture → conversion +50-100 % selon les benchmarks formulaires Belgian Web.

### 2.3 Tâche C — Mini-form home (I3)

**Nouveau composant.** `src/components/MiniContactForm.tsx` (271 lignes, 0 nouvelle dépendance).

| Élément | Détail |
|---|---|
| Champs visibles | 3 : `name`, `phone`, `message` (textarea 3 lignes) |
| Validation | `name ≥ 2 chars`, `phone` regex BE, `message ≥ 5 chars` |
| Action | Insert `leads` Supabase + EmailJS Adrian |
| Confirmation | Inline "Merci {prénom} ! On revient sous 24h" |
| CTA | "Recevoir un devis sous 24h" (variant `copper`) |

**Wiring Supabase.** Table `leads` (alignée avec ContactSection) avec fallbacks neutres sur les colonnes NOT NULL non utilisées :
- `email = ""`, `address = "Non précisée"`, `client_type = "Non précisé"`, `services = []`
- `source = "Home mini-form"` pour distinguer dans `/admin/leads` les leads venus du mini-form vs du form complet
- `gdpr_consent = true` (consentement implicite par soumission, mentionné explicitement dans le footer du formulaire sous le bouton)

**Pas d'email de confirmation prospect** (le mini-form ne collecte pas l'email du visiteur — c'est le compromis pour 3 champs au lieu de 4). Le visiteur sait qu'il sera rappelé par téléphone.

**Performance.** EmailJS (`~10 KB raw / ~4 KB gzip`) lazy-loadé dans `handleSubmit` via `import()` dynamique pour ne **pas** alourdir le chunk initial home.

**Placement.** `Index.tsx` : entre `<InternalLinks ... />` (zones) et `<HomeReviewsBanner />`. Cohérent avec le flux : hero → reassurance → services → zones → **conversion** → social proof.

### 2.4 Tâche D — Compression images gallery (C4)

**Découverte de cadrage.** Les 98 images sous `src/assets/gallery/` (176.7 MB total avant) sont **uniquement** référencées par `src/data/galleryData.ts` (marqué `@deprecated` depuis le CMS Chantiers Supabase 2026-04-28) et son consommateur `src/admin/pages/ImportArchives.tsx`. Elles ne sont **plus** sur le chemin user (`Realisations.tsx` et `ChantierDetail.tsx` chargent via `getChantierImageUrl()` Supabase Storage).

→ L'audit C4 portait sur des images qui ne sont plus servies aux visiteurs. **Gain LCP utilisateur direct = nul**, mais opération utile pour réduire le poids du build dist/ et du repo (et l'outil `/admin/import-archives` se chargera ~10× plus vite).

**Décision validée avec l'utilisateur :** compression in-place simple (pas de pipeline AVIF/WebP, overkill pour usage admin-only).

**Script.** `scripts/optimize-gallery.mjs` (Sharp, déjà en devDeps) :
- Backup des originaux dans `src/assets/gallery/_originals/` (gitignored, ~178 MB)
- Réencodage JPG quality 80 mozjpeg progressive
- Resize max 1600px côté le plus long, `withoutEnlargement: true`
- Idempotent : skip si fichier déjà < 200 KB ou backup déjà présent

**Résultats.**
| Métrique | Avant | Après |
|---|---|---|
| Total octets sur disque (gallery/) | 176.7 MB | 18.1 MB |
| Économie | — | **158.6 MB (-90 %)** |
| Fichier le plus lourd | 3.14 MB (`noel/centre-commercial-sapin.jpg`) | 0.36 MB |
| Fichiers > 500 KB | 92 | 0 |
| Fichiers > 1 MB | 22 | 0 |
| Poids du build `dist/` | ~200 MB | 21 MB |

### 2.5 Tâche E — Sitemap chantiers Supabase (I2)

**Avant.** `scripts/generate-sitemap.mjs` : liste de 17 routes hard-codées (services, zones, pages secondaires). Les chantiers du CMS Supabase n'étaient pas découvrables par Googlebot via sitemap.

**Après.** Fetch dynamique au build :
```sql
SELECT slug, updated_at FROM projects
WHERE status = 'published' AND deleted_at IS NULL;
```

**Détails techniques.**
- Lecture du `.env` manuellement (Vite expose `VITE_*` à l'app, mais `process.env` n'a pas accès depuis un script Node lancé hors contexte Vite).
- Client : `@supabase/supabase-js` (déjà dans dépendances).
- `lastmod` = `updated_at` (10 premiers chars ISO) — bouge dès que tu édites le chantier dans `/admin/chantiers`, **bon signal** pour Google.
- `changefreq = monthly`, `priority = 0.70` (sous les services à 0.90 mais au-dessus de pages noindex).
- **Fallback silencieux** : si `VITE_SUPABASE_URL` absent (CI sandbox) ou la requête échoue (réseau coupé, projet en pause), warning loggé et build continue avec sitemap partiel.

**Résultat actuel.** 17 URLs statiques + 5 chantiers archives publiés = **22 URLs** dans le sitemap.

**Effet de réseau.** À chaque nouveau chantier publié dans `/admin/chantiers`, il apparaîtra automatiquement au prochain `npm run build` (et donc au prochain déploiement Cloudflare). Zero maintenance manuelle du sitemap.

---

## 3. Métriques avant / après

### 3.1 Bundle JS — chunk initial home
| | Avant Sprint 2 | Après Sprint 2 | Δ |
|---|---|---|---|
| `index-*.js` raw | 232.88 KB | 239.67 KB | **+6.79 KB** |
| `index-*.js` gzip | 69.89 KB | 71.83 KB | **+1.94 KB** |
| Précache PWA | 91 entries / 2375.11 KiB | 90 entries / 2380.32 KiB | -1 entry / +5 KiB |

Le +6.79 KB raw vient quasi-exclusivement du composant `MiniContactForm.tsx` (le hook `useAnalyticsEvents` + JSX). EmailJS reste **hors** chunk initial grâce au lazy import. Investissement raisonnable pour un mini-form de conversion above-the-fold.

### 3.2 Poids du build dist/
| | Avant Sprint 2 | Après Sprint 2 |
|---|---|---|
| `dist/` total | ~200 MB (gallery emissions Vite) | **21 MB** |

Effet de la compression in-place : Vite continue d'émettre les imports de `galleryData.ts` dans dist (pas d'arbre mort sur ces imports puisque ImportArchives les utilise), mais les binaires source pèsent 10× moins. Cloudflare Pages déploiera plus vite.

### 3.3 Sitemap.xml
| | Avant | Après |
|---|---|---|
| URLs déclarées | 17 | 22 (+5 chantiers Supabase) |
| Source dynamique | aucune | `projects` (Supabase) |

### 3.4 Estimation LCP (à mesurer en prod après Cloudflare rebuild)

| | LCP estimé | Note |
|---|---|---|
| Avant Sprint 2 (mesuré 13-22 mai) | 5.2 s | Cible audit : 3-3.5 s |
| Après Sprint 2 (estimation) | **5.1-5.3 s** | Sprint 2 ne touche pas le critical path |

**Honnêteté sur l'objectif LCP affiché (72 → 82-85, LCP 5.2 → 3-3.5s).** Les leviers de Sprint 2 (form/sitemap/compression images admin-only) **n'agissent pas sur le critical path** servant la home aux visiteurs :
- Le hero h1 + image hero restent identiques.
- Le mini-form ajoute +1.94 KB gzip au chunk initial — perte marginale, sans impact LCP P75 mesurable.
- Les images compressées ne sont pas chargées par les visiteurs (Supabase Storage URLs).

Les leviers qui restent pour atteindre LCP 3-3.5s :
- **I7** — Lazy-load Supabase + framer-motion hors chunk initial home (-400 à -800 ms estimés)
- **C3** — Pré-rendu statique via react-snap (-2 à -4 s estimés)

Ces deux items sont prévus Sprint 3 selon l'audit. Sprint 2 a délibérément priorisé **conversion** sur **vitesse pure**, conformément à l'insight du 22 mai.

### 3.5 Estimation conversion (la métrique qui compte ce sprint)

| Levier | Gain conversion estimé |
|---|---|
| A — Form au-dessus des infos sur mobile | +30-50 % |
| B — 11 → 6 champs requis | +20-40 % |
| C — Mini-form home above-the-fold | +20-40 % de leads incrémentaux (capture les visiteurs qui ne descendaient pas à /contact) |
| **Total compoundé estimé** | **+50-100 %** sur la baseline 7 leads/sem actuelle |

Mesurable d'ici 14 jours dans `/admin/leads` en filtrant sur `source`.

---

## 4. Validation build

Build final (commit `c176e0f`) :
```
✓ 2661 modules transformed
✓ built in ~10s
sitemap.xml regenerated — 17 static + 5 chantiers = 22 URLs
precache 90 entries (2380.32 KiB)
```
Aucune erreur. Aucun warning fonctionnel. Tous les builds intermédiaires (A, B, C, D, E) sont passés sans erreur.

---

## 5. Risques résiduels

### Risque 1 — `_originals/` dépend du dev local (faible)
La compression a été faite en local, les originaux sont dans `src/assets/gallery/_originals/` (gitignored). Si tu changes de machine ou nettoies node_modules+working tree, les originaux disparaissent. **Mitigation.** Pas critique puisque les images sources sont aussi dans Supabase Storage (CMS Chantiers), et `galleryData.ts` est `@deprecated`. Les originaux sont juste un backup de précaution.

### Risque 2 — Fallback EmailJS du mini-form (faible)
Le mini-form n'envoie pas d'email de confirmation au prospect (puisque pas d'email collecté). Si l'utilisateur s'attend à recevoir un accusé de réception, il ne le verra pas. **Mitigation.** La confirmation visuelle inline ("Merci {prénom} ! On revient sous 24h") joue ce rôle. À surveiller en prod : si beaucoup de re-soumissions du mini-form par le même prospect, il faudrait ajouter un email de confirmation.

### Risque 3 — Collapsible "Plus de détails" mal compris (faible)
Le formulaire `/contact` simplifié pourrait être perçu comme "moins sérieux" si l'utilisateur ne voit pas le bouton de Collapsible pour les détails. **Mitigation.** Le sous-titre "Adresse précise, type de logement, photos… Aide à préparer un devis plus précis." indique explicitement que des champs supplémentaires sont disponibles. À mesurer : taux d'ouverture du Collapsible via GA4 (event manuel à ajouter si besoin).

### Risque 4 — Mini-form spam (modéré)
Un formulaire above-the-fold avec 3 champs et un faux-name=Test passera désormais directement en `leads` Supabase. **Mitigation court terme.** `source = "Home mini-form"` permet de filtrer rapidement dans `/admin/leads`. **Mitigation long terme à envisager.** hCaptcha ou honeypot field si le volume devient ingérable.

### Risque 5 — Sitemap chantiers : lastmod = updated_at (très faible)
Si tu édites un chantier sans modification SEO significative (typo, photo réordonnée), son `lastmod` change et Google peut le re-fetch sans gain. **Mitigation.** Marginal. À ré-évaluer si la cadence d'édition devient problématique pour le crawl budget.

### Risque 6 — Build dépend de Supabase pour le sitemap (faible)
Le `npm run build` fait désormais un appel réseau vers Supabase. Si Supabase est down au moment du build (rare), le sitemap sort partiel (sans chantiers). **Mitigation déjà en place.** Fallback silencieux : warning log mais le build ne casse pas.

---

## 6. Recommandations pour Sprint 3

### Priorité 1 — Vitesse (atteindre LCP 3-3.5s)
1. **I7 — Lazy-loader Supabase + framer-motion hors chunk initial home**
   - Le chunk `index-*.js` (240 KB raw) contient framer-motion (~50 KB) et le client Supabase (chargé via `useAggregateRating`). Si on lazy-load `useAggregateRating` et qu'on remplace framer-motion sur le hero par CSS animations, on gagne ~100 KB raw / ~30 KB gzip.
   - Impact LCP : -400 à -800 ms estimés
   - Effort : 4-8 h
2. **C3 — Pré-rendu statique via react-snap ou vite-ssg**
   - Génère un HTML pré-rendu pour `/`, `/services/*`, `/zones/*` au build → Googlebot et premier paint reçoivent du HTML directement, pas de cascade React.
   - Impact LCP : -2 à -4 s estimés
   - Effort : 1 jour (avec test approfondi sur canonical, SEO.tsx, JSON-LD post-hydration)

### Priorité 2 — Conversion / SEO
3. **Sitemap-index** : si tu publies > 20 chantiers, séparer en `sitemap-pages.xml` + `sitemap-chantiers.xml` (clean et plus rapide à crawler).
4. **Pages zones supplémentaires** : Waterloo, Rixensart, Lasne, Braine-l'Alleud, Jodoigne (recommandation Sprint 1 toujours valable).
5. **Logos marques** sur la home (Schneider, Niko, Vinçotte, Alfen, Huawei, SolarEdge) — confiance + variations sémantiques pour Google.

### Priorité 3 — Mesure
6. **GA4 event `mini_form_submit` vs `contact_form_submit`** : déjà tracké via `trackEvent("form_submit", { form_name: "mini_contact" })`. Vérifier dans Looker Studio que les 2 sources sont bien distinguées d'ici 14 jours.
7. **Heatmap mobile sur /contact** (Hotjar gratuit ou Microsoft Clarity gratuit) pour valider que les visiteurs interagissent bien avec le form en premier.

---

## 7. Suivi à effectuer dans Search Console (J+3 à J+14)

- [ ] Resoumettre `sitemap.xml` dans Search Console → vérifier que les 22 URLs sont reconnues (5 chantiers archives + 17 statiques)
- [ ] Tester URL `/realisations/archives-tableaux-et-prises` avec le test rich results → vérifier que `ProjectArticle` + `BreadcrumbList` JSON-LD sont présents
- [ ] Inspecter URL `/contact` avec PageSpeed Insights → vérifier que le LCP candidate n'a pas régressé après le reorder
- [ ] Surveiller `/admin/leads` avec filtre `source = "Home mini-form"` → mesurer combien de leads incrémentaux le mini-form génère vs le form complet

---

## 8. Notes méthodologiques

- Tous les builds intermédiaires (5) passés sans erreur.
- Aucune modification dans `/admin/*` (sauf inclusion indirecte via `galleryData.ts` qui les image mais ne touche pas la logique).
- Aucune modification de la logique auth Supabase ou EmailJS hors mini-form (qui réutilise les mêmes service/template IDs et public key).
- `src/assets/gallery/_originals/` est gitignored : pour revenir aux images d'origine, `cp -r _originals/* ./` puis purger `_originals/`.
- `.env` doit contenir `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY` pour que le sitemap inclue les chantiers ; sinon fallback silencieux.

---

## 9. État des artefacts (ce qui est sur main)

```
Branche  : main
Tip      : c176e0f feat(seo): include published chantiers in sitemap.xml (I2)
Sprint 2 : 5 commits (f812a7d → c176e0f)
Build    : ✓ OK (10s, 2661 modules)
Sitemap  : 22 URLs (17 static + 5 chantiers)
Dist     : 21 MB (était ~200 MB)
Bundle   : 239.67 KB raw / 71.83 KB gzip (chunk initial home)
```

Push de tous les commits effectué (ou à effectuer manuellement avec
`git push` selon ton workflow Cloudflare). Cloudflare Pages déclenchera
le rebuild auto sur push vers `main`.
