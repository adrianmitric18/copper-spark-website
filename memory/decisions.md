# Décisions

> Décisions durables prises sur le projet (technique, produit, organisation) et leur
> raison. Sert à ne pas reposer les mêmes questions ni revenir sans le savoir sur un
> choix assumé. Les plus récentes en haut.

## Format
```
### AAAA-MM-JJ — Titre court de la décision
- **Décision :** ce qui a été décidé
- **Pourquoi :** la raison / le contexte
- **Conséquences :** ce que ça implique pour la suite
```

## Journal

### 2026-08-16 — Simulateur : email obligatoire, pré-sélection par page, entrée dépannage
- **Décision :**
  - L'email est **obligatoire** sur l'écran de capture (client + policy RLS,
    migration `20260816120000_simulateur_email_obligatoire.sql`). L'accusé de
    réception avec l'estimation part donc toujours.
  - Le besoin se pré-sélectionne par `?besoin=…` depuis la page d'origine
    (`borne`, `rgie`, `combine`, `depannage`) ; l'étape 1 est alors sautée.
    Home, menu et pages villes restent génériques ; les deux pages services et
    la barre mobile sur ces pages pointent vers le parcours pré-sélectionné.
  - Le **parcours RGIE ne pose aucune question de borne** : la question d'usage
    (véhicule) y est remplacée par le motif de la mise en conformité
    (`CONTEXTES_RGIE`), projeté sur un `Usage` par `USAGE_PAR_CONTEXTE_RGIE`.
  - Le **dépannage** est une 4e entrée de l'étape 1 qui sort du parcours :
    grille tarifaire (`DEPANNAGE`, hors TVA), appel et WhatsApp. Aucun calcul,
    aucun lead, aucun email. Événement `simu_depannage_vu`.
- **Pourquoi :** tests réels d'Adrian. Le circuit lead et les emails étaient
  validés, restaient les frictions : email facultatif (donc pas d'estimation
  détaillée reçue), questions de borne posées à des demandes de conformité, et
  aucune porte de sortie pour les pannes.
- **Tarifs dépannage arbitrés par Adrian le 2026-08-16 : HTVA**, TVA en sus
  (6 % logement de plus de 10 ans, 21 % sinon). Ne pas les repasser en TTC sans
  son accord.
- **Conséquences / pièges à ne pas réapprendre :**
  - Le décompte de questions annoncé sur chaque page d'origine (« 3 questions »,
    « 2 questions ») doit rester aligné sur `sequence` dans `SimulateurWizard`.
  - Le formulaire de capture est en `noValidate` : la validation native du
    navigateur bloquait la soumission d'un `type="email"` mal formé et affichait
    sa propre bulle, dans la langue du navigateur — nos messages en français ne
    s'affichaient jamais. Ne pas retirer `noValidate`.
  - Les frictions mobiles traitées dans la même livraison : recentrage du champ
    actif sur `visualViewport.resize` (clavier), saisie GSM tolérante
    (`saisirGsm` / `nettoyerGsm`), historique par étape en `pushState` pour que
    le bouton retour Android revienne d'un écran, indicateur « Envoi de votre
    photo… » et compression au-delà de 2 Mo.
  - `index.html` déclare `function gtag(){…}` en script classique : impossible
    d'intercepter `window.gtag` avant lui pour un test. Instrumenter
    `window.dataLayer` à la place.

### 2026-08-09 — Pré-rendu statique au build, via Puppeteer et pas un plugin SSR
- **Décision :** `npm run build` enchaîne sitemap → `vite build` → `scripts/prerender.mjs`,
  qui pilote un vrai Chromium et écrit `dist/<route>/index.html` pour les 20 routes
  publiques. Les routes vivent dans `scripts/routes.mjs`, source unique partagée
  avec le générateur de sitemap.
- **Pourquoi Puppeteer :** le site pose title, meta description, canonical et JSON-LD
  depuis des `useEffect` (`SEO.tsx`, `StructuredData.tsx`). Ces effets ne s'exécutent
  jamais dans un rendu SSR Node, donc `vite-prerender-plugin` / vite-ssg produiraient
  des pages sans aucune de ces balises — c'est-à-dire sans le bénéfice recherché.
  Ne pas « simplifier » vers un plugin SSR sans avoir d'abord sorti le SEO des effets.
