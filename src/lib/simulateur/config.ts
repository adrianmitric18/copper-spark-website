/**
 * Simulateur de prix v2 — TOUTES les valeurs modifiables sont ici.
 *
 * Adrian doit pouvoir ajuster un tarif sans toucher au reste du code : aucun
 * montant, aucun libellé de choix ne doit vivre ailleurs que dans ce fichier.
 *
 * Règles absolues, arbitrées par Adrian le 2026-09-13 :
 *   1. Aucune mention du photovoltaïque nulle part dans le simulateur.
 *   2. Trois parcours totalement dédiés : borne, RGIE, dépannage. Le parcours
 *      « les deux » a été supprimé (voir PARCOURS_OBSOLETES).
 *   3. Le dossier technique et le passage de l'organisme agréé sont COMPRIS
 *      dans les fourchettes borne — c'est un argument commercial, et les
 *      fourchettes sont calées sur des chantiers réels qui les incluaient.
 *      (Inverse de la règle d'origine du brief 2026-08-09 : assumé.)
 *   4. Aucun prix ferme, aucun métrage affiché, aucun jargon.
 *   5. Le dépannage n'enregistre aucun lead : prix affichés, puis appel.
 */

// =====================================================================
//  Parcours
// =====================================================================

export type Parcours = "borne" | "rgie" | "depannage";

/** Valeurs acceptées dans `/simulateur?besoin=…` (pré-sélection par la page d'origine). */
export const PARCOURS: Parcours[] = ["borne", "rgie", "depannage"];

/**
 * Anciennes valeurs d'URL encore en circulation (liens externes, favoris,
 * résultats de recherche). Elles ne doivent jamais tomber sur l'étape 1 d'un
 * parcours qui n'existe plus : `combine` part sur la borne.
 */
export const PARCOURS_OBSOLETES: Record<string, Parcours> = {
  combine: "borne",
};

/**
 * Clé d'icône. La correspondance clé -> composant Lucide se fait dans l'UI
 * (SimulateurUI.tsx) : ce fichier reste du pur contenu, sans dépendance React.
 */
export type IconeChoix =
  | "borne"
  | "conformite"
  | "depannage"
  | "proche"
  | "allee"
  | "creuser"
  | "recente"
  | "classique"
  | "ancienne"
  | "inconnu"
  | "voiture"
  | "societe"
  | "immeuble"
  | "vente"
  | "certificat"
  | "travaux"
  | "maison"
  | "neuf"
  | "tableau"
  | "tableaux"
  | "jour"
  | "nuit"
  | "agenda"
  | "zone";

export interface ChoixSimple<T extends string> {
  value: T;
  label: string;
  description?: string;
  icone: IconeChoix;
}

export const CHOIX_PARCOURS: ChoixSimple<Parcours>[] = [
  {
    value: "borne",
    icone: "borne",
    label: "Installer une borne de recharge",
    description: "Pour recharger votre voiture électrique chez vous.",
  },
  {
    value: "rgie",
    icone: "conformite",
    label: "Mettre mon électricité en ordre",
    description:
      "Le contrôle officiel (RGIE) est obligatoire pour vendre, et après de gros travaux.",
  },
  {
    value: "depannage",
    icone: "depannage",
    label: "Un dépannage ou une panne",
    description: "Plus de courant, un disjoncteur qui saute, une prise qui a chauffé.",
  },
];

// =====================================================================
//  TVA
// =====================================================================

/**
 * Tous les montants borne et RGIE de ce fichier sont exprimés TTC, TVA 6 %
 * (logement de plus de 10 ans) — c'est de très loin le cas le plus fréquent.
 *
 * Le cas 21 % est DÉRIVÉ, jamais saisi à la main : une seule liste de chiffres
 * à valider, et les deux colonnes ne peuvent pas diverger.
 */
export const FACTEUR_TVA_21 = 1.21 / 1.06;

export type AgeLogement = "plus10" | "moins10" | "inconnu";

export const AGES_LOGEMENT: ChoixSimple<AgeLogement>[] = [
  {
    value: "plus10",
    icone: "maison",
    label: "Oui, plus de 10 ans",
    description: "La TVA est alors de 6 %.",
  },
  {
    value: "moins10",
    icone: "neuf",
    label: "Non, moins de 10 ans ou neuf",
    description: "La TVA est alors de 21 %.",
  },
  {
    value: "inconnu",
    icone: "inconnu",
    label: "Je ne sais pas",
    description: "On affiche le cas le plus courant, et on vérifie ensemble.",
  },
];

// =====================================================================
//  Parcours BORNE — question 1 : qui fournit la borne
// =====================================================================

export type Fournisseur = "alfen" | "client";

export const FOURNISSEURS: ChoixSimple<Fournisseur>[] = [
  {
    value: "alfen",
    icone: "borne",
    label: "Vous la fournissez et vous la posez",
    description: "Une Alfen, la marque que nous installons au quotidien.",
  },
  {
    value: "client",
    icone: "travaux",
    label: "J'ai déjà ma borne, ou je l'achète moi-même",
    description: "Nous nous occupons de la pose et du raccordement.",
  },
];

