# Phase A — RDV rapide

> Branche : `feat/admin-rdv-rapide`
> Date : 2026-04-29
> Statut : ✅ Code prêt — **migration SQL à appliquer avant de tester**
> Base : `main`

## 1. Ce qui a été fait

### Côté DB (1 migration)

`supabase/migrations/20260429100000_rdv_rapide_phase_a.sql` :

- **CHECK** sur `rendez_vous.type_visite` : `Devis | Visite technique | Dépannage | Inspection RGIE | Pose borne VE | Autre`.
- `leads_source_allowed` : ajout de la valeur `rdv_rapide`.
- **Nouvelle policy RLS d'INSERT leads light** : permet de créer un lead minimal (juste nom + téléphone + gdpr) à condition que `source = 'rdv_rapide'` ET `status = 'rdv_pris'`. Postgres combine les policies INSERT en OR — la policy stricte du formulaire de contact public reste **intacte**.

### Côté code (3 libs + 1 page + 1 FAB + 1 entrée sidebar)

**Libs réutilisables** (`src/lib/admin/`) :
- `google-calendar-link.ts` — `buildGoogleCalendarUrl(input)` → URL `calendar.google.com/calendar/render?action=TEMPLATE&...` pré-remplie. Pas d'API Google nécessaire.
- `sms-templates.ts` — 4 templates en français belge sobre + `buildSmsHref(phone, message)` qui produit le lien `sms:` compatible iOS/Android :
  - Confirmation RDV
  - Relance 1 (J+3, chaleureuse)
  - Relance 2 (J+7, plus directe)
  - Relance 3 (J+14, dernière relance polie)
  - *Les 3 templates de relance sont prêts mais pas encore utilisés — Phase B (tracking devis) les branchera.*
- `rdv-rapide.ts` — `createRdvRapide(input)` qui fait `INSERT lead minimal → INSERT rendez_vous` séquentiellement, avec rollback manuel du lead si l'INSERT rdv échoue.

**Page** : `src/admin/pages/RdvRapide.tsx`
- Formulaire mobile-first (8 champs, inputs h-12, autoFocus, autoComplete natifs).
- Durée auto-suggérée selon le type (60/60/90/120/180/60 min).
- Validation react-hook-form + zod alignée sur les CHECK SQL.
- Écran succès avec récap + 2 gros boutons : 📅 Google Calendar et 💬 SMS.

