# Refonte des templates de messages

> Branche : `feat/templates-pro`
> Date : 2026-04-30
> Statut : ✅ Code prêt — **migration SQL à appliquer avant de tester**, attente validation visuelle des templates

## 1. Ce qui a été fait

### Côté DB (1 migration)

`supabase/migrations/20260430090000_realign_types_rdv.sql`
- UPDATE `rendez_vous SET type_visite = 'Installation borne de recharge' WHERE type_visite = 'Pose borne VE'` (idempotent).
- DROP/CREATE de `rdv_type_visite_valide` avec **7 valeurs** alignées sur les services du site.

### Côté code

- `src/lib/admin/sms-templates.ts` → **renommé** `message-templates.ts`.
- Refonte complète : 30 templates pro générés depuis 7 `TYPE_CONFIGS` centralisées (modifier la copie d'un type = modifier les 3 supports d'un coup).
- `TYPE_VISITES` aligné 7 valeurs + `DUREE_DEFAUT_PAR_TYPE` (Devis 60, Visite 60, Dépannage 90, RGIE 120, Borne 180, **PV 240**, Autre 60).
- `RdvRapideInput` gagne `email?: string` optionnel (stocké en DB au lieu du placeholder si saisi).
- Page `/admin/rdv-rapide` : nouveau champ Email + écran de succès passe de 2 à **4 boutons** (Calendar / SMS / WhatsApp / Email) + bouton "Copier HTML" pour coller dans Gmail.

### Tests
- `npm run typecheck` : 0 erreur
- `npm run lint` : 0 erreur sur mes fichiers
- `npm run build` : ✓

### Aucune nouvelle dépendance npm.

---

## 2. ⚠️ Avant de tester — appliquer la migration SQL

```sql
-- Coller dans Lovable SQL Editor :
UPDATE public.rendez_vous SET type_visite = 'Installation borne de recharge' WHERE type_visite = 'Pose borne VE';
ALTER TABLE public.rendez_vous DROP CONSTRAINT IF EXISTS rdv_type_visite_valide;
ALTER TABLE public.rendez_vous ADD CONSTRAINT rdv_type_visite_valide CHECK (
  type_visite IN ('Devis','Visite technique','Dépannage','Inspection RGIE','Installation borne de recharge','Installation panneaux photovoltaïques','Autre')
);
```

Ou récupère le fichier complet :
`supabase/migrations/20260430090000_realign_types_rdv.sql`

---

## 3. APERÇU DES 30 TEMPLATES — pour validation

> Tous les exemples utilisent le payload :
> `Jean Dupont · 0485 12 34 56 · jean.dupont@example.com · 30 avril 2026 14:00 · Rue de la Station 12, 1490 Court-Saint-Étienne`

### 3.1 SMS COURTS — 7 confirmations

#### Devis (60 min)
```
🔌 Le Cuivre Électrique
Bonjour Jean Dupont,
Notre rendez-vous devis :
📅 30/04 à 14:00
📍 Rue de la Station 12, Court-Saint-Étienne
⏱️ ~1 h
À bientôt,
Adrian - 0485 75 52 27
```

#### Visite technique (60 min)
```
🔌 Le Cuivre Électrique
Bonjour Jean Dupont,
Votre visite technique :
📅 30/04 à 14:00
📍 Rue de la Station 12, Court-Saint-Étienne
⏱️ ~1 h
À bientôt,
Adrian - 0485 75 52 27
```

#### Dépannage (90 min)
```
🔌 Le Cuivre Électrique
Bonjour Jean Dupont,
Notre intervention de dépannage :
📅 30/04 à 14:00
📍 Rue de la Station 12, Court-Saint-Étienne
⏱️ ~1h30
À bientôt,
Adrian - 0485 75 52 27
```

#### Inspection RGIE (120 min)
```
🔌 Le Cuivre Électrique
Bonjour Jean Dupont,
Votre inspection RGIE :
📅 30/04 à 14:00
📍 Rue de la Station 12, Court-Saint-Étienne
⏱️ ~2 h
À bientôt,
Adrian - 0485 75 52 27
```

