import bornesRecharge01 from '@/assets/gallery/bornes-de-recharge/01-borne-hager-witty-pro-voiture-charge.jpg';
import bornesRecharge02 from '@/assets/gallery/bornes-de-recharge/02-lotissement-4-maisons-mitoyennes.jpg';
import bornesRecharge03 from '@/assets/gallery/bornes-de-recharge/03-tranchee-50m-pre-cablage-bornes.jpg';
import bornesRecharge04 from '@/assets/gallery/bornes-de-recharge/04-carottage-facade-passage-cable.jpg';
import bornesRecharge05 from '@/assets/gallery/bornes-de-recharge/05-sous-tableau-hager-borne-recharge.jpg';
import bornesRecharge06 from '@/assets/gallery/bornes-de-recharge/06-sous-tableau-schneider-resi9-borne.jpg';
import bornesRecharge07 from '@/assets/gallery/bornes-de-recharge/07-passage-mur-soutenement-sable.jpg';
import bornesRecharge08 from '@/assets/gallery/bornes-de-recharge/08-borne-recharge-type2-vehicule-electrique.jpg';
import bornesRecharge09 from '@/assets/gallery/bornes-de-recharge/09-pelouse-remise-en-etat-apres-chantier.jpg';
import bornesRecharge10 from '@/assets/gallery/bornes-de-recharge/10-fourreaux-gaines-tpc-tranchee.jpg';
import bornesRecharge11 from '@/assets/gallery/bornes-de-recharge/11-sous-tableau-hager-tubage-propre.jpg';
import bornesRecharge12 from '@/assets/gallery/bornes-de-recharge/12-trottoir-ouvert-protection-paves.jpg';
import bornesRecharge13 from '@/assets/gallery/bornes-de-recharge/13-trottoir-refait-paves-sable-lit.jpg';

export interface ChantierImage {
  id: string;
  title: string;
  alt: string;
  image: string;
}

export interface ChantierFAQ {
  question: string;
  answer: string;
}

export interface Chantier {
  id: string;
  slug: string;
  category: string;
  title: string;
  shortTitle: string;
  date: string;
  location: string;
  shortDescription: string;
  longDescription: string;
  coverImage: string;
  images: ChantierImage[];
  faq?: ChantierFAQ[];
  metaTitle?: string;
  metaDescription?: string;
}

export const chantiers: Chantier[] = [
  {
    id: 'bornes-4-bornes-brabant-wallon',
    slug: '4-bornes-lotissement-brabant-wallon',
    category: 'bornes-de-recharge',
    title: 'Installation de 4 bornes de recharge sur lotissement mitoyen',
    shortTitle: '4 bornes lotissement — Brabant wallon',
    date: 'Avril 2026',
    location: 'Brabant wallon',
    shortDescription:
      "Pré-câblage groupé pour 4 maisons mitoyennes et installation finalisée de 2 bornes Hager Witty Pro. Un défi de coordination et de précision technique sur 5 jours de chantier.",
    longDescription:
      "Contenu détaillé à compléter ultérieurement. Cette section affichera le récit complet du chantier (1500 mots SEO-optimisés) avec les défis techniques relevés, le matériel sélectionné, et les résultats obtenus.",
    coverImage: bornesRecharge01,
    metaTitle:
      "4 bornes Hager Witty Pro - Lotissement Brabant wallon | Le Cuivre Électrique",
    metaDescription:
      "Installation coordonnée de 4 bornes de recharge sur 4 maisons mitoyennes. 50m de tranchées, sous-tableaux dédiés, conformité RGIE. Brabant wallon.",
    images: [
      { id: 'br-01', title: 'Borne Hager Witty Pro avec véhicule en charge', alt: 'Borne de recharge Hager Witty Pro avec voiture électrique en charge dans Brabant wallon', image: bornesRecharge01 },
      { id: 'br-02', title: 'Lotissement de 4 maisons mitoyennes', alt: 'Vue extérieure des 4 maisons mitoyennes équipées en bornes de recharge', image: bornesRecharge02 },
      { id: 'br-03', title: 'Tranchée 50m pour pré-câblage', alt: 'Tranchée de 50 mètres creusée pour le pré-câblage des bornes de recharge', image: bornesRecharge03 },
      { id: 'br-04', title: 'Carottage de façade', alt: 'Carottage précis de façade béton pour passage du câble Cat 6 enterré', image: bornesRecharge04 },
      { id: 'br-05', title: 'Sous-tableau Hager dédié borne', alt: 'Sous-tableau Hager étiqueté avec différentiel 30mA Type A pour borne de recharge', image: bornesRecharge05 },
      { id: 'br-06', title: 'Sous-tableau Schneider Resi9', alt: 'Sous-tableau Schneider Electric Resi9 avec disjoncteur 32A pour borne', image: bornesRecharge06 },
      { id: 'br-07', title: 'Passage sous mur de soutènement', alt: 'Remblayage au sable de lit après passage de gaine sous mur de soutènement', image: bornesRecharge07 },
      { id: 'br-08', title: 'Connecteur Type 2 sur véhicule', alt: 'Connecteur Type 2 branché sur véhicule électrique en charge', image: bornesRecharge08 },
      { id: 'br-09', title: 'Pelouse remise en état', alt: 'Pelouse remise en état après chantier de pose des bornes de recharge', image: bornesRecharge09 },
      { id: 'br-10', title: 'Fourreaux et gaines TPC', alt: 'Fourreaux et gaines TPC rouges enterrés dans la tranchée pour câbles électriques', image: bornesRecharge10 },
      { id: 'br-11', title: 'Tubage propre dans tableau', alt: 'Sous-tableau Hager avec tubage électrique propre et organisé', image: bornesRecharge11 },
      { id: 'br-12', title: 'Ouverture du trottoir', alt: 'Ouverture du trottoir avec protection des pavés pour passage des gaines', image: bornesRecharge12 },
      { id: 'br-13', title: 'Trottoir remis en état', alt: 'Trottoir remis en état avec sable de pose après travaux', image: bornesRecharge13 },
    ],
    faq: [
      {
        question: "Combien coûte l'installation d'une borne de recharge en Belgique ?",
        answer:
          "Le prix varie selon la complexité du chantier. Pour une installation simple (compteur proche, monophasé), comptez entre 1 200 et 1 800 € TTC. Pour des configurations plus exigeantes (triphasé, longue distance, tranchée), le budget peut monter à 2 500-3 500 €.",
      },
      {
        question: "Faut-il un compteur triphasé pour installer une borne ?",
        answer:
          "Non. La majorité des bornes domestiques fonctionnent en monophasé jusqu'à 7,4 kW (32A). Pour des puissances supérieures (11 kW, 22 kW), le triphasé est nécessaire.",
      },
      {
        question: "Est-il possible d'installer plusieurs bornes en même temps dans un lotissement ?",
        answer:
          "Oui, et c'est plus économique de procéder ainsi. Mutualiser les tranchées et les déplacements permet de faire baisser le coût unitaire pour chaque foyer.",
      },
    ],
  },
];

export const getChantiersByCategory = (categorySlug: string): Chantier[] =>
  chantiers.filter((c) => c.category === categorySlug);

export const getChantierBySlug = (slug: string): Chantier | undefined =>
  chantiers.find((c) => c.slug === slug);
