import ZonePageLayout from "@/components/zones/ZonePageLayout";

const faqs = [
  {
    question: "Intervenez-vous à Bousval, Glabais, Loupoigne ou Ways ?",
    answer:
      "Oui, nous intervenons dans tous les villages de la commune de Genappe, y compris Bousval, Glabais, Houtain-le-Val, Loupoigne, Vieux-Genappe et Ways. Délai d'intervention moyen : 15-20 minutes depuis Court-Saint-Étienne.",
  },
  {
    question: "Ma ferme rénovée nécessite une rénovation électrique complète. Vous intervenez ?",
    answer:
      "Oui, la rénovation électrique de fermes et maisons anciennes est une de nos spécialités. Nous adaptons notre approche aux contraintes du bâti ancien tout en garantissant une installation moderne, sûre et conforme au RGIE.",
  },
  {
    question: "Mon toit à Genappe est-il adapté aux panneaux photovoltaïques ?",
    answer:
      "Les toitures de la région sont souvent très bien orientées et peu ombragées, ce qui en fait de bons candidats pour le photovoltaïque. Nous réalisons une étude gratuite complète : orientation, inclinaison, dimensionnement selon votre consommation.",
  },
  {
    question: "Puis-je installer une borne de recharge dans un village rural ?",
    answer:
      "Oui, à condition que votre installation électrique le permette. Nous réalisons une étude préalable gratuite pour vérifier la puissance disponible, l'état du tableau, et dimensionner la borne optimale.",
  },
  {
    question: "Faites-vous des contrats de maintenance pour les propriétaires de grandes maisons ?",
    answer:
      "Oui. Nous proposons un contrat de maintenance préventive annuelle qui inclut la vérification du tableau, le resserrage des borniers, le contrôle des protections différentielles et un rapport d'intervention formalisé.",
  },
];

const ElectricienGenappe = () => (
  <ZonePageLayout
    slug="electricien-genappe"
    cityName="Genappe"
    seoTitle="Électricien à Genappe — Le Cuivre Électrique Brabant wallon"
    seoDescription="Électricien à Genappe : installation, rénovation, dépannage, mise en conformité RGIE. Intervention rapide. Devis gratuit."
    h1="Électricien à Genappe"
    intro="Le Cuivre Électrique intervient à Genappe et dans ses villages : Bousval, Glabais, Houtain-le-Val, Loupoigne, Vieux-Genappe, Ways. Électricien de proximité dans le Brabant wallon."
    faqs={faqs}
  >
    <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-6">
      Votre électricien à Genappe
    </h2>
    <p className="text-muted-foreground leading-relaxed mb-4">
      Le Cuivre Électrique intervient à Genappe et dans ses villages : Bousval, Glabais, Houtain-le-Val, Loupoigne, Vieux-Genappe, Ways. Basés à Court-Saint-Étienne, à environ 15 minutes de Genappe, nous sommes l'électricien de proximité pour les habitants de cette commune rurale du Brabant wallon.
    </p>
    <p className="text-muted-foreground leading-relaxed mb-10">
      Genappe présente un habitat majoritairement composé de maisons individuelles, fermes rénovées et lotissements récents. Nos interventions couvrent l'ensemble des besoins électriques : installation neuve, rénovation complète, dépannage urgent, mise en conformité RGIE, bornes de recharge et panneaux photovoltaïques.
    </p>

    <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6">
      Nos interventions à Genappe
    </h2>
    <p className="text-muted-foreground leading-relaxed mb-4">
      Nous proposons une gamme complète adaptée aux besoins spécifiques de Genappe et de ses villages :
    </p>
    <ul className="space-y-3 text-foreground mb-10">
      {[
        "Installation électrique complète pour maison neuve ou rénovation : étude, tableau Schneider, appareillage Niko, mise en service et certificat de conformité.",
        "Rénovation électrique de maisons anciennes et fermes : mise aux normes RGIE, remplacement de tableau vétuste, modernisation complète du câblage.",
        "Mise en conformité RGIE : diagnostic, travaux correctifs, coordination avec organismes agréés. Obligatoire avant vente ou location.",
        "Installation de bornes de recharge pour voiture électrique : Alfen ou Hager, dimensionnées selon le véhicule et l'installation.",
        "Panneaux photovoltaïques : toitures rurales souvent bien orientées et dégagées. Étude gratuite, onduleurs Huawei ou SolarEdge.",
        "Dépannage électrique urgent : intervention rapide malgré la distance, diagnostic précis.",
        "Éclairage extérieur LED (jardins, allées, façades), parlophonie, câblage informatique RJ45, remplacement de tableau.",
      ].map((item) => (
        <li key={item} className="flex items-start gap-3">
          <span className="mt-2 w-2 h-2 rounded-full bg-primary shrink-0" />
          <span className="leading-relaxed text-muted-foreground">{item}</span>
        </li>
      ))}
    </ul>

    <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6">
      Genappe, un habitat rural aux besoins spécifiques
    </h2>
    <p className="text-muted-foreground leading-relaxed mb-4">
      La commune de Genappe et ses villages présentent des caractéristiques d'habitat particulières :
    </p>
    <ul className="space-y-3 text-foreground mb-6">
      {[
        ["Maisons anciennes et fermes rénovées", "murs épais en pierre, anciens câblages souvent apparents, tableaux sous-dimensionnés. Les rénovations nécessitent une mise aux normes complète avec un câblage respectant le bâti ancien."],
        ["Lotissements récents", "installations modernes nécessitant principalement des ajouts (bornes de recharge, domotique, éclairage extérieur)."],
        ["Grands terrains", "demandes fréquentes en éclairage extérieur LED, prises renforcées pour équipements de jardin, raccordement de dépendances (garage, abri, atelier)."],
        ["Toitures rurales bien orientées", "conditions souvent idéales pour le photovoltaïque, avec peu d'ombrages et une bonne exposition."],
      ].map(([title, desc]) => (
        <li key={title} className="flex items-start gap-3">
          <span className="mt-2 w-2 h-2 rounded-full bg-primary shrink-0" />
          <span className="leading-relaxed"><strong className="text-foreground">{title} :</strong> <span className="text-muted-foreground">{desc}</span></span>
        </li>
      ))}
    </ul>
    <p className="text-muted-foreground leading-relaxed mb-10">
      Les habitants de Genappe cherchent un électricien de confiance, capable d'intervenir sur des installations complexes comme sur des projets simples, avec un accompagnement de A à Z.
    </p>

    <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6">
      Votre demande à Genappe
    </h2>
    <p className="text-muted-foreground leading-relaxed mb-4">
      Pour toute demande à Genappe ou dans ses villages (Bousval, Glabais, Houtain-le-Val, Loupoigne, Vieux-Genappe, Ways), contactez-nous :
    </p>
    <ul className="space-y-2 text-muted-foreground mb-4">
      <li>• Téléphone : <a href="tel:+32485755227" className="text-primary hover:underline">0485 75 52 27</a> (urgences 7j/7)</li>
      <li>• Email : <a href="mailto:cuivre.electrique@gmail.com" className="text-primary hover:underline">cuivre.electrique@gmail.com</a></li>
      <li>• Formulaire en ligne : devis gratuit et sans engagement</li>
    </ul>
    <p className="text-muted-foreground leading-relaxed">
      Nous nous déplaçons à Genappe pour évaluer votre projet sur place et vous remettons un devis clair et détaillé.
    </p>
  </ZonePageLayout>
);

export default ElectricienGenappe;
