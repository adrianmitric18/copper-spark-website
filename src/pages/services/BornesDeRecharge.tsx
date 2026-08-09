import ServicePageLayout from "@/components/services/ServicePageLayout";

const faqs = [
  {
    question: "Quelle puissance de borne choisir ?",
    answer:
      "Pour un usage domestique, une borne 7,4 kW (monophasée) ou 11 kW (triphasée) est généralement suffisante : elle recharge la plupart des voitures électriques en une nuit. La 22 kW est réservée aux installations triphasées robustes (entreprises, copropriétés), à condition que le véhicule l'accepte. Nous vérifions la configuration de votre tableau avant de vous conseiller.",
  },
  {
    question: "Quel est le coût d'installation d'une borne ?",
    answer:
      "Le prix dépend de la marque, de la puissance, de la longueur de câble et de la complexité de l'installation (renforcement de tableau, tranchée éventuelle). Une borne Hager ou Alfen + pose simple démarre à quelques centaines d'euros HTVA, hors matériel. Nous remettons un devis détaillé après visite technique gratuite.",
  },
  {
    question: "Combien de temps pour recharger ma voiture ?",
    answer:
      "À 7,4 kW, comptez environ 6 à 8 heures pour recharger une batterie de 50 kWh à 80 %. À 11 kW, le temps est réduit à 4-5 heures. À 22 kW, environ 2-3 heures, à condition que le véhicule supporte cette puissance en courant alternatif.",
  },
  {
    question: "Toutes les voitures électriques sont-elles compatibles ?",
    answer:
      "Oui : les bornes que nous posons (Alfen, Hager, Wallbox et autres marques du marché) utilisent le standard européen Type 2, compatible avec toutes les voitures électriques et hybrides rechargeables vendues en Europe (Tesla, Renault, Volkswagen, Hyundai, Kia, BMW, Audi, Peugeot, etc.).",
  },
  {
    question: "Existe-t-il des primes en Wallonie pour l'installation d'une borne ?",
    answer:
      "Oui, des aides existent pour les particuliers et les entreprises (primes régionales wallonnes, déduction fiscale fédérale pour entreprises). Les conditions évoluent chaque année — nous vous donnons les informations à jour lors du devis et vous orientons vers les démarches adaptées à votre situation.",
  },
];