**Accès rapide** :
- Sidebar : nouvelle entrée **"RDV rapide"** en tête (icône `Phone`, fond `bg-primary/10` discret pour attirer l'œil).
- FAB mobile orange (`md:hidden`, bottom-right) sur toutes les pages admin sauf `/admin/rdv-rapide` et `/admin/login`.

### Tooling
Aucune nouvelle dépendance npm.

## 2. Avant de tester — appliquer la migration SQL

> ⚠️ **Sans cette étape, la page `/admin/rdv-rapide` plantera** sur l'INSERT (RLS refuse `status='rdv_pris'`, `source='rdv_rapide'`, `type_visite` hors liste).

### Procédure (5 minutes)

1. Ouvre **Lovable SQL Editor** (ou le dashboard Supabase si tu y as accès).
2. Copie-colle le contenu de :

   ```
   supabase/migrations/20260429100000_rdv_rapide_phase_a.sql
   ```

   ou récupère-le sur GitHub :
   ```
   https://raw.githubusercontent.com/adrianmitric18/copper-spark-website/feat/admin-rdv-rapide/supabase/migrations/20260429100000_rdv_rapide_phase_a.sql
   ```

3. Clique **Run**.
4. Attends "Success. No rows returned".

### Vérifications post-migration

```sql
-- Vérifier le CHECK type_visite
SELECT conname FROM pg_constraint WHERE conname = 'rdv_type_visite_valide';

-- Vérifier que rdv_rapide est dans les sources autorisées
SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'leads_source_allowed';

-- Vérifier les 2 policies INSERT sur leads
SELECT polname FROM pg_policy WHERE polname LIKE '%insert%' AND polrelid = 'public.leads'::regclass;
```

Tu dois voir 1 ligne pour la 1ère, 1 ligne contenant `rdv_rapide` pour la 2e, et **2 policies** pour la 3e (la stricte existante + la nouvelle "Admin can insert rdv_rapide leads").

## 3. Comment tester (5 minutes)

### Test 1 — Sidebar et FAB

1. Va sur `/admin` (n'importe quelle page).
2. Sidebar : "RDV rapide" doit apparaître **tout en haut**, fond légèrement orange.
3. Sur mobile (ou viewport étroit) : un **FAB orange rond** apparaît en bas-droite avec une icône téléphone.

### Test 2 — Création d'un RDV rapide complet

1. Clique sur "RDV rapide" → tu arrives sur `/admin/rdv-rapide`.
2. Remplis :
   - Nom : *Test Client*
   - Téléphone : *0485 12 34 56*
   - Date : aujourd'hui (déjà rempli)
   - Heure : 14:00
   - Type : *Pose borne VE* → la durée passe automatiquement à **180 min**.
3. Modifie la durée à 60 → l'indicateur passe à "Personnalisée".
4. Re-sélectionne *Devis* → la durée repasse auto à 60.
5. Adresse : *Rue de la Station 12, 1490 Court-Saint-Étienne* (optionnel).
6. Notes : *Test*.
7. Clique **"Confirmer le RDV"**.
8. Toast vert "RDV créé" + redirection vers l'écran succès.

### Test 3 — Boutons Google Calendar + SMS

Sur l'écran succès :

1. Clique **"Ajouter à Google Calendar"** → un onglet s'ouvre vers `calendar.google.com` avec :
   - Titre : "Devis – Test Client"
   - Date / heure / durée correctes
   - Description et adresse pré-remplies
   → Il ne te reste qu'à cliquer "Enregistrer" côté Google.

2. Clique **"Envoyer SMS au client"** → l'app SMS s'ouvre (sur mobile) avec le numéro et un message pré-rédigé :

   > Bonjour Test Client,
   > je vous confirme notre rendez-vous "Devis" le mercredi 29 avril 2026 à 14:00.
   > Adresse : Rue de la Station 12, 1490 Court-Saint-Étienne
   > À bientôt,
   > Adrian – Le Cuivre Électrique – 0485 75 52 27

   → Tu corriges éventuellement, tu cliques Envoyer.

### Test 4 — Vérification dans le pipeline existant

1. Clique "Voir la fiche lead" → tu arrives sur `/admin/lead/<id>`.
2. Le lead apparaît avec status `rdv_pris`, source `rdv_rapide`, services `["rdv_rapide"]`, message auto-rédigé "RDV devis pris par téléphone…".
3. Va sur `/admin/pipeline` → le lead est aussi dans la kanban (colonne selon le mapping de status).
4. Va sur `/admin/rdv` (calendrier) → le RDV apparaît à la date prévue.

### Test 5 — Bonus : "Nouveau RDV" qui reset

Sur l'écran succès, clique "Nouveau RDV" → le formulaire se réinitialise pour le prochain appel.

### Test technique

```bash
npm run typecheck    # 0 erreur
npm run lint         # 35 erreurs/warnings PRÉ-EXISTANTS (aucune sur mes fichiers)
npm run build        # ✓ 11.38s
```

## 4. Procédure de merge

Quand tu as testé et que tout est OK :

```bash
# 1. Tag de sauvegarde
git checkout main
git pull origin main
git tag backup-before-rdv-rapide-merge-2026-04-29
git push origin --tags

# 2. Merge --no-ff
git merge --no-ff feat/admin-rdv-rapide \
  -m "Merge Phase A — RDV rapide (form mobile-first, GCal+SMS deep links)"
git push origin main
```

Estimation Lovable rebuild : 2-5 min (build local 11.38s).

## 5. Procédure de rollback

### Cas 1 — Bug critique, rollback total

```bash
# Revert du merge
git checkout main
git revert -m 1 <hash-du-commit-de-merge>
git push origin main

# Rollback DB (optionnel, sans danger même si le code est revert)
# Dans le SQL Editor :
ALTER TABLE public.rendez_vous DROP CONSTRAINT IF EXISTS rdv_type_visite_valide;
DROP POLICY IF EXISTS "Admin can insert rdv_rapide leads" ON public.leads;
-- (la modif de leads_source_allowed peut rester sans casser quoi que ce soit)
```

### Cas 2 — Catastrophe (réécrit l'historique)

```bash
git checkout main
git reset --hard backup-before-rdv-rapide-merge-2026-04-29
git push --force-with-lease origin main
```

### Note DB après usage

Si tu as déjà créé des RDV rapides en prod et que tu rollback :
- Les leads créés (`source='rdv_rapide'`) restent en DB → aucun impact.
- Les RDV créés restent en DB → aucun impact (la table reste valide).
- Pour nettoyer manuellement :
  ```sql
  DELETE FROM public.leads WHERE source = 'rdv_rapide';
  -- (les rendez_vous CASCADE automatiquement)
  ```

## 6. Limites connues / pour la suite

- **`address` est sauvegardé "À préciser"** quand non saisi (contrainte NOT NULL côté schema). Tu peux toujours enrichir après via la fiche lead.
- **`email` placeholder** : `rdv-{timestamp}@local.cuivre-electrique.com`. Pas un vrai email — sert juste à passer le NOT NULL. Tu peux le remplacer dans la fiche lead quand tu obtiens le vrai email.
- **`client_type` par défaut "Particulier"**. Modifiable dans la fiche lead.
- **iOS lien `sms:`** : sur certaines versions iOS, le `?body=` peut être ignoré si le message contient des caractères spéciaux non-ASCII. Si tu rencontres ça, fais-moi un retour, on peut basculer vers `&body=` ou supprimer les accents dans les templates.

## 7. Ce qui vient en Phase B

Quand tu valides Phase A, on passe à Phase B (tracking devis ~5-6h) :
- Migration `leads` : colonnes `devis_envoye_at`, `devis_montant_eur`, `relance_count`, `derniere_relance_at`, `perdu_at` + extension du status.
- Bouton "Devis envoyé" sur la fiche lead (dialog avec date + montant).
- Carte "Devis à relancer" sur `/admin/Aujourd'hui` calculée client-side (J+3, J+7, J+14).
- Boutons "💬 SMS relance" qui réutilisent les templates 1/2/3 déjà livrés ici.
- Action "Marquer relancé" qui incrémente `relance_count` + change le status.

Branche dédiée : `feat/admin-devis-tracking`.