/** Champ texte libre affiché quand le visiteur fournit sa propre borne. */
export const CHAMP_MODELE_BORNE = {
  label: "Sa marque et son modèle, si vous les connaissez",
  placeholder: "Par exemple : Wallbox Pulsar Plus",
  maxLength: 120,
  mentions: [
    "Le modèle exact sera vérifié (fiche technique) avant confirmation du prix.",
    "Sous réserve de la présence d'une protection différentielle 6 mA DC intégrée à la borne. À défaut, une protection spécifique est ajoutée en supplément.",
  ],
} as const;

// =====================================================================
//  Parcours BORNE — question 2 : distance borne / tableau
// =====================================================================

export type Distance = "proche" | "moyenne" | "longue" | "inconnue";

export const DISTANCES: ChoixSimple<Distance>[] = [
  { value: "proche", icone: "proche", label: "Tout près : même pièce, ou mur voisin" },
  { value: "moyenne", icone: "allee", label: "À quelques mètres : allée, carport" },
  { value: "longue", icone: "creuser", label: "Loin, ou il faudra creuser" },
  {
    value: "inconnue",
    icone: "inconnu",
    label: "Je ne sais pas",
    description: "Pas de souci, on regarde ça ensemble.",
  },
];

/** Distances qui sortent du champ du simulateur (aucun prix affiché). */
export const DISTANCES_COMPLEXES: Distance[] = ["longue"];

// =====================================================================
//  État du tableau / de l'installation (borne ET RGIE)
// =====================================================================

// Aucun terme technique ici : ni « monophasé », ni « triphasé », ni
// « différentiel ». Le visiteur décrit ce qu'il voit, pas ce qu'il ignore.
export type EtatTableau = "recent" | "classique" | "ancien" | "inconnu";

export const ETATS_TABLEAU: ChoixSimple<EtatTableau>[] = [
  { value: "recent", icone: "recente", label: "Récent, ou refait il y a moins de 10 ans" },
  {
    value: "classique",
    icone: "classique",
    label: "Classique",
    description: "Il fonctionne bien, sans être tout neuf.",
  },
  {
    value: "ancien",
    icone: "ancienne",
    label: "Ancien : vieux fusibles, maison pas rénovée",
  },
  {
    value: "inconnu",
    icone: "inconnu",
    label: "Je ne sais pas",
    description: "Pas de souci, on vérifiera ensemble.",
  },
];

// =====================================================================
//  Parcours BORNE — question 5 : usage
// =====================================================================

export type Usage = "personnel" | "societe" | "copropriete";

export const USAGES: ChoixSimple<Usage>[] = [
  { value: "personnel", icone: "voiture", label: "Ma voiture personnelle" },
  {
    value: "societe",
    icone: "societe",
    label: "Une voiture de société, ou je suis indépendant",
    description: "Des avantages fiscaux existent dans ce cas.",
  },
  {
    value: "copropriete",
    icone: "immeuble",
    label: "Une copropriété, ou plusieurs bornes",
    description: "Immeuble, parking partagé, ou plus d'une borne à poser.",
  },
];

/** Usages qui sortent du champ du simulateur (aucun prix affiché). */
export const USAGES_COMPLEXES: Usage[] = ["copropriete"];

// =====================================================================
//  Parcours RGIE — question 1 : motif
// =====================================================================

export type ContexteRgie = "vente" | "certificat" | "travaux" | "professionnel";

export const CONTEXTES_RGIE: ChoixSimple<ContexteRgie>[] = [
  {
    value: "vente",
    icone: "vente",
    label: "Je vends mon habitation",
    description: "Le certificat est réclamé par le notaire pour passer l'acte.",
  },
  {
    value: "certificat",
    icone: "certificat",
    label: "Mon certificat arrive à échéance",
    description: "Un certificat de conformité est valable 25 ans.",
  },
  {
    value: "travaux",
    icone: "travaux",
    label: "Après des travaux, ou une installation neuve",
    description: "Le contrôle est obligatoire avant la mise en service.",
  },
  {
    value: "professionnel",
    icone: "societe",
    label: "C'est pour un bien professionnel",
    description: "Société, indépendant, ou bien mis en location.",
  },
];

/**
 * Usage déduit du motif : le parcours RGIE ne pose aucune question de véhicule.
 * Seul « bien professionnel » change quelque chose (lead marqué Professionnel,
 * mention de facturation société).
 */
export const USAGE_PAR_CONTEXTE_RGIE: Record<ContexteRgie, Usage> = {
  vente: "personnel",
  certificat: "personnel",
  travaux: "personnel",
  professionnel: "societe",
};

// =====================================================================
//  Parcours RGIE — question 2 : nombre de tableaux
// =====================================================================

export type NombreTableaux = "un" | "plusieurs" | "inconnu";

