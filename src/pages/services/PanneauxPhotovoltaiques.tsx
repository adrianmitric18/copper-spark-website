import ServicePageLayout from "@/components/services/ServicePageLayout";

const faqs = [
  {
    question: "Combien de temps pour rentabiliser une installation photovoltaïque ?",
    answer:
      "En moyenne, une installation photovoltaïque résidentielle en Wallonie se rentabilise en 7 à 10 ans, selon votre consommation, l'orientation de la toiture et le tarif d'injection de votre fournisseur. Au-delà, la production solaire devient une économie nette pendant 15 à 20 ans supplémentaires.",
  },
  {
    question: "Faut-il une orientation plein sud obligatoirement ?",
    answer:
      "Non. Le sud reste l'orientation idéale, mais une toiture est-ouest produit aussi très bien — et offre l'avantage de répartir la production sur la journée (matin + après-midi). Nous étudions précisément votre toiture (orientation, inclinaison, ombrages) pour dimensionner l'installation au mieux.",
  },
  {
    question: "Quelle différence entre Huawei et SolarEdge ?",
    answer:
      "Huawei propose un excellent rapport qualité-prix avec un onduleur central très fiable et une bonne application de monitoring. SolarEdge utilise des optimiseurs panneau par panneau, ce qui permet de récupérer la production individuelle de chaque module — idéal en cas d'ombrage partiel ou de toiture complexe.",
  },
  {
    question: "Quelles sont les primes disponibles en Wallonie ?",
    answer:
      "La Wallonie propose différentes aides régionales (primes énergie, certificats verts pour certaines configurations) ainsi qu'un mécanisme de compensation et un tarif d'injection. Les conditions évoluent régulièrement et certaines exigent une certification RESCERT côté installateur. Nous vous donnons les informations à jour lors du devis.",
  },
  {
    question: "Puis-je coupler les panneaux à une borne de recharge ou une batterie ?",
    answer:
      "Oui, c'est même un excellent montage : recharger votre voiture électrique sur le surplus solaire ou stocker l'énergie dans une batterie domestique permet de maximiser l'autoconsommation. Nos bornes Alfen et Hager sont compatibles avec ce type de pilotage intelligent.",
  },
];

