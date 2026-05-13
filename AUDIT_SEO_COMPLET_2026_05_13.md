# AUDIT SEO COMPLET — cuivre-electrique.com
## Date : 13 mai 2026
## Auditeur : Claude Code

> Audit en lecture seule du dépôt copper-spark-website @ commit `e3e025c` (branche `main`).
> Toutes les mesures viennent du code, du `npm run build` exécuté pendant l'audit et des
> fichiers `public/`. Quand un chiffre dépend du runtime (LCP réel, indexation), c'est noté.

---

## 🎯 SYNTHÈSE EXÉCUTIVE

**Score global : 48/100** — Le site est techniquement propre côté SEO de base (sitemap, JSON-LD, canonical fixé), mais il est plombé par **trois problèmes majeurs** qui expliquent à la fois la chute d'indexation, le LCP catastrophique (P75 6,7 s) et l'absence de leads malgré 21 avis Google.

### Top 3 problèmes par impact

1. **🚨 La home page n'a AUCUN contenu SEO** — pas de section services, pas de section zones, pas de liens internes vers les pages locales. Le crawler arrive sur `/` et trouve : un slogan, 4 icônes, 3 chiffres, un bandeau d'avis. C'est tout. Avec un site React CSR (SPA, pas de SSR), la home est de facto une coquille vide pour Googlebot et pour les visiteurs qui scrollent au-dessus de la fold.
2. **🚨 Robots.txt structurellement cassé pour Googlebot** — le bloc `User-agent: Googlebot` ne contient QUE `Allow: /` et `Crawl-delay: 1`. Comme un bloc UA-spécifique override le `User-agent: *`, **Googlebot n'hérite PAS des `Disallow` de la fin du fichier**. Résultat : Google peut crawler `/admin`, `/admin/avis`, `/merci`, `/src/`, etc. C'est très probablement le « 1 erreur » de PageSpeed et ça explique en partie les "Autre page avec balise canonique correcte" (Google indexe des pages techniques).
3. **🚨 LCP fracassé par 22 images > 1 MB dans le build** — `dist/assets/` contient 22 JPG de 1 à 3 MB chacun (gallery non optimisée). Le PWA service worker les pré-cache (`precache 93 entries (2376 KiB)`), ce qui mange la bande passante au premier visit. Pour la home spécifiquement, le hero est OK (AVIF/WebP via vite-imagetools), mais la `motion.p` à `delay: 1.0s` et 9 spans animés en cascade retardent le marqueur LCP visible.

### Top 3 quick wins (< 30 min chacun)

1. **Réparer robots.txt** : déplacer les `Disallow:` dans CHAQUE bloc UA, ou supprimer les blocs Googlebot/Bingbot et n'avoir qu'un bloc `User-agent: *` global. **15 min, impact ★★★★★**.
2. **Ajouter `<ServicesSection />`, `<ZoneSection />` et `<InternalLinks />` à `Index.tsx`** entre `<ReassuranceSection />` et `<HomeReviewsBanner />`. Les composants existent déjà, ils ne sont juste pas branchés sur la home. **10 min, impact ★★★★★**.
3. **Compresser les 22 grosses images gallery** (`src/assets/gallery/*.jpg` et fichiers dérivés) à 200-400 KB chacune via Sharp. Sharp est déjà en devDep. **25 min, impact ★★★★** sur LCP des pages /realisations et /admin.

---

## 📊 SCORES PAR SECTION

| Section | Score | Verdict |
|---|---|---|
| Performance | 35/100 | 🔴 LCP bloquant, gallery non optimisée, 4 fonts au lieu de 2 |
| SEO Technique | 55/100 | 🟡 sitemap propre, JSON-LD riche, MAIS robots.txt cassé et site 100% CSR |
| Contenu SEO | 50/100 | 🟡 zones bien écrites (~850 mots/page), MAIS home vide et services non maillés depuis home |
| Conversion | 50/100 | 🟡 sticky bar mobile OK, mais formulaire 14 champs et hero sans formulaire visible |

---

## 🔴 PROBLÈMES CRITIQUES (action immédiate)

### C1. Home page sans contenu SEO

**Le problème.** `src/pages/Index.tsx` rend uniquement :
```
<HeroSection />            // titre + 1 phrase + CTA
<ReassuranceSection />     // 4 icônes (RGIE, propreté, devis, réactivité) + bandeau TVA 6%
<KeyFiguresSection />      // 3 chiffres (20+ chantiers, 24h réponse, 4.94/5)
<HomeReviewsBanner />      // bandeau "voir les avis"
```
`ServicesSection.tsx` existe (200 lignes, 5 services listés) mais n'est **pas importée** sur la home. Idem `ZoneSection.tsx` (12 communes) et `InternalLinks.tsx`. Vérifié par grep : ces composants sont utilisés sur `/contact`, `/services` et dans les layouts zones/services, mais jamais sur `/`.

**Pourquoi c'est critique.**
- Googlebot crawle `/` et y trouve ~80 mots utiles. C'est trop peu pour ranker sur "électricien Brabant wallon" ou même "électricien Court-Saint-Étienne" (concurrence locale = 200+ mots minimum).
- Aucun lien interne depuis `/` vers les 5 pages zones. Le PageRank interne de la home ne se transmet pas aux pages locales → elles restent à la position 30-56.
- L'utilisateur qui arrive sur la home ne voit nulle part la liste des prestations. Il doit cliquer "Services" dans le menu, ce qui ajoute une friction et casse l'analytics funnel.