export const NOMBRES_TABLEAUX: ChoixSimple<NombreTableaux>[] = [
  { value: "un", icone: "tableau", label: "Un seul" },
  {
    value: "plusieurs",
    icone: "tableaux",
    label: "Plusieurs",
    description: "Bâtiment divisé, annexe, ou compteurs séparés.",
  },
  {
    value: "inconnu",
    icone: "inconnu",
    label: "Je ne sais pas",
    description: "On vérifiera lors du relevé.",
  },
];

/** Configurations qui sortent du forfait (aucun prix affiché). */
export const TABLEAUX_COMPLEXES: NombreTableaux[] = ["plusieurs"];

// =====================================================================
//  Parcours DÉPANNAGE — quand intervenir
// =====================================================================

/**
 * Deux moments, deux colonnes de forfaits (grille du 2026-10-25). Le « jour »
 * est la plage ouvrable ; tout le reste — soirée, nuit, week-end, jours
 * fériés — est au tarif nuit / week-end. L'ancienne option « sur rendez-vous »
 * a disparu : un rendez-vous convenu tombe dans l'une des deux plages.
 */
export type Moment = "jour" | "nuitWeekend";

/** Plage « jour », en heures pleines : de 7 h à 19 h. */
export const PLAGE_JOUR = { debut: 7, fin: 19 } as const;

/**
 * Décidé par Adrian le 2026-10-25 : le samedi est au tarif JOUR (le bureau est
 * ouvert le samedi jusqu'à 19 h). `true` le ferait basculer au tarif
 * soir / nuit. Tous les libellés qui décrivent les deux plages — simulateur,
 * page dépannage, FAQ — dérivent de cette constante : un seul booléen à changer.
 */
export const SAMEDI_AU_TARIF_WEEKEND = false;

/**
 * Nom de la plage hors jour, selon que le samedi en fait partie ou non :
 * « nuit / week-end » n'est vrai que si le samedi y est.
 */
export const LIBELLE_HORS_JOUR = {
  /** En-tête de colonne : « Soir / nuit / dimanche ». */
  court: SAMEDI_AU_TARIF_WEEKEND ? "Nuit / week-end" : "Soir / nuit / dimanche",
  /** Libellé de bouton : « Soir, nuit, dimanche ou jour férié ». */
  bouton: SAMEDI_AU_TARIF_WEEKEND
    ? "Nuit, week-end ou jour férié"
    : "Soir, nuit, dimanche ou jour férié",
  /** Complément de phrase : « … hors TVA le soir, la nuit, le dimanche ou un jour férié ». */
  phrase: SAMEDI_AU_TARIF_WEEKEND
    ? "la nuit, le week-end ou un jour férié"
    : "le soir, la nuit, le dimanche ou un jour férié",
} as const;

/** Définition de chaque plage, en toutes lettres, pour les écrans et la FAQ. */
export const DEFINITION_MOMENT: Record<Moment, string> = {
  jour: `Du lundi au ${SAMEDI_AU_TARIF_WEEKEND ? "vendredi" : "samedi"}, de ${PLAGE_JOUR.debut} h à ${PLAGE_JOUR.fin} h`,
  nuitWeekend: `Après ${PLAGE_JOUR.fin} h, avant ${PLAGE_JOUR.debut} h, ${
    SAMEDI_AU_TARIF_WEEKEND ? "le samedi, le dimanche" : "le dimanche"
  } et les jours fériés`,
};

/** Complément de phrase (« … hors TVA en journée »), par moment. */
export const COMPLEMENT_MOMENT: Record<Moment, string> = {
  jour: "en journée",
  nuitWeekend: LIBELLE_HORS_JOUR.phrase,
};

export const MOMENTS: ChoixSimple<Moment>[] = [
  {
    value: "jour",
    icone: "jour",
    label: "En journée",
    description: DEFINITION_MOMENT.jour,
  },
  {
    value: "nuitWeekend",
    icone: "nuit",
    label: LIBELLE_HORS_JOUR.bouton,
    description: DEFINITION_MOMENT.nuitWeekend,
  },
];

// =====================================================================
//  Parcours DÉPANNAGE — question 3 : zone de déplacement
// =====================================================================

/**
 * `hors` = hors secteur habituel. `sansForfait` = dans le secteur, mais le
 * déplacement n'est pas forfaitisable (Bruxelles et ses 19 communes) : les
 * deux mènent à « sur devis », mais ne se disent pas de la même façon au
 * visiteur.
 */
export type Zone = "zone1" | "zone2" | "zone3" | "hors" | "sansForfait";

/**
 * Zones calculées au kilomètre depuis Court-Saint-Étienne, mais affichées par
 * liste de communes : personne ne sait à combien de kilomètres il habite, tout
 * le monde sait dans quelle commune il vit.
 */
export interface ZoneDeplacement {
  value: Zone;
  label: string;
  /**
   * Forfait dépannage — déplacement ET première heure compris — HORS TVA,
   * par moment. `null` = pas forfaitisable, le déplacement est confirmé par
   * téléphone. (Grille du 2026-10-25 : remplace l'ancien déplacement seul
   * 25 / 35 / 50 € + main-d'œuvre horaire, qui n'était pas rentable.)
   */
  forfait: Record<Moment, number> | null;
  communes: string[];
}