- **Conséquences / pièges à ne pas réapprendre :**
  - Le pré-rendu tourne **en séquentiel**. En parallèle, Chromium gèle
    `requestAnimationFrame` sur les onglets en arrière-plan : les animations d'entrée
    framer-motion ne se terminent pas et les pages sont figées à `opacity:0`.
    Les flags `--disable-background-timer-throttling` et consorts sont nécessaires
    mais ne suffisent pas.
  - `vite preview` **ne permet pas** de vérifier le pré-rendu : son fallback SPA
    renvoie `index.html` pour toutes les routes. Tester avec un serveur qui résout
    `<path>/index.html`, ou directement en production.
  - Analytics et Supabase sont coupés pendant le pré-rendu (stats GA4 non polluées,
    sortie déterministe, pas de données figées jusqu'au prochain déploiement).
  - Le fallback SPA de Cloudflare est désormais la home pré-rendue : les routes non
    pré-rendues (`/realisations/<slug>`, `/admin`, `/merci`) reçoivent ce HTML avant
    que React ne prenne la main. Accepté par Adrian le 2026-08-09.
  - Échec de Chromium = avertissement + build vert (retour au comportement SPA),
    jamais un déploiement rouge. `PRERENDER_STRICT=1` pour forcer l'échec en debug.

### 2026-08-09 — Node épinglé à 22.12 pour le build
- **Décision :** `.nvmrc` = `22.12.0`, lu par Cloudflare Pages.
- **Pourquoi :** puppeteer 25 exige Node ≥ 22.12 et le projet ne fixait aucune version,
  donc dépendait du défaut de l'image de build Cloudflare, susceptible de changer.
- **Conséquences :** en cas de souci Chromium chez Cloudflare, replis possibles :
  `@sparticuz/chromium`, ou rétrograder puppeteer (la v23 accepte Node ≥ 18).

### 2026-08-09 — "Électricien agréé" assumé dans les titles des pages zones
- **Décision :** les titles des pages zones utilisent « Électricien agréé à <Ville> »,
  avec RGIE et bornes dans le title. Formulation type :
  `Électricien agréé à <Ville> - RGIE, bornes, devis`.
- **Pourquoi :** Adrian assume le terme comme expression d'usage courant côté client,
  après avoir pris connaissance de la réserve ci-dessous. Choix arbitré par lui.
- **Réserve connue et acceptée :** en Belgique le statut d'agrément n'existe formellement
  que pour les **organismes de contrôle** (Vinçotte, BTV), pas pour l'installateur. Le
  terme n'est donc pas justifiable au sens strict — ne pas re-soulever le point, il a été
  tranché. Les meta descriptions, elles, restent sans « agréé ».

### 2026-08-09 — La home doit toujours transmettre du lien vers les pages services
- **Décision :** la home porte une section services (`HomeServicesSection`, liste
  éditoriale numérotée) avec les 5 liens services. Ne pas la retirer pour alléger la page.
- **Pourquoi :** la home capte 96/117 clics du site ; son allègement du 05/06/2026 avait
  supprimé tout lien vers les pages services et cassé le maillage interne.
- **Conséquences :** si le rendu déplaît, retravailler le visuel — jamais supprimer les
  liens. Les libellés/URL viennent de `SERVICES_LINKS` (`src/lib/seo-links.ts`), source
  partagée avec `InternalLinks` : modifier là, pas dans le composant.
- **Toujours valable :** pas de formulaire sur la home (`MiniContactForm` reste retiré).

### 2026-08-09 — La note Google affichée a une valeur de secours en dur
- **Décision :** `FALLBACK_RATING` dans `src/hooks/useDisplayRating.ts` (5,0 / 32 avis)
  s'affiche par défaut ; la valeur Supabase la remplace dès qu'elle arrive.
- **Pourquoi :** la note venait uniquement de Supabase — tant que la requête n'avait pas
  abouti (ou si elle échouait), ni le visiteur ni Google ne voyaient de note.
- **Conséquences :** **à mettre à jour à la main** quand la vraie note Google bouge, en
  même temps que la saisie dans `/admin/avis`. Sinon le site affiche un chiffre périmé.
