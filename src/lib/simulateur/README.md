# Simulateur de prix — mise en service

## 1. Migration Supabase (obligatoire avant la mise en ligne)

Tant que la migration n'est pas appliquée, **aucun lead simulateur ne sera
enregistré** : la colonne `payload` n'existe pas et la policy d'insertion refuse
les leads sans adresse.

```
supabase/migrations/20260809120000_simulateur_leads.sql
```

Elle fait trois choses :

1. ajoute la colonne `payload jsonb` à `leads` ;
2. réécrit la policy d'insertion publique en deux branches — les leads
   `source = 'simulateur'` n'ont pas besoin d'adresse et l'email y est
   facultatif, mais le **GSM belge est validé par expression régulière côté
   base** ;
3. ajoute un index sur `source`.

Les photos vont dans le bucket `lead-photos` existant, sous le préfixe
`simulateur/`. Ce bucket a déjà les bonnes policies : écriture anonyme,
**lecture interdite au public**, lecture réservée à l'admin authentifié.

Après application, régénérer les types si tu veux rester aligné :

```
npx supabase gen types typescript --project-id <id> > src/integrations/supabase/types.ts
```

(la colonne `payload` a déjà été ajoutée à la main dans le fichier de types).

## 2. Les deux templates EmailJS à créer

Service déjà utilisé : `service_ybjga5v`. Les identifiants attendus par le code
sont définis dans `submit.ts` :

| Constante | ID attendu |
|---|---|
| `EMAILJS_TEMPLATE_SIMULATEUR_ADRIAN` | `template_simu_adrian` |
| `EMAILJS_TEMPLATE_SIMULATEUR_CLIENT` | `template_simu_client` |

Si tu préfères d'autres identifiants, change-les dans `submit.ts` — c'est le
seul endroit où ils apparaissent.

### Template 1 — notification interne (`template_simu_adrian`)

Destinataire : ton adresse. Variables disponibles :

| Variable | Contenu |
|---|---|
| `{{from_name}}` | Nom et prénom saisis |
| `{{phone}}` | GSM normalisé (`+324XXXXXXXX`) |
| `{{from_email}}` | Email, ou « Non fourni » |
| `{{besoin}}` | Borne / RGIE / Projet combiné |
| `{{distance}}` | Distance borne-tableau, ou « Sans objet » |
| `{{installation}}` | État déclaré de l'installation |
| `{{usage}}` | Société, personnel ou copropriété |
| `{{fourchette}}` | Fourchette affichée au client |
| `{{complexe}}` | « OUI — métré technique requis » ou « Non » |
| `{{resume}}` | Résumé multiligne de toutes les réponses |
| `{{photo}}` | Lien signé 7 jours vers la photo, ou « Aucune photo transmise » |
| `{{suspect}}` | « OUI (envoi en N s) » si soumission anormalement rapide |
| `{{db_status}}` | « Enregistré » ou « ECHEC BASE — lead à ré-encoder à la main » |
| `{{date}}` | Date et heure de la simulation |

⚠️ `{{resume}}` et `{{photo}}` contiennent des sauts de ligne et du HTML :
utilise un template **HTML** et insère `{{{resume}}}` en triple accolade si ton
éditeur échappe le contenu, ou remplace les retours à la ligne par `<br>` dans
la mise en page du template.

### Template 2 — accusé de réception client (`template_simu_client`)

Destinataire : `{{to_email}}`. **Envoyé uniquement si le visiteur a laissé un
email** (le champ est facultatif dans le parcours).

| Variable | Contenu |
|---|---|
| `{{to_email}}` | Email du prospect (destinataire) |
| `{{from_name}}` | Son nom |
| `{{besoin}}` | Ce qu'il a demandé |
| `{{fourchette}}` | Son estimation |
| `{{resume}}` | Le détail de ses réponses |

Texte suggéré : rappeler l'estimation, préciser qu'elle est **indicative** et
confirmée après visite ou photos, et annoncer un recontact rapide.

## 3. Où modifier les tarifs

Tout est dans `config.ts`, nulle part ailleurs :

- `BORNE.base` — base d'une borne posée (1 800 € TTC)
- `SURCOUT_DISTANCE` — surcoût par distance (+250 € en 5-15 m)
- `BORNE.majorationIncertitude` — élargissement du haut de fourchette (15 %)
- `BORNE.majorationStandard` — élargissement appliqué dans tous les autres cas
  (10 %). À 0, l'écran afficherait « à partir de X € » au lieu d'une fourchette.

⚠️ Ces montants sont affichés au public. Ils doivent rester cohérents avec les
réponses « Combien coûte l'installation d'une borne ? » de `/faq` et de
`/services/bornes-de-recharge`, qui annoncent la même fourchette.
- `BORNE.plafond` — plafond absolu (3 000 €)
- `RGIE_FOURCHETTES` — fourchette RGIE selon l'état de l'installation
- `RGIE_FORFAIT` — forfait fixe schémas + organisme (550 €)
- `MENTIONS` — tous les textes légaux et avertissements
