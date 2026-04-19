import { motion } from "framer-motion";
import { HelpCircle, Phone, FileText, Wrench, Package, ShieldCheck } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import SEO from "@/components/SEO";
import StructuredData from "@/components/StructuredData";
import Breadcrumbs from "@/components/Breadcrumbs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAnalyticsEvents } from "@/hooks/useAnalyticsEvents";

type FaqCategoryKey = "general" | "intervention" | "materiel" | "specialites";

interface FaqItem {
  category: FaqCategoryKey;
  question: string;
  answer: string; // plain text version (used for Schema.org)
  answerNode: React.ReactNode; // rich rendering for the UI
}

const categoryMeta: Record<FaqCategoryKey, { title: string; icon: typeof FileText }> = {
  general: { title: "Général", icon: FileText },
  intervention: { title: "Intervention & Urgence", icon: Wrench },
  materiel: { title: "Matériel & Marques", icon: Package },
  specialites: { title: "Conformité & Spécialités", icon: ShieldCheck },
};

const faqData: FaqItem[] = [
  // ─── GÉNÉRAL ───
  {
    category: "general",
    question: "Êtes-vous un électricien agréé en Belgique ?",
    answer:
      "Oui. Adrian Mitric, fondateur de Le Cuivre Électrique, est électricien diplômé et agréé pour réaliser toutes les installations électriques en Belgique (société enregistrée BE 0805 376 944). Toutes nos installations sont conformes au Règlement Général sur les Installations Électriques (RGIE) en vigueur. À noter : nous sommes en cours d'obtention de la certification RESCERT, requise pour certains travaux spécifiques comme les panneaux photovoltaïques et les bornes de recharge donnant droit aux primes régionales. Dans l'intervalle, nous pouvons vous orienter vers un partenaire certifié si vous souhaitez bénéficier de ces primes.",
    answerNode: (
      <>
        <p>
          Oui. Adrian Mitric, fondateur de Le Cuivre Électrique, est électricien diplômé et agréé
          pour réaliser toutes les installations électriques en Belgique (société enregistrée BE
          0805 376 944). Toutes nos installations sont conformes au Règlement Général sur les
          Installations Électriques (RGIE) en vigueur.
        </p>
        <p>
          À noter : nous sommes en cours d'obtention de la certification RESCERT, requise pour
          certains travaux spécifiques comme les panneaux photovoltaïques et les bornes de recharge
          donnant droit aux primes régionales. Dans l'intervalle, nous pouvons vous orienter vers
          un partenaire certifié si vous souhaitez bénéficier de ces primes.
        </p>
      </>
    ),
  },
  {
    category: "general",
    question: "Dans quelles zones intervenez-vous ?",
    answer:
      "Nous sommes basés à Court-Saint-Étienne et intervenons prioritairement dans tout le Brabant wallon : Ottignies-Louvain-la-Neuve, Wavre, Nivelles, Waterloo, Genappe, Rixensart, Lasne, Braine-l'Alleud, Jodoigne et les communes environnantes. Nous nous déplaçons également dans le reste de la Wallonie (Namur, Gembloux et au-delà) ainsi qu'à Bruxelles sur demande. N'hésitez pas à nous contacter même si votre commune n'est pas listée, nous étudions chaque demande.",
    answerNode: (
      <>
        <p>
          Nous sommes basés à Court-Saint-Étienne et intervenons prioritairement dans tout le
          Brabant wallon : Ottignies-Louvain-la-Neuve, Wavre, Nivelles, Waterloo, Genappe,
          Rixensart, Lasne, Braine-l'Alleud, Jodoigne et les communes environnantes.
        </p>
        <p>
          Nous nous déplaçons également dans le reste de la Wallonie (Namur, Gembloux et au-delà)
          ainsi qu'à Bruxelles sur demande. N'hésitez pas à nous contacter même si votre commune
          n'est pas listée, nous étudions chaque demande.
        </p>
      </>
    ),
  },
  {
    category: "general",
    question: "Travaillez-vous pour les particuliers et les professionnels ?",
    answer:
      "Oui, nous intervenons aussi bien chez les particuliers (maisons, appartements, rénovations) que pour les professionnels (commerces, bureaux, syndics, agences immobilières, architectes). Chaque projet est traité avec la même rigueur, que ce soit pour changer un tableau électrique dans un appartement ou mettre en conformité un immeuble entier avant revente.",
    answerNode: (
      <>
        <p>
          Oui, nous intervenons aussi bien chez les particuliers (maisons, appartements,
          rénovations) que pour les professionnels (commerces, bureaux, syndics, agences
          immobilières, architectes).
        </p>
        <p>
          Chaque projet est traité avec la même rigueur, que ce soit pour changer un tableau
          électrique dans un appartement ou mettre en conformité un immeuble entier avant revente.
        </p>
      </>
    ),
  },
  {
    category: "general",
    question: "Le devis est-il gratuit ?",
    answer:
      "Oui. Le devis est entièrement gratuit et sans engagement pour toute demande classique. Nous prenons le temps d'analyser votre projet, de vous proposer les options les plus adaptées, et de vous remettre un devis détaillé, poste par poste, pour que vous sachiez exactement ce qui est prévu. Pour les diagnostics techniques approfondis ou les déplacements très éloignés, des frais de déplacement peuvent s'appliquer. Ils sont systématiquement annoncés à l'avance et déduits du montant final si les travaux sont acceptés.",
    answerNode: (
      <>
        <p>
          Oui. Le devis est entièrement gratuit et sans engagement pour toute demande classique.
          Nous prenons le temps d'analyser votre projet, de vous proposer les options les plus
          adaptées, et de vous remettre un devis détaillé, poste par poste, pour que vous sachiez
          exactement ce qui est prévu.
        </p>
        <p>
          Pour les diagnostics techniques approfondis ou les déplacements très éloignés, des frais
          de déplacement peuvent s'appliquer. Ils sont systématiquement annoncés à l'avance et
          déduits du montant final si les travaux sont acceptés.
        </p>
      </>
    ),
  },

  // ─── INTERVENTION & URGENCE ───
  {
    category: "intervention",
    question: "Intervenez-vous en urgence ?",
    answer:
      "Oui. Nous proposons un service de dépannage électrique rapide pour tous types de situations urgentes : panne générale, court-circuit, disjoncteur qui saute en permanence, prise qui grille, odeur de brûlé, tableau électrique défaillant, coupure partielle… Selon la disponibilité et la distance, une intervention le jour même est souvent possible dans le Brabant wallon. Appelez-nous directement au 0485 75 52 27 pour les urgences, c'est le moyen le plus rapide d'être pris en charge.",
    answerNode: (
      <>
        <p>
          Oui. Nous proposons un service de dépannage électrique rapide pour tous types de
          situations urgentes : panne générale, court-circuit, disjoncteur qui saute en permanence,
          prise qui grille, odeur de brûlé, tableau électrique défaillant, coupure partielle…
        </p>
        <p>
          Selon la disponibilité et la distance, une intervention le jour même est souvent possible
          dans le Brabant wallon. Appelez-nous directement au{" "}
          <a href="tel:+32485755227" className="text-primary font-medium hover:underline">
            0485 75 52 27
          </a>{" "}
          pour les urgences, c'est le moyen le plus rapide d'être pris en charge.
        </p>
      </>
    ),
  },
  {
    category: "intervention",
    question: "Quel est votre délai d'intervention en cas d'urgence ?",
    answer:
      "Dans le Brabant wallon (Court-Saint-Étienne, Ottignies-LLN, Wavre, Nivelles, Waterloo et communes proches), nous visons une intervention dans les 1 à 2 heures pour les situations urgentes, selon notre charge de chantiers en cours. Pour les zones plus éloignées (Namur, Bruxelles), le délai dépend de la distance et des engagements en cours. Un appel téléphonique nous permet de vous confirmer immédiatement notre disponibilité et le délai exact.",
    answerNode: (
      <>
        <p>
          Dans le Brabant wallon (Court-Saint-Étienne, Ottignies-LLN, Wavre, Nivelles, Waterloo et
          communes proches), nous visons une intervention dans les 1 à 2 heures pour les situations
          urgentes, selon notre charge de chantiers en cours.
        </p>
        <p>
          Pour les zones plus éloignées (Namur, Bruxelles), le délai dépend de la distance et des
          engagements en cours. Un appel téléphonique nous permet de vous confirmer immédiatement
          notre disponibilité et le délai exact.
        </p>
      </>
    ),
  },
  {
    category: "intervention",
    question: "Combien de temps dure une installation électrique complète ?",
    answer:
      "Le délai dépend de la surface et de la complexité du projet. À titre indicatif : Rénovation partielle (ajout de prises, modification d'un tableau) : de quelques heures à 2-3 jours. Rénovation complète d'un appartement : 1 à 2 semaines. Installation complète d'une maison neuve : 2 à 4 semaines. Rénovation lourde avec réagencement : 3 à 5 semaines. Nous vous donnons un planning précis lors de l'établissement du devis, et nous nous engageons à le respecter.",
    answerNode: (
      <>
        <p>Le délai dépend de la surface et de la complexité du projet. À titre indicatif :</p>
        <ul className="list-disc pl-5 space-y-1.5 my-2">
          <li>
            <strong className="text-foreground">Rénovation partielle</strong> (ajout de prises,
            modification d'un tableau) : de quelques heures à 2-3 jours
          </li>
          <li>
            <strong className="text-foreground">Rénovation complète d'un appartement</strong> : 1 à
            2 semaines
          </li>
          <li>
            <strong className="text-foreground">Installation complète d'une maison neuve</strong> :
            2 à 4 semaines
          </li>
          <li>
            <strong className="text-foreground">Rénovation lourde avec réagencement</strong> : 3 à
            5 semaines
          </li>
        </ul>
        <p>
          Nous vous donnons un planning précis lors de l'établissement du devis, et nous nous
          engageons à le respecter.
        </p>
      </>
    ),
  },
  {
    category: "intervention",
    question: "Le chantier est-il laissé propre après intervention ?",
    answer:
      "Oui. Nous travaillons avec soin, protégeons systématiquement les zones sensibles (meubles, sols, revêtements) avec des bâches et cartons, et laissons le chantier propre en fin d'intervention. Les gravats et déchets de chantier sont évacués par nos soins. C'est un point sur lequel nos clients nous font régulièrement des retours positifs, et c'est l'une des raisons pour lesquelles nous avons une note de 4,94/5 sur Google.",
    answerNode: (
      <>
        <p>
          Oui. Nous travaillons avec soin, protégeons systématiquement les zones sensibles
          (meubles, sols, revêtements) avec des bâches et cartons, et laissons le chantier propre
          en fin d'intervention. Les gravats et déchets de chantier sont évacués par nos soins.
        </p>
        <p>
          C'est un point sur lequel nos clients nous font régulièrement des retours positifs, et
          c'est l'une des raisons pour lesquelles nous avons une note de{" "}
          <strong className="text-foreground">4,94/5 sur Google</strong>.
        </p>
      </>
    ),
  },

  // ─── MATÉRIEL & MARQUES ───
  {
    category: "materiel",
    question: "Quelles marques de matériel utilisez-vous d'office ?",
    answer:
      "Nous posons d'office du matériel de marques reconnues pour leur fiabilité et leur durabilité : Tableaux électriques : Schneider (principal) ou Hager. Prises et interrupteurs : Niko. Bornes de recharge : Alfen et Hager. Onduleurs photovoltaïques : Huawei ou SolarEdge. Ces marques sont choisies pour leur qualité professionnelle, leur disponibilité en Belgique et leur service après-vente.",
    answerNode: (
      <>
        <p>
          Nous posons d'office du matériel de marques reconnues pour leur fiabilité et leur
          durabilité :
        </p>
        <ul className="list-disc pl-5 space-y-1.5 my-2">
          <li>
            <strong className="text-foreground">Tableaux électriques</strong> : Schneider
            (principal) ou Hager
          </li>
          <li>
            <strong className="text-foreground">Prises et interrupteurs</strong> : Niko
          </li>
          <li>
            <strong className="text-foreground">Bornes de recharge</strong> : Alfen et Hager
          </li>
          <li>
            <strong className="text-foreground">Onduleurs photovoltaïques</strong> : Huawei ou
            SolarEdge
          </li>
        </ul>
        <p>
          Ces marques sont choisies pour leur qualité professionnelle, leur disponibilité en
          Belgique et leur service après-vente.
        </p>
      </>
    ),
  },
  {
    category: "materiel",
    question: "Puis-je demander d'autres marques que celles que vous utilisez habituellement ?",
    answer:
      "Oui, absolument. Si vous avez une préférence pour une autre marque (Legrand, Bticino, ABB, Wallbox, etc.), nous sommes ouverts à travailler avec, à condition qu'elle respecte les normes en vigueur et la qualité professionnelle. Nos marques de base sont notre choix par défaut pour garantir un niveau de qualité éprouvé, mais nous nous adaptons aux besoins et envies de chaque client.",
    answerNode: (
      <>
        <p>
          Oui, absolument. Si vous avez une préférence pour une autre marque (Legrand, Bticino,
          ABB, Wallbox, etc.), nous sommes ouverts à travailler avec, à condition qu'elle respecte
          les normes en vigueur et la qualité professionnelle.
        </p>
        <p>
          Nos marques de base sont notre choix par défaut pour garantir un niveau de qualité
          éprouvé, mais nous nous adaptons aux besoins et envies de chaque client.
        </p>
      </>
    ),
  },
  {
    category: "materiel",
    question: "Fournissez-vous vous-même le matériel ?",
    answer:
      "Oui, nous fournissons et installons tout le matériel nécessaire à votre projet. Cela simplifie grandement la coordination et garantit que le matériel est adapté à l'installation. Si vous souhaitez fournir vous-même certains éléments (luminaires spécifiques, marques particulières), c'est tout à fait possible et nous en discutons lors du devis.",
    answerNode: (
      <>
        <p>
          Oui, nous fournissons et installons tout le matériel nécessaire à votre projet. Cela
          simplifie grandement la coordination et garantit que le matériel est adapté à
          l'installation.
        </p>
        <p>
          Si vous souhaitez fournir vous-même certains éléments (luminaires spécifiques, marques
          particulières), c'est tout à fait possible et nous en discutons lors du devis.
        </p>
      </>
    ),
  },

  // ─── CONFORMITÉ & SPÉCIALITÉS ───
  {
    category: "specialites",
    question: "Réalisez-vous les mises en conformité RGIE ?",
    answer:
      "Oui, la mise en conformité électrique (RGIE) est l'une de nos spécialités. Nous réalisons un diagnostic complet de votre installation, identifions les non-conformités, vous remettons un rapport détaillé, effectuons les travaux correctifs nécessaires, et vous accompagnons jusqu'à l'obtention du certificat de conformité. La mise en conformité est obligatoire en Belgique dans plusieurs cas : vente d'un bien immobilier, changement de compteur, fin du certificat de 25 ans, ou rénovation majeure.",
    answerNode: (
      <>
        <p>
          Oui, la mise en conformité électrique (RGIE) est l'une de nos spécialités. Nous réalisons
          un diagnostic complet de votre installation, identifions les non-conformités, vous
          remettons un rapport détaillé, effectuons les travaux correctifs nécessaires, et vous
          accompagnons jusqu'à l'obtention du certificat de conformité.
        </p>
        <p>
          La mise en conformité est obligatoire en Belgique dans plusieurs cas : vente d'un bien
          immobilier, changement de compteur, fin du certificat de 25 ans, ou rénovation majeure.
        </p>
      </>
    ),
  },
  {
    category: "specialites",
    question: "Travaillez-vous avec un organisme de contrôle agréé ?",
    answer:
      "Oui. Nous collaborons régulièrement avec les organismes de contrôle agréés en Belgique (Vinçotte, AIB-Vinçotte, BTV, etc.) et nous pouvons coordonner le passage du contrôleur après les travaux pour faciliter l'obtention de votre certificat de conformité. Cela vous évite les démarches administratives fastidieuses : nous nous occupons de tout de A à Z.",
    answerNode: (
      <>
        <p>
          Oui. Nous collaborons régulièrement avec les organismes de contrôle agréés en Belgique
          (Vinçotte, AIB-Vinçotte, BTV, etc.) et nous pouvons coordonner le passage du contrôleur
          après les travaux pour faciliter l'obtention de votre certificat de conformité.
        </p>
        <p>
          Cela vous évite les démarches administratives fastidieuses : nous nous occupons de tout
          de A à Z.
        </p>
      </>
    ),
  },
  {
    category: "specialites",
    question: "Installez-vous des bornes de recharge pour voiture électrique ?",
    answer:
      "Oui. Nous installons des bornes de recharge pour véhicules électriques, tant pour les particuliers (à domicile) que pour les professionnels (entreprises, copropriétés). Nos marques de référence sont Alfen et Hager. Selon votre installation électrique existante (monophasée ou triphasée), nous pouvons installer des bornes de 7,4 kW, 11 kW ou 22 kW. Nous réalisons toujours une étude préalable pour dimensionner la borne correctement et vérifier si des adaptations électriques sont nécessaires. Pour bénéficier des primes régionales liées aux bornes, une certification RESCERT est requise. Comme nous sommes en cours d'obtention, nous pouvons vous orienter vers un partenaire certifié dans l'intervalle si vous souhaitez accéder à ces primes.",
    answerNode: (
      <>
        <p>
          Oui. Nous installons des bornes de recharge pour véhicules électriques, tant pour les
          particuliers (à domicile) que pour les professionnels (entreprises, copropriétés). Nos
          marques de référence sont Alfen et Hager.
        </p>
        <p>
          Selon votre installation électrique existante (monophasée ou triphasée), nous pouvons
          installer des bornes de 7,4 kW, 11 kW ou 22 kW. Nous réalisons toujours une étude
          préalable pour dimensionner la borne correctement et vérifier si des adaptations
          électriques sont nécessaires.
        </p>
        <p>
          Pour bénéficier des primes régionales liées aux bornes, une certification RESCERT est
          requise. Comme nous sommes en cours d'obtention, nous pouvons vous orienter vers un
          partenaire certifié dans l'intervalle si vous souhaitez accéder à ces primes.
        </p>
      </>
    ),
  },
  {
    category: "specialites",
    question: "Pouvez-vous installer des panneaux photovoltaïques ?",
    answer:
      "Oui. Nous installons des panneaux photovoltaïques avec onduleurs Huawei (excellent rapport qualité-prix, fiabilité reconnue) ou SolarEdge (optimisation panneau par panneau, idéal pour toitures complexes ou partiellement ombragées). Les panneaux sont choisis avec vous selon votre budget et la performance recherchée. Notre approche : étude de consommation, analyse de l'orientation et inclinaison de votre toiture, dimensionnement sur mesure, installation soignée et mise en service. À noter : la certification RESCERT (nécessaire pour les primes régionales wallonnes) est en cours d'obtention chez nous. Si vous souhaitez bénéficier de ces primes, nous vous orientons vers un partenaire certifié le temps que la nôtre soit délivrée.",
    answerNode: (
      <>
        <p>
          Oui. Nous installons des panneaux photovoltaïques avec onduleurs Huawei (excellent
          rapport qualité-prix, fiabilité reconnue) ou SolarEdge (optimisation panneau par panneau,
          idéal pour toitures complexes ou partiellement ombragées). Les panneaux sont choisis avec
          vous selon votre budget et la performance recherchée.
        </p>
        <p>
          Notre approche : étude de consommation, analyse de l'orientation et inclinaison de votre
          toiture, dimensionnement sur mesure, installation soignée et mise en service.
        </p>
        <p>
          À noter : la certification RESCERT (nécessaire pour les primes régionales wallonnes) est
          en cours d'obtention chez nous. Si vous souhaitez bénéficier de ces primes, nous vous
          orientons vers un partenaire certifié le temps que la nôtre soit délivrée.
        </p>
      </>
    ),
  },
];

const categoryOrder: FaqCategoryKey[] = ["general", "intervention", "materiel", "specialites"];

const FAQ = () => {
  const { trackEvent } = useAnalyticsEvents();

  // Schema.org FAQPage payload (uses plain-text answers)
  const schemaQuestions = faqData.map((item) => ({
    question: item.question,
    answer: item.answer,
  }));

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SEO
        title="Questions fréquentes | Le Cuivre Électrique - Électricien Brabant wallon"
        description="Toutes les réponses à vos questions sur nos services d'électricien agréé en Brabant wallon : urgences, conformité RGIE, bornes de recharge, photovoltaïque."
        keywords="FAQ électricien, questions fréquentes électricité, RGIE, dépannage urgent, borne de recharge, photovoltaïque, Brabant wallon, Bruxelles, Wallonie"
        canonical="https://cuivre-electrique.com/faq"
      />
      <StructuredData type="FAQPage" questions={schemaQuestions} />
      <StructuredData
        type="BreadcrumbList"
        items={[
          { name: "Accueil", url: "https://cuivre-electrique.com" },
          { name: "Questions fréquentes", url: "https://cuivre-electrique.com/faq" },
        ]}
      />
      <Header />
      <WhatsAppButton />

      {/* Hero */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-20 bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto px-4">
          <Breadcrumbs items={[{ label: "Questions fréquentes", href: "/faq" }]} />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6">
              <HelpCircle className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">FAQ</span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              Questions <span className="text-primary">fréquentes</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Vos questions les plus courantes sur nos services d'électricien agréé en Brabant
              wallon, à Bruxelles et en Wallonie.
            </p>
          </motion.div>
        </div>
      </section>

      {/* FAQ catégorisée */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto space-y-14">
            {categoryOrder.map((catKey) => {
              const meta = categoryMeta[catKey];
              const items = faqData.filter((q) => q.category === catKey);
              const Icon = meta.icon;

              return (
                <motion.div
                  key={catKey}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">
                      {meta.title}
                    </h2>
                  </div>

                  <Accordion type="single" collapsible className="space-y-3">
                    {items.map((item, idx) => (
                      <AccordionItem
                        key={`${catKey}-${idx}`}
                        value={`${catKey}-${idx}`}
                        className="bg-card border border-border rounded-xl px-5 md:px-6 data-[state=open]:shadow-lg transition-shadow"
                      >
                        <AccordionTrigger className="text-left font-medium text-foreground hover:text-primary py-5 text-base md:text-[1.05rem]">
                          {item.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground pb-5 leading-relaxed space-y-3">
                          {item.answerNode}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing CTA — replaces previous tariff grid */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto bg-card border border-border rounded-2xl p-8 md:p-12 text-center shadow-lg"
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <FileText className="w-7 h-7 text-primary" />
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
              Tarifs adaptés à votre projet
            </h2>
            <p className="text-muted-foreground mb-8 leading-relaxed max-w-2xl mx-auto">
              Chaque installation est unique. Nous préférons vous proposer un devis personnalisé,
              transparent et sans surprise, plutôt qu'une grille tarifaire générique. Contactez-nous
              pour une estimation gratuite.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild variant="copper" size="lg" className="gap-2">
                <Link
                  to="/contact"
                  data-analytics="quote_request"
                  onClick={() =>
                    trackEvent("quote_request", { source_section: "faq_pricing_cta" })
                  }
                >
                  Demander un devis gratuit
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="gap-2">
                <a
                  href="tel:+32485755227"
                  data-analytics="call_click"
                  onClick={() => trackEvent("call_click", { source_section: "faq_pricing_cta" })}
                >
                  <Phone className="w-4 h-4" />
                  Nous appeler
                </a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA bas (existant) */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto text-center"
          >
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
              Une question qui n'est pas dans la liste ?
            </h2>
            <p className="text-muted-foreground mb-8">
              Contactez-nous, nous vous répondons rapidement.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="gap-2">
                <Link
                  to="/contact"
                  data-analytics="quote_request"
                  onClick={() => trackEvent("quote_request", { source_section: "faq_bottom_cta" })}
                >
                  <Phone className="w-4 h-4" />
                  Demander un devis gratuit
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a
                  href="tel:+32485755227"
                  data-analytics="call_click"
                  onClick={() => trackEvent("call_click", { source_section: "faq_bottom_cta" })}
                >
                  Appeler maintenant
                </a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FAQ;
