# PHASE 1 — Rapport d'exécution
## Date : 13 mai 2026
## Référence audit : `AUDIT_SEO_COMPLET_2026_05_13.md` (commit `ff3af23`)
## Branche : `main`

> Sprint 1 du plan d'attaque : C2, C1, I1, I6, I5, C5. Durée réelle ~1h15.

---

## 1. Commits effectués (6, par ordre chronologique)

| # | SHA | Tâche | Sujet |
|---|---|---|---|
| 1 | `361554d` | T1 / C2 | fix(seo): robots.txt - block /admin /src for all bots including Googlebot |
| 2 | `60f6416` | T4 / I6 | fix(seo): server-side 301 redirects for old category URLs (I6) |
| 3 | `5abf0e0` | T3 / I1 | perf(fonts): remove unused Roboto + Libre Caslon imports (I1) |
| 4 | `ab59d39` | T2 / C1 | feat(seo): wire ServicesSection + ZoneSection + InternalLinks on Home (C1) |
| 5 | `e2beffd` | T5 / I5 | fix(seo): hardcode aggregateRating fallback in JSON-LD (I5) |
| 6 | `fa9ab14` | T6 / C5 | perf(hero): reduce animation delays for faster LCP (C5) |

Tous mergés directement sur `main` (workflow validé pour ce solo-dev).

---

## 2. Avant / après par métrique

### 2.1 robots.txt
| | Avant | Après |
|---|---|---|
| Lignes | 26 (4 blocs UA + 7 Disallow) | 9 (1 bloc UA + 7 Disallow) |
| Bloc Googlebot dédié | OUI (Allow / Crawl-delay 1) — bug : pas de Disallow hérité | NON |
| Disallow effectifs pour Googlebot | 0 (aucun) | 7 (merci, admin, admin/, src, supabase, *.json$, sitemap) |
| Crawl-delay (non supporté par Google) | présent → warning Lighthouse probable | supprimé |

**Validation.** Le fichier est strictement conforme à la RFC 9309 et à la spec Google. À retester sur https://www.google.com/webmasters/tools/robots-testing-tool une fois déployé en prod.

### 2.2 Redirections 301 server-side
| | Avant | Après |
|---|---|---|
| Anciennes catégories `/realisations/<x>` redirigées | 5 (via `<Navigate>` React Router) | 5 (en 301 HTTP via Cloudflare `_redirects`) |
| Statut HTTP vu par Googlebot | 200 OK + JS redirect (PageRank perdu) | 301 propre (PageRank transmis) |
| Filet de sécurité client | Conservé dans `App.tsx` L 95-117 | Conservé (rétro-compatible) |

### 2.3 Fonts
| | Avant | Après |
|---|---|---|
| Fonts importées | 4 familles : Inter, Montserrat, **Roboto**, **Libre Caslon Text** | 2 familles : Inter, Montserrat |
| Imports CSS @import (bloquants) | 2 lignes dans `src/index.css` | 0 |
| `--font-sans` CSS var | `'Roboto', ...` | `'Inter', ...` |
| `--font-serif` CSS var | `'Libre Caslon Text', ...` | `ui-serif, Georgia, ...` (système) |
| `--font-mono` CSS var | `'Roboto Mono', ...` (déjà non chargé) | `ui-monospace, ...` (système) |
| Tailwind `fontFamily.sans/serif/mono` | identique | mis à jour pour cohérence |
| Usage de `.font-serif` (HeroSection L123) | Libre Caslon Text | Georgia/Cambria système |

**Gain LCP estimé : 300-500 ms** (2 requêtes CSS bloquantes en moins + 4-5 fichiers WOFF2 en moins au premier visit).

### 2.4 Contenu Home
| | Avant | Après |
|---|---|---|
| Sections rendues sur `/` | 4 : Hero, Reassurance, KeyFigures, ReviewsBanner | 7 : Hero, Reassurance, **ServicesSection**, **ZoneSection**, KeyFigures, **InternalLinks**, ReviewsBanner |
| Mots utiles indexables (estimation) | ~80 mots | ~880 mots (+1000 %) |
| Liens internes depuis Home vers pages SEO | 0 dans le contenu (seulement header/footer) | 5 services + 12 zones (cartes) + 5 zones (InternalLinks) = ~22 ancres |
| h2 sur la home | 5 (icônes reassurance + bandeau TVA) | 8 (services, zone, reassurance, internalLinks, etc.) |