#### Installation borne de recharge (180 min)
```
🔌 Le Cuivre Électrique
Bonjour Jean Dupont,
L'installation de votre borne de recharge :
📅 30/04 à 14:00
📍 Rue de la Station 12, Court-Saint-Étienne
⏱️ ~3 h
À bientôt,
Adrian - 0485 75 52 27
```

#### Installation panneaux photovoltaïques (240 min)
```
🔌 Le Cuivre Électrique
Bonjour Jean Dupont,
L'installation de vos panneaux photovoltaïques :
📅 30/04 à 14:00
📍 Rue de la Station 12, Court-Saint-Étienne
⏱️ ~4 h
À bientôt,
Adrian - 0485 75 52 27
```

#### Autre (60 min)
```
🔌 Le Cuivre Électrique
Bonjour Jean Dupont,
Notre rendez-vous :
📅 30/04 à 14:00
📍 Rue de la Station 12, Court-Saint-Étienne
⏱️ ~1 h
À bientôt,
Adrian - 0485 75 52 27
```

### 3.2 WHATSAPP — 7 confirmations

#### Devis
```
⚡ *Le Cuivre Électrique*

Bonjour Jean Dupont 👋

Je vous confirme notre rendez-vous pour l'établissement de votre devis.

📅 *jeudi 30 avril 2026*
🕐 *14:00*
📍 *Rue de la Station 12, 1490 Court-Saint-Étienne*
⏱️ *Durée estimée : 1 heure*

🔧 *Au programme :*
✓ Visite des lieux et écoute de votre besoin
✓ Prise de mesures et photos techniques
✓ Conseils sur les options possibles et leur impact budget
✓ Devis détaillé envoyé sous 48 à 72 h ouvrées

📋 *À prévoir :*
• Plans ou photos du projet si vous en avez (utile, pas obligatoire)
• Accès aux pièces concernées par les travaux

Je vous appelle 30 minutes avant mon arrivée pour vous prévenir.

À bientôt,
Adrian Mitric
🌐 cuivre-electrique.com
📱 0485 75 52 27
```

#### Inspection RGIE (extrait représentatif)
```
⚡ *Le Cuivre Électrique*

Bonjour Jean Dupont 👋

Je vous confirme notre rendez-vous pour l'inspection RGIE de votre installation.

📅 *jeudi 30 avril 2026*
🕐 *14:00*
📍 *Rue de la Station 12, 1490 Court-Saint-Étienne*
⏱️ *Durée estimée : 2 heures*

🔧 *Au programme :*
✓ Contrôle complet de la conformité au Règlement Général sur les Installations Électriques
✓ Mesures d'isolement, de continuité et de mise à la terre
✓ Vérification du tableau, des disjoncteurs différentiels et de la sélectivité
✓ Rapport de conformité remis en fin de visite

📋 *À prévoir :*
• Plans de l'installation (en cas de rénovation récente)
• Procès-verbal d'inspection précédent si vous en avez un
• Accès libre et dégagé au tableau électrique

Je vous appelle 30 minutes avant mon arrivée pour vous prévenir.

À bientôt,
Adrian Mitric
🌐 cuivre-electrique.com
📱 0485 75 52 27
```

#### Installation borne de recharge
```
⚡ *Le Cuivre Électrique*

Bonjour Jean Dupont 👋

Je vous confirme l'installation de votre borne de recharge pour véhicule électrique.

📅 *jeudi 30 avril 2026*
🕐 *14:00*
📍 *Rue de la Station 12, 1490 Court-Saint-Étienne*
⏱️ *Durée estimée : 3 heures*

🔧 *Au programme :*
✓ Pose de la borne (Hager Witty Pro recommandée)
✓ Création d'un sous-tableau dédié, conforme RGIE
✓ Mise en service, tests de charge et vérification du courant de fuite
✓ Configuration du badge ou de l'application mobile selon votre véhicule

📋 *À prévoir :*
• Accès libre au tableau électrique
• Place de stationnement dégagée pendant l'intervention
• Modèle exact de votre véhicule (type de connecteur)

Je vous appelle 30 minutes avant mon arrivée pour vous prévenir.

À bientôt,
Adrian Mitric
🌐 cuivre-electrique.com
📱 0485 75 52 27
```

