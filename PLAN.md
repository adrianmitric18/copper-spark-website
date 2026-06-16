# PLAN.md — Redesign & extension de l'admin (Le Cuivre Électrique)

> **Source de vérité unique.** En cas de doute, ce fichier tranche (pas la mémoire de conversation).
> Branche de travail : `redesign/admin-cockpit`. **Jamais de merge sur `main` sans OK explicite d'Adrian.**

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
- [ ] **1.1 — Navigation unifiée** : barre d'onglets en bas sur mobile (pouce), nav latérale sur desktop.
      4 entrées : `Aujourd'hui · Leads · Chantiers · Plus`. Ancien hamburger conservé sous « Plus ».
- [ ] **1.2 — Cockpit « Aujourd'hui »** : RDV du jour + chantiers du jour + alertes (nouveaux leads,
      à relancer). Chaque carte = actions 1 tap (Appeler / Itinéraire / Confirmer / Checklist).
- [ ] **1.3 — Fiche lead allégée** : barre d'actions figée en haut, détails repliés.
- [ ] **1.4 — Calendrier** relégué en vue secondaire ; **Pipeline → liste « Leads »** filtrable.
- [ ] **1.5 — « Plus »/Contenu** : Réalisations + Avis rangés là.
- [ ] **1.6 — Confirmation unifiée** : canal par défaut selon la source (web = email auto / tél = SMS).
      *(Dépend de 0.2 pour l'email auto.)*
- [ ] **→ Push preview + POINT avec Adrian. Validation direction avant Phase 2.**

## PHASE 2 — Quick wins (réutilise l'existant)
- [ ] **2.1 — Rappel J-1 en 1 tap** ♻️ : carte « Rappels demain » → `sendRappelJ1Emails` (déjà codé)
      + SMS/WhatsApp pré-remplis. **Pas de cron** (rail 5) : envoi manuel groupé.
- [ ] **2.2 — Réponses rapides** ♻️ : messages types depuis la fiche (« je vous rappelle »,
      « indispo cette semaine »…) via le moteur SMS/WhatsApp/mailto existant.
- [ ] **2.3 — Recherche client mobile** ♻️ : nom/tél, réutilise la palette `Cmd+K` (`CommandPalette`).
- [ ] **2.4 — Checklist « reste à faire / à ramener »** ♻️ : réutilise `checklist_items`, texte persistant
      par lead/chantier.
- [ ] **2.5 — Dictée vocale sur la fiche** 🆕(gratuit, Web Speech API) : note que ~90 % du temps c'est
      sur chantier (à relire). **Filet fiable** = mémo audio dans le bucket storage existant.

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

## ❌ Hors-scope (acté)
Facturation maison (Peppol B2B obligatoire en Belgique → outil externe certifié), stats vanity,
notifications push, multi-utilisateur, sync Google Agenda OAuth bidirectionnelle.

---

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