### 2.5 JSON-LD aggregateRating
| | Avant | Après |
|---|---|---|
| `aggregateRating` présent | conditionnel à `useAggregateRating()` (Supabase) | toujours présent |
| Window async sans étoiles | ~100-400ms entre hydratation et fetch Supabase | 0 (FALLBACK_RATING 4.94/5 sur 21 avis) |
| Quand Supabase répond | rating live | rating live écrase fallback (inchangé) |

### 2.6 Hero animations
| Élément | Delay avant | Delay après | Note |
|---|---|---|---|
| h1 cascade 7 spans | 0.2s → 0.98s | **supprimé** (un seul motion.h1 fade 0.4s) | -16 lignes de code |
| slogan « Basé à Court-Saint-Étienne » | 1.0s | 0.2s | -800ms |
| rating chip 4.94/5 | 1.05s | 0.3s | -750ms |
| CTA « Demander un devis gratuit » | 1.2s | 0.4s | -800ms |
| horaires bureau | 1.2s | 0.5s | -700ms |
| scroll indicator | 1.5s | 0.7s | -800ms |
| **Hero entièrement composé** | **1.5s** | **0.7s** | **-800ms** |

**Gain LCP estimé : 600-800 ms** sur P75 (selon que le LCP candidate est le h1 ou l'image hero).

### 2.7 Bundle JS (chunk initial pour la home)
| | Avant Sprint 1 | Après Sprint 1 | Δ |
|---|---|---|---|
| `index-*.js` (raw) | 222 KB | 233 KB | +11 KB |
| `index-*.js` (gzip) | 67 KB | 70 KB | +3 KB |
| CSS bundle | 99 KB | 99 KB (-2 lignes @import) | identique |
| Précache PWA (entries / KB) | 93 / 2376 KB | 91 / 2375 KB | -2 entries |

Le +11 KB raw vient de l'inclusion de ServicesSection (+5 KB), ZoneSection (+3 KB) et InternalLinks (+1 KB) directement dans le chunk initial de la home (Index étant eager-loaded, pas lazy). Compensé par le retrait des 2 imports Google Fonts CSS (économie côté réseau, pas bundle).

### 2.8 Fonts chargées au runtime
| | Avant | Après |
|---|---|---|
| Familles | Inter, Montserrat, Roboto, Libre Caslon Text | Inter, Montserrat |
| CSS requests vers fonts.googleapis.com | 2 (index.html) + 2 (index.css @import) = **4 RTT** | 1 (index.html, combine Inter + Montserrat) = **1 RTT** |
| Fichiers WOFF2 téléchargés | ~8 (Inter 4 weights + Montserrat 2 + Roboto 3 + Libre Caslon 2) | ~6 (Inter 4 + Montserrat 2) |

---

## 3. Estimation gain LCP cumulé

| Source | Gain estimé |
|---|---|
| Fonts (4 → 2) | 300-500 ms |
| Hero animations | 600-800 ms |
| `aggregateRating` toujours présent (pas de gain LCP, gain CTR via étoiles SERP) | — |
| robots.txt (pas de gain LCP, gain indexation) | — |
| 301 server-side (pas de gain LCP, gain PageRank) | — |
| **Total LCP estimé** | **900-1300 ms** |

**LCP P75 projeté : 5.4-5.8 s** (vs 6.7 s avant). Toujours en zone rouge CWV (seuil vert <2.5s), mais c'est l'amorce. Le gros levier reste **C3 (CSR vs pré-rendu)** et **C4 (gallery 22 images >1MB)** — prévus Sprint 2 et 3.

---

## 4. Validation build

Build final exécuté après le dernier commit (`fa9ab14`) :
```
✓ 2661 modules transformed
✓ built in ~9s
precache 91 entries (2374.80 KiB)
```
Aucune erreur. Aucun warning fonctionnel. Le chunk `chunkSizeWarningLimit: 500` n'est pas dépassé sur le chunk initial.

Sitemap.xml régénéré automatiquement (`generate-sitemap.mjs`) avec lastmod git ajusté pour les 3 fichiers modifiés (Index.tsx, HeroSection.tsx, etc.).

---

## 5. Risques résiduels

### Risque 1 — Badge "Artisan Électricien" sans Libre Caslon (faible)
Le badge du hero (`HeroSection.tsx` L 123) utilise `.font-serif`. Avant : Libre Caslon Text (police serif élégante). Après : Georgia/Cambria système. Visuellement, ça reste un texte serif italique-like, mais l'identité change légèrement.
**Mitigation possible.** Si Adrian préfère récupérer la touche serif premium, recharger uniquement Libre Caslon Text pour ce badge en font-display: optional, coût ~10 KB.

### Risque 2 — Fallback rating désynchronisé (faible)
Le `FALLBACK_RATING` est codé en dur à 4.94/21. Si l'écart avec GMB devient significatif (>2 avis), le JSON-LD initial servi à Google sera obsolète jusqu'à la réponse Supabase. Comme Supabase répond en <500ms en général, c'est une fenêtre minuscule. Mais à resync manuelle de temps en temps (toutes les ~10 nouveaux avis), dans `StructuredData.tsx`.

### Risque 3 — Cache Cloudflare Pages (modéré)
Le déploiement Cloudflare Pages garde `robots.txt` en cache 3600s (cf. `public/_headers`). Le `Cache-Control: max-age=3600` peut retarder de 1h la propagation du nouveau robots.txt. Une purge cache manuelle accélèrerait. Pour `_redirects`, c'est appliqué au routing CF, pas en cache HTTP — propagation immédiate.

### Risque 4 — Animations supprimées du h1 (très faible)
L'effet "cascade word-by-word" est supprimé au profit d'un fade simple. Validé par l'utilisateur. Régression visuelle volontaire et acceptée.

### Risque 5 — `<Navigate>` redondants (faible)
Les `<Navigate>` côté client dans `App.tsx` L 95-117 sont conservés en filet de sécurité. À retirer dans 2-3 semaines une fois confirmé en prod que les 301 Cloudflare fonctionnent correctement.

---

## 6. Recommandations pour Sprint 2

Reprise du plan d'audit, classé par ROI :

### Priorité 1 (semaine prochaine)
1. **C4 — Optimiser les 22 images gallery > 1 MB** (Sharp ou vite-imagetools)
   - Impact LCP /realisations : -3 à -5 s
   - Effort : 1-2 h
2. **I2 — Étendre sitemap pour inclure chantiers Supabase**
   - Fetch publié + slug dans `scripts/generate-sitemap.mjs`
   - Effort : 1 h
3. **I3 + I4 — Réduire formulaire contact à 5 champs ou ajouter mini-form home**
   - Impact conversion : potentiellement +50-100% leads
   - Effort : 2-4 h

### Priorité 2
4. **I7 — Lazy-loader Supabase + framer-motion hors chunk initial**
   - Impact LCP : -400 à -800 ms
   - Effort : 4-8 h
5. **C3 — Pré-rendu statique via react-snap**
   - Impact massif sur indexation et LCP (-2 à -4 s)
   - Effort : 1 jour
   - Risque : tester en profondeur (canonical, SEO.tsx, JSON-LD post-hydration)

### Priorité 3 (mois prochain)
6. **Logos marques** : Schneider, Niko, Vinçotte, Alfen, Huawei, SolarEdge — sur la home et les pages services
7. **Mini photos chantiers sur la home** : 3-4 visuels au-dessus du footer
8. **Pages zones supplémentaires** : Waterloo, Rixensart, Lasne, Braine-l'Alleud, Jodoigne

---

## 7. Suivi à effectuer dans Search Console (J+3 à J+14)

- [ ] Vérifier que `robots.txt` est validé (https://search.google.com/search-console)
- [ ] Tester URL `/realisations/tableaux-et-prises` : doit renvoyer 301 vers `/realisations?tag=...`
- [ ] Inspecter URL `/` avec le test rich results : `aggregateRating` doit être présent dès le HTML brut
- [ ] Surveiller la courbe d'indexation : si les 12 pages perdues remontent dans les 2-3 semaines, le diagnostic était bon
- [ ] Surveiller CWV : si LCP P75 passe sous 6 s d'ici 28 jours, le sprint a payé

---

## 8. Notes méthodologiques

- Tous les builds (4 builds intermédiaires + 1 final) passés sans erreur ni warning fonctionnel.
- Aucune modification dans `/admin/*`, aucune modification de la logique Supabase ou EmailJS hors `aggregateRating` fallback.
- Le sitemap.xml a été régénéré à chaque build (lastmod git auto). C'est attendu.
- `public/_redirects` est un fichier Cloudflare Pages spécifique. Format documenté : https://developers.cloudflare.com/pages/configuration/redirects/
- Encoding URL des tags dans `_redirects` : pourcentage-encoded UTF-8 (é = %C3%A9, & = %26, + = espace).