> Les 4 autres types (Visite technique, Dépannage, Panneaux PV, Autre) suivent **exactement** la même structure. Chaque type a son propre `programme` et `prerequis` adaptés (voir `TYPE_CONFIGS` dans `message-templates.ts:62-186`).

### 3.3 EMAIL PLAINTEXT — 7 confirmations

> Le sujet email est généré par `emailSubjectConfirmation` :
> - "Confirmation RDV devis — 30/04 à 14:00"
> - "Confirmation visite technique — 30/04 à 14:00"
> - "Confirmation intervention dépannage — 30/04 à 14:00"
> - "Confirmation inspection RGIE — 30/04 à 14:00"
> - "Confirmation installation borne de recharge — 30/04 à 14:00"
> - "Confirmation installation panneaux photovoltaïques — 30/04 à 14:00"
> - "Confirmation RDV — 30/04 à 14:00"

**Exemple plaintext (Inspection RGIE)**
```
Bonjour Jean Dupont,

Je vous confirme notre rendez-vous pour l'inspection RGIE de votre installation.

INFORMATIONS PRATIQUES
Date    : jeudi 30 avril 2026
Heure   : 14:00
Lieu    : Rue de la Station 12, 1490 Court-Saint-Étienne
Durée   : environ 2 heures

AU PROGRAMME
- Contrôle complet de la conformité au Règlement Général sur les Installations Électriques
- Mesures d'isolement, de continuité et de mise à la terre
- Vérification du tableau, des disjoncteurs différentiels et de la sélectivité
- Rapport de conformité remis en fin de visite

À PRÉVOIR DE VOTRE CÔTÉ
- Plans de l'installation (en cas de rénovation récente)
- Procès-verbal d'inspection précédent si vous en avez un
- Accès libre et dégagé au tableau électrique

Je vous rappelle 30 minutes avant mon arrivée pour confirmer.

En savoir plus sur ce service :
https://cuivre-electrique.com/services/mise-en-conformite-rgie

Bien cordialement,
Adrian Mitric
Le Cuivre Électrique
0485 75 52 27 · cuivre.electrique@gmail.com
https://cuivre-electrique.com
BE 0805 376 944 · Électricien agréé
```

> Les 6 autres types suivent la même structure. Le contenu **AU PROGRAMME** / **À PRÉVOIR** / lien service change.

### 3.4 EMAIL HTML — aperçu structurel

L'HTML stylé inline (compat Gmail/Outlook) donne une mise en page de type magazine :

```
┌─────────────────────────────────────────────────────────────┐
│  [Header dark #1F1F1F, padding 32px]                        │
│      ⚡ Le Cuivre Électrique  [titre orange #E85D04]         │
│      Électricien agréé · Brabant wallon · Bruxelles · …     │
├─────────────────────────────────────────────────────────────┤
│  [Body blanc, padding 32px]                                 │
│  Bonjour **Jean Dupont**,                                   │
│  Je vous confirme [intro]…                                  │
│                                                             │
│  ╔════════════════════════════════════════════╗             │
│  ║ 📅 Date     | jeudi 30 avril 2026          ║  bordures   │
│  ║ 🕐 Heure    | 14:00                        ║  orange     │
│  ║ 📍 Lieu     | Rue de la Station 12, 1490…  ║  brand      │
│  ║ ⏱️ Durée    | environ 2 heures             ║             │
│  ╚════════════════════════════════════════════╝             │
│                                                             │
│  AU PROGRAMME  [titre orange uppercase tracking]            │
│  • [...]                                                    │
│                                                             │
│  À PRÉVOIR DE VOTRE CÔTÉ  [titre orange]                    │
│  • [...]                                                    │
│                                                             │
│  Je vous rappelle 30 minutes avant…                         │
│                                                             │
│  En savoir plus : [lien orange souligné au hover]           │
├─────────────────────────────────────────────────────────────┤
│  [Footer cream #F5F0E8, padding 24px]                       │
│  **Adrian Mitric**                                          │
│  Le Cuivre Électrique – Électricien agréé                   │
│  📱 0485 75 52 27                                           │
│  ✉️ cuivre.electrique@gmail.com                              │
│  🌐 cuivre-electrique.com                                   │
│  BE 0805 376 944 · Court-Saint-Étienne, Belgique            │
└─────────────────────────────────────────────────────────────┘
```

