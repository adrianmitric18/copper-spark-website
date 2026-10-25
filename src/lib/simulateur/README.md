# Simulateur de prix v2 — mise en service

Version 2 du 2026-09-13 : **trois parcours totalement dédiés** (borne, RGIE,
dépannage) et un **mini-devis indicatif par poste** à la place de la fourchette
unique. Le parcours « les deux » a été supprimé.

## 1. Migration Supabase

**Aucune migration n'est nécessaire pour la v2.** Le payload est une colonne
`jsonb` libre : les nouveaux champs y entrent sans changement de schéma.

Les deux migrations de la v1 restent indispensables :

```
supabase/migrations/20260809120000_simulateur_leads.sql
supabase/migrations/20260816120000_simulateur_email_obligatoire.sql
```

⚠️ **`source` doit rester `'simulateur'`.** La policy d'insertion publique a deux
branches : `source = 'simulateur'` (pas d'adresse, GSM belge et email validés en
base) et **toutes les autres sources**, qui exigent rue, numéro, code postal et
commune. Marquer le parcours autrement (`simulateur_depannage`, par exemple)
ferait échouer silencieusement chaque insertion. Le parcours vit dans le
payload, jamais dans `source`.

La taille du payload est plafonnée à 8 Ko par la policy
(`pg_column_size(payload) <= 8192`). Le devis par lignes reste très en dessous ;
en ajouter beaucoup d'autres demanderait de vérifier ce point.

## 2. Les deux templates EmailJS

**Inchangés.** Aucun nom de variable n'a bougé entre la v1 et la v2 : le détail
du devis par poste passe par `{{resume}}`, déjà multiligne. Rien à refaire côté
compte EmailJS.

| Constante | ID attendu |
|---|---|
| `EMAILJS_TEMPLATE_SIMULATEUR_ADRIAN` | `template_simu_adrian` |
| `EMAILJS_TEMPLATE_SIMULATEUR_CLIENT` | `template_simu_client` |

Variables du template interne : `{{from_name}}`, `{{phone}}`, `{{phone_wa}}`,
`{{from_email}}`, `{{besoin}}` (le parcours), `{{distance}}`,
`{{installation}}` (état du tableau), `{{usage}}` (ou le motif RGIE),
`{{fourchette}}` (total affiché), `{{complexe}}`, `{{resume}}`, `{{photo}}`,
`{{suspect}}`, `{{db_status}}`, `{{date}}`.

Template client : `{{to_email}}`, `{{from_name}}`, `{{besoin}}`,
`{{fourchette}}`, `{{resume}}`.

## 3. Les trois parcours

| URL | Parcours | Questions | Capture | Lead |
|---|---|---|---|---|
| `/simulateur` | étape 1 (3 choix) puis le parcours choisi | — | — | — |
| `/simulateur?besoin=borne` | fourniture → distance → tableau → âge → usage | 5 | oui | oui |
| `/simulateur?besoin=rgie` | motif → nombre de tableaux → installation → âge | 4 | oui | oui |
| `/simulateur?besoin=depannage` | **redirigé vers `/services/depannage-urgent`** (grille affichée sans clic) | — | — | — |

| `/simulateur?besoin=combine` | redirigé vers le parcours borne | — | — | — |

Chacun des trois parcours a son entrée sur la page service correspondante
(`SimulateurCTA` + lien du hero via `simulateurCta`), et la barre mobile
(`BESOIN_PAR_PAGE`) y renvoie aussi. Sur `/services/depannage-urgent`, l'encart
est posé **après** le bloc d'urgence : quelqu'un en panne doit tomber sur le
numéro d'abord.

Le **dépannage ne passe plus par le simulateur** (décision d'Adrian du
2026-10-25) : la grille est affichée sans clic en haut de
`/services/depannage-urgent` (`GrilleDepannage`), et toutes les entrées
« dépannage » — étape 1, `?besoin=depannage`, barre mobile, encart CTA — y
renvoient (`PAGE_DEPANNAGE`). L'ancien écran dépannage du simulateur a été
supprimé le 2026-10-26 ; `calculerDevis` lève une erreur si on l'appelle encore
avec le parcours dépannage. Les zones (`ZONES`) et `HORS_FORFAIT` restent dans
`config.ts` : c'est la source unique de la grille.

Les questions ne vivent pas dans le composant : elles sont décrites par
`QUESTIONS` et `SEQUENCES` dans `config.ts`, et rendues par un écran générique.
Ajouter, retirer ou réordonner une question ne demande aucune ligne de React.