**Action.** Importer et insérer dans `Index.tsx` :
```tsx
import ServicesSection from "@/components/ServicesSection";
import ZoneSection from "@/components/ZoneSection";
import InternalLinks from "@/components/InternalLinks";

// dans <main>, après <ReassuranceSection /> :
<ServicesSection />
<ZoneSection />
<InternalLinks mode="zones" title="Nos zones d'intervention" intro="..." />
```

**Effort.** 10 min de code + 5 min de QA visuel.

---

### C2. Robots.txt — Googlebot autorisé à crawler /admin

**Le problème.** Le fichier `public/robots.txt` :
```
User-agent: Googlebot
Allow: /
Crawl-delay: 1            # ← ignoré par Google mais peut déclencher un warning Lighthouse

User-agent: Bingbot
Allow: /
Crawl-delay: 2

User-agent: *
Allow: /
Disallow: /merci
Disallow: /admin
Disallow: /admin/
...
```

Selon la spec REP (RFC 9309) et l'implémentation Google, **le bloc le plus spécifique gagne** : Googlebot voit son propre bloc et ignore complètement `User-agent: *`. Donc les 7 lignes `Disallow:` ne s'appliquent qu'aux UA non listés, pas à Googlebot.

**Pourquoi c'est critique.**
- Google peut indexer `/admin`, `/admin/avis`, `/merci`, etc. Le header HTTP `X-Robots-Tag: noindex, nofollow` (servi par `public/_headers` sur `/admin/*`) protège l'indexation finale, MAIS Google les crawle quand même → budget de crawl gaspillé, et probable cause des « 2 pages : Autre page avec balise canonique correcte » signalées par Search Console.
- Le `Crawl-delay: 1` sur Googlebot est ignoré par Google et signalé comme directive non supportée par certains validateurs — vraisemblablement le « 1 erreur » de PageSpeed.

**Action.** Supprimer les blocs `Googlebot` et `Bingbot` spécifiques (ils ajoutent seulement `Crawl-delay` non supporté), garder un seul bloc `User-agent: *` avec tous les `Disallow`. Le `Sitemap:` reste en haut.

```
# robots.txt — Le Cuivre Électrique
Sitemap: https://cuivre-electrique.com/sitemap.xml

User-agent: *
Allow: /
Disallow: /merci
Disallow: /admin
Disallow: /admin/
Disallow: /src/
Disallow: /supabase/
Disallow: /*.json$
```

**Effort.** 5 min + test sur https://www.google.com/webmasters/tools/robots-testing-tool

---

### C3. Site 100% CSR (React Router) — Googlebot reçoit du HTML vide

**Le problème.** L'app est une SPA Vite + React 18 sans SSR ni SSG. Le commentaire dans `index.html` lignes 22-24 confirme :
> « Bug fixé le 2026-05-01 : avant ce script, Googlebot recevait le même HTML brut pour toutes les routes (CSR pure) sans canonical, et consolidait tout sur la home. »

Le fix de mai pose bien le canonical synchronement avant React, MAIS le contenu (h1, p, schemas) reste injecté par React après l'hydratation. Googlebot moderne sait exécuter JS, mais :
- Le rendu JS est **différé** dans le crawl (2-3 semaines de délai par rapport au crawl HTML brut).
- Les pages zones et services dépendent de `<SEO />` (`src/components/SEO.tsx`) qui injecte le title/description via `useEffect` après hydratation.
- Le JSON-LD `LocalBusiness` est injecté par `<StructuredData />` après hydratation, et inclut `aggregateRating` qui dépend d'un fetch Supabase asynchrone. Tant que la requête Supabase n'a pas répondu, le JSON-LD est rendu **sans** aggregateRating.

**Pourquoi c'est critique.**
- Explique probablement les 12 pages perdues entre 18/04 et 12/05 : pendant la migration Supabase (commit `60e9acd`), si Supabase répondait en erreur, le JSON-LD était incomplet et Google a pu drop les rich results.
- Explique le LCP P75 à 6,7 s : Googlebot voit `<div id="root"></div>` puis attend l'hydratation.
- Les positions 30-56 des pages zones sont cohérentes avec un site CSR mal indexé.

**Action.** Trois options par ordre d'effort croissant :
1. **Pré-rendu statique** via `vite-plugin-prerender-spa` ou `react-snap` — génère du HTML statique au build pour les 17 routes du sitemap. Effort : 1 jour. Impact massif.
2. **Migration vers Next.js ou Astro** avec SSG. Effort : 1 semaine.
3. **Minimum vital** : enrichir le `<noscript>` de `index.html` (qui est déjà bien fait) + ajouter dans le HTML statique des routes les titles/descriptions hardcodés via un build hook. Effort : 1/2 jour.

**Effort recommandé.** Option 1 (react-snap) — high ROI sur un site de 17 pages.

---

### C4. Images gallery non optimisées (22 fichiers > 1 MB dans le build)

**Le problème.** `npm run build` produit dans `dist/assets/` :

