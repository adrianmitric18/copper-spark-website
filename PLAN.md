# PLAN.md — Redesign & extension de l'admin (Le Cuivre Électrique)

> **Source de vérité unique.** En cas de doute, ce fichier tranche (pas la mémoire de conversation).
> Branche de travail : `feat/intake-telephone` (PHASE 6, créée depuis `main` à jour ;
> `redesign/admin-cockpit` déjà mergée dans `main`). **Jamais de merge sur `main` sans OK explicite d'Adrian.**

## 🎯 Objectif
Outil admin **ultra rapide pour un électricien solo, pressé, sur son téléphone** (PWA Android),
propre aussi sur PC. Redesign de l'**expérience**, pas du backend.

## 🚧 Rails non négociables
1. Branche dédiée + preview Cloudflare. **Pas de merge sur `main` sans OK.**
2. **STOP avant tout changement DB** (champ/contrainte/migration). Je fournis le SQL, Adrian l'applique sur la prod.
3. On **garde le moteur** : tables Supabase, EmailJS, 13 types de RDV, checklist.
4. On ne **supprime rien** : l'ancien code est **commenté**, pas effacé.
5. **STOP avant tout coût récurrent / infra neuve** (cron, edge function, API payante, push).

Légende : ♻️ = réutilise l'existant (rapide) · 🆕 = demande du neuf · ⛔ = bloqué tant qu'Adrian n'a pas agi.

---

## PHASE 0 — Fondations

- [ ] **0.1 — Auth qui reste connectée** ♻️
  - **Bug identifié** : `src/hooks/useAdminAuth.ts` déconnecte après **24 h d'inactivité**
    (`INACTIVITY_LIMIT_MS`). Un solo qui n'ouvre pas l'app chaque jour doit refaire le lien magique
    en permanence.
  - **Fix appliqué** : limite portée à **30 jours** (mono-utilisateur, accès sur son propre tél,
    gardé par lien magique). Ancienne valeur **commentée** (rail 4). `persistSession` +
    `autoRefreshToken` déjà actifs → la session se rafraîchit toute seule.
  - **À vérifier avec Adrian si ça déconnecte encore** (causes possibles hors code) :
    Android qui purge le `localStorage` du PWA, ou « effacer les données du site » activé.
- [ ] **0.2 — ⛔ Migration types RDV (À FAIRE PAR ADRIAN)**
  - La migration `supabase/migrations/20260606130000_rdv_types_unifies_13.sql` **doit être appliquée
    à la prod**. Sans elle, **toute confirmation de RDV depuis la fiche lead plante**
    (CHECK `rdv_type_visite_valide` encore sur 7 valeurs, le form en envoie 13 → erreur 23514).
  - Voie propre : `supabase db push` (applique aussi `add_display_order` + `google_rating_cache`,
    à confirmer via `supabase migration list`). Voie ciblée : coller le SQL puis
    `supabase migration repair --status applied 20260606130000`.
- [ ] **0.3 — Config preview → Supabase (À FAIRE PAR ADRIAN, voir section dédiée plus bas)**
  - Variables `VITE_SUPABASE_*` dans Cloudflare Pages (Production **et** Preview).
  - Whitelister l'URL de preview dans Supabase → Auth → URL Configuration (sinon le lien magique
    ne revient pas sur la preview et on ne peut pas tester l'admin).

## PHASE 1 — Redesign structure (écran par écran) — **CHECKPOINT après cette phase**
- [x] **1.1 — Navigation unifiée** : barre d'onglets en bas sur mobile (pouce), nav latérale sur desktop.
      4 entrées : `Aujourd'hui · Leads · Chantiers · Plus`. Ancien hamburger conservé sous « Plus ». ✅ fait
- [x] **1.2 — Cockpit « Aujourd'hui »** : itinéraire 1 tap ajouté sur les RDV du jour (Appeler existait déjà).
      Le cockpit (KPIs, à faire aujourd'hui, 7 prochains jours, sources) était déjà solide. ✅ fait
      *(Confirmer/Checklist en 1 tap depuis la carte → à voir avec 1.3/1.6.)*
- [x] **1.3 — Fiche lead allégée** : barre d'actions figée en haut (Appeler / Itinéraire /
      WhatsApp ou Caler RDV) **+ cartes secondaires repliables** (CollapsibleCard : Détails ouverte,
      Actions / Réponses rapides / Zone dangereuse fermées par défaut). ✅ fait (complet).