Le nombre de questions annoncé sur les pages d'origine vient de `NB_QUESTIONS`,
**dérivé de `SEQUENCES`** : il ne peut plus se désaligner du parcours réel
(c'était un piège de la v1).

## 4. Où modifier les tarifs

Tout est dans `config.ts`, nulle part ailleurs. **Tous les montants borne et
RGIE sont saisis TTC, TVA 6 %** (logement de plus de 10 ans) : le cas 21 % est
dérivé par `FACTEUR_TVA_21`, jamais saisi à la main, pour qu'il n'y ait qu'une
seule liste de chiffres à valider.

| Constante | Contenu | Validé le |
|---|---|---|
| `BORNE.alfen` | Alfen fournie et posée, 2 650 – 3 000 € | 2026-09-13 |
| `BORNE.poseSeule` | Pose seule, borne du client, 950 – 1 300 € | 2026-09-13 |
| `BORNE.liaison` | Liaison tableau ↔ borne (+250 € à quelques mètres) | v1 |
| `TABLEAUX_A_CONFIRMER` | États de tableau dont l'adaptation n'est pas chiffrée en ligne | 2026-09-13 |
| `RGIE_FORFAIT` | Forfait 550 €, libellé exact d'Adrian + précision organisme | 2026-09-13 |
| `RGIE_TRAVAUX` | Travaux par état d'installation (500–1 200 / 500–2 000 / 800–3 000 / 500–3 000) | 2026-09-13 |
| `ZONES` | Forfaits dépannage HTVA, déplacement + 1re heure compris : 110 / 130 / 150 € jour (lundi-samedi 7 h-19 h), 210 / 230 / 250 € soir-nuit-dimanche-fériés ; Bruxelles et hors liste = confirmé par téléphone | 2026-10-25 |
| `DEPANNAGE.demiHeureSupplementaire` | Demi-heure supplémentaire entamée : 40 € jour, 50 € soir-nuit-dimanche | 2026-10-25 |
| `SAMEDI_AU_TARIF_WEEKEND` | `false` = samedi au tarif jour (décidé par Adrian). Tous les libellés de plage (`DEFINITION_MOMENT`, `LIBELLE_HORS_JOUR`) en dérivent | 2026-10-25 |
| `MENTIONS.depannagePaiement` | « Le dépannage se paie sur place, à la fin de l'intervention » (cohérent CGV §5) | 2026-10-25 |
| `MENTIONS` | Tous les textes légaux et avertissements | — |

⚠️ Ces montants sont affichés au public. Ils doivent rester cohérents avec :

- `/faq` — « Combien coûte l'installation d'une borne de recharge ? »
- `/services/bornes-de-recharge` — « Quel est le coût d'installation d'une borne ? »

Les deux ont été alignés sur 2 650 – 3 000 € le 2026-09-13. Toute modification
de `BORNE.alfen` ou `BORNE.poseSeule` doit y être reportée le même jour.

La grille de dépannage, elle, est **importée** depuis `config.ts` par
`/services/depannage-urgent` (section « Tarification transparente » et FAQ
« Quel est le tarif d'un dépannage urgent ? ») et par `/faq` (plancher) :
modifier `ZONES` ou `DEPANNAGE` met ces pages à jour sans autre intervention.
Les CGV (§5) ne citent aucun montant de dépannage.

## 5. Deux règles de fond, à ne pas réapprendre

1. **Le dossier technique et le passage de l'organisme agréé sont COMPRIS** dans
   les fourchettes borne, et c'est dit à l'écran. Les deux fourchettes sont
   calées sur des chantiers réels qui les incluaient (Alfen posée à 2 834 € TTC
   avec un poste dossier + contrôle de 300 € ; pose seule à 998 € TTC avec
   environ 285 €). C'est l'**inverse** de la règle du brief d'origine
   (2026-08-09) : le changement est assumé et c'est un argument commercial.
2. **Un poste « à confirmer » n'entre jamais dans le total.** Le total affiché
   est la somme des seules lignes chiffrées, et l'écran le dit. Ne jamais
   « boucher » un poste inconnu par une estimation pour faire un total plus
   rond.

## 6. Événements GA4

Les noms de la v1 sont conservés (les renommer casserait l'historique), avec un
paramètre `parcours` en plus :

`simu_step_1` … `simu_step_N` · `simu_capture_vu` · `simu_resultat_vu` ·
`simu_depannage_vers_page` (clic dépannage à l'étape 1) · `simu_lead_envoye` (avec
`preference_rappel`) · `simu_cas_complexe` · `form_submit`.
