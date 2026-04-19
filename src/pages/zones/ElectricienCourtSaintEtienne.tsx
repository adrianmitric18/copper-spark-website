import ZonePageLayout from "@/components/zones/ZonePageLayout";

const faqs = [
  {
    question: "Dans quels délais pouvez-vous intervenir à Court-Saint-Étienne ?",
    answer:
      "Étant basés dans la commune, nous pouvons intervenir rapidement sur Court-Saint-Étienne et ses villages (Beaurieux, Faux, Sart-Messire-Guillaume, La Roche). Pour les urgences, nous nous efforçons d'intervenir le jour même ou le lendemain.",
  },
  {
    question: "Puis-je vous appeler pour un simple remplacement de prise ou d'interrupteur ?",
    answer:
      "Oui, nous intervenons pour toute demande, du plus simple au plus complexe. Une visite préalable gratuite permet d'évaluer précisément vos besoins et d'établir un devis clair.",
  },
  {
    question: "Travaillez-vous uniquement à Court-Saint-Étienne ?",
    answer:
      "Non. Court-Saint-Étienne est notre siège, mais nous intervenons dans tout le Brabant wallon (Wavre, Nivelles, Ottignies-LLN, Genappe, Rixensart, Lasne, Braine-l'Alleud, Jodoigne, Gembloux) ainsi qu'en Wallonie et à Bruxelles pour les projets importants.",
  },
  {
    question: "Faut-il faire une mise en conformité RGIE pour vendre ma maison à Court-Saint-Étienne ?",
    answer:
      "Oui, la mise en conformité RGIE est obligatoire avant la vente d'un bien immobilier en Belgique. Nous réalisons le diagnostic, les travaux correctifs éventuels, et coordonnons le passage du contrôleur agréé jusqu'à l'obtention du certificat.",
  },
  {
    question: "Peut-on installer une borne de recharge dans une maison ancienne à Court-Saint-Étienne ?",
    answer:
      "Oui, à condition que votre installation électrique le permette. Nous réalisons une étude préalable gratuite pour vérifier la puissance disponible, l'état du tableau, et la meilleure puissance de borne adaptée (7,4 kW à 22 kW).",
  },
];

