import ServicePageLayout from "@/components/services/ServicePageLayout";

const faqs = [
  {
    question: "Quand la mise en conformité RGIE est-elle obligatoire ?",
    answer:
      "Le contrôle RGIE est obligatoire dans plusieurs cas : à la vente d'un bien immobilier, lors d'un changement de compteur électrique, après une rénovation majeure, et au minimum tous les 25 ans pour toute installation existante. Sans certificat de conformité, la vente ou la location peut être bloquée.",
  },
  {
    question: "Combien de temps pour obtenir le certificat ?",
    answer:
      "Une fois les travaux correctifs réalisés, l'organisme agréé (Vinçotte, BTV…) intervient sous 1 à 3 semaines selon les disponibilités. Nous coordonnons l'ensemble : diagnostic, travaux, prise de rendez-vous avec l'organisme, présence le jour du contrôle si nécessaire.",
  },
  {
    question: "Que se passe-t-il si mon installation n'est pas conforme ?",
    answer:
      "L'organisme délivre un rapport de non-conformité avec la liste précise des points à corriger. Vous disposez généralement de 12 à 18 mois pour effectuer les travaux et obtenir un nouveau contrôle. Nous prenons en charge la totalité du processus pour vous éviter les allers-retours.",
  },
  {
    question: "Faut-il tout refaire à neuf ?",
    answer:
      "Pas forcément. Beaucoup de mises en conformité concernent des points spécifiques : ajout de différentiels 30 mA, mise à la terre des prises, repérage du tableau, schéma unifilaire à jour. Nous évaluons précisément ce qui est nécessaire et ne facturons que les travaux réellement utiles.",
  },
];

const MiseEnConformiteRgie = () => {
  return (
    <ServicePageLayout
      slug="mise-en-conformite-rgie"
      breadcrumbLabel="Conformité RGIE"
      seoTitle="Mise en conformité RGIE à Court-Saint-Étienne et en Brabant wallon | Le Cuivre Électrique"
      seoDescription="Mise en conformité RGIE pour vente, location ou contrôle. Électricien agréé à Court-Saint-Étienne. Diagnostic, travaux et accompagnement jusqu'au certificat. 0485 75 52 27."
      seoKeywords="mise en conformité RGIE, certificat conformité électrique, contrôle Vinçotte, électricien agréé Brabant wallon, vente immobilier électrique"
      schemaServiceName="Mise en conformité RGIE"
      schemaServiceDescription="Diagnostic, travaux correctifs et accompagnement jusqu'à l'obtention du certificat de conformité RGIE par organisme agréé. Brabant wallon, Wallonie et Bruxelles."
      hero={{
        eyebrow: "Conformité RGIE",
        h1: "Mise en conformité RGIE — Votre installation aux normes",
        intro:
          "Vente, location, fin du certificat 25 ans ? Nous prenons en charge l'intégralité du processus : diagnostic complet, travaux correctifs et accompagnement jusqu'au certificat de conformité délivré par un organisme agréé.",
      }}
      faqs={faqs}
    >
      <p className="text-foreground text-lg leading-relaxed mb-10">
        Le <strong>RGIE</strong> (Règlement Général sur les Installations
        Électriques) fixe les règles de sécurité applicables à toute installation
        électrique en Belgique. La mise en conformité est une obligation légale
        dans plusieurs situations clés — et c'est aussi la garantie d'une
        installation sûre pour les occupants.
      </p>

      <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6">
        Quand est-ce obligatoire ?
      </h2>
      <ul className="space-y-3 text-foreground mb-10">
        {[
          ["Vente d'un bien immobilier", "Le notaire exigera un certificat de conformité ou un PV de visite avec délais de mise aux normes."],
          ["Changement de compteur électrique", "Le gestionnaire de réseau (ORES, Sibelga…) demandera systématiquement le certificat."],
          ["Rénovation majeure", "Toute modification significative de l'installation déclenche un nouveau contrôle."],
          ["Tous les 25 ans", "Tout certificat a une durée de validité limitée. Au-delà, un nouveau contrôle est obligatoire."],
        ].map(([title, desc]) => (
          <li key={title} className="flex items-start gap-3">
            <span className="mt-2 w-2 h-2 rounded-full bg-primary shrink-0" />
            <span>
              <strong className="text-foreground">{title}</strong> —{" "}
              <span className="text-muted-foreground">{desc}</span>
            </span>
          </li>
        ))}
      </ul>

      <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6">
        Notre prestation, de A à Z
      </h2>
      <ol className="space-y-4 text-foreground mb-10">
        {[
          ["Diagnostic complet sur place", "Visite gratuite, inspection du tableau et de l'installation, identification des non-conformités."],
          ["Rapport détaillé et devis", "Liste claire des points à corriger, devis transparent poste par poste."],
          ["Travaux correctifs", "Réalisation des modifications nécessaires, du simple ajout de différentiel au remplacement complet du tableau."],
          ["Coordination avec l'organisme agréé", "Vinçotte, BTV, AIB-Vinçotte — nous prenons rendez-vous et sommes présents le jour du contrôle si besoin."],
          ["Obtention et remise du certificat", "Vous recevez votre certificat de conformité officiel, valable 25 ans."],
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

      <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6">
        Les non-conformités les plus fréquentes
      </h2>
      <ul className="space-y-3 text-foreground mb-10">
        {[
          "Prises non reliées à la terre (notamment en cuisine et salle de bain)",
          "Différentiels 30 mA absents ou défectueux",
          "Tableau électrique obsolète (à fusibles, sans repérage)",
          "Schéma unifilaire et schéma de position manquants ou non à jour",
          "Sections de câbles inadaptées aux protections en place",
          "Prises de courant en zone humide non conformes (salle de bain)",
          "Liaison équipotentielle absente",
        ].map((item) => (
          <li key={item} className="flex items-start gap-3">
            <span className="mt-2 w-2 h-2 rounded-full bg-primary shrink-0" />
            <span className="leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>

      <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6">
        Notre valeur ajoutée
      </h2>
      <p className="text-muted-foreground leading-relaxed mb-4">
        Nous travaillons en partenariat avec les organismes de contrôle agréés
        belges. Cela signifie que vous n'avez qu'un seul interlocuteur : nous nous
        chargeons de la prise de rendez-vous, de la préparation du dossier
        technique (schémas unifilaires, schémas de position) et du suivi jusqu'à
        l'obtention du certificat.
      </p>
      <p className="text-muted-foreground leading-relaxed">
        Pour les ventes immobilières en cours, nous travaillons en délais courts
        afin de ne pas bloquer la signature de votre acte chez le notaire.
      </p>
    </ServicePageLayout>
  );
};

export default MiseEnConformiteRgie;
