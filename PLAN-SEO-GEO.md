# PLAN-SEO-GEO.md — Mieux classé sur Google, lu et cité par les IA (2026-11)

> **Source de vérité** pour le chantier SEO/GEO (brief d'Adrian du 2026-11-15, plan validé le même
> jour). Un lot = une branche = un commit = Adrian teste = lot suivant. Ne rien casser dans l'admin.
> Le plan admin reste dans `PLAN.md`.

## Faits métier (font foi, viennent d'Adrian)
- Horaires : **lundi–samedi 7h–19h**, dimanche fermé, urgences 7j/7. Une seule constante partout.
- Délais : **« Réponse sous 24h »** + **« Devis gratuit sous 48h »**. Unifier partout.
- Bornes : **Zaptec en premier** (choix de base), Alfen (haut de gamme), Hager et Wallbox aussi.
  Phrase à ajouter (page bornes + FAQ) : « Vous avez déjà acheté votre borne ? On l'installe aussi.
  Dans ce cas, notre garantie couvre la pose et les raccordements ; la garantie du produit reste
  celle du vendeur ou du fabricant. »
- **Pas de photovoltaïque** (page à rediriger en 301, retirer partout sauf admin).
- Zones affichées partout : Brabant wallon, **province de Namur**, **Bruxelles**.
- Nikoconstruct : entreprise générale du père d'Adrian, Court-Saint-Étienne, pas de site. Rénovations
  complètes : Nikoconstruct = murs, carrelage, plomberie, gros œuvre ; Le Cuivre Électrique =
  électricité, éclairage, chauffage.
- Assurance : écrire seulement « assuré en responsabilité civile professionnelle ». Aucune certification.
- Fiche Google : lien avis `https://g.page/r/CVLZZFVq3KkiEBM/review` (URL Maps à dériver du Place ID).
  **Pas de LinkedIn.**
- Avis : **pas d'aggregateRating** en JSON-LD. Texte des avis dans le HTML brut (/avis + 3-4 avis sur
  l'accueil et les pages services), note et nombre réels en texte, lien vers la fiche Google.
- Ne jamais inventer d'avis, de chiffres, de certifications.

## Lots (ordre = impact sur les appels)

- [x] **Lot 1 — Réalisations indexables** (branche `feat/seo-realisations-indexables`)
  - [x] Snapshot des réalisations publiées au build (`scripts/fetch-realisations.mjs` →
        `.generated/realisations.json`, module virtuel `virtual:realisations`).
  - [x] Pré-rendu d'une page HTML par réalisation + liste `/realisations` complète dans le HTML.
  - [x] Sitemap depuis le même snapshot (lastmod = `updated_at`).
  - [x] Fiche : OG aux vraies dimensions de la couverture, `width/height` sur la couverture,
        JSON-LD Article enrichi (`about` = service, `locationCreated`).
  - [x] Maillage : fiche → service + zone + simulateur ; pages services et zones → réalisations liées.
  - [x] Chantiers fictifs (placeholders) retirés de `/realisations`.
  - [ ] ⛔ **Adrian** : créer le Deploy Hook Cloudflare + le webhook Supabase (clics fournis le 15/11).
  - [ ] ⛔ **Adrian** : Search Console → soumettre le sitemap ; Bing Webmaster Tools → importer le site.
- [ ] **Lot 2 — Vitesse mobile** : pas d'animation d'entrée quand le HTML est déjà rendu, Supabase et
      framer-motion hors du chemin critique de l'accueil, polices auto-hébergées + preload. Mesure
      avant/après (référence 15/11 : perf 60, LCP 8,4 s, FCP 4,4 s sur l'accueil).
- [ ] **Lot 3 — Faits et identité** : retrait photovoltaïque (301, menus, footer, JSON-LD, sitemap,
      zones, FAQ, simulateur ; pas l'admin), Zaptec en avant, horaires/délais en une constante, JSON-LD
      Electrician (sameAs fiche Google, founder, foundingDate 2023, areaServed Namur + Bruxelles,
      knowsAbout).
- [ ] **Lot 4 — Textes pour les IA** : premier paragraphe « réponse directe » (accueil, services,
      zones), FAQ + 8 questions, À propos factuel, section « ce qui nous distingue », avis dans le HTML
      brut (/avis, accueil, services). Gates contenu : devils-advocate → sentinel → eagle-supervisor.
- [ ] **Lot 5 — llms.txt / llms-full.txt / 404** propre pour les fichiers inexistants avec extension.
- [ ] **Lot 6 — Villers-la-Ville** + proposition argumentée de 3 à 5 communes (une page par lot ensuite).
- [ ] **Lot 7 — Finitions** : liens cassés, redirections en chaîne, canonical accueil, contraste et ordre
      des titres, cache des assets.

## Vérification à la fin de chaque lot
1. `curl -A Googlebot` sur chaque URL du sitemap : title, description, h1 et texte propres à la page.
2. `/llms.txt`, `/llms-full.txt` en `text/plain` ; URL `.txt` inexistante → 404 (à partir du lot 5).
3. `/robots.txt` : aucun blocage des robots IA, lien vers le sitemap.
4. validator.schema.org : accueil, une page service, une page zone, une réalisation, la FAQ.
5. Lighthouse mobile avant/après (en local : `npx lighthouse <url> --form-factor=mobile`).
6. `/karen` avant de déclarer le lot terminé.
7. Liste pour Adrian : Search Console (sitemap, indexation des nouvelles pages), Bing Webmaster Tools.
