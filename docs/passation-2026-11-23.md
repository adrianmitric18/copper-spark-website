# Note de passation — 23 novembre 2026

Pour la prochaine session. État vérifié le 23/11/2026 : `main` = `origin/main`, rien de non commité,
aucune branche en attente de fusion. Le détail des décisions et des pièges est dans
`memory/decisions.md` (entrées des 21 et 22/11) ; cette note donne la vue d'ensemble.

## 1. Ce qui est fait et en ligne

| Lot | Contenu | Fusion |
|---|---|---|
| Photos des réalisations sur PC | Couverture à 70 % de la hauteur d'écran, avant/après à 75 %, à partir de 1024 px | 21/11 |
| Page bornes | Texte d'Adrian (`docs/page-bornes-texte.md`), certifié Zaptec, FAQ dans le HTML visible, un seul h1 par page, nombre d'avis lu dans `google_rating` au build, certificat Zaptec | 21/11 |
| Cookies et mesure | Google chargé seulement après accord, page `/cookies`, Google Ads retiré, mesure réparée (CSP) | 21/11 |
| Compteur | Compteur anonyme des clics WhatsApp et téléphone de la page bornes, écran `/admin/demandes-bornes` | 22/11 |
| Zaptec Pro | Zaptec Pro pour plusieurs bornes, « surtout Zaptec, Alfen en haut de gamme » sur la page bornes, les pages communes, `/services`, `/faq` | 22/11 |
| Simulateur | La base refusait toutes les demandes du simulateur depuis août (origine absente de `leads_source_allowed`) : corrigé | 22/11 |
| Devis borne avec photos | Formulaire à photos, deux choix sur `/contact`, un seul bouton principal sur la page bornes, `/devis-borne` redirigé | 23/11 |
| Tableaux | « Schneider le plus souvent, ou Hager », Zaptec parmi les marques posées | 23/11 |

Migrations appliquées à la main par Adrian : `20261122090000_compteur_clics`,
`20261122100000_leads_source_simulateur`, `20261122120000_devis_borne_photos`.

Vérifié sur le site en ligne le 23/11 : `/devis-borne` répond 301 vers `/contact?demande=borne` ;
`/contact` a un seul h1 et une adresse canonique unique ; une demande borne marquée TEST est
enregistrée (201) et ses deux e-mails sont acceptés par EmailJS (200).

## 2. Ce qui reste, dans l'ordre convenu

1. **Suppression automatique des photos** (suite du lot devis borne). Règle validée par Adrian, à
   coder puis à lui montrer avant de l'activer. Les photos d'une demande sont effacées quand TOUT
   est vrai : la demande a plus de 6 mois ; son statut n'est pas « Converti » ; elle n'a aucun
   chantier, ni en cours ni terminé ; aucun rendez-vous à venir ; aucun devis envoyé, ou le dernier
   date de plus de 6 mois. Seules les photos partent, la fiche reste, avec une ligne « Photos
   supprimées automatiquement le … » dans ses notes. Vérification à l'ouverture de l'admin.
   Ensuite seulement : ajouter « effacées après 6 mois » dans le formulaire et la politique de
   confidentialité.
2. **Polices hébergées** : Inter et Montserrat servies par le site, plus aucun appel à Google Fonts
   (site et admin). Rétablir alors dans `/cookies` la phrase « aucun outil de Google n'est chargé ».