| Fichier (extrait) | Taille |
|---|---|
| `sapin-geant-*.jpg` | 3 022 KB |
| `decor-vitrine-*.jpg` | 3 081 KB |
| `centre-commercial-sapin-*.jpg` | 3 144 KB |
| `etoiles-plafond-*.jpg` | 2 915 KB |
| 18 autres JPG | 1 000-2 900 KB chacun |
| **Total ~22 fichiers > 1 MB** | **~38 MB cumulés** |

Ces images viennent de `src/assets/gallery/**/*.jpg` (importées par `Realisations.tsx` / `ChantierDetail.tsx`) et passent par vite-imagetools UNIQUEMENT si elles sont importées avec le query `?w=...&format=avif;webp;jpg&as=picture` comme le hero. Or les imports gallery semblent ne pas utiliser cette syntaxe — le build les recopie telles quelles.

De plus, le PWA service worker précache `93 entries (2376.03 KiB)` au premier visit, ce qui mange immédiatement 2,4 MB de bande passante mobile.

**Pourquoi c'est critique.**
- Page `/realisations` : LCP probablement >10 s sur 4G. Une page-clé pour la conversion (preuves sociales).
- Page chantier détail (`/realisations/[slug]`) : même problème, multiplié par 5-10 photos par chantier.
- Impact indirect sur la home : si Cloudflare CDN sert ces fichiers à partir de la même origine, les connexions HTTP/2 sont saturées.

**Action.**
1. Migrer tous les imports gallery vers vite-imagetools : `import img from "@/assets/gallery/foo.jpg?w=480;800;1280&format=avif;webp;jpg&as=picture"`.
2. Ou pré-traiter avec Sharp (déjà en devDep) : créer `scripts/optimize-gallery.mjs` qui réduit à 1600px max width, qualité 80, AVIF + WebP + JPG fallback. Garder les originaux dans un sous-dossier `_originals/` ignoré du build.
3. Pour les chantiers en BDD Supabase, vérifier que `getChantierImageUrl()` sert des images redimensionnées par Supabase Image Transformations.

**Effort.** 1-2 h pour migrer les imports + run Sharp.

---

### C5. Hero : LCP retardé par `motion.p` à `delay: 1s` et 9 spans en cascade

**Le problème.** `src/components/HeroSection.tsx` :
- L 165-176 : `<motion.p>` avec `transition={{ duration: 0.6, delay: 1 }}` pour la phrase « Basé à Court-Saint-Étienne » qui passe de `opacity: 0` à `opacity: 1` à t=1000ms.
- L 129-160 : le `<h1>` est découpé en 7 spans (`titleWords` + `subtitleWords`), chacun avec `initial={{ opacity: 0, y: 50, rotateX: -90 }}` et un delay en cascade jusqu'à `0.5 + 4*0.12 = 0.98s`. Le dernier mot apparaît à ~1 s.
- L 201-209 : CTA « Demander un devis gratuit » avec `delay: 1.2`.
- L 250-256 : indicateur scroll avec `delay: 1.5`.

Le hero affiche donc son contenu textuel principal entre t=200ms et t=1500ms. Pendant ce temps, le LCP candidat est probablement le `<picture>` du hero (image optimisée AVIF, ~28 KB) — c'est OK — MAIS les CWV Core Web Vitals incluent aussi le `largest text block` qui est le `<h1>`. Le h1 est mesuré quand toutes ses parties sont visibles à 100% opacity → vers 1 s minimum.

Côté CSS bundle aussi : `dist/assets/animations-vDNsHnNi.js` = 121 KB (gzip 39 KB) — framer-motion est chargé sur TOUTES les pages, y compris quand il n'y a rien à animer.

**Pourquoi c'est critique.**
- Sur mobile 4G médian, Time to Interactive monte facilement à 4-5 s à cause du parsing framer-motion + supabase + router + index = ~870 KB raw / 200 KB gzip.
- Les `useMotionValue` + `useSpring` + `useTransform` du parallax souris (L 26-40) consomment du CPU même sans interaction mobile (le listener mousemove est attaché toujours).

**Action.**
1. Sur le h1, remplacer la cascade de 7 spans animés par un seul `motion.h1` avec un fade simple à 0.3 s, ou supprimer totalement l'anim du h1.
2. Réduire le `delay: 1` du `motion.p` à `0.3`.
3. Retirer le listener `mousemove` global ou le mettre derrière un `requestIdleCallback`.
4. Évaluer si framer-motion est nécessaire — `animate-fade-up` CSS suffirait pour la home. Si oui, ne pas mettre `framer-motion` dans le chunk principal mais le lazy-loader.

**Effort.** 1 h.

---

## 🟡 PROBLÈMES IMPORTANTS (semaine prochaine)

### I1. 4 fonts Google chargées, 2 effectivement utilisées

**Détail.** `index.html` L 119 charge `Inter` (4 poids) + `Montserrat` (2 poids). `src/index.css` L 1-2 charge **en plus** `Roboto` (3 poids) + `Libre Caslon Text` (2 poids). Or :
- `body` utilise `font-family: 'Inter'` (L 192 de index.css)
- `h1-h6` utilisent `'Montserrat'` (L 196)
- Roboto et Libre Caslon Text ne sont référencés que via les variables CSS `--font-sans` et `--font-serif` qui ne sont jamais appliquées.

**Impact.** 2 requêtes CSS supplémentaires bloquantes (Roboto + Libre Caslon CSS depuis fonts.googleapis.com) + 4-5 fichiers WOFF2 inutiles téléchargés. Sur LCP P75 = 6,7 s, cela contribue probablement à 300-500 ms.