/**
 * Zones affichées par liste de communes, mais le visiteur, lui, choisit SA
 * commune : c'est la seule chose qu'il sait avec certitude. Les zones restent
 * la structure tarifaire, les communes en sont l'interface.
 */
export interface CommuneZone {
  commune: string;
  zone: Zone;
}

export const ZONES: ZoneDeplacement[] = [
  {
    value: "zone1",
    label: "Zone 1",
    forfait: { jour: 110, nuitWeekend: 210 },
    communes: [
      "Court-Saint-Étienne",
      "Ottignies-Louvain-la-Neuve",
      "Mont-Saint-Guibert",
      "Céroux-Mousty",
      "Genappe",
      "Chastre",
      "Bousval",
    ],
  },
  {
    value: "zone2",
    label: "Zone 2",
    forfait: { jour: 130, nuitWeekend: 230 },
    communes: [
      "Wavre",
      "Rixensart",
      "Lasne",
      "Villers-la-Ville",
      "Walhain",
      "Nivelles",
      "Grez-Doiceau",
      "Waterloo",
    ],
  },
  {
    value: "zone3",
    label: "Zone 3",
    forfait: { jour: 150, nuitWeekend: 250 },
    communes: ["Braine-l'Alleud", "Jodoigne", "Gembloux", "Charleroi"],
  },
  {
    value: "sansForfait",
    label: "Bruxelles",
    forfait: null,
    communes: [],
  },
  {
    value: "hors",
    label: "Ma commune n'est pas dans la liste",
    forfait: null,
    communes: [],
  },
];

/**
 * Entrées du sélecteur qui ne sont pas des communes au sens strict et dont le
 * déplacement ne peut pas être forfaitisé.
 *
 * Bruxelles couvre 19 communes, de 25 à 40 km de Court-Saint-Étienne : un
 * forfait unique y serait sous-facturé au nord et affiché ferme sur un écran
 * lu vite (arbitrage du 2026-09-14, maintenu avec la grille du 2026-10-25). La
 * demi-heure supplémentaire, elle, reste annoncée normalement.
 */
export const COMMUNES_SANS_FORFAIT: CommuneZone[] = [
  { commune: "Bruxelles (selon la commune)", zone: "sansForfait" },
];

/** Toutes les entrées du sélecteur de commune, par ordre alphabétique. */
export const COMMUNES: CommuneZone[] = [
  ...ZONES.flatMap((z) => z.communes.map((commune) => ({ commune, zone: z.value }))),
  ...COMMUNES_SANS_FORFAIT,
].sort((a, b) => a.commune.localeCompare(b.commune, "fr"));

// =====================================================================
//  Écran dépannage — un seul écran, le prix d'abord
// =====================================================================

/**
 * Écran dépannage : purement tarifaire.
 *
 * Deux décisions successives d'Adrian l'ont amené là. D'abord la compaction :
 * trois écrans avant de voir un prix, c'était deux de trop pour quelqu'un dont
 * l'installation vient de lâcher. Ensuite la suppression du contrôle de
 * sécurité (2026-09-14) : le simulateur est un outil de prix, il ne donne
 * aucune consigne de sécurité. Depuis le 2026-10-26, le site n'en donne plus
 * aucune non plus (consigne pompiers / 112 retirée partout, décision d'Adrian).
 */
export const ECRAN_DEPANNAGE = {
  eyebrow: "Dépannage",
  // « Nos tarifs » annonçait une grille — c'est ce qu'affichait la v1. L'écran
  // chiffre désormais un cas, pas un catalogue.
  titre: "Ce que coûte votre dépannage",
  /** Intitulé du montant tant que la commune n'est pas choisie (plancher). */
  intitulePlancher: "Intervention à partir de",
  /** Intitulé du montant une fois la commune connue : c'est LE forfait. */
  intituleForfait: "Votre forfait dépannage",
  /** Intitulé et « montant » quand le déplacement n'est pas forfaitisable. */
  intituleSansForfait: "Forfait dépannage",
  montantSansForfait: "Confirmé par téléphone",
  sousTitreMontant: "hors TVA — déplacement et première heure compris",
  sousTitreSansForfait: "hors TVA — le déplacement dépend de votre commune",
  invitePrecision: "Choisissez votre commune pour le montant exact.",
  labelCommune: "Votre commune",
  optionHorsListe: "Ma commune n'est pas dans la liste",
  labelMoment: "Quand faut-il intervenir ?",
} as const;

/** Libellés courts, pour les boutons du sélecteur de l'écran dépannage. */
export const MOMENTS_COURTS: Record<Moment, string> = {
  jour: "En journée",
  nuitWeekend: LIBELLE_HORS_JOUR.bouton,
};

// =====================================================================
//  Tarifs — BORNE (TTC, TVA 6 %)
// =====================================================================

export interface Fourchette {
  min: number;
  max: number;
}

