import ZonePageLayout from "@/components/zones/ZonePageLayout";

const faqs = [
  {
    question: "Combien de temps mettez-vous pour intervenir à Nivelles ?",
    answer:
      "Nous sommes basés à Court-Saint-Étienne, à environ 25 minutes de Nivelles. Pour les urgences, nous nous efforçons d'intervenir dans la journée ou le lendemain.",
  },
  {
    question: "Je vends ma maison à Nivelles, ai-je besoin d'une mise en conformité RGIE ?",
    answer:
      "Oui, la mise en conformité RGIE est obligatoire avant toute vente immobilière en Belgique. Nous réalisons le diagnostic complet, les travaux correctifs éventuels, et coordonnons le passage du contrôleur agréé jusqu'à l'obtention du certificat.",
  },
  {
    question: "Puis-je installer une borne de recharge dans un quartier pavillonnaire à Nivelles ?",
    answer:
      "Oui, les quartiers pavillonnaires de Baulers, Thines et Monstreux sont particulièrement bien adaptés à l'installation de bornes de recharge. Nous réalisons une étude préalable gratuite pour dimensionner la borne optimale.",
  },
  {
    question: "Mon toit est-il adapté aux panneaux photovoltaïques à Nivelles ?",
    answer:
      "La plupart des toitures pavillonnaires de Nivelles sont bien orientées pour le photovoltaïque. Nous réalisons une étude gratuite : orientation, inclinaison, ombrages, dimensionnement selon votre consommation. Un rapport détaillé vous permet de décider en toute objectivité.",
  },
  {
    question: "Travaillez-vous avec les syndics de copropriété de Nivelles ?",
    answer:
      "Oui. Nous accompagnons les syndics sur les interventions en parties communes (dépannage, mise en conformité, éclairage de secours) et proposons un contrat de maintenance préventive annuelle avec rapport d'intervention formalisé.",
  },
];

const ElectricienNivelles = () => (
  <ZonePageLayout
    slug="electricien-nivelles"
    cityName="Nivelles"
    seoTitle="Électricien à Nivelles — Le Cuivre Électrique Brabant wallon"
    seoDescription="Électricien à Nivelles : installation, rénovation, dépannage, bornes de recharge, panneaux photovoltaïques. Intervention rapide. Devis gratuit."
    h1="Électricien à Nivelles"
    intro="Le Cuivre Électrique intervient à Nivelles et dans ses quartiers : centre-ville, Baulers, Bornival, Monstreux, Thines. Votre électricien de proximité dans le Brabant wallon."
    faqs={faqs}
  >
    <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-6">
      Votre électricien à Nivelles
    </h2>
    <p className="text-muted-foreground leading-relaxed mb-4">
      Le Cuivre Électrique intervient à Nivelles et dans ses quartiers : centre-ville, Baulers, Bornival, Monstreux, Thines. Basés à Court-Saint-Étienne, à environ 25 minutes de Nivelles, nous sommes votre électricien de proximité pour vos projets dans la commune.
    </p>
    <p className="text-muted-foreground leading-relaxed mb-10">
      Nivelles est une commune dynamique du Brabant wallon qui combine patrimoine historique, quartiers résidentiels récents et zones d'activité professionnelle. Nos interventions couvrent l'ensemble des besoins électriques : installation neuve, rénovation, dépannage, mise en conformité RGIE, bornes de recharge et panneaux photovoltaïques.
    </p>

    <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6">
      Nos interventions à Nivelles
    </h2>
    <p className="text-muted-foreground leading-relaxed mb-4">
      Nous proposons une gamme complète de services adaptés aux besoins des habitants de Nivelles :
    </p>
    <ul className="space-y-3 text-foreground mb-10">
      {[
        "Installation électrique complète pour maison neuve ou appartement : étude, tableau Schneider, appareillage Niko, mise en service et certificat de conformité.",
        "Rénovation électrique : remplacement d'installations anciennes, mise aux normes RGIE, modernisation du tableau, création de circuits supplémentaires.",
        "Installation de bornes de recharge : voitures électriques de plus en plus nombreuses à Nivelles. Bornes Alfen ou Hager, de 7,4 kW à 22 kW.",
        "Panneaux photovoltaïques : toitures pavillonnaires idéales pour l'installation solaire. Onduleurs Huawei ou SolarEdge, étude de rentabilité personnalisée.",
        "Mise en conformité RGIE : obligatoire avant vente ou location. Diagnostic, travaux, coordination avec organismes agréés (Vinçotte, AIB, BTV).",
        "Dépannage électrique urgent : intervention rapide avec diagnostic précis.",
        "Éclairage LED intérieur et extérieur, câblage informatique RJ45, parlophonie, remplacement de tableau.",
      ].map((item) => (
        <li key={item} className="flex items-start gap-3">
          <span className="mt-2 w-2 h-2 rounded-full bg-primary shrink-0" />
          <span className="leading-relaxed text-muted-foreground">{item}</span>
        </li>
      ))}
    </ul>

    <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6">
      Nivelles, une commune aux besoins diversifiés
    </h2>
    <p className="text-muted-foreground leading-relaxed mb-4">
      Nivelles compte environ 30 000 habitants et présente une variété d'habitat qui implique des approches techniques variées :
    </p>
    <ul className="space-y-3 text-foreground mb-6">
      {[
        ["Centre-ville historique", "maisons anciennes, appartements en rénovation. Les installations électriques nécessitent souvent une mise aux normes RGIE complète avec un câblage adapté au bâti ancien."],
        ["Quartiers pavillonnaires récents (Baulers, Thines, Monstreux)", "forte demande en bornes de recharge, panneaux photovoltaïques et éclairage extérieur LED."],
        ["Zones résidentielles années 70-80", "besoins en rénovation électrique complète et modernisation des tableaux."],
        ["Zones professionnelles (zoning Nord et Sud)", "interventions sur locaux professionnels, entreprises, commerces nécessitant des installations tertiaires."],
      ].map(([title, desc]) => (
        <li key={title} className="flex items-start gap-3">
          <span className="mt-2 w-2 h-2 rounded-full bg-primary shrink-0" />
          <span className="leading-relaxed"><strong className="text-foreground">{title} :</strong> <span className="text-muted-foreground">{desc}</span></span>
        </li>
      ))}
    </ul>
    <p className="text-muted-foreground leading-relaxed mb-10">
      Nivelles bénéficie également d'une dynamique immobilière forte avec de nombreuses ventes, ce qui implique de nombreuses demandes de mise en conformité RGIE avant transaction.
    </p>

    <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6">
      Votre demande à Nivelles
    </h2>
    <p className="text-muted-foreground leading-relaxed mb-4">
      Pour toute demande à Nivelles, contactez-nous :
    </p>
    <ul className="space-y-2 text-muted-foreground mb-4">
      <li>• Téléphone : <a href="tel:+32485755227" className="text-primary hover:underline">0485 75 52 27</a> (urgences 7j/7)</li>
      <li>• Email : <a href="mailto:cuivre.electrique@gmail.com" className="text-primary hover:underline">cuivre.electrique@gmail.com</a></li>
      <li>• Formulaire en ligne : devis gratuit et sans engagement</li>
    </ul>
    <p className="text-muted-foreground leading-relaxed">
      Nous nous déplaçons à Nivelles pour évaluer votre projet sur place et vous remettons un devis clair et détaillé.
    </p>
  </ZonePageLayout>
);

export default ElectricienNivelles;