const PanneauxPhotovoltaiques = () => {
  return (
    <ServicePageLayout
      slug="panneaux-photovoltaiques"
      breadcrumbLabel="Panneaux photovoltaïques"
      seoTitle="Installation de panneaux photovoltaïques en Brabant wallon | Le Cuivre Électrique"
      seoDescription="Installation de panneaux photovoltaïques avec onduleurs Huawei ou SolarEdge. Étude gratuite, production optimisée. Brabant wallon et Wallonie. 0485 75 52 27."
      seoKeywords="panneaux photovoltaïques, panneaux solaires Wallonie, onduleur Huawei, onduleur SolarEdge, installation solaire Brabant wallon, prime photovoltaïque"
      schemaServiceName="Installation de panneaux photovoltaïques"
      schemaServiceDescription="Étude personnalisée et installation de panneaux photovoltaïques avec onduleurs Huawei ou SolarEdge en Brabant wallon, Wallonie et Bruxelles."
      hero={{
        eyebrow: "Panneaux photovoltaïques",
        h1: "Panneaux photovoltaïques — Huawei & SolarEdge",
        intro:
          "Produisez votre propre électricité, réduisez votre facture et augmentez la valeur de votre bien. Étude personnalisée, dimensionnement sur mesure et onduleurs de référence pour une installation pensée pour durer.",
      }}
      faqs={faqs}
    >
      <p className="text-foreground text-lg leading-relaxed mb-10">
        Une installation photovoltaïque est un investissement de long terme — il
        mérite d'être pensé sur mesure, pas vendu en pack standardisé. Nous
        analysons votre consommation, votre toiture et votre budget pour vous
        proposer une installation réellement rentable.
      </p>

      <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6">
        Pourquoi nous choisir ?
      </h2>
      <ul className="space-y-3 text-foreground mb-10">
        {[
          "Étude personnalisée, pas de pack standardisé",
          "Onduleurs de référence : Huawei (fiabilité + rapport qualité-prix) ou SolarEdge (optimisation panneau par panneau)",
          "Dimensionnement basé sur votre consommation réelle, pas sur la surface disponible",
          "Installation soignée, intégration esthétique et conforme RGIE",
          "Suivi de production via application mobile",
        ].map((item) => (
          <li key={item} className="flex items-start gap-3">
            <span className="mt-2 w-2 h-2 rounded-full bg-primary shrink-0" />
            <span className="leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>

      <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6">
        Notre approche
      </h2>
      <ol className="space-y-4 text-foreground mb-10">
        {[
          ["Analyse de votre consommation", "Lecture de vos factures sur 12 mois pour dimensionner au plus juste."],
          ["Étude de votre toiture", "Orientation, inclinaison, ombrages, état de la couverture, points de fixation."],
          ["Proposition technique sur mesure", "Choix de l'onduleur (Huawei vs SolarEdge), nombre et type de panneaux, devis détaillé."],
          ["Installation par notre équipe", "Pose des panneaux, raccordement de l'onduleur, mise en service."],
          ["Démarches administratives", "Déclaration au gestionnaire de réseau, mise en service du compteur."],
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
        Onduleurs : Huawei & SolarEdge
      </h2>
      <p className="text-muted-foreground leading-relaxed mb-6">
        Nous privilégions les onduleurs <strong>Huawei</strong> (excellent
        rapport qualité-prix, fiabilité reconnue) et <strong>SolarEdge</strong>{" "}
        (optimisation panneau par panneau, idéale pour toitures complexes ou
        partiellement ombragées). D'autres marques peuvent être proposées sur
        demande selon les spécificités de votre projet.
      </p>
      <div className="grid md:grid-cols-2 gap-4 mb-10">
        <div className="bg-card border border-border/60 rounded-2xl p-6">
          <h3 className="font-display text-xl font-bold text-foreground mb-3">
            Huawei
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Onduleur centralisé, fiabilité reconnue, application FusionSolar
            intuitive, excellent rapport qualité-prix. Idéal pour toitures
            simples, bien orientées et sans ombrage.
          </p>
        </div>
        <div className="bg-card border border-border/60 rounded-2xl p-6">
          <h3 className="font-display text-xl font-bold text-foreground mb-3">
            SolarEdge
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Optimiseurs panneau par panneau : chaque module produit
            indépendamment. Idéal en cas d'ombrage partiel, toiture complexe ou
            multi-orientation. Monitoring détaillé module par module.
          </p>
        </div>
      </div>

      <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6">
        Choix des panneaux
      </h2>
      <p className="text-muted-foreground leading-relaxed mb-4">
        Nous choisissons avec vous les panneaux en fonction du budget et de la
        performance recherchée. Nous travaillons avec des marques établies —{" "}
        <strong>Trina Solar, Jinko, Canadian Solar, LG</strong> selon
        disponibilité et prix du moment. Tous nos panneaux bénéficient de
        garanties produit et performance constructeur (généralement 10-12 ans
        produit, 25 ans performance).
      </p>

      <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6">
        Primes en Wallonie
      </h2>
      <p className="text-muted-foreground leading-relaxed mb-4">
        Plusieurs aides existent en Wallonie pour soutenir l'installation
        photovoltaïque résidentielle : primes régionales énergie, certificats
        verts pour certaines configurations, mécanisme de compensation et tarif
        d'injection avec votre fournisseur. Les conditions et montants évoluent —
        nous vous communiquons les informations à jour au moment du devis.
      </p>

      <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6">
        Certification RESCERT — En toute transparence
      </h2>
      <div className="bg-accent/40 border border-primary/20 rounded-2xl p-6">
        <p className="text-foreground leading-relaxed">
          Notre certification <strong>RESCERT</strong> (nécessaire pour obtenir
          certaines primes régionales wallonnes) est{" "}
          <strong>en cours d'obtention</strong>. D'ici là, nous pouvons réaliser
          votre installation conforme RGIE, mais nous vous orientons sans frais
          vers un partenaire certifié si vous souhaitez bénéficier dès maintenant
          des primes qui exigent RESCERT.
        </p>
      </div>
    </ServicePageLayout>
  );
};

export default PanneauxPhotovoltaiques;
