import ZonePageLayout from "@/components/zones/ZonePageLayout";

const faqs = [
  {
    question: "Intervenez-vous rapidement à Louvain-la-Neuve et Ottignies ?",
    answer:
      "Nous sommes basés à Court-Saint-Étienne, à environ 15 minutes. Pour les urgences, nous nous efforçons d'intervenir le jour même ou au plus tard le lendemain.",
  },
  {
    question: "Je loue un kot étudiant à LLN. Dois-je faire une mise en conformité RGIE ?",
    answer:
      "Oui, la mise en conformité RGIE est obligatoire pour tout bien mis en location en Belgique. Si votre installation date de plus de 25 ans ou n'a jamais été certifiée, un diagnostic est nécessaire. Nous réalisons la démarche complète jusqu'à l'obtention du certificat.",
  },
  {
    question: "Puis-je installer une borne de recharge à Limelette ou Céroux-Mousty ?",
    answer:
      "Oui, l'installation de bornes est possible dans toutes les zones de la commune. Nous réalisons une étude préalable gratuite pour dimensionner la borne adaptée à votre véhicule et à votre installation existante.",
  },
  {
    question: "Travaillez-vous avec les agences immobilières et syndics d'Ottignies-LLN ?",
    answer:
      "Oui. Nous accompagnons les professionnels sur leurs dossiers électriques : mise en conformité avant vente ou location, dépannages urgents entre locataires, interventions sur parties communes. Rapports d'intervention formalisés remis systématiquement.",
  },
  {
    question: "Mon appartement à LLN a un tableau très ancien. Faut-il le remplacer ?",
    answer:
      "Un tableau ancien présente des risques de sécurité et de conformité. Nous réalisons un diagnostic gratuit pour évaluer l'état de votre tableau et vous conseiller objectivement.",
  },
];

const ElectricienOttigniesLLN = () => (
  <ZonePageLayout
    slug="electricien-ottignies-louvain-la-neuve"
    cityName="Ottignies-Louvain-la-Neuve"
    seoTitle="Électricien à Ottignies-Louvain-la-Neuve — Le Cuivre Électrique"
    seoDescription="Électricien à Ottignies-LLN : installation, rénovation, dépannage, mise en conformité RGIE. Intervention rapide. Devis gratuit."
    h1="Électricien à Ottignies-Louvain-la-Neuve"
    intro="Le Cuivre Électrique intervient à Ottignies-Louvain-la-Neuve et dans tous ses quartiers : centre d'Ottignies, Louvain-la-Neuve, Limelette, Céroux-Mousty."
    faqs={faqs}
  >
    <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-6">
      Votre électricien à Ottignies-LLN
    </h2>
    <p className="text-muted-foreground leading-relaxed mb-4">
      Le Cuivre Électrique intervient à Ottignies-Louvain-la-Neuve et dans tous ses quartiers : centre d'Ottignies, Louvain-la-Neuve, Limelette, Céroux-Mousty. Basés à Court-Saint-Étienne, à environ 15 minutes de LLN, nous sommes l'électricien de proximité pour les habitants et professionnels de la commune.
    </p>
    <p className="text-muted-foreground leading-relaxed mb-10">
      Ottignies-LLN combine une population étudiante, des résidents de longue date et de nombreux professionnels. Cette diversité implique des besoins électriques variés : rénovations complètes, mises en conformité avant location, installations neuves, bornes de recharge et dépannages.
    </p>

    <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6">
      Nos interventions à Ottignies-LLN
    </h2>
    <p className="text-muted-foreground leading-relaxed mb-4">
      Nous couvrons l'ensemble des prestations électriques adaptées au profil varié de la commune :
    </p>
    <ul className="space-y-3 text-foreground mb-10">
      {[
        "Mise en conformité RGIE avant location : obligatoire pour les biens mis en location, notamment les kots étudiants et appartements de LLN. Nous réalisons le diagnostic, les travaux correctifs, et coordonnons le contrôle de conformité.",
        "Rénovation électrique complète d'appartements et maisons : remplacement de tableau, mise aux normes, création de circuits adaptés aux usages modernes.",
        "Dépannage électrique urgent : panne de disjoncteur, prise défaillante, coupure partielle. Intervention rapide avec diagnostic précis.",
        "Installation électrique neuve : maisons individuelles, rénovations lourdes, constructions neuves. Tableau Schneider, appareillage Niko, mise en service et certificat.",
        "Installation de bornes de recharge pour voiture électrique : Alfen ou Hager, dimensionnées selon véhicule et installation.",
        "Panneaux photovoltaïques : étude d'orientation, dimensionnement sur mesure, onduleurs Huawei ou SolarEdge.",
        "Éclairage LED, parlophonie, câblage informatique RJ45, remplacement de tableau électrique.",
      ].map((item) => (
        <li key={item} className="flex items-start gap-3">
          <span className="mt-2 w-2 h-2 rounded-full bg-primary shrink-0" />
          <span className="leading-relaxed text-muted-foreground">{item}</span>
        </li>
      ))}
    </ul>

    <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6">
      Ottignies-LLN, des besoins électriques spécifiques
    </h2>
    <p className="text-muted-foreground leading-relaxed mb-4">
      La commune d'Ottignies-Louvain-la-Neuve présente plusieurs profils d'habitat qui nécessitent des approches adaptées :
    </p>
    <ul className="space-y-3 text-foreground mb-6">
      {[
        ["Louvain-la-Neuve", "ville universitaire récente, nombreux appartements et kots étudiants. Forte demande en mises en conformité avant location et dépannages urgents entre deux locataires."],
        ["Ottignies centre", "maisons de ville et appartements, souvent rénovés par phases. Demandes fréquentes de rénovation électrique et de remplacement de tableaux."],
        ["Limelette et Céroux-Mousty", "zones résidentielles plus calmes, villas et maisons individuelles. Demandes en installation neuve, bornes de recharge, panneaux photovoltaïques."],
        ["Bâtiments professionnels", "nombreux bureaux, commerces, professions libérales qui nécessitent des interventions rapides et un suivi structuré."],
      ].map(([title, desc]) => (
        <li key={title} className="flex items-start gap-3">
          <span className="mt-2 w-2 h-2 rounded-full bg-primary shrink-0" />
          <span className="leading-relaxed"><strong className="text-foreground">{title} :</strong> <span className="text-muted-foreground">{desc}</span></span>
        </li>
      ))}
    </ul>
    <p className="text-muted-foreground leading-relaxed mb-10">
      Cette diversité nous permet d'intervenir sur des chantiers très variés, du simple dépannage à la rénovation électrique complète.
    </p>

    <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6">
      Votre demande à Ottignies-LLN
    </h2>
    <p className="text-muted-foreground leading-relaxed mb-4">
      Pour toute demande à Ottignies-Louvain-la-Neuve, contactez-nous :
    </p>
    <ul className="space-y-2 text-muted-foreground mb-4">
      <li>• Téléphone : <a href="tel:+32485755227" className="text-primary hover:underline">0485 75 52 27</a> (urgences 7j/7)</li>
      <li>• Email : <a href="mailto:cuivre.electrique@gmail.com" className="text-primary hover:underline">cuivre.electrique@gmail.com</a></li>
      <li>• Formulaire en ligne : devis gratuit et sans engagement</li>
    </ul>
    <p className="text-muted-foreground leading-relaxed">
      Nous nous déplaçons à Ottignies-LLN pour évaluer votre projet et vous remettons un devis clair et détaillé.
    </p>
  </ZonePageLayout>
);

export default ElectricienOttigniesLLN;