- [x] **1.4 — « Leads » en liste filtrable** : renommage + **kanban → liste verticale** avec chips
      de statut (Tous + 5 statuts, compteurs), recherche conservée. Choix validé par Adrian
      (« liste filtrable »). Ancien board commenté (rail 4). ✅ fait (complet).
- [x] **1.5 — « Contenu »** : libellé au-dessus de Réalisations + Avis dans la sidebar. ✅ fait.
- [x] **1.6 — Confirmation unifiée** : email auto si vrai email (web), sinon bascule SMS/WhatsApp
      (tél) sans planter ; échec email ne perd plus le RDV. ✅ fait *(dépendait de 0.2, appliqué)*.
- [x] **→ Push preview + POINT avec Adrian. Validation direction avant Phase 2.**

## PHASE 2 — Quick wins (réutilise l'existant)
- [x] **2.1 — Rappel J-1 en 1 tap** ♻️ : carte « Rappels demain » sur le cockpit → SMS/WhatsApp
      pré-remplis + bouton Email (`sendRappelJ1Emails`, déjà codé) qui marque le RDV « rappel_envoye ».
      **Pas de cron** (rail 5) : envoi manuel groupé. ✅ fait
- [x] **2.2 — Réponses rapides** ♻️ : 4 messages types (SMS/WhatsApp) sur la fiche. ✅ fait
- [x] **2.3 — Recherche client mobile** ♻️ : bouton loupe (topbar) qui ouvre la palette réutilisée. ✅ fait
- [ ] **2.4 — Checklist « à ramener / reste à faire »** ⛔ **STOP DB** : `checklist_items.checklist_type`
      a une contrainte CHECK `('rgie','pv','borne','installation','generique')`. Ajouter un type dédié
      = changement DB. **SQL proposé ci-dessous, à appliquer par Adrian.** Implémentation UI ensuite.
- [x] **2.5 — Dictée vocale sur la fiche** 🆕 : micro sur les notes internes (Web Speech API), masqué
      si non supporté. ✅ fait. **Filet « mémo audio » ⛔ STOP** : demande un bucket storage dédié
      (`lead-audio`) + policies → à valider (voir ci-dessous).

## PHASE 3 — Relances devis ⛔ (DB)
- [ ] **3.1 — STOP : champ `devis_envoye_at`** sur `leads` → je fournirai le SQL, Adrian applique.
- [ ] **3.2 — Paliers J+3/7/14** ♻️ (templates déjà écrits) en 1 tap depuis « Aujourd'hui ».

## PHASE 4 — Suivi devis « argent en attente » ⛔ (DB)
- [ ] **4.1 — STOP : champs `devis_montant` + `devis_statut`** (envoyé/accepté/refusé) → SQL fourni, Adrian applique.
- [ ] **4.2 — Vue « CA en attente »** : total des devis envoyés non tranchés.

## MODULE — Coffre à documents ⛔ (DB + storage à valider)
- [ ] **M.1 — STOP : table/bucket documents** par client/chantier (factures, photos, pièces).
      Exportable pour le comptable. **PAS** de génération de factures (e-facturation Peppol = outil externe certifié).

## 💡 Mes idées ajoutées (chacune justifiée « gagne du temps » / « gère plus de monde »)
- [ ] **I.1 — Détection doublon de lead** ♻️ : à la création, alerte si le **téléphone** existe déjà
      (le form public ET le RDV rapide créent des leads → évite les fiches en double quand le volume monte).
- [ ] **I.2 — Anti-doublon RDV / rollback** ♻️ : si l'envoi de confirmation échoue, ne pas laisser un RDV
      orphelin re-créable en double (corrige un risque réel repéré dans `LeadDetail.handleRdvSubmit`).
- [ ] **I.3 — « Prochaine action » par lead** ♻️ : un libellé clair (Appeler / Relancer / RAS) calculé
      depuis statut + dernier contact, pour vider le cerveau et ne rien oublier.

