export interface Review {
  name: string;
  city: string;
  rating: number;
  text: string;
  service: string;
  date: string;
}

// ── Easy-to-change URLs ──
export const googleReviewUrl = "https://g.page/r/CVLZZFVq3KkiEBM/review";
export const testimonialFormUrl = "#";

// ── All real Google reviews ──
export const reviews: Review[] = [
  {
    name: "Martial Xhignesse",
    city: "Bruxelles",
    rating: 5,
    text: "Service impeccable ! Respect des délais, respect du devis ! Travail très bien effectué et surtout de façon très propre !!! Je referai appel c'est certain. Merci pour le travail",
    service: "Rénovation électrique",
    date: "Il y a 12 semaines",
  },
  {
    name: "Benoit Mansion",
    city: "Bruxelles",
    rating: 5,
    text: "J'ai fait appel au Cuivre Electrique à plusieurs reprises, que ce soit pour un chantier important (nouvelle cuisine), ou de petits dépannages. J'ai chaque fois été très satisfait. Adrian est fiable, compétent, et à l'écoute de ses clients, je recommande !",
    service: "Installation & Dépannage",
    date: "Il y a 12 semaines",
  },
  {
    name: "Guillaume",
    city: "Belgique",
    rating: 5,
    text: "Service de qualité et bonne communication, à prix juste. Ne pas hésiter !",
    service: "Installation électrique",
    date: "Il y a 12 semaines",
  },
  {
    name: "Nicolai Mitric",
    city: "Belgique",
    rating: 5,
    text: "Parfait travail, merci Cuivre Électrique",
    service: "Travaux électriques",
    date: "Il y a 12 semaines",
  },
  {
    name: "Dany Smeyers",
    city: "Belgique",
    rating: 5,
    text: "Adrian est hyper compétent et rigoureux dans son travail et ses conseils sont des plus précieux ! Merci pour le travail accompli dans notre maison",
    service: "Installation complète",
    date: "Il y a 12 semaines",
  },
  {
    name: "Jerome Ver Elst",
    city: "Belgique",
    rating: 5,
    text: "Le travail réalisé par cet électricien est d'un grand professionnalisme. Chaque intervention est effectuée avec soin, précision et dans le respect des normes en vigueur. Son sérieux et son savoir-faire apportent une entière satisfaction.",
    service: "Mise en conformité",
    date: "Il y a 12 semaines",
  },
  {
    name: "Jean-Claude Leclercq",
    city: "Belgique",
    rating: 4,
    text: "Nous avons fait appel à cet électricien pour la mise en conformité de notre tableau électrique et pour d'autres petits travaux. Le travail a été fait très proprement, avec beaucoup de soin. Il est très ponctuel, très professionnel et communique très bien. Tarifs corrects.",
    service: "Mise en conformité RGIE",
    date: "Il y a 11 semaines",
  },
  {
    name: "Gwenn Nicolay",
    city: "Belgique",
    rating: 5,
    text: "J'ai fait toute l'installation électrique de ma maison avec « Le cuivre électrique ». Adrian a tout fait dans les règles de l'art. Je suis ravi ! Et il vient chez moi pour du suivi si besoin.",
    service: "Installation complète",
    date: "Il y a 12 semaines",
  },
  {
    name: "Jessica Cuvelier",
    city: "Belgique",
    rating: 5,
    text: "Hyper flexible, prix correct, sérieux et serviable. Bref nous le recommandons fortement.",
    service: "Travaux électriques",
    date: "Il y a 11 semaines",
  },
  {
    name: "Charles Moreau",
    city: "Belgique",
    rating: 5,
    text: "Très satisfait du travail d'adaptation du tableau électrique avec placement de la ligne de terre, merci à Mr. Adrian, Cuivre Électrique.",
    service: "Tableau électrique",
    date: "Il y a 9 semaines",
  },
  {
    name: "Annabelle",
    city: "Belgique",
    rating: 5,
    text: "La communication est excellente, son travail est rapide et soigné, il s'adapte à la demande avec professionnalisme, sérieux et respect. Le devis est honnête. C'est la crème de l'électricien. Je le recommande à tous fortement.",
    service: "Rénovation électrique",
    date: "Il y a 9 semaines",
  },
  {
    name: "Valentina Rotar",
    city: "Halle",
    rating: 5,
    text: "Adrian est professionnel, ponctuel et travaille proprement. Il explique clairement ce qu'il fait et propose des solutions adaptées. Travail soigné, respect des délais et très bon contact. Je recommande sans hésiter.",
    service: "Travaux électriques",
    date: "Il y a 7 semaines",
  },
  {
    name: "Victor Bachelier",
    city: "Belgique",
    rating: 5,
    text: "Adrian est réactif, professionnel et très à l'écoute de ses clients. Il est également de très bon conseil !",
    service: "Conseil & Installation",
    date: "Il y a 5 semaines",
  },
  {
    name: "Melody Mertens",
    city: "Belgique",
    rating: 5,
    text: "Adrian est un super électricien, très gentil et très réactif. On était dans l'urgence et il a fait tout son possible pour que le travail soit effectué dans les délais. Je le recommande à 100 %. Vous pouvez lui faire confiance les yeux fermés.",
    service: "Dépannage urgent",
    date: "Il y a 5 semaines",
  },
];
