// Définitions des 5 checklists de visite chantier
export type ChecklistType = "rgie" | "pv" | "borne" | "installation" | "generique";

export interface ChecklistTemplateItem {
  key: string;
  label: string;
  group: string;
}

const buildItems = (groups: Record<string, string[]>): ChecklistTemplateItem[] => {
  const items: ChecklistTemplateItem[] = [];
  let order = 0;
  for (const [group, labels] of Object.entries(groups)) {
    for (const label of labels) {
      items.push({
        key: `${group.toLowerCase().replace(/[^a-z0-9]+/gi, "_")}_${order}`,
        label,
        group,
      });
      order++;
    }
  }
  return items;
};

export const CHECKLIST_LABELS: Record<ChecklistType, string> = {
  rgie: "RGIE / Mise en conformité",
  pv: "Panneaux photovoltaïques",
  borne: "Borne de recharge",
  installation: "Installation / Rénovation",
  generique: "Visite générique",
};

const RGIE = buildItems({
  "Matériel à emporter": [
    "Multimètre",
    "Testeur de prise",
    "Testeur différentiel",
    "Téléphone chargé pour photos",
    "Carnet et stylo",
    "Lampe frontale ou torche",
    "Mètre ruban",
  ],
  "Questions à poser en arrivant": [
    "Comment m'avez-vous trouvé ? (validation SEO)",
    "Contexte : vente, location, ou installation de 25 ans ?",
    "Y a-t-il un ancien certificat RGIE ?",
    "Y a-t-il un rapport de contrôle existant ?",
    "Quels sont vos délais souhaités ?",
    "Avez-vous un budget en tête ?",
  ],
  "À vérifier pendant la visite": [
    "Tableau électrique : vétusté, nombre de circuits, différentiels présents",
    "Compteur électrique : puissance en kVA, monophasé ou triphasé",
    "Mise à la terre : présence et qualité",
    "État général du câblage visible",
    "Prises vétustes ou dangereuses",
    "Salle de bain : respect des volumes RGIE 0/1/2/3",
    "Sous-sol ou cave : prises et éclairages",
    "Extérieur : prises extérieures, éclairage",
  ],
  "Photos à prendre": [
    "Tableau électrique vue d'ensemble",
    "Tableau électrique close-up",
    "Compteur électrique",
    "Mise à la terre",
    "Problèmes visibles",
    "Plan général du bien",
  ],
  "Upsells à scanner": [
    "Voiture électrique ou intérêt borne ?",
    "Toiture orientée sud pour PV ?",
    "Éclairage extérieur vétuste ?",
    "Domotique ?",
  ],
  "Avant de partir": [
    "Récapituler devant le client",
    "Annoncer délai devis : sous 48h maximum",
    "Laisser carte de visite",
    "Remercier et saluer",
  ],
});

const PV = buildItems({
  "Matériel à emporter": [
    "Multimètre",
    "Téléphone chargé pour photos",
    "Boussole (pour orientation)",
    "Mètre ruban long",
    "Carnet et stylo",
  ],
  "Questions à poser en arrivant": [
    "Comment m'avez-vous trouvé ? (validation SEO)",
    "Consommation annuelle en kWh ?",
    "Avez-vous vos factures des 12 derniers mois ?",
    "Année de construction de la toiture ?",
    "Quels sont vos délais souhaités ?",
    "Avez-vous un budget en tête ?",
    "Objectif autoconsommation ou revente ?",
  ],
  "À vérifier pendant la visite": [
    "Orientation de la toiture (idéal : sud / sud-est / sud-ouest)",
    "Inclinaison de la toiture",
    "Surface disponible utilisable",
    "Ombres : arbres, cheminées, bâtiments voisins",
    "État de la charpente (accès combles)",
    "Type de couverture (tuiles, ardoises, bac acier)",
    "Tableau électrique : place disponible pour onduleur",
    "Compteur : puissance souscrite, mono/tri",
    "Passage de câbles entre toiture et tableau",
    "Emplacement onduleur (aéré, accessible)",
  ],
  "Photos à prendre": [
    "Toiture vue globale (depuis extérieur)",
    "Toiture détails (tuiles, état)",
    "Combles / charpente",
    "Tableau électrique",
    "Compteur",
    "Emplacement prévu onduleur",
  ],
  "Upsells à scanner": [
    "Borne de recharge pour voiture électrique ?",
    "Batterie de stockage ?",
    "Mise aux normes RGIE ?",
  ],
  "Avant de partir": [
    "Récapituler devant le client",
    "Annoncer délai devis : sous 48h",
    "Mentionner les primes régionales possibles",
    "Laisser carte de visite",
    "Remercier",
  ],
});