## PHASE 5 — Proposition « terrain & argent » (carte blanche, 2026-06-17) — 🟡 À VALIDER AVEC ADRIAN
> Liste consolidée présentée à Adrian le 2026-06-17. **Aucun code tant qu'elle n'est pas tranchée.**
> Effort : S (≤½j) · M (1-2j) · L (3j+/risqué). 🟥 = SQL à appliquer par Adrian · 🟦 = brique infra (OK requis).
> Note : A1/A2 recoupent Phase 3-4, B1 recoupe 2.4, C2/C3/C4 recoupent I.1/I.3/I.2 (regroupés ici par priorité).

### Bloc A — Argent : devis & encaissement
- [ ] **A1 — Relances devis 1-tap (J+3/7/14)** ♻️ — 🟥 `leads.devis_envoye_at` (date) — **S — P1**
      (= Phase 3). Templates `message-templates.ts` déjà écrits. Pas de cron : envoi manuel groupé.
- [ ] **A2 — Suivi devis « argent en attente »** ♻️ — 🟥 `leads.devis_montant` (numeric) + `devis_statut`
      (envoyé/accepté/refusé) — **M — P1** (= Phase 4). Vue total CA en attente.
- [ ] **A3 — QR de paiement SEPA / Payconiq** (acompte + solde) 🆕 — génération QR côté client +
      communication structurée belge `+++/+++` (mod-97). **Aucune DB** (sans état au départ). **M — P1**.
- [ ] **A4 — Demande d'acompte à la programmation d'une intervention** ♻️ (utilise A3) — Aucune DB — **S — P2**.

### Bloc B — Terrain : gagner du temps sur place
- [ ] **B1 — Checklist « à ramener / reste à faire »** ♻️ — 🟥 élargir CHECK `checklist_type` (+`a_ramener`,
      SQL déjà rédigé section STOP DB) — **S — P1** (= Phase 2.4). Évite les retours atelier.
- [ ] **B2 — Photos de visite attachées au lead** (capture depuis le tél) ♻️ bucket `lead-photos` +
      `leads.photo_urls` + URLs signées + pattern `ImageUploader` — Aucune DB (vérifier policy insert admin) — **M — P2**.
- [ ] **B3 — « Je suis en route — j'arrive à HH:MM » 1-tap** ♻️ `message-templates` + `delai_appel_minutes`
      (déjà en base) — Aucune DB — **S — P2**.
- [ ] **B4 — Itinéraire de la journée multi-arrêts** ♻️ Maps `dir` waypoints + cockpit — Aucune DB — **S — P2**.
- [ ] **B5 — Minuteur d'heures par intervention** (start/stop, cumul) ♻️ `interventions` — 🟥
      `interventions.heures_reelles` (numeric) ou table de pointages — **M — P2**. Facturer les vraies heures.

### Bloc C — Disponibilités & hygiène des leads
- [ ] **C1 — Prochains créneaux libres + détection de conflit** (RDV **et** interventions bloquent le temps)
      ♻️ requêtes existantes + `formatters` — Aucune DB — **M — P2**.
- [ ] **C2 — Détection doublon de lead (par téléphone)** ♻️ `rdv-rapide`/form — Aucune DB — **S — P2** (= I.1).
- [ ] **C3 — « Prochaine action » par lead** (Appeler/Relancer/RAS) ♻️ statut + dates — Aucune DB
      (option 🟥 `leads.rappel_le` date) — **S — P2** (= I.3).
- [ ] **C4 — Anti-doublon RDV / rollback** ♻️ `handleRdvSubmit` — Aucune DB — **S — P2** (= I.2, aussi un fix).

### Bloc D — Ambitieux (à cadrer ensemble)
- [ ] **D1 — Mode hors-ligne en lecture** (journée + fiches + checklist) + file de synchro ♻️ PWA/Workbox
      déjà en place — 🆕 cache IndexedDB + file d'écritures — **aucune infra serveur** — **L — P2**.
      Justif : caves / constructions neuves / rural sans réseau ; données aujourd'hui en `NetworkOnly`.
- [ ] **D2 — Mini-devis chiffré sur place** (catalogue prix perso → total → PDF/partage) — 🟥 table
      `prestations`/`materiaux` — **L — P3**. ⚠️ proche ligne rouge « facturation maison » (devis ≠ facture Peppol).