export const BORNE = {
  /**
   * Borne Alfen fournie ET posée.
   * Calée sur des chantiers réels : une Alfen posée facturée 2 834 € TTC,
   * poste dossier + contrôle de 300 € compris dedans.
   */
  alfen: { min: 2650, max: 3000 } as Fourchette,
  /**
   * Pose seule, borne fournie par le client.
   * Calée sur un chantier réel à 998 € TTC, poste dossier + contrôle d'environ
   * 285 € compris dedans.
   */
  poseSeule: { min: 950, max: 1300 } as Fourchette,
  /**
   * Liaison entre le tableau et la borne.
   * « Tout près » est compris dans la base. « Je ne sais pas » couvre
   * honnêtement les deux cas plausibles plutôt que de trancher à la place du
   * visiteur.
   */
  liaison: {
    proche: { min: 0, max: 0 },
    moyenne: { min: 250, max: 250 },
    inconnue: { min: 0, max: 250 },
    longue: { min: 0, max: 0 }, // non utilisé : bascule en cas complexe
  } as Record<Distance, Fourchette>,
} as const;

/**
 * États de tableau pour lesquels l'adaptation éventuelle ne peut pas être
 * chiffrée en ligne. Sur les autres, la ligne s'affiche « comprise ».
 */
export const TABLEAUX_A_CONFIRMER: EtatTableau[] = ["classique", "ancien", "inconnu"];

// =====================================================================
//  Tarifs — RGIE
// =====================================================================

/**
 * Forfait fixe, affiché 550 € quel que soit le taux de TVA : le libellé
 * ci-dessous est celui d'Adrian, mot pour mot, et il porte le montant.
 */
export const RGIE_FORFAIT = {
  montant: 550,
  // « maison standard » était un critère subjectif opposable : le client le
  // lisait comme un engagement, Adrian pouvait le refuser sur son appréciation.
  // « une habitation avec un seul tableau électrique » est vérifiable.
  libelle:
    "Forfait 550 € pour une habitation avec un seul tableau électrique : relevé technique complet sur place + rédaction des plans (unifilaire et position) + coordination et présence lors du contrôle de l'organisme agréé.",
  /**
   * Le libellé d'Adrian dit « coordination et présence », ce qui décrit le
   * travail fait PENDANT un contrôle — un lecteur en déduit naturellement que
   * la facture de l'organisme arrive en plus. Elle n'arrive pas : la redevance
   * est refacturée au coût et intégrée au forfait. Formulation validée le
   * 2026-09-13, à ne pas édulcorer : c'est elle qui évite le litige au
   * téléphone.
   */
  precision:
    "La redevance de l'organisme agréé est comprise : vous ne recevez aucune facture séparée de l'organisme de contrôle.",
  /**
   * Le forfait couvre le PREMIER passage. Sur une installation ancienne, la
   * non-conformité est le cas courant : travaux, puis second passage. Celui-là
   * est refacturé au prix coûtant (règle existante du devis Meunier, arbitrée
   * par Adrian le 2026-09-13). Sans cette clause, la phrase ci-dessus est un
   * absolu que le forfait ne couvre pas.
   */
  secondPassage:
    "Si un second passage de l'organisme est nécessaire après les travaux de mise en conformité, sa redevance vous est refacturée par nos soins, au prix coûtant, sans marge.",
  /**
   * Glose du seul mot technique du parcours. Le libellé ci-dessus est
   * intouchable (validé mot pour mot), on l'explique donc juste après.
   */
  glose:
    "Les plans, ce sont le schéma qui montre comment votre installation est câblée, et celui qui situe prises et points lumineux dans le logement.",
} as const;

/**
 * Travaux de mise en conformité, TTC TVA 6 %, forfait NON compris.
 * Fourchettes validées par Adrian le 2026-09-13.
 */
export const RGIE_TRAVAUX: Record<EtatTableau, Fourchette> = {
  recent: { min: 500, max: 1200 },
  classique: { min: 500, max: 2000 },
  ancien: { min: 800, max: 3000 },
  // « Je ne sais pas » : bas de la fourchette standard, haut laissé ouvert.
  // Ne jamais bloquer le visiteur, ne jamais lui promettre un prix bas qu'on
  // ne pourrait pas tenir.
  inconnu: { min: 500, max: 3000 },
};

// =====================================================================
//  Tarifs — DÉPANNAGE (HORS TVA)
// =====================================================================

/**
 * Grille du 2026-10-25 : un FORFAIT par zone et par moment (déplacement et
 * première heure compris — voir `ZONES`), puis une demi-heure supplémentaire
 * entamée. Il n'y a plus de déplacement seul ni de tarif horaire.
 */