3. **Pages légales** : mentions légales, confidentialité, CGV. Textes dans le dossier d'Adrian
   `OneDrive\Documents\Bureau\Claude Business\` : `textes-legaux-site-2026-11.md` et, pour les CGV,
   **`cgv-site-version-2026-11-21.md`** (pas la version du 17/07), sans toucher au fond. PDF du
   formulaire de rétractation depuis `/cgv`, ancienne version archivée et non indexée. Publier sans
   les passages [À CONFIRMER] 2 (assurance) et 3 (durée de conservation). Supabase = « Union
   européenne (Irlande) ». GA4 : « cookie : 13 mois au maximum ; données conservées 2 mois chez
   Google ». Mention WhatsApp dans la politique. **Dans ce lot aussi** : les formulaires existants
   (contact, simulateur) mettent dans l'e-mail des liens vers les photos valables 7 jours → les
   retirer (« N photos, visibles dans l'admin »).
4. **Vraie page 404** (code 404 pour les adresses inconnues, en gardant `/admin/*`, `/merci` et
   `/realisations/*` servis par l'application) + fiches `archives-*` en non indexées et hors sitemap.
5. **Lot 3** : simulateur avec Zaptec en premier choix (2 000 – 2 400 €, module, dossier et contrôle
   compris ; Alfen en second, 2 650 – 3 000 €) ; formulaire classique selon la section 4 du dossier
   légal (plus de case « J'accepte », ce qui demande une migration) ; purge des demandes sans suite
   après 12 mois (montrer la règle : aucun client ni devis signé effacé).
6. **Lot 4 — bornes d'abord partout** : accueil, menu, pied de page, données structurées ; proposer
   2 titres et 2 descriptions d'accueil gardant « électricien » et « Brabant wallon » ; écrire les
   liens du sous-menu Services dans le HTML brut ; retirer le photovoltaïque (301). Quelques jours
   après le lot page bornes, pour lire l'effet dans la Search Console.
7. **Dépannage** : grille soir / nuit / dimanche hors du site (elle reste dans l'admin), retrait de
   « 7j/7 », **prix TVA comprise pour les particuliers** (à rappeler à Adrian).
8. **Communes** : Nivelles, Wavre, Genappe (deuxième page de Google, 500 impressions chacune) ; FAQ
   de `/faq` et des pages communes en `<details>` (réponses aujourd'hui absentes du HTML visible).
9. **Accessibilité** : donner la liste de ce qui échoue AVANT de corriger. Pas de mode sombre sur le
   site public.
10. Plus tard : vitesse mobile, `llms.txt` (priorité basse).

### Lot intercalé le 23/11 au soir : fiche d'un lead et liste des leads

Branche `feat/admin-fiche-liste`, en attente du « fusionne » d'Adrian. Aucune migration. Détail
dans `memory/decisions.md` (entrée du 23/11). Après ce lot, la suite ci-dessus reprend au point 1,
sans rien intercaler.

### Idées pour l'admin, à choisir par Adrian après les lots légaux (rien n'est codé)

| # | Idée | Ce qu'elle fait gagner | Travail |
|---|---|---|---|
| 1 | Notes enregistrées toutes seules, sans bouton | Plus de note dictée perdue par oubli d'« Enregistrer » | 2 heures environ |
| 2 | Photos prises pendant la visite, ajoutées à la fiche | Les photos de visite sont avec le client et partent dans « Préparer le devis » | 1 jour environ ; règle du stockage à montrer |
| 3 | Après « Oui, je l'ai eu » : note dictée et RDV sur le même écran | L'appel se termine sans rouvrir la fiche | Une demi-journée |
| 4 | Fiches et RDV du jour lisibles sans réseau | Adresse, demande et notes disponibles dans une cave | 1 à 2 jours |
| 5 | Alerte sur le téléphone à l'arrivée d'une demande | La demande se voit sans ouvrir la boîte mail | 1 à 2 jours ; demande un changement en base |

## 3. En attente du côté d'Adrian
- Passer par « Mise à jour proposée » pour les 17 fiches dont le RDV d'avant le 21/11 est resté
  ouvert (comptage du 23/11 : 37 leads actifs, dont 14 fiches TEST).

- Supprimer les fiches et fichiers TEST (section 6).
- Relire puis appliquer `suppression-regles-deny-lead-photos.sql` (dossier « Claude Business ») :
  les deux règles « Deny … read lead photos » du stockage sont permissives et ouvrent la lecture de
  tout futur dossier privé.
- Redirection `www` → domaine nu dans Cloudflare (clics donnés le 21/11).
- Search Console : demander l'indexation de `/services/bornes-de-recharge` ; donner le nom des deux
  pages « explorées, non indexées ».
- Texte bornes : passages [à confirmer] 5, 7, 9, 10, 11, 13, 14 (pour le 10, la fiche Zaptec donne
  12,7 kW en 3 × 230 V) ; deux ou trois avis qui parlent d'une borne ; vraies photos d'exemple pour
  le formulaire (les schémas actuels sont des dessins provisoires).
- `/faq`, réponse « marques » : **répondu le 23/11** — retirer la mention des onduleurs
  photovoltaïques (Adrian n'en pose plus). À faire dans un lot de contenu, avec les trois contrôles.
- Zaptec Pro : **répondu le 23/11** — aucun prix, « sur devis ».
- Assurance : pas encore de réponse du courtier (23/11). Les pages légales sortent sans la phrase
  sur la zone couverte, comme prévu.
- Admin : vérifier une fiche sans téléphone (boutons Appeler et WhatsApp) ; l'écran « Demandes de
  bornes » n'a pas été vu connecté par Claude.

## 4. Règles à respecter

**Méthode**
- Avis d'abord, rien n'est codé avant l'accord d'Adrian. Un lot à la fois, sur une branche, avec
  aperçu (`<branche-avec-tirets>.copper-spark-website.pages.dev`) et 5 lignes à tester.
- Ne fusionner que lorsqu'Adrian écrit « fusionne ». Les trois contrôles de contenu avant de
  publier un texte ; `/karen` avant de déclarer un lot terminé.
- Une migration est toujours montrée à Adrian avant d'être appliquée. Il l'applique à la main ;
  Claude n'a ni clé de service ni accès à l'admin, et ne peut pas lire la table `leads`.
- **Tout parcours qui écrit en base se vérifie par une vraie insertion** :
  `node scripts/test-insertion-leads.mjs tout` puis `… stockage`. Chaque essai accepté crée une
  fiche TEST à faire supprimer. Toute nouvelle valeur de `leads.source` s'ajoute à
  `leads_source_allowed` ET à la règle d'insertion dans la même migration.
- Après tout changement d'un composant global : `npm run build` en local et lire « N/N routes
  pré-rendues ». Un pré-rendu en échec donne un déploiement vert avec un site cassé. Des
  navigateurs Puppeteer restés ouverts figent le build : les fermer par chemin (`*puppeteer*`),
  jamais tout `chrome.exe`.

**Contenu**
- « Certifié Zaptec », jamais « agréé ». Nous travaillons surtout avec Zaptec (Go 2 pour une
  maison, Pro dès qu'il y a plusieurs bornes), Alfen est le haut de gamme. On ne critique aucune
  marque. « 22 kW » est toujours « jusqu'à ». Aucun prix pour la Zaptec Pro.
- Tableaux : Schneider le plus souvent, Hager aussi. Pas de photovoltaïque.
- Ne jamais inventer d'avis, de chiffre ni de certification. Ne rien publier de marqué « à confirmer ».
- Page bornes : aucun prix avant « Combien coûte une borne de recharge posée ? » ; les fourchettes
  viennent de `BORNE` dans `src/lib/simulateur/config.ts`.
- Un seul h1 par page. Le même texte pour les visiteurs et pour les robots.

**Demandes et vie privée**
- Le client ne doit jamais avoir à choisir entre plusieurs formulaires : un seul endroit, `/contact`,
  avec deux choix. `/devis-borne` n'est pas une page.
- Devis borne : obligatoires = nom, téléphone OU e-mail, code postal ; photos conseillées.
- Photos : dossier privé `lead-photos`, lisible par l'admin seulement, jamais d'adresse publique,
  aucun lien dans un e-mail. Images seulement, 8 Mo au maximum.
- Aucun script Google avant « Tout accepter », rien en cas de refus. Toute nouvelle clé de stockage
  ou tout nouveau cookie s'ajoute au tableau de `src/pages/Cookies.tsx`.
- Le compteur de clics n'enregistre qu'un nombre : ne jamais lui ajouter d'argument.
- CGV : ne pas toucher au fond ; jamais de numéro de compte ni de numéro de police en ligne.

## 5. Où trouver quoi

| Sujet | Fichier |
|---|---|
| Décisions et pièges | `memory/decisions.md` |
| Texte de la page bornes | `docs/page-bornes-texte.md` |
| Questions et photos du devis borne | `src/lib/devis-borne/config.ts` |
| Envoi du devis borne | `src/lib/devis-borne/submit.ts` |
| Formulaire à photos | `src/components/devis-borne/DevisBorneForm.tsx` |
| Les deux choix de la page contact | `src/pages/Contact.tsx` |
| Chargement de Google après accord | `src/lib/analytics/gtag.ts` |
| Compteur anonyme | `src/lib/compteur.ts` |
| Test d'insertion en base | `scripts/test-insertion-leads.mjs` |
| Plan SEO d'origine | `PLAN-SEO-GEO.md` |

## 6. Fiches et fichiers TEST à supprimer

Créés par les essais des 22 et 23/11. Certains ont peut-être déjà été supprimés.

**Fiches dans les leads** (les dates dans les noms sont celles du jour de l'essai, 22 ou 23/11)

| Nom de la fiche | Nombre créé |
|---|---|
| TEST — à supprimer (vérification simulateur 22/11) | 1 |
| TEST Claude (à supprimer) | 1 |
| TEST simulateur 2026-11-22 (à supprimer) | 3 |
| TEST contact 2026-11-22 (à supprimer) | 3 |
| TEST devis borne 2026-11-22 (à supprimer) | 2 |
| TEST devis borne tel 2026-11-22 (à supprimer) | 2 |
| TEST devis photos Claude (à supprimer) | 2 |
| TEST e-mail en ligne 23/11 (à supprimer) | 1 |

S'y ajoute la demande envoyée par Adrian depuis son téléphone pour tester l'aperçu.
Les fiches « TEST devis borne tel » pointent vers cinq photos qui n'existent pas (`t1.jpg` à
`t5.jpg`) : l'admin affichera des photos introuvables.

**Fichiers dans le dossier `lead-photos`** (Supabase, Storage)

- `test-1795373077219-9fcjm`
- `test-1795373077996-xhwd7`
- `test-1795373078348-fjloj`
- `test-1795373078774-r3gxx` (9 Mo)
- `test-1795373932809-eudgm`
- `test-1795378403137-0hl0s`
- `devis-borne/1795375650473-t8qbye6-compteur.jpg`
- `devis-borne/1795375652821-6kwpogc-trajet.jpg`
- `devis-borne/1795378326568-8lebseh-compteur.jpg`
- `devis-borne/1795378329072-0spfwhl-trajet.jpg`

Les quatre fichiers `devis-borne/…` partent tout seuls quand les deux fiches « TEST devis photos
Claude » sont supprimées depuis l'admin.
