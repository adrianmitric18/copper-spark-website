import ZonePageLayout from "@/components/zones/ZonePageLayout";

const faqs = [
  {
    question: "Combien de temps mettez-vous pour intervenir à Wavre ?",
    answer:
      "Nous sommes basés à Court-Saint-Étienne, à environ 20 minutes de Wavre selon la circulation. Pour les urgences, nous nous efforçons d'intervenir dans la journée ou au plus tard le lendemain.",
  },
  {
    question: "Je vends ma maison à Wavre, ai-je besoin d'une mise en conformité RGIE ?",
    answer:
      "Oui, la mise en conformité RGIE est obligatoire avant toute vente immobilière en Belgique. Si votre installation date de plus de 25 ans ou n'a jamais été certifiée, un diagnostic complet est nécessaire. Nous réalisons l'intégralité de la démarche jusqu'à l'obtention du certificat.",
  },
  {
    question: "Mon appartement à Wavre a un tableau très ancien. Faut-il le remplacer ?",
    answer:
      "Un tableau ancien présente plusieurs risques : surcharge, mauvaise protection, absence de protection différentielle conforme. Nous réalisons un diagnostic gratuit pour évaluer l'état de votre tableau et vous conseillons objectivement sur l'opportunité d'un remplacement.",
  },
  {
    question: "Puis-je installer une borne de recharge à Bierges ou Limal ?",
    answer:
      "Oui, l'installation de bornes de recharge est possible dans toutes les zones de Wavre, y compris Bierges et Limal. Nous réalisons une étude préalable gratuite pour dimensionner la borne adaptée à votre véhicule et à votre installation électrique existante.",
  },
  {
    question: "Travaillez-vous avec les syndics de copropriété de Wavre ?",
    answer:
      "Oui. Nous accompagnons les syndics de copropriété sur les interventions en parties communes : mise en conformité, remplacement de tableaux, dépannage urgent, éclairage de secours. Nous proposons également un contrat de maintenance préventive annuelle.",
  },
];

const ElectricienWavre = () => (
  <ZonePageLayout
    slug="electricien-wavre"
    cityName="Wavre"
    seoTitle="Électricien à Wavre — Le Cuivre Électrique Brabant wallon"
    seoDescription="Électricien à Wavre : installation, rénovation, dépannage urgent, bornes de recharge. Intervention rapide sur tout Wavre. Devis gratuit."
    h1="Électricien à Wavre"
    intro="Le Cuivre Électrique intervient à Wavre et dans tous ses quartiers : centre-ville, Basse-Wavre, Bierges, Limal. Électricien de proximité pour particuliers et professionnels."
    faqs={faqs}
  >
    <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-6">
      Votre électricien à Wavre et sa région
    </h2>
    <p className="text-muted-foreground leading-relaxed mb-4">
      Le Cuivre Électrique intervient à Wavre et dans tous ses quartiers : centre-ville, Basse-Wavre, Bierges, Limal. Basés à Court-Saint-Étienne, à environ 20 minutes de Wavre, nous sommes l'électricien de proximité pour les habitants et professionnels de la commune.
    </p>
    <p className="text-muted-foreground leading-relaxed mb-10">
      Que vous soyez dans un appartement du centre, une maison de Limal ou une villa de Bierges, nous proposons une gamme complète de services : installation électrique, rénovation, dépannage urgent, mise en conformité RGIE, bornes de recharge, panneaux photovoltaïques.
    </p>

    <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6">
      Nos interventions à Wavre
    </h2>
    <p className="text-muted-foreground leading-relaxed mb-4">
      Wavre présente une grande diversité de besoins électriques, que nous couvrons avec une approche adaptée à chaque situation :
    </p>
    <ul className="space-y-3 text-foreground mb-10">
      {[
        "Rénovation électrique complète de maisons individuelles ou d'appartements : mise aux normes du tableau, remplacement du câblage ancien, création de circuits supplémentaires pour les usages modernes (électroménager, chauffage électrique, bornes).",
        "Dépannage électrique urgent : disjoncteur qui saute, prise qui chauffe, panne partielle. Nous intervenons rapidement avec un diagnostic précis et une réparation durable.",
        "Installation de bornes de recharge pour voiture électrique : dimensionnement selon votre véhicule et votre installation, marques Alfen ou Hager, raccordement propre au tableau principal.",
        "Panneaux photovoltaïques : étude d'orientation de votre toiture, calcul de rentabilité, installation complète avec onduleur Huawei ou SolarEdge.",
        "Mise en conformité RGIE : diagnostic, travaux de mise aux normes, accompagnement avec les organismes agréés (Vinçotte, AIB, BTV).",
        "Installation neuve, câblage informatique RJ45, parlophonie, éclairage LED.",
      ].map((item) => (
        <li key={item} className="flex items-start gap-3">
          <span className="mt-2 w-2 h-2 rounded-full bg-primary shrink-0" />
          <span className="leading-relaxed text-muted-foreground">{item}</span>
        </li>
      ))}
    </ul>

    <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6">
      Wavre, une commune dynamique aux besoins variés
    </h2>
    <p className="text-muted-foreground leading-relaxed mb-4">
      Wavre est la ville principale du Brabant wallon et compte environ 35 000 habitants. Sa diversité d'habitat implique des besoins électriques multiples :
    </p>
    <ul className="space-y-3 text-foreground mb-6">
      {[
        ["Centre-ville", "appartements et maisons mitoyennes, souvent rénovées par étapes. Les mises en conformité RGIE et les remplacements de tableaux sont des demandes fréquentes."],
        ["Basse-Wavre", "zones résidentielles mixtes, avec un parc de maisons des années 60-80 nécessitant souvent des rénovations électriques complètes."],
        ["Bierges", "villas 4 façades, demandes fréquentes en bornes de recharge, panneaux photovoltaïques, éclairage extérieur."],
        ["Limal", "mix de résidences récentes et de maisons anciennes, demandes en installation complète, rénovation et domotique."],
      ].map(([title, desc]) => (
        <li key={title} className="flex items-start gap-3">
          <span className="mt-2 w-2 h-2 rounded-full bg-primary shrink-0" />
          <span className="leading-relaxed"><strong className="text-foreground">{title} :</strong> <span className="text-muted-foreground">{desc}</span></span>
        </li>
      ))}
    </ul>
    <p className="text-muted-foreground leading-relaxed mb-10">
      Wavre connaît également une forte dynamique immobilière, avec de nombreuses ventes qui nécessitent des mises en conformité RGIE avant transaction. Nous accompagnons régulièrement les vendeurs et acquéreurs dans ces démarches.
    </p>

    <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6">
      Votre demande à Wavre
    </h2>
    <p className="text-muted-foreground leading-relaxed mb-4">
      Pour toute demande d'intervention à Wavre, contactez-nous :
    </p>
    <ul className="space-y-2 text-muted-foreground mb-4">
      <li>• Téléphone : <a href="tel:+32485755227" className="text-primary hover:underline">0485 75 52 27</a> (urgences 7j/7)</li>
      <li>• Email : <a href="mailto:cuivre.electrique@gmail.com" className="text-primary hover:underline">cuivre.electrique@gmail.com</a></li>
      <li>• Formulaire en ligne : devis gratuit et sans engagement</li>
    </ul>
    <p className="text-muted-foreground leading-relaxed">
      Nous nous déplaçons à Wavre pour évaluer votre projet sur place et vous remettons un devis clair et détaillé.
    </p>
  </ZonePageLayout>
);

export default ElectricienWavre;