export const DEPANNAGE = {
  /** Demi-heure supplémentaire entamée, au-delà de la première heure, hors TVA. */
  demiHeureSupplementaire: { jour: 40, nuitWeekend: 50 } as Record<Moment, number>,
  libelleForfait: "Forfait dépannage",
  detailForfait:
    "Déplacement et première heure compris. Annoncé et accepté avant que nous prenions la route.",
  detailForfaitSansCommune: "Selon votre commune. Déplacement et première heure compris.",
  detailForfaitParTelephone:
    "Déplacement et première heure compris. Confirmé par téléphone avant tout départ.",
  libelleDemiHeure: "Demi-heure supplémentaire entamée",
  detailDemiHeure: "Au-delà de la première heure, en sus du forfait.",
  /**
   * Durée d'un dépannage courant, validée par Adrian le 2026-09-14. Sert à
   * afficher un ordre de grandeur réel à côté du forfait : celui-ci est le
   * minimum absolu, pas ce que coûte une intervention typique.
   */
  dureeCouranteHeures: 2,
  /** Le même nombre, en toutes lettres, pour la phrase affichée. */
  dureeCouranteTexte: "deux",
} as const;

// =====================================================================
//  Mentions affichées
// =====================================================================

export const MENTIONS = {
  estimationIndicative:
    "Estimation indicative — le devis définitif est confirmé par un électricien basé à Court-Saint-Étienne après visite ou photos.",
  aConfirmer:
    "Les postes marqués « à confirmer » se chiffrent sur photo de votre tableau, ou lors de la visite. Ils ne sont pas compris dans le total ci-dessus.",
  // Formulation retravaillée le 2026-09-13 : la version précédente affirmait
  // que « beaucoup de devis » sortent ces postes de leur total « pour paraître
  // moins chers ». Invérifiable, et ça prête une intention trompeuse à des
  // confrères identifiables à 20 km. Même argument, sous forme de vérification
  // que le client peut faire lui-même.
  dossierCompris:
    "Le dossier technique et le passage de l'organisme agréé sont compris dans ce prix. Pensez à comparer ce point sur les autres devis que vous recevrez : ces deux postes n'y sont pas toujours compris.",
  // L'ancienneté de 10 ans n'est pas la seule condition du taux réduit belge :
  // le bien doit aussi être affecté au logement privé. Sans cette précision, on
  // annonce 6 % à quelqu'un qui en paiera 21.
  tvaReduite: "TVA de 6 % appliquée : votre logement privé a plus de 10 ans.",
  tvaNormale: "TVA de 21 % appliquée : votre logement a moins de 10 ans.",
  tvaInconnue:
    "Prix affichés avec la TVA à 6 %, celle des logements privés de plus de 10 ans. Pour un logement plus récent, la TVA est de 21 %.",
  /**
   * Bien professionnel ou voiture de société : on n'affiche aucun taux ferme.
   * Le taux dépend du bâtiment, pas du client — un indépendant dans son
   * logement privé de plus de 10 ans garde le 6 %, et une société assujettie
   * avec un numéro de TVA actif bascule en autoliquidation. Annoncer 21 %
   * serait faux dans les deux cas.
   */
  tvaProfessionnel:
    "Le taux de TVA applicable est confirmé avec vous : il dépend de l'affectation du bien.",
  // Les régimes fiscaux belges sur les bornes ont été bornés dans le temps et
  // dégressifs : annoncer une déduction comme un fait permanent, sur une page
  // qui vivra des années, revient à promettre un avantage qui peut avoir
  // disparu. On renvoie donc la vérification au devis, daté, lui.
  deductionSociete:
    "Sociétés & indépendants : selon le régime en vigueur, une déduction fiscale peut s'appliquer. Nous vérifions ce qui vaut pour votre situation au moment du devis.",
  facturationSociete:
    "Facturation adaptée pour les sociétés et indépendants : TVA déductible, attestation pour votre comptable.",
  splitBilling:
    "Les bornes connectées, Alfen en tête, gèrent le split-billing : l'électricité que vous consommez pour recharger est comptabilisée à part et peut vous être remboursée par votre employeur.",
  gestionDynamique:
    "La répartition automatique de la puissance entre votre maison et votre voiture est activable au passage au compteur digital.",
  casComplexe:
    "Votre projet mérite une visite sur place, pour tout mesurer et vous donner un prix juste.",
  electricienLocal:
    "Votre demande est traitée par un électricien local basé à Court-Saint-Étienne, pas par une plateforme.",
  rgpdCapture:
    "En validant, vous acceptez d'être recontacté par Le Cuivre Électrique au sujet de votre demande. Vos données ne sont jamais revendues.",
  /**
   * Version courte, réservée à l'écran dépannage : deux phrases de fiscalité
   * sur l'écran de quelqu'un qui n'a plus de courant, c'était une de trop. Les
   * parcours borne et RGIE gardent leurs mentions complètes — là, le visiteur
   * a le temps de lire.
   */
  depannageTva:
    "Prix hors TVA. Le taux — 6 % ou 21 % — dépend de l'âge et de l'usage de votre logement ; il est confirmé avec vous avant l'intervention.",
  depannageMateriel:
    "Le matériel éventuellement nécessaire (différentiel, disjoncteur, prise…) est facturé en sus, après votre accord.",
  // La réserve de disponibilité de nuit vaut pour TOUTES les zones, pas
  // seulement la plus lointaine (arbitrage du 2026-09-13) : un artisan seul ne
  // peut pas garantir un départ à 3 h du matin, où que ce soit.
  depannageNuit:
    "Intervention de nuit sous réserve de disponibilité, confirmée par téléphone.",
  depannageHorsZone:
    "Votre commune est en dehors de notre secteur habituel : le déplacement, et donc le forfait, est confirmé par téléphone avant tout départ.",
  // Bruxelles est bien desservie — c'est l'étendue de la région (19 communes,
  // de 25 à 40 km) qui interdit un forfait unique, pas la distance.
  depannageBruxelles:
    "Bruxelles compte 19 communes, à des distances très différentes : le forfait est calculé selon la vôtre et confirmé par téléphone, avant tout départ.",
  // Demandé par Adrian le 2026-10-25 : le visiteur doit savoir avant d'appeler
  // que le dépannage se règle sur place (cohérent avec les CGV, §5 : paiement
  // comptant à la fin de l'intervention).
  depannagePaiement: "Le dépannage se paie sur place, à la fin de l'intervention.",
  // « On vous répond » était une garantie qu'un artisan seul ne peut pas tenir,
  // et l'argument n'en avait pas besoin.
  depannagePasDeFormulaire: "Pas de formulaire pour une panne : un appel suffit.",
} as const;

