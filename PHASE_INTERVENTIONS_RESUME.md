# Phase Interventions — Résumé livrable

**Branche** : `feat/interventions` (depuis `main` à `65b0393`)
**Phases livrées** : 1 + 2 + 3 (périmètre complet)
**Statut** : prêt à valider, pas encore mergé sur `main`

## 📋 Sommaire

1. [Liste des commits](#liste-des-commits)
2. [Architecture livrée](#architecture-livrée)
3. [Migration SQL à appliquer](#migration-sql-à-appliquer)
4. [6 aperçus templates (cas Véronique)](#6-aperçus-templates-cas-véronique)
5. [Procédure de tests step-by-step](#procédure-de-tests-step-by-step)
6. [Procédure de rollback](#procédure-de-rollback)
7. [Bugs / améliorations identifiés en passant](#bugs--améliorations-identifiés-en-passant)
8. [Notes implémentation](#notes-implémentation)

---

## Liste des commits

11 commits atomiques sur `feat/interventions` (le 12e étant ce résumé) :

| # | Hash | Phase | Sujet |
|---|------|-------|-------|
| 1 | `4e12afc` | P1 | feat(interventions): migration SQL + types Supabase |
| 2 | `1cf6ac9` | P1 | feat(interventions): lib métier + zod schema + helper Calendar range |
| 3 | `d0d73e0` | P1 | feat(messages): templates chantier confirmation (SMS/WA/Email) |
| 4 | `c669cbd` | P1 | feat(leads): bouton + dialog "Programmer le chantier" |
| 5 | `3c9acd7` | P1 | feat(interventions): écran succès 4 boutons + carte de lecture sur fiche lead |
| 6 | `28a2111` | P2 | feat(interventions): page /admin/interventions index + filtres temporels |
| 7 | `0392dc0` | P2 | feat(messages): templates rectification chantier (mise à jour planning) |
| 8 | `821cbb7` | P2 | feat(messages): templates annulation chantier (SMS/WA/Email) |
| 9 | `d9d8e7c` | P2 | feat(interventions): modification + annulation + écran rectification |
| 10 | `f45ba63` | P3 | feat(admin): badge "X chantiers cette semaine" sur dashboard |
| 11 | `dcee018` | P3 | feat(interventions): bouton "Transformer en chantier vitrine" |

**Note plan vs réalité** :
- 5 commits Phase 1 prévus → 5 livrés ✅
- 5 commits Phase 2 prévus → 4 livrés. Le 5e prévu ("templates spécialisés par type") a été constaté **déjà couvert** par les commits 3, 7 et 8 : les templates utilisent déjà `TYPE_CONFIGS[typeIntervention].programme`/`.prerequis`/`.shortLabel` qui spécialisent automatiquement par type. Pas de commit cosmétique inventé.
- 2 commits Phase 3 prévus → 2 livrés ✅. La vue calendrier mensuelle (3e commit P3) avait été explicitement skippée d'un commun accord.

**Validations** : typecheck OK · lint OK (5 warnings pré-existants `Aujourdhui.tsx` non liés) · build prod OK (~11s).

---

## Architecture livrée

### BDD
Nouvelle table `public.interventions` avec FK vers `leads` (CASCADE) et `projects` (SET NULL pour le lien vitrine optionnel). Statuts : `programme` / `en_cours` / `termine` / `reporte` / `annule`. RLS admin only via `is_admin()`.

### Code

```
src/
├── lib/admin/
│   ├── interventions.ts          ← types, zod, CRUD, helpers, transformToProject
│   ├── google-calendar-link.ts   ← + buildGoogleCalendarRangeUrl (multi-jours)
│   └── message-templates.ts      ← + 15 fonctions chantier (confirm × rectif × annul × 3 supports)
├── components/admin/
│   ├── InterventionDialog.tsx           ← création/édition
│   ├── InterventionCard.tsx             ← lecture sur fiche lead
│   ├── InterventionSuccessScreen.tsx    ← 4 boutons (modes confirmation | rectification)
│   └── InterventionAnnulationDialog.tsx ← 2 étapes (form raison + 3 boutons SMS/WA/Email)
├── admin/pages/
│   └── Interventions.tsx         ← /admin/interventions index + filtres temporels
├── pages/admin/
│   └── LeadDetail.tsx            ← intégration : bouton, fetch, handlers
├── admin/layout/Sidebar.tsx      ← entrée "Chantiers" (icône HardHat)
├── admin/pages/Aujourdhui.tsx    ← KPI badge cliquable "Chantiers cette semaine"
└── App.tsx                       ← route /admin/interventions
```

### Workflow

```
1. /admin/lead/:id : bouton "Programmer le chantier"
   ↓
2. Dialog : type, date début/fin, heure début/fin, notes client/internes
   ↓ (warning ⚠️ si week-end inclus, non bloquant)
3. createIntervention → INSERT BDD
   ↓
4. Écran succès : Calendar (multi-jours) / SMS / WhatsApp / Email (texte + HTML)
   ↓
5. Lecture : carte sur fiche lead avec boutons Modifier / Renvoyer / Annuler / Transformer
   ↓ (modif → écran rectification, annul → dialog 2-étapes, transform → /admin/chantiers/:id)
6. Index /admin/interventions : filtres temporels (à venir / en cours / terminées / toutes)
```

---

## Migration SQL à appliquer

⚠️ **À pousser via Lovable AVANT de tester** (ou via SQL editor Supabase). Sinon l'INSERT plantera sur la table `interventions` qui n'existe pas encore.

Fichier : `supabase/migrations/20260429140000_interventions.sql`

Crée la table avec contraintes CHECK (7 types valides, 5 statuts valides, dates cohérentes), 4 index, trigger updated_at, et policy RLS admin-only.

---

## 6 aperçus templates (cas Véronique)

**Données utilisées** :
- Cliente : Véronique Fauvarque
- Type : Inspection RGIE
- Dates : lundi 4 mai → mardi 5 mai 2026
- Horaires : 8h - 17h chaque jour
- Adresse : Rue X 12, 1300 Wavre

### 1. SMS confirmation chantier

```
🔌 Le Cuivre Électrique
Bonjour Véronique Fauvarque, votre chantier inspection rgie est planifié :
📅 lundi 4 mai → mardi 5 mai
🕐 8h - 17h chaque jour
📍 Rue X 12, Wavre
Je vous appelle la veille pour finaliser.
🌐 cuivre-electrique.com
Adrian Mitric - 0485 75 52 27
```

### 2. WhatsApp confirmation chantier

```
⚡ *Le Cuivre Électrique*

Bonjour Véronique Fauvarque 👋

Je vous confirme la planification de votre chantier *inspection rgie*.

📅 *lundi 4 mai 2026 → mardi 5 mai 2026*
🕐 *8h - 17h chaque jour*
📍 *Rue X 12, 1300 Wavre*

🔧 *Au programme :*
✓ Contrôle complet de la conformité au Règlement Général sur les Installations Électriques
✓ Mesures d'isolement, de continuité et de mise à la terre
✓ Vérification du tableau, des disjoncteurs différentiels et de la sélectivité
✓ Rapport de conformité remis en fin de visite

📋 *À prévoir avant le chantier :*
• Plans de l'installation (en cas de rénovation récente)
• Procès-verbal d'inspection précédent si vous en avez un
• Accès libre et dégagé au tableau électrique

Je vous appelle la veille pour finaliser les derniers détails.

À bientôt,
Adrian Mitric
🌐 cuivre-electrique.com
📱 0485 75 52 27
```

### 3. Email confirmation chantier (plaintext)

**Sujet** : `Confirmation chantier inspection rgie — 04/05 → 05/05`

```
Bonjour Véronique Fauvarque,

Suite à votre acceptation du devis, je vous confirme la planification de votre chantier inspection rgie.

INFORMATIONS PRATIQUES
Dates    : lundi 4 mai 2026 → mardi 5 mai 2026
Horaires : 8h - 17h chaque jour
Lieu     : Rue X 12, 1300 Wavre

AU PROGRAMME
- Contrôle complet de la conformité au Règlement Général sur les Installations Électriques
- Mesures d'isolement, de continuité et de mise à la terre
- Vérification du tableau, des disjoncteurs différentiels et de la sélectivité
- Rapport de conformité remis en fin de visite

À PRÉVOIR AVANT LE CHANTIER
- Plans de l'installation (en cas de rénovation récente)
- Procès-verbal d'inspection précédent si vous en avez un
- Accès libre et dégagé au tableau électrique

Je vous appelle la veille pour finaliser les derniers détails.

En savoir plus sur ce service :
https://cuivre-electrique.com/services/mise-en-conformite-rgie

Bien cordialement,
Adrian
```

> Le bouton "Copier HTML stylé" copie une version HTML avec header noir/orange, tableau encadré, sections "Au programme" / "À prévoir", note encart crème si présente, et signature "Bien cordialement, Adrian" (sans coordonnées — ta signature Gmail prend le relais).

### 4. SMS rectification (dates décalées au 5-6 mai)

```
🔌 Le Cuivre Électrique
Bonjour Véronique Fauvarque, mise à jour du planning de votre chantier inspection rgie :
📅 mardi 5 mai → mercredi 6 mai
🕐 8h - 17h chaque jour
📍 Rue X 12, Wavre
Merci de noter ces nouvelles dates.
🌐 cuivre-electrique.com
Adrian Mitric - 0485 75 52 27
```

### 5. WhatsApp rectification

```
⚡ *Le Cuivre Électrique*

Bonjour Véronique Fauvarque 👋

Je reviens vers vous pour une *mise à jour du planning* de votre chantier *inspection rgie*.

📅 *mardi 5 mai 2026 → mercredi 6 mai 2026*
🕐 *8h - 17h chaque jour*
📍 *Rue X 12, 1300 Wavre*

Le reste de l'organisation prévue ne change pas. Si une question, n'hésitez pas.

À bientôt,
Adrian Mitric
🌐 cuivre-electrique.com
📱 0485 75 52 27
```

### 6. Email rectification (plaintext)

**Sujet** : `Mise à jour planning inspection rgie — 05/05 → 06/05`

```
Bonjour Véronique Fauvarque,

Je reviens vers vous pour une mise à jour du planning de votre chantier inspection rgie.

NOUVEAU PLANNING
Dates    : mardi 5 mai 2026 → mercredi 6 mai 2026
Horaires : 8h - 17h chaque jour
Lieu     : Rue X 12, 1300 Wavre

Le reste de l'organisation prévue ne change pas — programme et points à prévoir restent identiques.

Si une question, n'hésitez pas à me joindre.

Bien cordialement,
Adrian
```

---

## Procédure de tests step-by-step

### Préparation (2 min)

1. **Appliquer la migration SQL** dans Supabase (via Lovable ou SQL editor) :
   `supabase/migrations/20260429140000_interventions.sql`
2. Vérifier dans Supabase que la table `interventions` existe avec les bonnes colonnes.
3. Build local : `npm run build` → doit passer.

### Test 1 — Création chantier 2 jours (cas Véronique) (3 min)

1. Aller sur `/admin/lead/<id-veronique>` (fiche Véronique Fauvarque).
2. Section "Chantiers programmés" → bouton **"Programmer le chantier"**.
3. Dans le dialog :
   - Type : `Inspection RGIE` (auto-deviné depuis services du lead)
   - Date début : `2026-05-04` · Date fin : `2026-05-05`
   - Heure début : `08:00` · Heure fin : `17:00`
   - Note pour le client : (laisser vide)
4. Vérifier : pas de warning week-end (lundi-mardi).
5. Cliquer **"Confirmer le chantier"** → toast succès + ouverture écran 4 boutons.
6. Sur l'écran succès :
   - Cliquer **"Ajouter à Google Calendar"** → vérifier que l'événement couvre lundi 4 mai 8h → mardi 5 mai 17h dans Google.
   - Cliquer **"SMS"** → app SMS s'ouvre avec le texte (cf aperçu §1 ci-dessus).
   - Cliquer **"WhatsApp"** → wa.me s'ouvre avec le texte (cf §2).
   - Cliquer **"Ouvrir email (texte)"** → app mail avec sujet + body texte (cf §3). **Aucun "+" suspect** (fix RFC 6068 hérité de la phase précédente).
   - Cliquer **"Copier HTML stylé"** → toast confirme, coller dans Gmail web : doit apparaître avec header noir/orange et sections.

### Test 2 — Lecture + carte (1 min)

1. Fermer l'écran succès.
2. La section "Chantiers programmés" affiche maintenant la carte avec :
   - Type, plage longue capitalisée, horaires, badge "Programmé" bleu.
   - Boutons : Renvoyer confirmation · Modifier · Transformer en chantier vitrine · Annuler.

### Test 3 — Modification + écran rectification (2 min)

1. Cliquer **"Modifier"** sur la carte.
2. Dialog rouvre avec valeurs pré-remplies. Décaler les dates au `2026-05-05` → `2026-05-06`.
3. Cliquer **"Mettre à jour"** → toast "Planning mis à jour" + écran rectification s'ouvre.
4. Vérifier que les 4 boutons utilisent maintenant les **templates rectification** ("mise à jour de votre planning" — cf aperçus §4-§6).
5. Fermer.

### Test 4 — Renvoyer confirmation (30 s)

1. Sur la carte, cliquer **"Renvoyer confirmation"**.
2. Vérifier que l'écran s'ouvre en mode **confirmation** (pas rectification) avec les dates actuelles.

### Test 5 — Annulation (2 min)

1. Cliquer **"Annuler"** sur la carte.
2. Dialog d'annulation : saisir une raison ex. "imprévu personnel".
3. Cliquer **"Confirmer l'annulation"** → bascule sur l'étape "confirmed".
4. Vérifier que les 3 boutons (SMS/WA/Email) ouvrent les templates d'annulation avec la raison.
5. Fermer. La carte affiche maintenant le badge **"Annulé"** rouge et masque les boutons d'action.
6. Vérifier que la raison apparaît dans les **notes internes** de l'intervention (préfixée `[Annulation]`).

### Test 6 — Page index + filtres (2 min)

1. Cliquer **"Chantiers"** dans la sidebar admin.
2. Page `/admin/interventions` charge. Vérifier les 4 filtres avec compteurs.
3. Filtre "À venir" doit lister les interventions au statut `programme` avec `date_debut >= aujourd'hui`.
4. Filtre "Toutes" doit lister TOUT (incluant l'annulée du test 5).
5. Cliquer une carte → doit naviguer vers `/admin/lead/<lead_id>`.
6. Vérifier que l'URL passe à `?filter=in_progress` quand on clique le filtre, mais pas pour `?filter=upcoming` (default omis).

### Test 7 — Badge dashboard (1 min)

1. Aller sur `/admin` (Aujourd'hui).
2. Vérifier la 5e KPI **"Chantiers cette semaine"** dans la grille.
3. Compteur doit refléter les interventions actives chevauchant [aujourd'hui, +7j].
4. Cliquer la card → doit ouvrir `/admin/interventions?filter=upcoming`.

### Test 8 — Transformer en chantier vitrine (3 min)

1. Reprendre l'intervention Véronique (ou en créer une nouvelle non annulée).
2. Cliquer **"Transformer en chantier vitrine"** sur la carte.
3. Toast "Brouillon créé" + redirection automatique vers `/admin/chantiers/<projectId>`.
4. Dans l'éditeur de chantier, vérifier le pré-remplissage :
   - Title : `Inspection RGIE – Wavre` (ou similaire)
   - Slug : généré (ex. `inspection-rgie-wavre-2026-05`)
   - Location : commune du lead
   - Zone : "Brabant wallon"
   - Completed_at : date_fin de l'intervention
   - Duration_days : nb jours inclusif
   - Status : draft
5. Retourner sur `/admin/lead/<id>` → la carte affiche désormais "Lié à un chantier vitrine" et le bouton "Transformer" disparait.

### Total : ~14 min en suivant tout

---

## Procédure de rollback

### Option A — Pas encore mergé sur main (situation actuelle)
Rien à faire. La branche `feat/interventions` n'affecte pas `main`. Tu peux la garder, l'oublier, ou la supprimer.

### Option B — Si déjà mergé sur main (après ta validation)
Procédure standard pour cette feature :

```bash
# 1. Tag de sauvegarde avant le merge (à faire AVANT le merge)
git tag -a backup-before-interventions-2026-04-29 -m "Backup avant interventions"
git push origin backup-before-interventions-2026-04-29

# 2. Merge --no-ff
git merge --no-ff feat/interventions

# 3. Push
git push origin main

# Rollback ultérieur si problème : revert propre
git revert -m 1 <merge-commit-hash>
git push origin main

# Ou en dernier recours : reset hard
git reset --hard backup-before-interventions-2026-04-29
git push --force-with-lease origin main
```

### ⚠️ Côté Supabase
La migration SQL ne sera pas auto-revertée. Pour nettoyer :

```sql
DROP TABLE IF EXISTS public.interventions CASCADE;
DROP FUNCTION IF EXISTS public.touch_interventions_updated_at;
```

Aucun risque de fuite : la table est en RLS admin-only, pas exposée publiquement.

---

## Bugs / améliorations identifiés en passant

> **À discuter ensemble plus tard, NON codés dans cette phase**.

### 🟠 Casse acronymes dans templates chantier

Le SMS/WhatsApp/Email affiche `inspection rgie`, `panneaux pv`, `pose borne` (au lieu de `inspection RGIE`, `panneaux PV`, `installation borne` avec accord). C'est exactement le même bug que celui qu'on avait corrigé pour les templates RDV via le champ `confirmedLabel`.

**Fix futur** : ajouter à `TYPE_CONFIGS` un champ `chantierLabel` (ou réutiliser `shortLabel` sans `.toLowerCase()`) avec une formulation pré-validée par type :
- `"inspection RGIE"` (acronyme préservé)
- `"installation de borne"` (article)
- `"installation de panneaux photovoltaïques"`
- etc.

Ce serait un commit ~10 min, similaire à `fix(sms): accord grammatical via confirmedLabel`.

### 🟡 Pas de notification au client si modif rapide après création

Si tu crées un chantier pour Véronique puis tu te rends compte 1 minute après que tu as inversé une date, tu vas appeler l'écran rectification → templates "mise à jour de votre planning" → **mais le client n'a pas encore reçu le 1er message**. Du coup la rectification arrive sans contexte.

**Pas urgent** : tu sauras gérer ce cas en envoyant directement la confirmation initiale corrigée plutôt que la rectification.

### 🟡 Suppression événement Google Calendar manuelle après annulation

L'écran d'annulation rappelle qu'il faut supprimer manuellement l'événement Calendar. Ce n'est pas automatisable sans API Google Calendar (out of scope ici, le projet utilise des liens pré-remplis).

### 🟡 Pas de lien depuis chantier vitrine vers intervention source

Une fois la transformation faite, tu vois "Lié à un chantier vitrine" sur la carte intervention, mais pas l'inverse côté éditeur de chantier. Si tu modifies un chantier vitrine et te demandes "c'était quel client à l'origine ?", il faut chercher.

**Fix futur** : afficher un lien vers le lead/intervention source dans `ChantierEditor.tsx` si `intervention` lié.

### 🟡 Filtres temporels sans persistance par session

Si tu cliques `?filter=in_progress` puis tu changes de page et reviens, c'est revenu sur "à venir" (default). Le filtre n'est mémorisé que dans l'URL active. Si c'est gênant, on pourrait persister en localStorage.

### 🟢 Vue calendrier mensuelle (skippée volontairement)

Pour rappel, la vue calendrier interne avait été skippée d'un commun accord (économie ~1h, Google Calendar fait déjà le job). À ré-évaluer si tu veux un aperçu rapide sans sortir de l'admin.

### 🟢 Génération du slug du chantier vitrine

Le slug auto-généré est correct mais peu sexy : `inspection-rgie-wavre-2026-05`. À toi d'éditer dans le ChantierEditor pour quelque chose de plus marketing avant publication. Pas un bug, un choix de design.

### 🟢 Onglet "Chantiers" dans Sidebar (icône)

J'ai utilisé `HardHat` pour distinguer de l'entrée "Réalisations" (qui utilise `Hammer`). Si la distinction visuelle n'est pas claire, tu peux rebasculer sur d'autres icônes Lucide (Construction, Wrench, etc.).

---

## Notes implémentation

- **WhatsApp web link** : utilise `wa.me/<phone>?text=` pré-existant. Le numéro est normalisé (préfixe `32` pour BE).
- **mailto encoding** : conforme RFC 6068 (`%20` au lieu de `+`) hérité de la phase précédente.
- **Multi-jours Google Calendar** : 1 seul événement qui couvre toute la plage (lundi 8h → mardi 17h en bloc continu). Si tu préfères N événements (1 par jour), à voir en V2.
- **Validation week-end** : warning visuel non bloquant. Pas de check des fériés belges (volontairement out of scope).
- **Annulation et raison** : la raison saisie dans le dialog est ajoutée aux notes_internes de l'intervention (préfixée `[Annulation]`) pour traçabilité historique côté admin.
- **Rectification** : statut reste `programme` (la rectification n'introduit pas de statut spécial). La modif elle-même est tracée par `updated_at` automatique via trigger PG.
- **Mappage services → type** : heuristique simple sur lead.services lower-cased (`rgie`, `dépann`, `borne`, `photovolta`, `installation`...). L'admin peut surcharger dans le dialog.

---

**Branche prête à valider et merger.** Quand tu auras testé les 8 étapes ci-dessus en prod, dis-moi GO et je lance la procédure de merge standard (tag de sauvegarde → merge --no-ff → push).