const ElectricienCourtSaintEtienne = () => (
  <ZonePageLayout
    slug="electricien-court-saint-etienne"
    cityName="Court-Saint-Étienne"
    seoTitle="Électricien à Court-Saint-Étienne — Le Cuivre Électrique"
    seoDescription="Électricien local à Court-Saint-Étienne : installation, rénovation, dépannage, bornes de recharge. Intervention rapide. Devis gratuit."
    h1="Électricien à Court-Saint-Étienne"
    intro="Le Cuivre Électrique est implanté au cœur de Court-Saint-Étienne. Électricien agréé, nous sommes votre interlocuteur de proximité pour tous vos projets électriques."
    faqs={faqs}
  >
    <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-6">
      Votre électricien local à Court-Saint-Étienne
    </h2>
    <p className="text-muted-foreground leading-relaxed mb-4">
      Le Cuivre Électrique est implanté au cœur de Court-Saint-Étienne. Électricien agréé, nous sommes votre interlocuteur de proximité pour tous vos projets électriques : installation neuve, rénovation complète, dépannage urgent, mise en conformité RGIE, installation de bornes de recharge et de panneaux photovoltaïques.
    </p>
    <p className="text-muted-foreground leading-relaxed mb-10">
      Être basé dans votre commune, c'est vous garantir une réactivité maximale et une vraie connaissance du territoire. Que vous habitiez dans le centre, à Beaurieux, à Faux, Sart-Messire-Guillaume ou La Roche, nous intervenons dans un délai court avec un équipement complet.
    </p>

    <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6">
      Pourquoi choisir un électricien local à Court-Saint-Étienne
    </h2>
    <p className="text-muted-foreground leading-relaxed mb-4">
      Un électricien basé dans votre commune présente plusieurs avantages concrets par rapport à un prestataire éloigné :
    </p>
    <ul className="space-y-3 text-foreground mb-10">
      {[
        ["Intervention rapide", "nous sommes à quelques minutes de votre domicile, ce qui nous permet d'intervenir rapidement en cas de panne ou d'urgence électrique."],
        ["Connaissance du bâti local", "les maisons de Court-Saint-Étienne présentent souvent des caractéristiques spécifiques (anciennes maisons de village en pierre, fermes rénovées, constructions des années 70-80, lotissements récents). Nous connaissons les contraintes techniques propres à chaque type d'habitat."],
        ["Disponibilité pour le suivi", "un projet d'installation électrique ne s'arrête pas à la mise en service. Nous restons joignables pour toute question, réglage ou évolution de votre installation."],
        ["Engagement local", "en faisant appel à un artisan de votre commune, vous soutenez l'économie locale et tissez une relation de proximité basée sur la confiance."],
      ].map(([title, desc]) => (
        <li key={title} className="flex items-start gap-3">
          <span className="mt-2 w-2 h-2 rounded-full bg-primary shrink-0" />
          <span className="leading-relaxed"><strong className="text-foreground">{title} :</strong> <span className="text-muted-foreground">{desc}</span></span>
        </li>
      ))}
    </ul>

    <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6">
      Nos services à Court-Saint-Étienne
    </h2>
    <p className="text-muted-foreground leading-relaxed mb-4">
      Nous proposons l'ensemble des prestations d'un électricien agréé, avec une expertise particulière sur les projets suivants :
    </p>
    <ul className="space-y-3 text-foreground mb-10">
      {[
        "Installation électrique complète pour maison neuve ou appartement : étude des besoins, tableau Schneider, appareillage Niko, mise en service et certificat de conformité.",
        "Rénovation électrique : remplacement d'une installation vétuste, mise aux normes RGIE, modernisation du tableau principal, création de nouveaux circuits adaptés à vos usages.",
        "Dépannage électrique urgent : disjoncteur qui saute régulièrement, prise qui ne fonctionne plus, coupure partielle, défaut d'isolation. Diagnostic rapide et réparation durable.",
        "Mise en conformité RGIE : obligatoire avant vente, location ou après 25 ans d'installation. Nous réalisons le diagnostic, les travaux correctifs, et coordonnons le passage de l'organisme agréé (Vinçotte, AIB, BTV).",
        "Installation de bornes de recharge voiture électrique : bornes Alfen ou Hager de 7,4 kW à 22 kW, dimensionnées selon votre véhicule et votre installation.",
        "Installation de panneaux photovoltaïques : étude d'orientation, dimensionnement sur mesure, onduleurs Huawei ou SolarEdge, raccordement et mise en service.",
        "Éclairage LED intérieur et extérieur, parlophonie et vidéophonie, câblage informatique RJ45.",
      ].map((item) => (
        <li key={item} className="flex items-start gap-3">
          <span className="mt-2 w-2 h-2 rounded-full bg-primary shrink-0" />
          <span className="leading-relaxed text-muted-foreground">{item}</span>
        </li>
      ))}
    </ul>

    <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6">
      L'habitat de Court-Saint-Étienne et ses besoins électriques
    </h2>
    <p className="text-muted-foreground leading-relaxed mb-4">
      Court-Saint-Étienne présente une diversité de bâti qui implique des approches techniques adaptées :
    </p>
    <ul className="space-y-3 text-foreground mb-6">
      {[
        ["Maisons de village anciennes", "murs en pierre, anciens câblages souvent apparents, tableaux électriques sous-dimensionnés. Les rénovations nécessitent une mise aux normes RGIE complète et un câblage respectant les contraintes du bâti ancien."],
        ["Fermes rénovées et gîtes", "installations nécessitant plusieurs circuits indépendants, tableaux divisionnaires, prises extérieures renforcées pour équipements agricoles ou de jardin."],
        ["Constructions des années 70-80", "installations électriques vieillissantes, souvent à rénover pour intégrer les usages modernes (plaques induction, bornes de recharge, domotique)."],
        ["Lotissements récents", "installations en bon état nécessitant principalement des ajouts (bornes, prises connectées, éclairage extérieur)."],
      ].map(([title, desc]) => (
        <li key={title} className="flex items-start gap-3">
          <span className="mt-2 w-2 h-2 rounded-full bg-primary shrink-0" />
          <span className="leading-relaxed"><strong className="text-foreground">{title} :</strong> <span className="text-muted-foreground">{desc}</span></span>
        </li>
      ))}
    </ul>
    <p className="text-muted-foreground leading-relaxed mb-10">
      Quel que soit votre type de logement, nous adaptons notre approche pour respecter le bâti tout en garantissant une installation moderne, sûre et évolutive.
    </p>

    <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6">
      Contactez votre électricien de Court-Saint-Étienne
    </h2>
    <p className="text-muted-foreground leading-relaxed mb-4">
      Pour toute demande d'intervention, de devis ou de conseil technique à Court-Saint-Étienne, contactez-nous :
    </p>
    <ul className="space-y-2 text-muted-foreground mb-4">
      <li>• Téléphone : <a href="tel:+32485755227" className="text-primary hover:underline">0485 75 52 27</a> (disponible 7j/7 pour les urgences)</li>
      <li>• Email : <a href="mailto:cuivre.electrique@gmail.com" className="text-primary hover:underline">cuivre.electrique@gmail.com</a></li>
      <li>• Formulaire : demande de devis gratuit et sans engagement</li>
    </ul>
    <p className="text-muted-foreground leading-relaxed">
      Nous nous déplaçons pour évaluer votre projet et vous remettons un devis clair, détaillé et sans surprise.
    </p>
  </ZonePageLayout>
);

export default ElectricienCourtSaintEtienne;