/** Message WhatsApp pré-rempli depuis l'écran dépannage. */
export const MESSAGE_WHATSAPP_DEPANNAGE =
  "Bonjour, j'ai un problème électrique et je souhaite un dépannage. Voici ma situation :";

// =====================================================================
//  Les questions, écran par écran
// =====================================================================

/**
 * Questions posées écran par écran. Le parcours dépannage n'en a aucune : il
 * tient sur un écran unique, décrit par `ECRAN_DEPANNAGE`.
 */
export type IdQuestion =
  // Parcours borne
  | "fournisseur"
  | "distance"
  | "usage"
  // Parcours borne ET RGIE
  | "tableau"
  | "age"
  // Parcours RGIE
  | "motif"
  | "tableaux";

export interface DefinitionQuestion {
  titre: string;
  sousTitre?: string;
  options: ChoixSimple<string>[];
  /** Précision affichée sous les réponses, quelle que soit la réponse choisie. */
  note?: string;
  /**
   * Valeur qui ouvre un champ texte libre sous les réponses. Tant qu'elle est
   * sélectionnée, l'écran n'avance plus tout seul : le visiteur doit pouvoir
   * taper avant de valider.
   */
  champLibreSi?: string;
}

export const QUESTIONS: Record<IdQuestion, DefinitionQuestion> = {
  fournisseur: {
    titre: "Qui fournit la borne ?",
    sousTitre: "Les deux sont possibles, le prix n'est simplement pas le même.",
    options: FOURNISSEURS,
    // La page service met Hager et Wallbox en avant : ne pas le rappeler ici
    // laisserait croire qu'on ne pose qu'une seule marque.
    note: "Nous installons également Hager, Wallbox et les autres marques du marché. Dans ce cas, choisissez « j'ai déjà ma borne » et indiquez le modèle : nous chiffrons la pose ici, et la borne à part.",
    champLibreSi: "client",
  },
  distance: {
    titre: "Où sera placée la borne par rapport à votre tableau électrique ?",
    sousTitre:
      "Le tableau, c'est le coffret avec les fusibles ou les disjoncteurs, souvent au garage, à la cave ou dans la buanderie.",
    options: DISTANCES,
  },
  tableau: {
    titre: "Votre tableau électrique, il ressemble à quoi ?",
    sousTitre: "Une idée générale suffit, on vérifiera ensemble.",
    options: ETATS_TABLEAU,
  },
  age: {
    titre: "Votre logement a plus de 10 ans ?",
    sousTitre: "C'est ce qui détermine la TVA sur votre facture.",
    options: AGES_LOGEMENT,
  },
  usage: {
    titre: "Cette borne, c'est pour…",
    sousTitre: "Cela change les avantages fiscaux auxquels vous avez droit.",
    options: USAGES,
  },
  motif: {
    titre: "Cette mise en conformité, c'est pour quoi ?",
    sousTitre: "Cela nous dit surtout s'il y a une échéance à tenir.",
    options: CONTEXTES_RGIE,
  },
  tableaux: {
    titre: "Combien de tableaux électriques y a-t-il dans le bâtiment ?",
    sousTitre: "Le forfait vaut pour une maison avec un seul tableau.",
    options: NOMBRES_TABLEAUX,
  },
};

/**
 * Les questions posées, dans l'ordre, parcours par parcours.
 *
 * Le dépannage n'en a aucune : tout tient sur un écran unique où le prix est
 * lisible avant le moindre clic (voir `ECRAN_DEPANNAGE`).
 */
export const SEQUENCES: Record<Parcours, IdQuestion[]> = {
  borne: ["fournisseur", "distance", "tableau", "age", "usage"],
  rgie: ["motif", "tableaux", "tableau", "age"],
  depannage: [],
};