Génération via `emailHtmlConfirmation(payload)`. Sur l'écran succès, un bouton "📋 Copier HTML" met le HTML dans le presse-papier ; il suffit de coller dans Gmail/Outlook (Ctrl+V) pour qu'il s'affiche stylé.

---

### 3.5 SMS — 3 paliers de relance devis

> Payload : `Jean Dupont · devis envoyé le 25 avril 2026 · 1 250 €`

#### Relance 1 (J+3, chaleureuse)
```
🔌 Le Cuivre Électrique
Bonjour Jean Dupont,
Avez-vous eu l'occasion de regarder le devis (1 250 €) envoyé le 25/04 ?
Je reste à votre disposition pour toute précision.
Adrian - 0485 75 52 27
```

#### Relance 2 (J+7, plus directe)
```
🔌 Le Cuivre Électrique
Bonjour Jean Dupont,
Je reviens vers vous concernant le devis du 25/04.
Si certains points sont à ajuster, un coup de fil suffit.
Adrian - 0485 75 52 27
```

#### Relance 3 (J+14, dernière, polie)
```
🔌 Le Cuivre Électrique
Bonjour Jean Dupont,
Devis envoyé le 25/04 resté sans suite.
Pourriez-vous me confirmer si le projet vous intéresse toujours ? Merci.
Adrian - 0485 75 52 27
```

### 3.6 WHATSAPP — 3 paliers de relance

#### Relance 1 (J+3)
```
⚡ *Le Cuivre Électrique*

Bonjour Jean Dupont,

J'espère que vous allez bien.
Avez-vous eu l'occasion de regarder le devis envoyé le *vendredi 25 avril 2026* ?
Montant : *1 250 €*

Je reste à votre disposition pour préciser ou ajuster un point — un message ou un coup de fil suffit.

Bien cordialement,
Adrian Mitric
📱 0485 75 52 27
🌐 cuivre-electrique.com
```

#### Relance 2 (J+7)
```
⚡ *Le Cuivre Électrique*

Bonjour Jean Dupont,

Je reviens vers vous concernant le devis envoyé le *vendredi 25 avril 2026*.

S'il y a des points à préciser ou à ajuster (matériel, planning, budget), je peux retravailler la proposition rapidement.

Adrian Mitric
📱 0485 75 52 27
```

#### Relance 3 (J+14)
```
⚡ *Le Cuivre Électrique*

Bonjour Jean Dupont,

Le devis envoyé le *vendredi 25 avril 2026* est resté sans réponse de votre côté.

Avant de clôturer le dossier, pourriez-vous me dire si le projet vous intéresse toujours, ou si vous avez choisi une autre piste ?

Merci d'avance pour votre retour,
Adrian Mitric
📱 0485 75 52 27
```

### 3.7 EMAIL — 3 paliers de relance

> Subjects :
> - Relance 1 : "Suivi de votre devis"
> - Relance 2 : "Devis — points à préciser ?"
> - Relance 3 : "Devis — votre projet est-il toujours d'actualité ?"

**Plaintext relance 1 (extrait)**
```
Bonjour Jean Dupont,

J'espère que vous allez bien.
Avez-vous eu l'occasion de regarder le devis (1 250 €) que je vous ai envoyé le vendredi 25 avril 2026 ?

Je reste à votre disposition pour toute précision ou pour ajuster certains points si nécessaire — n'hésitez pas à me répondre directement à ce mail ou à m'appeler.

Bien cordialement,
Adrian Mitric
Le Cuivre Électrique
0485 75 52 27 · cuivre.electrique@gmail.com
https://cuivre-electrique.com
```

