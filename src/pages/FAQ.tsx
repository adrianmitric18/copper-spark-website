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
    question: "Qui est derrière Le Cuivre Électrique ?",
    answer:
      "Adrian Mitric, électricien indépendant à Court-Saint-Étienne, fondateur du Cuivre Électrique en 2021. Société enregistrée BE 0805.376.944. Toutes nos installations sont réalisées dans le respect du Règlement Général sur les Installations Électriques (RGIE) en vigueur en Belgique, avec coordination du contrôle final par un organisme agréé (Vinçotte, BTV, AIB-Vinçotte).",
    answerNode: (
      <>
        <p>
          Adrian Mitric, électricien indépendant à Court-Saint-Étienne, fondateur
          du Cuivre Électrique en 2021. Société enregistrée BE 0805.376.944.
        </p>
        <p>
          Toutes nos installations sont réalisées dans le respect du Règlement
          Général sur les Installations Électriques (RGIE) en vigueur en Belgique,
          avec coordination du contrôle final par un organisme agréé (Vinçotte,
          BTV, AIB-Vinçotte).
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
  {
    category: "general",
    question: "Quelles garanties proposez-vous ?",
    answer:
      "Toutes nos installations sont conformes au Règlement Général sur les Installations Électriques (RGIE) en vigueur en Belgique. La main-d'œuvre est garantie 2 ans à compter de la fin de chantier (garantie légale de conformité). Le matériel posé bénéficie en plus de la garantie constructeur (Schneider, Niko, Hager, Alfen, etc.) qui peut aller jusqu'à 5 ou 10 ans selon les marques et les références.",
    answerNode: (
      <>
        <p>
          Toutes nos installations sont conformes au Règlement Général sur
          les Installations Électriques (RGIE) en vigueur en Belgique.
        </p>
        <p>
          La main-d'œuvre est garantie 2 ans à compter de la fin de chantier
          (garantie légale de conformité). Le matériel posé bénéficie en plus
          de la garantie constructeur (Schneider, Niko, Hager, Alfen, etc.)
          qui peut aller jusqu'à 5 ou 10 ans selon les marques et les
          références.
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
      "Oui. Nous travaillons avec soin, protégeons systématiquement les zones sensibles (meubles, sols, revêtements) avec des bâches et cartons, et laissons le chantier propre en fin d'intervention. Les gravats et déchets de chantier sont évacués par nos soins. C'est un point sur lequel nos clients nous font régulièrement des retours positifs, et c'est l'une des raisons de notre excellente note sur Google.",
    answerNode: (
      <>
        <p>
          Oui. Nous travaillons avec soin, protégeons systématiquement les zones sensibles
          (meubles, sols, revêtements) avec des bâches et cartons, et laissons le chantier propre
          en fin d'intervention. Les gravats et déchets de chantier sont évacués par nos soins.
        </p>
        <p>
          C'est un point sur lequel nos clients nous font régulièrement des retours positifs, et
          c'est l'une des raisons de notre <strong className="text-foreground">excellente note sur Google</strong>.
        </p>
      </>
    ),
  },

  // ─── MATÉRIEL & MARQUES ───
  {
    category: "materiel",
    question: "Quelles marques de matériel utilisez-vous d'office ?",
    answer:
      "Nous posons d'office du matériel de marques reconnues pour leur fiabilité et leur durabilité : Tableaux électriques : Schneider (principal) ou Hager. Prises et interrupteurs : Niko. Bornes de recharge : Alfen (référence), Hager ou Wallbox. Onduleurs photovoltaïques : Huawei ou SolarEdge. Ces marques sont choisies pour leur qualité professionnelle, leur disponibilité en Belgique et leur service après-vente.",
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
            <strong className="text-foreground">Bornes de recharge</strong> : Alfen (référence),
            Hager ou Wallbox
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
    question: "Je vends ma maison, que faire si le contrôle électrique est négatif ?",
    answer:
      "Ce n'est pas bloquant pour la vente : l'acheteur dispose de 18 mois après l'acte pour faire réaliser la mise en conformité. En pratique, un dossier réglé avant la vente vous évite des négociations à la baisse, l'acheteur chiffrant presque toujours les travaux au-delà de leur coût réel. Achat ou vente d'un bien dans le Brabant wallon : nous traitons les demandes RGIE urgentes pour compromis et actes notariés sous 48-72h, avec un dossier complet (plans et corrections) pour que votre vente ne soit pas bloquée.",
    answerNode: (
      <>
        <p>
          Ce n'est pas bloquant pour la vente : l'acheteur dispose de{" "}
          <strong>18 mois après l'acte</strong> pour faire réaliser la mise en
          conformité.
        </p>
        <p>
          En pratique, un dossier réglé avant la vente vous évite des
          négociations à la baisse — l'acheteur chiffre presque toujours les
          travaux bien au-delà de leur coût réel.
        </p>
        <p>
          Achat ou vente d'un bien dans le Brabant wallon ? Nous traitons les
          demandes RGIE urgentes pour compromis et actes notariés{" "}
          <strong>sous 48-72h</strong>, avec un dossier complet (plans et
          corrections) pour que votre vente ne soit pas bloquée.
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
      "Oui. Nous installons des bornes de recharge pour véhicules électriques, tant pour les particuliers (à domicile) que pour les professionnels (entreprises, copropriétés). Alfen est notre marque de référence ; nous installons aussi Hager, Wallbox et les autres marques du marché. Selon votre installation électrique existante (monophasée ou triphasée), nous pouvons installer des bornes de 7,4 kW, 11 kW ou 22 kW. Nous réalisons toujours une étude préalable pour dimensionner la borne correctement et vérifier si des adaptations électriques sont nécessaires. Des aides régionales existent pour les bornes — nous vous donnons les informations à jour lors du devis et vous orientons sur les démarches.",
    answerNode: (
      <>
        <p>
          Oui. Nous installons des bornes de recharge pour véhicules électriques, tant pour les
          particuliers (à domicile) que pour les professionnels (entreprises, copropriétés). Alfen
          est notre marque de référence ; nous installons aussi Hager, Wallbox et les autres
          marques du marché.
        </p>
        <p>
          Selon votre installation électrique existante (monophasée ou triphasée), nous pouvons
          installer des bornes de 7,4 kW, 11 kW ou 22 kW. Nous réalisons toujours une étude
          préalable pour dimensionner la borne correctement et vérifier si des adaptations
          électriques sont nécessaires.
        </p>
        <p>
          Des aides régionales existent pour les bornes de recharge. Les
          conditions évoluent chaque année — nous vous donnons les informations
          à jour lors du devis et vous orientons sur les démarches.
        </p>
      </>
    ),
  },
  {
    category: "specialites",
    question: "Pouvez-vous installer des panneaux photovoltaïques ?",
    answer:
      "Oui. Nous installons des panneaux photovoltaïques avec onduleurs Huawei (excellent rapport qualité-prix, fiabilité reconnue) ou SolarEdge (optimisation panneau par panneau, idéal pour toitures complexes ou partiellement ombragées). Les panneaux sont choisis avec vous selon votre budget et la performance recherchée. Notre approche : étude de consommation, analyse de l'orientation et inclinaison de votre toiture, dimensionnement sur mesure, installation soignée et mise en service. Les conditions des primes régionales évoluent chaque année — nous vous donnons les informations à jour au moment du devis.",
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
          Les conditions des primes régionales évoluent chaque année — nous vous
          donnons les informations à jour au moment du devis et vous orientons
          sur les démarches.
        </p>
      </>
    ),
  },

  // ─── BORNES DE RECHARGE — questions ciblées (brief V3) ───
  {
    category: "specialites",
    question: "Quelle puissance de borne pour ma voiture ?",
    answer:
      "Pour un usage domestique, une borne 7,4 kW (monophasée) ou 11 kW (triphasée) recharge la plupart des voitures électriques en une nuit. La 22 kW est réservée aux installations triphasées robustes (entreprises, copropriétés), et seulement si votre véhicule l'accepte en courant alternatif. Avant le devis, nous vérifions toujours la configuration de votre tableau et le type de prise embarquée par votre voiture.",
    answerNode: (
      <>
        <p>
          Pour un usage domestique, une borne 7,4 kW (monophasée) ou 11 kW
          (triphasée) recharge la plupart des voitures électriques en une
          nuit. La 22 kW est réservée aux installations triphasées robustes
          (entreprises, copropriétés), et seulement si votre véhicule
          l'accepte en courant alternatif.
        </p>
        <p>
          Avant le devis, nous vérifions toujours la configuration de votre
          tableau et le type de prise embarquée par votre voiture.
        </p>
      </>
    ),
  },
  {
    category: "specialites",
    question: "Combien coûte l'installation d'une borne de recharge ?",
    answer:
      "Le prix dépend de la marque, de la puissance, de la longueur de câble entre tableau et borne, et de la complexité de l'installation (renforcement de tableau, tranchée éventuelle). Pour une borne Alfen, Hager ou Wallbox avec une pose simple, comptez en ordre de grandeur entre 1 800 et 3 000 € TTC, matériel et main-d'œuvre compris. Les chantiers nécessitant une tranchée ou un terrassement sortent de cette fourchette. Le devis est gratuit après visite technique sur place et détaille chaque poste séparément.",
    answerNode: (
      <>
        <p>
          Le prix dépend de la marque, de la puissance, de la longueur de
          câble entre tableau et borne, et de la complexité de l'installation
          (renforcement de tableau, tranchée éventuelle).
        </p>
        <p>
          Pour une borne Alfen, Hager ou Wallbox avec une pose simple, comptez
          en ordre de grandeur entre 1 800 et 3 000 € TTC, matériel et
          main-d'œuvre compris. Les chantiers nécessitant une tranchée ou un
          terrassement sortent de cette fourchette. Le devis est gratuit après
          visite technique sur place et détaille chaque poste séparément.
        </p>
      </>
    ),
  },
  {
    category: "specialites",
    question: "Faut-il l'accord du gestionnaire de réseau pour une borne ?",
    answer:
      "Pour une borne domestique jusqu'à 11 kW raccordée à une installation existante, aucune demande préalable n'est requise dans la majorité des cas. Au-delà (22 kW, recharge rapide, raccordement triphasé en monophasé existant) ou pour certaines copropriétés, une déclaration ou un renforcement chez le gestionnaire de réseau peut être nécessaire. Nous regardons cela ensemble lors de la visite et nous prenons en charge les démarches si elles s'imposent.",
    answerNode: (
      <>
        <p>
          Pour une borne domestique jusqu'à 11 kW raccordée à une installation
          existante, aucune demande préalable n'est requise dans la majorité
          des cas.
        </p>
        <p>
          Au-delà (22 kW, recharge rapide, raccordement triphasé en
          monophasé existant) ou pour certaines copropriétés, une
          déclaration ou un renforcement chez le gestionnaire de réseau peut
          être nécessaire. Nous regardons cela ensemble lors de la visite et
          nous prenons en charge les démarches si elles s'imposent.
        </p>
      </>
    ),
  },
  {
    category: "specialites",
    question: "Comment fonctionne la prime VE en Wallonie ?",
    answer:
      "La Wallonie propose des aides régionales pour l'installation de bornes de recharge, principalement à destination des particuliers et de certaines entreprises. Les conditions et montants évoluent chaque année et certains dispositifs requièrent un installateur agréé pour ce type de prime. Nous vous donnons les informations à jour au moment du devis et vous orientons sur les démarches adaptées à votre situation.",
    answerNode: (
      <>
        <p>
          La Wallonie propose des aides régionales pour l'installation de
          bornes de recharge, principalement à destination des particuliers
          et de certaines entreprises.
        </p>
        <p>
          Les conditions et montants évoluent chaque année et certains
          dispositifs requièrent un installateur agréé pour ce type de prime.
          Nous vous donnons les informations à jour au moment du devis et
          vous orientons sur les démarches adaptées à votre situation.
        </p>
      </>
    ),
  },

  // ─── PHOTOVOLTAÏQUE — questions ciblées (brief V3) ───
  {
    category: "specialites",
    question: "Combien de panneaux pour couvrir ma consommation ?",
    answer:
      "En ordre de grandeur : un ménage belge consomme entre 3 000 et 5 000 kWh par an. Un panneau de 410-450 Wc bien orienté produit en Wallonie autour de 350 à 400 kWh/an. Pour couvrir une consommation moyenne il faut donc typiquement entre 8 et 14 panneaux. Le dimensionnement réel dépend de votre toiture (orientation, inclinaison, ombrages), de votre consommation détaillée et de votre stratégie d'autoconsommation. Nous faisons l'étude précise lors de la visite gratuite.",
    answerNode: (
      <>
        <p>
          En ordre de grandeur : un ménage belge consomme entre 3 000 et
          5 000 kWh par an. Un panneau de 410-450 Wc bien orienté produit
          en Wallonie autour de 350 à 400 kWh/an. Pour couvrir une
          consommation moyenne il faut donc typiquement entre 8 et 14 panneaux.
        </p>
        <p>
          Le dimensionnement réel dépend de votre toiture (orientation,
          inclinaison, ombrages), de votre consommation détaillée et de
          votre stratégie d'autoconsommation. Nous faisons l'étude précise
          lors de la visite gratuite.
        </p>
      </>
    ),
  },
  {
    category: "specialites",
    question: "Quel délai pour rentabiliser une installation photovoltaïque ?",
    answer:
      "Le retour sur investissement dépend de votre consommation, du tarif d'électricité au moment où vous installez, du taux d'autoconsommation, et des aides régionales. En 2026 et avec une installation bien dimensionnée, le retour se situe généralement entre 7 et 12 ans. Une installation est garantie 25 ans côté production des panneaux, donc la part rentabilisée représente la majeure partie de la durée de vie. Nous vous fournissons une simulation chiffrée dans le devis.",
    answerNode: (
      <>
        <p>
          Le retour sur investissement dépend de votre consommation, du
          tarif d'électricité au moment où vous installez, du taux
          d'autoconsommation, et des aides régionales.
        </p>
        <p>
          En 2026 et avec une installation bien dimensionnée, le retour se
          situe généralement entre 7 et 12 ans. Une installation est
          garantie 25 ans côté production des panneaux, donc la part
          rentabilisée représente la majeure partie de la durée de vie.
          Nous vous fournissons une simulation chiffrée dans le devis.
        </p>
      </>
    ),
  },
  {
    category: "specialites",
    question: "Quelles démarches administratives pour le photovoltaïque ?",
    answer:
      "Une installation photovoltaïque résidentielle en Wallonie demande typiquement : la déclaration auprès du gestionnaire de réseau pour autoriser l'injection, l'inscription au mécanisme de compensation ou de rachat (selon la puissance), une éventuelle demande de prime régionale, et le contrôle RGIE après pose. Nous prenons en charge le formalisme technique de A à Z et vous accompagnons sur la partie prime ; vous restez décideur sur les choix qui vous engagent (contrat, choix tarifaire).",
    answerNode: (
      <>
        <p>
          Une installation photovoltaïque résidentielle en Wallonie demande
          typiquement : la déclaration auprès du gestionnaire de réseau pour
          autoriser l'injection, l'inscription au mécanisme de compensation
          ou de rachat (selon la puissance), une éventuelle demande de
          prime régionale, et le contrôle RGIE après pose.
        </p>
        <p>
          Nous prenons en charge le formalisme technique de A à Z et vous
          accompagnons sur la partie prime ; vous restez décideur sur les
          choix qui vous engagent (contrat, choix tarifaire).
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
        description="Toutes les réponses à vos questions sur nos services d'électricien indépendant en Brabant wallon : urgences, conformité RGIE, bornes de recharge, photovoltaïque."
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
              Vos questions les plus courantes sur nos services d'électricien indépendant en Brabant
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
