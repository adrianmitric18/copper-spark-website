import ServicePageLayout from "@/components/services/ServicePageLayout";

const faqs = [
  {
    question: "Combien de temps dure une installation électrique complète ?",
    answer:
      "Pour une maison neuve de taille standard (3 chambres), comptez en moyenne 2 à 3 semaines de chantier, hors finitions. Pour une rénovation, la durée dépend de l'ampleur des travaux et de l'accessibilité des gaines existantes : de quelques jours pour un remplacement de tableau à plusieurs semaines pour une rénovation complète.",
  },
  {
    question: "Dois-je faire contrôler mon installation après travaux ?",
    answer:
      "Oui. Toute installation neuve ou rénovée doit obligatoirement passer un contrôle de conformité RGIE par un organisme agréé (Vinçotte, BTV, AIB-Vinçotte, etc.) avant la mise sous tension par le gestionnaire de réseau. Nous vous accompagnons dans cette démarche jusqu'à l'obtention du certificat.",
  },
  {
    question: "Puis-je garder mon ancien tableau électrique ?",
    answer:
      "Cela dépend de son état et de sa conformité. Un tableau ancien (à fusibles, sans différentiels 30 mA, sans repérage) sera systématiquement signalé comme non conforme lors d'un contrôle. Nous réalisons un diagnostic gratuit et vous proposons soit une mise à niveau, soit un remplacement par un tableau Schneider moderne.",
  },
  {
    question: "Travaillez-vous avec d'autres marques que Schneider et Niko ?",
    answer:
      "Oui. Nous posons d'office Schneider (tableau) et Niko (appareillage) car ce sont des références fiables et largement disponibles en Belgique. Nous restons cependant ouverts à d'autres marques de qualité (Hager, Legrand, Bticino…) selon vos préférences esthétiques ou techniques.",
  },
  {
    question: "Intervenez-vous sur Bruxelles ?",
    answer:
      "Oui. Notre zone prioritaire est le Brabant wallon (basé à Court-Saint-Étienne) et la Wallonie, mais nous intervenons régulièrement sur Bruxelles pour les installations et rénovations. Contactez-nous pour vérifier nos disponibilités et obtenir un devis.",
  },
];