**Action.** Supprimer les 2 lignes `@import url(...Roboto)` et `@import url(...Libre Caslon Text)` de `src/index.css`. Garder `Inter` et `Montserrat` qui sont préconnect en L 114-115 de `index.html`. Ajouter `font-display: swap` est déjà dans l'URL, OK.

**Effort.** 5 min.

---

### I2. Sitemap incomplet — chantiers détail absents

**Détail.** `scripts/generate-sitemap.mjs` liste 17 routes statiques. Aucune route `/realisations/[slug]` n'y figure, alors qu'elles existent (le `ChantierDetail.tsx` est routé L 118 de `App.tsx` et c'est un chunk de 172 KB — beaucoup de logique). Les chantiers sont stockés en Supabase, donc le script devrait :
1. Soit fetcher la liste publiée depuis Supabase à chaque build.
2. Soit générer un sitemap dynamique servi via Cloudflare Function.

**Impact.** Les pages chantiers (potentiellement 10-30 URLs uniques avec contenu de qualité, photos, schema Article) ne sont pas découvertes par Google.

**Action.** Étendre `generate-sitemap.mjs` pour fetcher `await fetchPublishedProjects()` depuis Supabase et ajouter chaque slug. Réutiliser la query existante `src/lib/chantiers/queries.ts`.

**Effort.** 1 h.

---

### I3. Page Home — aucun formulaire au-dessus de la fold mobile

**Détail.** Le hero mobile mesure `min-h-screen` (~640 dp) et contient titre + sous-titre + 1 bouton CTA « Demander un devis gratuit » qui redirige vers `/contact`. Le formulaire `ContactSection.tsx` n'est jamais embarqué sur la home. Sur mobile, l'utilisateur doit :
1. Voir le hero
2. Cliquer le CTA
3. Attendre la résolution du chunk `Contact-COHD0oOd.js` (27 KB gzip + 84 KB forms chunk)
4. Voir le formulaire qui a **14 champs + 3 photos**

À chaque étape, ~30-40 % d'attrition. Un formulaire mini à 3 champs (nom, tél, besoin) embarqué dans le hero ou en sticky donnerait probablement +50-100 % de leads.

**Action.** Soit ajouter un `<MiniContactForm />` (3 champs) dans le hero, soit garder le sticky CTA mais ajouter sur la home une section ContactSection compacte au-dessus du footer.

**Effort.** 2-3 h pour un mini-form bien designé.

---

### I4. Formulaire `/contact` — 14 champs obligatoires

**Détail.** `ContactSection.tsx` L 94-110, le state initial déclare 15 propriétés. La validation L 179-196 marque 13 champs comme requis : name, email, phone, rue, numero, codePostal, commune, clientType, habitatType, services[], message ≥ 20 chars, gdprConsent. Seuls `buildYear`, `timing` et `source` sont optionnels.

Sur mobile, cela représente un funnel de ~5 minutes de remplissage. Le téléphone est en haut de page (carte « Téléphone — 0485 75 52 27 ») donc beaucoup de visiteurs vont préférer appeler — mais Adrian rate les leads en dehors des heures d'ouverture.

**Pourquoi c'est important.** Avec 21 avis Google et un trafic faible (positions 30-56), chaque visiteur compte. Un formulaire long fait fuir les prospects en phase d'exploration.

**Action.**
1. Réduire à 5 champs requis : nom, téléphone (ou email), commune, services, message. Reporter habitatType / clientType / adresse précise en seconde étape ou au moment de la réponse d'Adrian.
2. Ou bien proposer DEUX formulaires : « Devis express » (3 champs) et « Devis détaillé » (l'actuel).

**Effort.** 4-6 h.

---

### I5. JSON-LD aggregateRating dépend d'un fetch async

**Détail.** `Index.tsx` L 23-33 et `StructuredData.tsx` L 152-160 : le bloc `aggregateRating` n'est inclus dans le JSON-LD QUE si `useAggregateRating()` (hook Supabase) a déjà répondu. Si Googlebot crawle avant la résolution du fetch, le JSON-LD est rendu sans aggregateRating → pas d'étoiles dans les SERPs.

**Pourquoi c'est important.** Les étoiles dans les SERPs augmentent le CTR de 15-30 %. Sur 21 avis et 4,94/5, c'est un asset majeur perdu.

**Action.** Hardcoder une valeur fallback dans le JSON-LD initial (`reviewCount: 16, ratingValue: 4.94`) et la mettre à jour quand Supabase répond — au pire le HTML statique a la bonne valeur. Ou bien pré-calculer au build (script qui fetch Supabase et injecte dans `index.html`).

**Effort.** 1-2 h.

---

### I6. Redirections 301 client-side (React Router `<Navigate>`)

**Détail.** `App.tsx` L 95-117 définit 5 redirections de catégories anciennes (`/realisations/tableaux-et-prises` → `/realisations?tag=...`). Mais ce sont des `<Navigate>` React, donc **côté client après hydratation**. Google reçoit un 200 OK avec le HTML SPA standard, exécute le JS, puis voit le redirect. Ce n'est PAS un 301 HTTP.

**Pourquoi c'est important.** Les anciennes URLs ne transmettent pas le PageRank à la nouvelle. Et si elles étaient dans l'index Google avant la refonte, elles peuvent disparaître (faisant partie des 12 pages perdues ?).

**Action.** Ajouter ces 5 redirections dans `public/_redirects` (Cloudflare Pages format) :
```
/realisations/tableaux-et-prises  /realisations?tag=R%C3%A9novation+tableau+%C3%A9lectrique  301
/realisations/ambiances-lumineuses /realisations?tag=%C3%89clairage+LED  301
...
```

**Effort.** 15 min.

---

### I7. Bundle JS — chunk principal 220 KB (67 KB gzip) sur la home

**Détail.** Critical path home (mesuré dans le build) :
- `index-75-xmV5q.js` = 222 KB (67 KB gzip)
- `router-C2Krb2qX.js` = 156 KB (50 KB gzip)
- `supabase-Co4BrACr.js` = 176 KB (42 KB gzip)
- `animations-vDNsHnNi.js` = 121 KB (39 KB gzip)
- `query-Cd6PKjFZ.js` = 41 KB (12 KB gzip)
- `ui-Qd4DkYCV.js` = 24 KB (8 KB gzip)
- `index-JoaoTfPc.css` = 99 KB (17 KB gzip)
- **Total ~840 KB raw / ~235 KB gzip** rien que pour servir la home.

Sur 3G médian, c'est ~2-3 s de download + 1-2 s de parse. Cohérent avec LCP P90 = 8,6 s.

**Action.**
1. Lazy-loader Supabase : `useAggregateRating` n'est utilisé que pour les étoiles. Loader Supabase à l'idle (`requestIdleCallback`) plutôt qu'en synchrone.
2. Évaluer remplacer framer-motion par des animations CSS (`animate-fade-up` déjà défini) sur la home + zones. Sortir framer-motion du chunk initial.
3. Tree-shake `lucide-react` : actuellement chunk `ui` 24 KB. Tous les icônes utilisés (~30) devraient peser <10 KB en raw.

**Effort.** 4-8 h.

---

### I8. SEO.tsx — cleanup qui reset le title à la home title

**Détail.** `src/components/SEO.tsx` L 81-83 : le cleanup `useEffect` fait `document.title = "Le Cuivre Électrique | Électricien indépendant..."` (le title home) au démontage. Lors d'une navigation route A → route B, React démonte le `<SEO />` de A AVANT que celui de B ne monte → le title flash à la home title pendant quelques ms. Pour un humain c'est imperceptible. Pour Googlebot exécutant le JS, c'est probablement OK aussi. Mais c'est un anti-pattern et un risque si Google fait des snapshots à différents moments.

**Action.** Supprimer le cleanup, ou utiliser `react-helmet-async` qui gère ça proprement.

**Effort.** 30 min (mais low priority).

---

## 🟢 OPTIMISATIONS (plus tard)

### O1. CSS critique non inliné
Le bundle CSS 99 KB est servi en `<link rel="stylesheet">` bloquant. Inliner les 5-10 KB nécessaires au hero gagnerait ~200 ms sur le First Contentful Paint.

### O2. Lazy load du PWA service worker
`vite-plugin-pwa` enregistre le SW au load. Pour les visiteurs publics (qui ne vont pas sur /admin), ça consomme du CPU et précache 2,4 MB inutilement. Le SW est déjà guardé `if pathname starts with /admin` dans `main.tsx` (à vérifier) ; sinon, désinstaller le SW côté public.

### O3. Preload du hero image
`<link rel="preload" as="image" imagesrcset="..." imagesizes="100vw" type="image/avif">` dans `index.html` accélèrerait le LCP de 200-400 ms sur 4G.

### O4. Sitemap : changefreq « weekly » sur /realisations alors que peu de chantiers ajoutés
Google ignore largement `changefreq` et `priority`. C'est cosmétique.

### O5. Pas de breadcrumb JSON-LD sur les pages zones
`ZonePageLayout` injecte `LocalBusinessZone` + `FAQPage` mais pas `BreadcrumbList`. Ajouter pour rich results breadcrumb dans SERPs.

### O6. Logo email 234 KB dans `/public/`
`public/logo-email.png` (234 KB) sert pour les emails EmailJS, mais il est dans le bucket public et précaché par le SW. Le déplacer hors de `public/` ou ne le servir que depuis EmailJS.

### O7. Hero parallax mousemove sur desktop
Le listener `mousemove` global de `HeroSection.tsx` L 29-40 reste actif tant que la home est montée. Sur des sessions longues, ça ajoute du jank. À mettre derrière `IntersectionObserver` (couper si hero out of view).

### O8. Aucun lien interne depuis pages services → pages zones (et inversement déjà fait)
`ServicePageLayout` a `<InternalLinks mode="zones" />` ✓. Mais l'inverse `ZonePageLayout` a `<InternalLinks mode="services" />` ✓ aussi. Bon point. Cependant : depuis `/services` (page liste), aucun lien vers les zones. Et depuis chaque page service, on a la liste zones mais pas les autres services. À densifier.

---

## 📋 DÉTAIL PAR SECTION

### 🏗️ SECTION 1 — PERFORMANCE TECHNIQUE

#### 1.1 Animation Hero
- **Localisation :** `src/components/HeroSection.tsx`
- **Animations identifiées :**
  - `motion.div` scale 1.1→1 sur l'image hero (durée 1,5 s) — bénin, image déjà visible
  - 7 `motion.span` pour le h1 (delay 0.2-0.98 s)
  - `motion.p` slogan (delay 1.0 s)
  - `motion.div` chip rating (delay 1.05 s)
  - `motion.div` CTA primaire (delay 1.2 s)
  - `motion.p` horaires (delay 1.2 s)
  - `motion.div` scroll indicator (delay 1.5 s)
  - 2 `motion.div` parallax mousemove desktop (useMotionValue + useSpring + useTransform + useMotionTemplate)
  - 1 `motion.div` breathing mobile (opacity loop infini)
- **Impact LCP estimé.** Sur P75 (6,7 s), 800-1200 ms imputables au chaining des animations + au coût parse framer-motion (~121 KB raw). Cf. C5.

#### 1.2 Images
- **Hero :** OK. `src/assets/hero-lighting-design.jpg` (141 KB source) traité par vite-imagetools → fichiers AVIF 7-28 KB + WebP 15-68 KB + JPG 27-140 KB selon viewport. `fetchpriority="high"`, `loading="eager"`. ✓
- **Hero variants source non utilisés :** `hero-abstract.jpg/webp` (338 KB / 258 KB) et `hero-electricite.jpg/webp` (141 KB / 58 KB) sont dans `src/assets/` mais probablement pas importés. À supprimer.
- **Logo PNG :** `src/assets/logo-cuivre-electrique.png` (234 KB) → vite-imagetools le sort en AVIF 1-3 KB + WebP 1-3 KB + PNG 6-15 KB. ✓
- **Gallery :** ❌ 22 fichiers > 1 MB dans `dist/assets/`. Cf. C4.
- **Public :** `og-image.jpg` 80 KB (OK), favicons multi-formats OK, `logo-email.png` 234 KB inutile en public (cf. O6), icônes PWA 192/512 OK.
- **Above-the-fold lazy-loaded ?** Non, hero image en eager. ✓ pour le hero. Mais aucune image lazy-loaded sur la home puisqu'il n'y a pas d'autres images.

#### 1.3 Bundle JavaScript
- **Build OK** (`npm run build` réussi en 13,1 s, 2661 modules).
- **Chunks > 100 KB :**
  - `index-75-xmV5q.js` 222 KB
  - `supabase-Co4BrACr.js` 176 KB
  - `ChantierDetail-BpjeESxt.js` 172 KB
  - `router-C2Krb2qX.js` 156 KB
  - `animations-vDNsHnNi.js` 121 KB
- **Code splitting actuel :** correct sur les routes (`App.tsx` lazy-load toutes les pages sauf Home). Manual chunks bien définis dans `vite.config.ts` (vendor, router, animations, ui, supabase, query, forms). Le drop_console terser est activé.
- **Lazy loading /admin :** ✓ tous les composants admin sont en `lazy()`.
- **Évaluation :** Le splitting est bien fait au niveau routes mais le chunk initial reste lourd à cause de supabase + animations qui sont préchargés par le manual chunks alors qu'ils ne sont pas tous nécessaires sur la home.

#### 1.4 Fonts et CSS
- **Fonts :** 4 familles chargées (Inter, Montserrat, Roboto, Libre Caslon Text) — 2 effectivement utilisées. Cf. I1. `font-display: swap` activé via URL ✓.
- **CSS critique :** Non inliné. Bundle 99 KB en `<link>` bloquant. Cf. O1.

#### 1.5 Tiers (scripts externes)
- **gtag (Google Ads) :** `<script async>` dans index.html, OK.
- **GA4 :** `<script async>` dans index.html, OK.
- **EmailJS :** chargé uniquement quand le formulaire est utilisé (import direct dans `ContactSection.tsx`). ✓
- **Supabase :** chunk dédié 176 KB, chargé sur la home pour `useAggregateRating`. À lazy-loader.
- **Cloudflare Analytics :** non détecté.
- **Consent Mode v2 :** ✓ correctement configuré en `denied` par défaut pour l'EEE.

---

### 🧱 SECTION 2 — SEO TECHNIQUE

#### 2.1 Sitemap.xml
- **Existe :** `public/sitemap.xml`, 17 URLs.
- **À jour :** ✓ régénéré à chaque build via `scripts/generate-sitemap.mjs` avec lastmod dérivé de git log par fichier source. Architecture propre.
- **5 pages zones présentes :** ✓ (Court-Saint-Étienne, Wavre, Ottignies-LLN, Nivelles, Genappe).
- **URLs absolues :** ✓
- **Manquant :** chantiers `/realisations/[slug]`. Cf. I2.

#### 2.2 Robots.txt
- **Existe :** ✓
- **Cohérent :** ❌ Disallow ne s'applique pas à Googlebot. Cf. C2.
- **Erreur PageSpeed probable :** `Crawl-delay: 1` sur Googlebot (non supporté, déclenche un warning).
- **Sitemap référencé :** ✓ en ligne 2.

#### 2.3 Meta tags par page
- **Home :** title 109 chars (trop long, idéal <60), description 246 chars (trop long, idéal 140-160), canonical ✓, og:* ✓.
- **Services :** chaque page service a son `<SEO />` propre. Vérifié `DepannageUrgent.tsx` : title 88 chars (long), description 198 chars (long), keywords présents.
- **Zones :** vérifié `Wavre` : title « Électricien à Wavre — Le Cuivre Électrique Brabant wallon » = 56 chars ✓ idéal. Description 161 chars ✓.
- **Mots-clés locaux :** Les pages zones ont bien le nom de la commune dans title, h1, intro, FAQ. ✓

#### 2.4 Schema.org structured data
- **LocalBusiness/Electrician :** ✓ riche (address, geo, openingHours, hasOfferCatalog avec 5 services, sameAs WhatsApp, 15 areaServed cities).
- **AggregateRating :** ✓ mais conditionnel au fetch Supabase. Cf. I5.
- **Service :** ✓ injecté sur chaque page service.
- **FAQPage :** ✓ injecté sur chaque page service et zone (5 questions chacune).
- **BreadcrumbList :** ✓ sur `/realisations` et pages services/zones via `<Breadcrumbs />`. Pas sur la home (OK, conventionnel).
- **Article (ProjectArticle) :** ✓ défini dans `StructuredData.tsx` pour les chantiers détail.

#### 2.5 Structure HTML
- **1 seul `<h1>` par page :** ✓ vérifié sur Index (le h1 du hero), Wavre (un h1 dans ZonePageLayout), DepannageUrgent (un h1 dans ServicePageLayout).
- **Hiérarchie :** h1 > h2 > h3, mais `ReassuranceSection.tsx` utilise des `<h2>` pour les 4 features (« Conformité RGIE », etc.) ET le bandeau TVA — ça fait 5 h2 sur la home pour des items qui pourraient être h3. Pas critique.
- **Balises sémantiques :** `<header>`, `<main>`, `<section>`, `<article>`, `<footer>`, `<nav>` ✓.

---

### 🧱 SECTION 3 — CONTENU SEO PAR PAGE

#### 3.1 Pages zones (5)
- **Wordcount (mesuré par wc -w sur les fichiers source TSX, donc inclut le code) :**
  - Court-Saint-Étienne : 1056 mots TSX (~800 mots de contenu utile)
  - Genappe : 835 mots TSX
  - Nivelles : 816 mots TSX
  - Ottignies-LLN : 807 mots TSX
  - Wavre : 865 mots TSX
- **Verdict :** ~700-800 mots de vrai contenu par page, c'est dans la fourchette acceptable pour du SEO local (idéal 1000+ mais correct). Court-Saint-Étienne plus dense (siège). ✓
- **Originalité :** vérifié Wavre vs Court-Saint-Étienne — les paragraphes sont distincts, vraiment écrits pour chaque ville (quartiers nommés : Bierges, Limal, Basse-Wavre pour Wavre ; Beaurieux, Faux, Sart-Messire-Guillaume pour CSE). ✓ excellent.
- **Nom commune dans title/h1/url/premiers mots :** ✓ partout.
- **Contenu local spécifique :** ✓ habitat décrit par quartier, FAQ adaptée.
- **Maillage interne :** ✓ chaque zone link vers les 5 services via `<InternalLinks mode="services" />`. Mais pas de lien depuis une zone vers les autres zones.

#### 3.2 Pages services
- **5 pages services existantes :** Installation, Dépannage, RGIE, Bornes, Photovoltaïque. ✓
- **Longueur :** ~7-9 KB de TSX chacune, soit ~600-900 mots de contenu utile.
- **Qualité :** vérifié `DepannageUrgent` et `InstallationRenovation` — contenu pro, marques citées (Schneider, Niko, Vinçotte, BTV, Alfen, Hager, Huawei, SolarEdge), processus 6 étapes détaillé, FAQ 4-5 questions. ✓
- **Photos avec alt text :** vérifié, les pages services n'ont pas de photos pour le moment (uniquement icônes Lucide). Manque de visuels pour rassurer le visiteur.
- **Maillage :** chaque page service → 5 zones via `<InternalLinks mode="zones" />`. ✓

#### 3.3 Page Home
- **Contenu textuel :** ❌ ~80 mots utiles (hero + reassurance + 3 stats). Cf. C1.
- **CTA clairs :** « Demander un devis gratuit » + tel + indicateur scroll. ✓
- **Liens vers pages zones et services :** ❌ uniquement via le header (menu déroulant) et le footer. Pas dans le contenu de la home. Cf. C1.

#### 3.4 Maillage interne global
- **Footer cohérent partout :** ✓ `Footer.tsx` linke vers /services, /realisations, /avis, /contact, /mentions-legales, /cgv, /confidentialite + les 5 pages zones en ligne. Bon.
- **Header :** dropdown Services avec 5 sous-items + Voir tous les services + nav classique.
- **Sticky bar mobile :** Appeler + Devis gratuit. Pas de lien vers d'autres pages = OK, sticky est pour la conversion.
- **Manque :** pas de lien zone↔zone, pas de lien depuis Home vers zones.

---

### 🎨 SECTION 4 — CONVERSION

#### 4.1 Formulaire contact
- **Position above-the-fold mobile :** ❌ formulaire absent de la home. Sur `/contact`, il faut scroller passé le hero + 3 cartes canaux + section « Comment ça se passe » (4 étapes) avant d'atteindre le formulaire. Estimé 2-3 viewports mobile à scroller.
- **Nombre de champs :** 14 champs requis + 3 photos. Cf. I4. Trop pour mobile.

#### 4.2 Téléphone et CTA
- **Téléphone cliquable visible sans scroll :**
  - Header desktop : ✓ chip orange « 0485 75 52 27 » + bouton « Devis gratuit ».
  - Header mobile : ✓ icône téléphone ronde + bouton Menu.
  - Sticky bar mobile : ✓ « Appeler » + « Devis gratuit » fixés en bas.
- **CTA « Devis gratuit » répété :** ✓ partout (header, hero, footer, sticky mobile, pages service hero + CTA final, pages zone hero + CTA final).
- **Sticky CTA mobile :** ✓ `MobileStickyBar.tsx` rendu à la racine de l'App, masqué sur /admin.

#### 4.3 Preuves sociales
- **Avis Google intégrés :**
  - `<HomeReviewsBanner />` ✓ sur home + pages zones + pages services. Note dynamique Supabase + bouton « Voir tous les avis » + bouton « Laisser un avis » (lien direct vers g.page).
  - Page `/avis` dédiée existe.
  - Chip Note dans le hero home (`HeroSection.tsx` L 178-198). ✓
- **Photos chantiers :** ❌ pas sur la home. Page `/realisations` les affiche (`ProjectVerticalList.tsx`) avec placeholder si Supabase vide.
- **Logos agréments :** ❌ aucun logo Vinçotte / AIB / BTV / Schneider / Niko / Hager / Alfen / Huawei / SolarEdge visible alors que ces marques sont citées partout. Manque de réassurance visuelle.

---

## 🎯 PLAN D'ATTAQUE RECOMMANDÉ

Classé par ROI (impact × inverse-effort) :

### Sprint 1 (cette semaine, ~3 h)
1. **🟢 30 min** — Réparer `public/robots.txt` (C2)
2. **🟢 20 min** — Ajouter `<ServicesSection />` + `<ZoneSection />` à `Index.tsx` (C1)
3. **🟢 10 min** — Supprimer les 2 imports Roboto + Libre Caslon de `src/index.css` (I1)
4. **🟢 20 min** — Ajouter les 5 redirections 301 dans `public/_redirects` (I6)
5. **🟢 30 min** — Hardcoder fallback `aggregateRating` dans le JSON-LD initial (I5)
6. **🟢 30 min** — Réduire les delays des animations hero (C5 partiel : delay 1s → 0.3s, supprimer cascade h1)
7. **🟢 30 min** — Push + monitorer Search Console 48-72h

**Impact attendu Sprint 1.** Crawl Googlebot redevient propre, home gagne ~800 mots de contenu et 5 liens internes vers zones, LCP gagne 300-500 ms via fonts. C'est probablement suffisant pour récupérer 3-6 des 12 pages perdues dans les 2-3 semaines suivantes.

### Sprint 2 (semaine prochaine, ~1 jour)
8. **🟡 1 h** — Optimiser les 22 images gallery > 1 MB via Sharp (C4)
9. **🟡 1 h** — Étendre sitemap pour inclure chantiers Supabase (I2)
10. **🟡 2 h** — Réduire formulaire contact à 5 champs ou créer mini-form home (I3 + I4)
11. **🟡 2 h** — Lazy-loader Supabase + framer-motion hors chunk initial (I7)

**Impact attendu Sprint 2.** LCP P75 passe sous 4 s. CTR landing → form +20-40 %. Pages chantiers commencent à apparaître dans Google.

### Sprint 3 (mois prochain, ~1 semaine)
12. **🔴 1 jour** — Implémenter le pré-rendu statique via react-snap (C3)
13. **🔴 1 jour** — Refonte page Home : sections enrichies + témoignages visuels + logos marques + photos chantiers
14. **🔴 1 jour** — Création 5-10 nouvelles pages zones (Waterloo, Rixensart, Lasne, Braine-l'Alleud, Jodoigne) pour densifier la longue traîne locale

**Impact attendu Sprint 3.** Positions zones passent de 30-56 à 10-20. LCP P75 sous 2,5 s (vert CWV). Génération de leads multipliée par 2-3x.

---

## 📌 Notes de méthodologie

- **Mesures de bundle :** issues de `npm run build` lancé pendant l'audit. Sizes en KB raw, gzip indiqué quand pertinent. Le warning `chunkSizeWarningLimit: 500` n'est pas dépassé pour le chunk initial mais on est à 220 KB raw juste pour `index-*.js`.
- **Wordcount pages zones :** `wc -w` sur les fichiers TSX, inclut le code JSX → estimation à ~75 % du chiffre brut pour le vrai contenu visible.
- **LCP P75 6,7 s :** fourni dans le brief, non mesuré pendant l'audit. Cohérent avec les findings (CSR + 4 fonts + animations chaînées + chunk JS initial lourd).
- **Pages perdues :** non vérifiable depuis le repo. Hypothèses cohérentes : canonical absent avant le 2026-05-01 (cf. commentaire `index.html`), redirections client-side au lieu de 301 HTTP, JSON-LD aggregateRating manquant pendant la migration Supabase.
- **Non audité dans ce passage :** Search Console réelle, GA4 réel, contenu des chantiers en BDD Supabase, comportement mobile in-vivo, comportement du PWA service worker, contenu de `/avis`, contenu de `/faq` (39 KB de source, probablement très dense).