const BORNE = buildItems({
  "Matériel à emporter": [
    "Multimètre",
    "Mètre ruban",
    "Téléphone chargé pour photos",
    "Testeur de prise",
    "Carnet et stylo",
  ],
  "Questions à poser en arrivant": [
    "Comment m'avez-vous trouvé ? (validation SEO)",
    "Marque et modèle du véhicule électrique ?",
    "Voiture déjà livrée ou en commande ?",
    "Habitudes de recharge (quotidien, weekend, distance) ?",
    "Puissance de charge souhaitée (3,7 / 7,4 / 11 / 22 kW) ?",
    "Fonctions connectées / app / badge RFID souhaités ?",
    "Délais souhaités ?",
    "Budget ?",
  ],
  "À vérifier pendant la visite": [
    "Tableau électrique : place pour nouveau disjoncteur",
    "Compteur : puissance disponible en kVA",
    "Compteur mono ou triphasé",
    "Distance entre tableau et emplacement borne (en mètres)",
    "Parcours des câbles : apparent, encastré, goulotte",
    "Emplacement borne : intérieur garage, carport, façade extérieure",
    "Protection pluie et chocs pour l'emplacement",
    "Besoin de forage mur porteur ?",
    "Proximité d'un point d'eau (dangerosité)",
  ],
  "Photos à prendre": [
    "Tableau électrique",
    "Compteur",
    "Emplacement prévu de la borne",
    "Parcours des câbles",
    "Place de parking / garage globalement",
  ],
  "Upsells à scanner": [
    "Mise aux normes RGIE tant qu'on y est ?",
    "Intérêt pour panneaux photovoltaïques (couplage avec borne) ?",
  ],
  "Avant de partir": [
    "Récapituler devant le client",
    "Annoncer délai devis : sous 48h",
    "Mentionner primes régionales voiture électrique",
    "Laisser carte de visite",
    "Remercier",
  ],
});

const INSTALLATION = buildItems({
  "Matériel à emporter": [
    "Multimètre",
    "Testeur de prise",
    "Testeur différentiel",
    "Mètre ruban long",
    "Téléphone chargé pour photos",
    "Carnet et stylo",
    "Lampe frontale",
  ],
  "Questions à poser en arrivant": [
    "Comment m'avez-vous trouvé ? (validation SEO)",
    "Construction neuve ou rénovation ?",
    "Année du bâtiment ?",
    "Pièces concernées par les travaux ?",
    "Besoins spécifiques : nb prises, types d'éclairage, domotique ?",
    "Délais souhaités ?",
    "Budget ?",
  ],
  "À vérifier pendant la visite": [
    "Tableau électrique existant : vétusté, place disponible",
    "Compteur : puissance, mono/tri",
    "État général de l'installation actuelle",
    "Chaque pièce concernée : nombre prises, points lumineux actuels",
    "Passage de câbles : faux plafond, cloisons, goulottes",
    "Cave / combles : accès pour passage câbles",
    "Salle de bain : volumes RGIE à respecter",
    "Besoins éclairage extérieur",
    "Besoin prises extérieures",
  ],
  "Photos à prendre": [
    "Tableau électrique existant",
    "Compteur",
    "Chaque pièce concernée",
    "Points problématiques existants",
    "Plan général du bien si disponible",
  ],
  "Upsells à scanner": [
    "Borne de recharge ?",
    "Panneaux photovoltaïques ?",
    "Domotique / objets connectés ?",
    "Éclairage LED RGB ?",
    "Interphone / vidéosurveillance ?",
  ],
  "Avant de partir": [
    "Récapituler devant le client",
    "Annoncer délai devis : sous 48h à 72h selon complexité",
    "Mentionner possibilité d'étapes (tableau d'abord, puis reste)",
    "Laisser carte de visite",
    "Remercier",
  ],
});

const GENERIQUE = buildItems({
  "Matériel à emporter": [
    "Multimètre",
    "Testeur de prise",
    "Téléphone chargé pour photos",
    "Carnet et stylo",
    "Outils de base (tournevis, pince)",
  ],
  "Questions à poser en arrivant": [
    "Comment m'avez-vous trouvé ? (validation SEO)",
    "Description exacte du problème ou besoin",
    "Depuis quand le problème existe-t-il ?",
    "Quels symptômes (disjoncteur saute, prise ne marche pas...) ?",
    "Délais souhaités ?",
  ],
  "À vérifier pendant la visite": [
    "Tableau électrique : état général, différentiels",
    "Zone concernée par le problème",
    "Test des prises et points lumineux concernés",
    "Câblage visible",
    "Sécurité globale de l'installation",
  ],
  "Photos à prendre": [
    "Problème exact",
    "Tableau électrique",
    "Zone concernée",
  ],
  "Upsells à scanner": [
    "État global, mise aux normes RGIE possible ?",
    "Borne de recharge si voiture électrique ?",
    "Panneaux photovoltaïques si toiture favorable ?",
  ],
  "Avant de partir": [
    "Récapituler devant le client ce qui a été constaté",
    "Annoncer délai devis",
    "Laisser carte de visite",
    "Remercier",
  ],
});

export const CHECKLISTS: Record<ChecklistType, ChecklistTemplateItem[]> = {
  rgie: RGIE,
  pv: PV,
  borne: BORNE,
  installation: INSTALLATION,
  generique: GENERIQUE,
};

/**
 * Détecte le type de checklist à partir d'un texte (type_visite RDV ou service).
 */
export function detectChecklistType(input: string | null | undefined): ChecklistType {
  const t = (input || "").toLowerCase();
  if (t.includes("rgie") || t.includes("conformit") || t.includes("rénovation tableau") || t.includes("remplacement tableau")) {
    return "rgie";
  }
  if (t.includes("photovolt") || t.includes("panneau") || t.includes("solaire")) {
    return "pv";
  }
  if (t.includes("borne") || t.includes("recharge")) {
    return "borne";
  }
  if (t.includes("installation") || t.includes("rénovation") || t.includes("renovation")) {
    return "installation";
  }
  return "generique";
}