const BornesDeRecharge = () => {
  return (
    <ServicePageLayout
      slug="bornes-de-recharge"
      breadcrumbLabel="Bornes de recharge"
      seoTitle="Borne de recharge Brabant wallon - Alfen, Hager, Wallbox"
      seoDescription="Installation de bornes de recharge pour voiture électrique. Alfen en marque de référence, également Hager, Wallbox et les autres marques du marché. Devis gratuit."
      seoKeywords="borne de recharge, voiture électrique, Alfen, Hager, Wallbox, installation borne Brabant wallon, prime borne Wallonie, électricien Court-Saint-Étienne"
      schemaServiceName="Installation de bornes de recharge pour véhicules électriques"
      schemaServiceDescription="Installation de bornes de recharge pour particuliers, entreprises et copropriétés en Brabant wallon, Wallonie et Bruxelles. Alfen en marque de référence, également Hager, Wallbox et les autres marques du marché."
      hero={{
        eyebrow: "Bornes de recharge",
        h1: "Installation de bornes de recharge — Alfen, Hager, Wallbox",
        intro:
          "Avec la montée en puissance des voitures électriques, disposer d'une borne fiable à domicile ou au travail devient incontournable. Alfen est notre marque de référence, celle que nous recommandons en premier. Nous installons également Hager, Wallbox et les autres marques du marché selon vos préférences et la compatibilité de votre installation.",
      }}
      simulateurCta
      faqs={faqs}
    >
      <p className="text-foreground text-lg leading-relaxed mb-10">
        Que vous soyez <strong>particulier, indépendant, entreprise ou
        copropriété</strong>, nous étudions votre besoin et installons la solution
        de recharge la plus adaptée à votre véhicule, votre budget et la
        configuration de votre installation électrique.
      </p>

      <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6">
        Pour qui ?
      </h2>
      <ul className="space-y-3 text-foreground mb-10">
        {[
          "Particuliers (maison individuelle, appartement avec parking privé)",
          "Indépendants et professions libérales",
          "Entreprises (flotte de véhicules, parking employés)",
          "Copropriétés et résidences",
        ].map((item) => (
          <li key={item} className="flex items-start gap-3">
            <span className="mt-2 w-2 h-2 rounded-full bg-primary shrink-0" />
            <span className="leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>

      <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6">
        Nos marques : Alfen en référence, Hager et Wallbox
      </h2>
      <p className="text-muted-foreground leading-relaxed mb-6">
        <strong>Alfen</strong> est la marque que nous recommandons en premier,
        pour sa fiabilité éprouvée, son suivi logiciel et sa gestion dynamique de
        la charge. Nous installons aussi <strong>Hager</strong> et{" "}
        <strong>Wallbox</strong>, ainsi que les autres marques du marché si vous
        en possédez déjà une ou en préférez une en particulier — sous réserve
        qu'elle soit compatible avec votre installation et conforme aux normes
        en vigueur.
      </p>
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {/* Alfen se distingue visuellement : bordure cuivre + badge. Le reste
            de la grille reste neutre pour que la hiérarchie soit lisible. */}
        <div className="bg-card border-2 border-primary/60 rounded-2xl p-6 shadow-sm shadow-primary/10">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="font-display text-xl font-bold text-foreground">Alfen</h3>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-primary border border-primary/40 bg-primary/10 rounded-full px-2 py-0.5">
              Recommandée
            </span>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Notre référence. Bornes hautes performances, monitoring intelligent,
            gestion dynamique de la charge — idéal pour un usage exigeant et les
            solutions multi-bornes.
          </p>
        </div>
        <div className="bg-card border border-border/60 rounded-2xl p-6">
          <h3 className="font-display text-xl font-bold text-foreground mb-3">
            Hager
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Fiabilité reconnue, compatibilité parfaite avec toutes les marques de
            voitures, intégration soignée dans les installations résidentielles.
          </p>
        </div>
      </div>

      <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6">
        Puissances disponibles
      </h2>
      <ul className="space-y-3 text-foreground mb-10">
        <li className="flex items-start gap-3">
          <span className="mt-2 w-2 h-2 rounded-full bg-primary shrink-0" />
          <span>
            <strong>7,4 kW</strong> — installation monophasée standard, parfait
            usage domestique
          </span>
        </li>
        <li className="flex items-start gap-3">
          <span className="mt-2 w-2 h-2 rounded-full bg-primary shrink-0" />
          <span>
            <strong>11 kW</strong> — triphasé, recharge plus rapide pour
            domiciles équipés en triphasé
          </span>
        </li>
        <li className="flex items-start gap-3">
          <span className="mt-2 w-2 h-2 rounded-full bg-primary shrink-0" />
          <span>
            <strong>22 kW</strong> — usage professionnel ou copropriété (selon
            véhicule compatible)
          </span>
        </li>
      </ul>

      <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6">
        Fonctionnalités intelligentes
      </h2>
      <ul className="space-y-3 text-foreground mb-10">
        {[
          "Pilotage par application mobile (consommation, programmation)",
          "Facturation et reporting pour entreprises",
          "Délestage dynamique (la borne adapte sa puissance pour ne pas surcharger l'installation)",
          "Compatibilité avec installations photovoltaïques (recharge sur surplus solaire)",
          "Authentification par badge RFID pour usage partagé",
        ].map((item) => (
          <li key={item} className="flex items-start gap-3">
            <span className="mt-2 w-2 h-2 rounded-full bg-primary shrink-0" />
            <span className="leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>

      <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6">
        Étapes d'installation
      </h2>
      <ol className="space-y-4 text-foreground mb-10">
        {[
          ["Étude technique gratuite", "Vérification du tableau, mesure de la puissance disponible, choix de l'emplacement."],
          ["Devis détaillé", "Borne, câblage, protections, éventuels renforcements. Tout est chiffré clairement."],
          ["Installation conforme RGIE", "Câblage, protection dédiée, mise à la terre, contrôle de conformité si nécessaire."],
          ["Mise en service", "Configuration, paramétrage application, test de charge réel."],
          ["Tutoriel client", "On vous explique le fonctionnement et l'application sur place."],
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

export default BornesDeRecharge;