/**
 * Nombre de questions réellement posées, par parcours.
 *
 * DÉRIVÉ de `SEQUENCES`, jamais saisi : les pages d'origine
 * (ServicePageLayout, ZonePageLayout, SimulateurBanner, page /simulateur)
 * annoncent ce chiffre au visiteur, et le laisser vivre en dur dans chaque
 * composant l'a déjà fait dériver une fois.
 */
export const NB_QUESTIONS: Record<Parcours, number> = {
  borne: SEQUENCES.borne.length,
  rgie: SEQUENCES.rgie.length,
  depannage: SEQUENCES.depannage.length,
};

// =====================================================================
//  Contact
// =====================================================================

/**
 * Page où la grille de dépannage est affichée sans clic. Depuis le 2026-10-25,
 * toute entrée « dépannage » du simulateur (étape 1, `?besoin=depannage`, barre
 * mobile, encart CTA) y renvoie : un visiteur en panne ne passe pas par un
 * simulateur pour lire un prix.
 */
export const PAGE_DEPANNAGE = "/services/depannage-urgent";

export const CONTACT = {
  telephone: "+32485755227",
  telephoneAffiche: "0485 75 52 27",
  whatsapp: "32485755227",
} as const;

// =====================================================================
//  Préférence de rappel (écran de capture)
// =====================================================================

export type PreferenceRappel = "rappel" | "prix";

export const PREFERENCES_RAPPEL: { value: PreferenceRappel; label: string }[] = [
  { value: "rappel", label: "Je veux être rappelé pour en parler" },
  { value: "prix", label: "Je veux juste voir les prix pour l'instant" },
];

// =====================================================================
//  Anti-spam & upload
// =====================================================================

/** GSM belge. Utilisé côté client ET répliqué en contrainte RLS Supabase. */
export const REGEX_GSM_BELGE = /^(?:\+32|0032|0)?4[5-9]\d{7}$/;

/**
 * Nettoie une saisie de GSM avant validation : ne garde que les chiffres et un
 * éventuel « + » de tête.
 *
 * Espaces (y compris insécables), points, tirets de toutes largeurs, barres
 * obliques et parenthèses sont ignorés. Un numéro belge valide ne doit jamais
 * être refusé à cause de son formatage : « 0470 12 34 56 »,
 * « +32 470/12.34.56 » et « 0032-470-123-456 » désignent le même numéro.
 */
export const nettoyerGsm = (input: string): string => {
  const avecPlus = input.trimStart().startsWith("+");
  // \D retire tout ce qui n'est pas un chiffre, « + » compris : d'où le
  // drapeau relevé avant, puis réappliqué.
  const chiffres = input.replace(/\D/g, "");
  return avecPlus ? `+${chiffres}` : chiffres;
};

/**
 * Filtre la frappe dans le champ GSM, à la volée.
 *
 * Retire ce qui ne peut appartenir à un numéro (lettres collées par un
 * copier-coller depuis une signature de mail) mais laisse les séparateurs :
 * se battre avec quelqu'un qui tape ses espaces est le meilleur moyen de lui
 * faire abandonner le formulaire. Retire aussi le préfixe pays, déjà affiché à
 * gauche du champ, pour ne pas obtenir « +32 +32 470… ».
 */
export const saisirGsm = (brut: string): string =>
  brut
    .replace(/[^\d+\s.\-/()]/g, "")
    .replace(/^\s*(?:\+\s*32|0032)/, "")
    // Le préfixe retiré laisse son séparateur derrière lui : « +32 470… »
    // deviendrait «  470… » et « 0032-470… » deviendrait « -470… ». La saisie
    // se faisant caractère par caractère, ce nettoyage doit être réappliqué à
    // chaque frappe, pas seulement au collage.
    .replace(/^[\s.\-/()]+/, "");

/**
 * Email. Volontairement permissive (on ne rejette pas une adresse valide et
 * exotique), mais suffisante pour écarter les saisies qui ne partiront jamais.
 *
 * Répliquée côté base dans la policy RLS de la branche simulateur :
 *   '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]{2,}$'
 * Toute modification ici doit être reportée dans une migration.
 */
export const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const UPLOAD = {
  /** Taille maximale acceptée avant compression, en Mo. */
  maxMo: 8,
  /**
   * Au-delà de ce poids, on compresse côté client avant l'envoi. Une photo de
   * tableau prise au téléphone pèse couramment 3 à 5 Mo : sur une 4G moyenne,
   * l'envoyer telle quelle fait patienter une minute devant un bouton figé.
   */
  seuilCompressionMo: 2,
  /** Poids visé après compression. */
  cibleCompressionMo: 1.5,
  maxWidthOrHeight: 1920,
  bucket: "lead-photos",
} as const;

/**
 * En dessous de ce délai entre l'ouverture du simulateur et l'envoi, la
 * soumission est marquée comme suspecte dans le payload (sans être bloquée :
 * un faux positif ne doit jamais coûter un vrai lead).
 */
export const DELAI_SUSPECT_MS = 10_000;

/** Clé de session : une seule soumission par onglet. */
export const CLE_SESSION_ENVOI = "simulateur_envoye_v1";