- [ ] **D3 — Journal kilométrique par intervention** (déduction fiscale) — 🟥 `interventions.km` — **M — P3**.
- [ ] **D4 — Prise de RDV self-service client** (créneaux) 🆕 page publique + dispos (s'appuie sur C1) — **L — P3**.
      ⚠️ perte de contrôle de l'agenda pour un solo.

**Ordre recommandé** : Bloc A + B1 (P1, fort levier, 4 petits ajouts DB) → B2-B5 + C1-C4 (P2, surtout sans DB) →
D1 (hors-ligne) → D2-D4 (à décider). A3 (QR paiement) ne demande rien en base.

## PHASE 6 — 📞 Intake TÉLÉPHONE (PRIORITÉ #1, 2026-06-17) — 🟡 À VALIDER AVEC ADRIAN
> Canal n°1 d'Adrian : la plupart des clients APPELLENT (souvent juste nom + tél + adresse,
> pas d'email). Objectif : appel → lead → RDV → rappel → suivi, en mobile-first, 1-tap,
> **zéro infra SMS payante**. **Aucun code tant que ce bloc n'est pas tranché.**
>
> ⚠️ Constat clé : une grande partie existe déjà → **T1 et T2 ne demandent AUCUN changement DB**
> (placeholder email `@local.cuivre-electrique.com` + `hasUsableEmail` couvrent déjà les NOT NULL ;
> `RdvRapide` insère déjà un lead sans email/sans adresse structurée en prod).

- [x] **T1 — Lead express (appel sans RDV)** ♻️ — 🟢 aucune DB — **S — P1**. ✅ fait (`644b4b3`).
      Trou : `ManualLeadDialog` exige email + adresse structurée + services + message ; `RdvRapide`
      force une date/heure/type. Solution recommandée : **toggle « 📞 Juste un lead (pas encore de date) »**
      dans `RdvRapide` → masque date/heure/type/durée/délai, ne crée que le lead. Requis = nom + tél +
      commune ; email optionnel (placeholder réutilisé). Réutilise `createRdvRapide` (variante sans
      INSERT `rendez_vous`) + `SuccessScreen`. Alternative : page « Lead express » séparée (plus de code).
- [x] **T2 — Confirmation SMS/WhatsApp 1-tap depuis la FICHE lead** ♻️ — 🟢 aucune DB — **S — P1**. ✅ fait (`a28da2c`).
      Trou : caler un RDV depuis `LeadDetail` pour un lead sans email → seulement un toast ; `RendezVousCard`
      n'a aucun bouton SMS/WA, et « Réponses rapides » est générique (pas la date du RDV). Fix : ajouter
      2 boutons **SMS/WhatsApp** dans `RendezVousCard`, pré-remplis avec la date/heure réelles via
      `smsTemplateConfirmation`/`whatsappTemplateConfirmation` + `buildSmsHref`/`buildWhatsappHref`
      (déjà utilisés par l'écran succès de `RdvRapide`). Mis en avant si `!hasUsableEmail`.
- [x] **T3 — Rappel J-1 SMS/WhatsApp/Email 1-tap** ✅ **déjà fait** (= Phase 2.1, carte « Rappels demain »).
      Reste un micro-écart cosmétique (texte rappel inline dans `Aujourdhui.tsx:82-92` au lieu de
      `message-templates.ts`) — **S — P3**, pure cohérence, non urgent.
- [x] **T4 — Anti-doublon par téléphone** ♻️ — 🟢 aucune DB — **S — P1** (= C2/I.1, **remonté P1**). ✅ fait (`9885984`).
      Au blur du tél : bandeau « déjà {Nom} — ouvrir sa fiche ? » (informe sans bloquer). `findLeadsByPhone`.
- [x] **T5 — SMS « carte de visite » post-1er appel** ♻️ — 🟢 aucune DB — **S — P2**. ✅ fait (`2044831`).
      Bouton sur les 2 écrans succès : SMS 1-tap « c'est Adrian du Cuivre Électrique suite à notre appel… »
      → le client enregistre le numéro + trace écrite. `smsCarteDeVisite` + `buildSmsHref`.
- [x] **T6 — Coller le numéro depuis le presse-papier** ♻️ — 🟢 aucune DB — **S — P3**. ✅ fait (`637a47d`).
      À l'ouverture de RDV rapide, si le presse-papier contient un numéro → bouton « Coller 0485… »
      sous le champ tél. `navigator.clipboard.readText`, échec silencieux. Au collage : remplit +
      relance l'anti-doublon (T4). Confort (dépend permissions navigateur).
- [x] **T7 — Carte « Leads à rappeler » sur Aujourd'hui** ♻️ — 🟢 aucune DB — **S-M — P2**. ✅ fait (`bd93d72`).
      File des appels à passer : leads actifs (nouveau/traité) sans RDV à venir, du plus ancien au
      plus récent → Appeler / SMS / WhatsApp / Caler RDV 1-tap. Heuristique 100 % sans DB
      (statut + absence de RDV + ancienneté). Distincte de la mini-liste « >48h » du héro
      (celle-ci = file complète actionnable). « Caler RDV » ouvre le form via `?rdv=1` sur LeadDetail.
      (= C3/I.3, recadré flux tél.) Option 🟥 `leads.rappel_le` non utilisée (pas de DB).

**Ordre recommandé : T1 → T2 → T4** (3× P1, 3× 🟢 zéro DB, ~½ journée) → T5/T7 si validés.
**Rien à appliquer en base pour démarrer.** Seul SQL optionnel du lot : `leads.rappel_le` (T7), et seulement
si Adrian veut des rappels datés explicites.

## ❌ Hors-scope (acté)
Facturation maison (Peppol B2B obligatoire en Belgique → outil externe certifié), stats vanity,
notifications push, multi-utilisateur, sync Google Agenda OAuth bidirectionnelle.

---

## 🟥 STOP DB — en attente de validation d'Adrian (je n'applique RIEN, rail 2)

### (a) Phase 2.4 — nouveau type de checklist « à ramener / reste à faire »
But : une liste persistante par lead (matériel à ramener, tâches restantes), réutilisant
`checklist_items`. Bloqué par la contrainte CHECK sur `checklist_type`.

D'abord confirmer le **nom réel** de la contrainte (CHECK inline → nom auto) :
```sql
SELECT conname FROM pg_constraint
WHERE conrelid = 'public.checklist_items'::regclass AND contype = 'c';
```
Puis (remplace le nom si différent de `checklist_items_checklist_type_check`) :
```sql
ALTER TABLE public.checklist_items
  DROP CONSTRAINT IF EXISTS checklist_items_checklist_type_check;
ALTER TABLE public.checklist_items
  ADD CONSTRAINT checklist_items_checklist_type_check
  CHECK (checklist_type IN ('rgie','pv','borne','installation','generique','a_ramener'));
```
Non destructif (élargit la liste autorisée). Une fois appliqué, je code l'UI « À ramener ».

### (b) Phase 2.5 (filet) — mémo audio fiable
Pour stocker un enregistrement vocal (si la dictée échoue sur un chantier bruyant), il faut un
**bucket storage dédié** + policies admin. C'est de l'infra (rail 5). Proposition à valider :
bucket privé `lead-audio`, lecture/écriture réservées à l'admin connecté (mêmes règles que
`lead-photos`). **Dis-moi si tu le veux** et je fournis le SQL/console exact. La dictée
(texte) marche déjà sans ça.

## 🔧 À configurer par Adrian pour que les PREVIEWS atteignent Supabase
1. **Cloudflare Pages → Settings → Environment variables** (pour *Preview* ET *Production*) :
   - `VITE_SUPABASE_URL` = l'URL du projet Supabase
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = la clé publishable/anon
   - `VITE_SUPABASE_PROJECT_ID` = l'id du projet
   - Sans ces 3 variables, le build de preview se charge mais **ne parle pas à la base** → rien à tester.
2. **Supabase → Authentication → URL Configuration → Redirect URLs** :
   - Ajouter le domaine des previews (ex. `https://*.copper-spark-website.pages.dev/**`)
   - Sinon le lien magique ne revient pas sur la preview → connexion admin impossible en test.

## 📌 Journal des décisions
- 2026-06-16 — Branche `redesign/admin-cockpit` créée depuis `main`. PLAN.md posé.
- 2026-06-16 — Phase 0.1 : limite d'inactivité auth 24 h → 30 j (mono-utilisateur).
- 2026-06-16 — Branche poussée, preview Cloudflare déclenchée.
- 2026-06-16 — **Décision Adrian** : il câble d'abord l'env (0.2 migration + 0.3 variables
  Cloudflare + redirect URL Supabase). Je reprends Phase 1 ensuite, en testant chaque écran sur
  la preview connectée à la base.
- 2026-06-16 — Env câblé (OK Adrian). Phase 1 démarrée.
- 2026-06-16 — 1.1 (barre d'onglets mobile) + 1.2 (itinéraire cockpit) livrés et poussés.
- 2026-06-16 — Adrian : « déroule 1.3 → 1.6, je teste en fin de Phase 1 ».
- 2026-06-16 — 1.3 → 1.6 livrés et poussés. **PHASE 1 terminée.** Build/typecheck/lint verts.
  POINT de fin de Phase 1 envoyé (URL preview + checklist de test). En attente du retour d'Adrian
  avant Phase 2 (quick wins).
  Différés non bloquants : repli profond fiche (1.3), réécriture kanban→liste (1.4).
- 2026-06-16 — Adrian : « continue la Phase 2 en autonomie ».
- 2026-06-16 — **PHASE 2** : 2.1 (rappels demain), 2.2 (réponses rapides), 2.3 (recherche mobile),
  2.5 (dictée vocale) livrés et poussés. Build/typecheck/lint verts.
  **STOP DB en attente** : 2.4 (type checklist « à ramener ») + filet mémo audio (bucket) — SQL/infra
  proposés ci-dessus, non appliqués (rail 2/5). Récap consolidé de test (Phase 1 + 2) envoyé à Adrian.
- 2026-06-16 (soir) — Adrian : finir les 2 parqués de Phase 1, sans toucher la prod ; reporter les
  features DB. **1.3 complété** (cartes repliables, CollapsibleCard). **1.4 complété** (Leads kanban →
  liste filtrable, choix validé par Adrian). Build/typecheck/lint verts, poussés.
  **PHASE 1 100 % terminée.** Restent en attente du SQL d'Adrian : 2.4 + Phase 3 (relances, champ
  `devis_envoye_at`) + Phase 4 (suivi devis) + mémo audio.
- 2026-06-17 — 3 bugs terrain corrigés et poussés (`redesign/admin-cockpit`) : scroll vers le formulaire
  « Caler RDV » (`cc00f8c`), checklist idempotente + mémo non bloqué par notes vides (`ea1e94b`),
  mémo Adrian aussi sur **modification** de RDV avec la nouvelle date (`61881f1`).
- 2026-06-17 — **Proposition carte blanche** posée en **PHASE 5** (terrain & argent) : 17 idées priorisées
  (A devis/encaissement, B terrain, C dispos/hygiène, D ambitieux). 🟡 **À valider avec Adrian avant tout code.**
  Recommandation : Bloc A + B1 d'abord (P1). Hors-scope reconfirmé (Peppol maison, vanity, push, multi-user).
- 2026-06-17 — **PHASE 6 — Intake TÉLÉPHONE (priorité #1)** posée. Cartographie du code : T3 (rappel J-1)
  déjà fait ; T1 (lead express) + T2 (confirmation SMS/WA depuis la fiche) sont les 2 trous réels et
  **ne demandent AUCUN changement DB** (placeholder email + `hasUsableEmail` existants). Carte blanche :
  T4 anti-doublon tél (P1), T5 SMS carte de visite, T6 coller numéro, T7 carte « leads à rappeler ».
  🟡 **À valider avec Adrian. Aucun code écrit.** Ordre proposé : T1 → T2 → T4.
- 2026-06-17 — **PHASE 6 livrée** sur `feat/intake-telephone` : T1 lead express (`644b4b3`),
  T2 confirmation SMS/WA datée sur la fiche (`a28da2c`), T4 anti-doublon téléphone (`9885984`),
  T5 SMS carte de visite (`2044831`). Build/typecheck/lint verts, **zéro changement DB**.
  Reste P2/P3 : T6 (coller numéro, optionnel), T7 (carte « leads à rappeler », heuristique). Preview poussée.
- 2026-06-18 — **PHASE 6 finalisée** sur une **nouvelle branche `feature/leads-a-rappeler`** (créée
  depuis `main` à jour ; `feat/intake-telephone` déjà mergée) : T7 carte « Leads à rappeler »
  (`bd93d72`, heuristique sans DB + `?rdv=1` pour Caler RDV 1-tap) et T6 coller le numéro depuis le
  presse-papier (`637a47d`). Build/typecheck/lint verts, **zéro changement DB**. Preview poussée.
  **Pas de merge sur `main` sans OK d'Adrian.**