> Les relances 2 et 3 suivent la même structure (signature complète, ton plus direct au fil des paliers).

---

## 4. Comment tester (15 minutes)

### Test 1 — Sélecteur du formulaire
Va sur `/admin/rdv-rapide` → ouvre le menu "Type de RDV". Tu dois voir **7 options** : Devis · Visite technique · Dépannage · Inspection RGIE · Installation borne de recharge · Installation panneaux photovoltaïques · Autre. Les durées par défaut s'affichent en suffix.

### Test 2 — Champ email
Saisis un email valide (ex: `jean@example.com`) → soumets. Sur l'écran succès, l'email apparaît dans le récap et **les boutons "Email" + "Copier HTML"** sont visibles.

Refais sans email → les 2 boutons sont remplacés par un message "Saisis l'email du client pour activer…".

### Test 3 — Bouton SMS
Clique sur "SMS" → l'app SMS s'ouvre avec le numéro et le texte rédigé exactement comme dans la section 3.1 ci-dessus, selon le type sélectionné.

### Test 4 — Bouton WhatsApp
Clique sur "WhatsApp" → ouvre `wa.me/32485XXXXXXX?text=...` qui démarre une conversation WhatsApp avec le numéro + le message en *gras markdown*. Le numéro `0485 12 34 56` est automatiquement converti en `32485123456`.

### Test 5 — Bouton Email
Clique sur "Email" (si email saisi) → ouvre ton client mail (Gmail web, Outlook, Apple Mail) avec :
- Destinataire : email saisi
- Sujet : "Confirmation [type] — 30/04 à 14:00"
- Corps : version plaintext (cf. 3.3)

### Test 6 — Bouton Copier HTML
Clique sur "Copier HTML" → toast "Email HTML copié". Va dans Gmail (web) → nouveau message → coller (Ctrl+V) dans le corps. Tu dois voir l'email **stylé** avec header dark, brand orange, tableau infos, etc.

### Test 7 — Vérifs techniques
```bash
npm run typecheck    # 0 erreur
npm run lint         # 35 pré-existants, 0 sur mes fichiers
npm run build        # ✓
```

---

## 5. Procédure de merge (après validation visuelle)

```bash
git checkout main
git pull origin main
git tag backup-before-templates-pro-merge-2026-04-30
git push origin --tags

git merge --no-ff feat/templates-pro \
  -m "Merge templates pro — 7 confirmations × 3 supports + 3 relances × 3"
git push origin main
```

## 6. Procédure de rollback

### Cas 1 — Bug critique
```bash
git revert -m 1 <hash-commit-de-merge>
git push origin main
```

### Cas 2 — Rollback DB seulement
```sql
-- Remettre le CHECK précédent (sans Panneaux PV)
ALTER TABLE public.rendez_vous DROP CONSTRAINT IF EXISTS rdv_type_visite_valide;
ALTER TABLE public.rendez_vous ADD CONSTRAINT rdv_type_visite_valide CHECK (
  type_visite IN ('Devis','Visite technique','Dépannage','Inspection RGIE','Pose borne VE','Autre')
);
UPDATE public.rendez_vous SET type_visite = 'Pose borne VE' WHERE type_visite = 'Installation borne de recharge';
```

⚠️ Ne pas faire ça si tu as déjà créé des RDV "Installation panneaux photovoltaïques" — il n'y a pas de mapping arrière.

### Cas 3 — Catastrophe nucléaire
```bash
git reset --hard backup-before-templates-pro-merge-2026-04-30
git push --force-with-lease origin main
```

---

## 7. Commits sur cette branche

```
c5532a7 feat(rdv-rapide): écran succès — 4 boutons + email client optionnel
964b16a feat(messages): refonte pro — 7 confirmations × 3 supports + 3 relances × 3
fe409ec feat(rdv): TYPE_VISITES alignées 7 valeurs + email optionnel
1fa7157 feat(rdv): migration SQL — alignement 7 types RDV avec services site
```

4 commits atomiques.