const InstallationRenovation = () => {
  return (
    <ServicePageLayout
      slug="installation-electrique-renovation"
      breadcrumbLabel="Installation & Rénovation"
      seoTitle="Installation électrique et rénovation en Brabant wallon | Le Cuivre Électrique"
      seoDescription="Installation électrique complète, neuve ou rénovation, par électricien agréé à Court-Saint-Étienne. Tableau Schneider, prises Niko. Devis gratuit."
      seoKeywords="installation électrique Brabant wallon, rénovation électrique, tableau Schneider, prises Niko, électricien Court-Saint-Étienne, mise aux normes"
      schemaServiceName="Installation électrique et rénovation"
      schemaServiceDescription="Installation électrique complète neuve ou rénovation : tableau Schneider, appareillage Niko, câblage, éclairage. Brabant wallon, Wallonie et Bruxelles."
      hero={{
        eyebrow: "Installation & Rénovation",
        h1: "Installation électrique et rénovation en Brabant wallon",
        intro:
          "Adrian Mitric et Le Cuivre Électrique réalisent vos installations électriques complètes, neuves ou en rénovation, partout dans le Brabant wallon, en Wallonie et à Bruxelles. Matériel professionnel de référence (tableaux Schneider, appareillage Niko) pour une installation durable et sécurisée.",
      }}
      faqs={faqs}
    >
      <p className="text-foreground text-lg leading-relaxed mb-10">
        Le Cuivre Électrique réalise vos installations électriques complètes, neuves
        ou en rénovation, partout dans le Brabant wallon, en Wallonie et à Bruxelles.
        Basé à Court-Saint-Étienne, Adrian Mitric intervient avec du matériel
        professionnel de référence (tableaux <strong>Schneider</strong>, appareillage{" "}
        <strong>Niko</strong>) pour garantir durabilité et sécurité.
      </p>

      <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6">
        Nos prestations
      </h2>
      <ul className="space-y-3 text-foreground mb-10">
        {[
          "Installation électrique complète pour construction neuve",
          "Rénovation complète ou partielle d'installations existantes",
          "Remplacement et modernisation de tableau électrique",
          "Ajout et déplacement de prises, interrupteurs, points lumineux",
          "Câblage réseau informatique et domotique",
          "Éclairage intérieur et extérieur (LED, spots, design)",
        ].map((item) => (
          <li key={item} className="flex items-start gap-3">
            <span className="mt-2 w-2 h-2 rounded-full bg-primary shrink-0" />
            <span className="leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>

      <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6">
        Pourquoi une installation professionnelle ?
      </h2>
      <p className="text-muted-foreground leading-relaxed mb-4">
        Une installation électrique défectueuse est l'une des principales causes
        d'incendies domestiques en Belgique. Au-delà du risque d'électrocution, une
        installation non conforme expose ses occupants à des dangers durables et
        peut bloquer la vente ou la location de votre bien.
      </p>
      <p className="text-muted-foreground leading-relaxed mb-4">
        Le contrôle de conformité <strong>RGIE</strong> est obligatoire à la vente
        ou à la location et tous les 25 ans pour toute installation existante.
        Choisir un électricien agréé, c'est s'assurer d'une installation conforme
        dès le départ et éviter des travaux correctifs coûteux par la suite.
      </p>
      <p className="text-muted-foreground leading-relaxed">
        Nous privilégions du matériel reconnu pour sa fiabilité — Schneider est la
        référence du marché belge pour les tableaux électriques — et nous laissons
        toujours nos chantiers propres et étiquetés.
      </p>

      <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6">
        Le matériel que nous posons
      </h2>
      <p className="text-muted-foreground leading-relaxed mb-4">
        Nous posons d'office du matériel de marques reconnues pour leur fiabilité
        et leur durabilité :
      </p>
      <ul className="space-y-2 text-foreground mb-4">
        <li className="flex items-start gap-3">
          <span className="mt-2 w-2 h-2 rounded-full bg-primary shrink-0" />
          <span>
            <strong>Tableaux électriques Schneider</strong> (ou Hager sur demande)
          </span>
        </li>
        <li className="flex items-start gap-3">
          <span className="mt-2 w-2 h-2 rounded-full bg-primary shrink-0" />
          <span>
            <strong>Prises et interrupteurs Niko</strong>, design moderne et
            disponibilité en stock partout en Belgique
          </span>
        </li>
      </ul>
      <p className="text-muted-foreground leading-relaxed">
        Nous restons ouverts aux autres marques selon les préférences du client
        (Legrand, Bticino, etc.), tant qu'elles respectent les normes de qualité.
      </p>

      <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6">
        Déroulement d'un chantier
      </h2>
      <ol className="space-y-4 text-foreground mb-6">
        {[
          ["Visite technique gratuite", "Sur place, pour évaluer précisément vos besoins."],
          ["Devis détaillé, poste par poste", "Salon, cuisine, chambres, extérieur… vous savez exactement ce que vous payez."],
          ["Planning de chantier transparent", "Dates, durée, organisation : tout est annoncé clairement."],
          ["Installation par Adrian en personne", "Pas de sous-traitance. La même main réalise du début à la fin."],
          ["Contrôle de conformité RGIE via organisme agréé", "Nous coordonnons la visite avec Vinçotte, BTV ou un autre organisme."],
          ["Remise des documents officiels", "Schéma unifilaire, schéma de position, attestation de conformité."],
        ].map(([title, desc], i) => (
          <li key={title} className="flex gap-4">
            <span className="shrink-0 w-9 h-9 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center">
              {i + 1}
            </span>
            <div>
              <strong className="text-foreground">{title}</strong>
              <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
            </div>
          </li>
        ))}
      </ol>
    </ServicePageLayout>
  );
};

export default InstallationRenovation;
