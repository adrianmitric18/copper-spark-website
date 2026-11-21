import { useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, MessageCircle } from "lucide-react";
import ServicePageLayout from "@/components/services/ServicePageLayout";
import RealisationsLiees from "@/components/realisations/RealisationsLiees";
import { Button } from "@/components/ui/button";
import { useDisplayRating } from "@/hooks/useDisplayRating";
import { realisationsPourService } from "@/lib/chantiers/liens";
import { actionDuLien, compterClic } from "@/lib/compteur";
import { BORNE, NB_QUESTIONS, type Fourchette } from "@/lib/simulateur/config";
// Certificat fourni par Adrian le 2026-11-21 (1241 × 1754). La vignette (360 px
// de large, affichée en 180 px) est seule chargée avec la page ; l'original ne
// se télécharge qu'au clic. Le certificat ne porte pas de date : elle n'est
// écrite que dans la légende.
import certificatZaptec from "@/assets/certificat-zaptec-adrian-mitric.webp";
import certificatZaptecVignette from "@/assets/certificat-zaptec-adrian-mitric-360.webp";

/**
 * Page /services/bornes-de-recharge.
 *
 * Le texte vient d'Adrian (docs/page-bornes-texte.md, version du 21/11/2026) et
 * fait foi : ne pas le réécrire ici sans mettre le document à jour. Les passages
 * marqués « [à confirmer N] » dans le document ne sont PAS publiés ; chaque
 * endroit concerné porte un commentaire avec son numéro.
 *
 * Règles de la page :
 *   - aucun prix au-dessus de « Combien coûte une borne de recharge posée ? » ;
 *   - les fourchettes viennent de `BORNE` (src/lib/simulateur/config.ts), la
 *     même constante que le simulateur : un prix ne se change qu'à un endroit ;
 *   - la FAQ visible et le JSON-LD FAQPage lisent le même tableau `faqs`.
 */

/** Date des tarifs et de la dernière mise à jour du texte. À changer avec le texte. */
const MISE_A_JOUR = "21 novembre 2026";

const SLUG = "bornes-de-recharge";

const nombre = (n: number) => n.toLocaleString("fr-BE");
/** « 2 000 à 2 400 € » */
const prix = (f: Fourchette) => `${nombre(f.min)} à ${nombre(f.max)} €`;

const PRIX_ZAPTEC = prix(BORNE.zaptec);
const PRIX_ALFEN = prix(BORNE.alfen);
const PRIX_POSE_SEULE = prix(BORNE.poseSeule);

/**
 * Tant que le formulaire de contact n'accepte que 3 photos (limite de la
 * policy Supabase, levée au lot 3), « Envoyer mes photos » ouvre WhatsApp, où
 * les quatre photos passent. Le formulaire reste proposé en second.
 */
const WHATSAPP_PHOTOS =
  "https://wa.me/32485755227?text=" +
  encodeURIComponent(
    "Bonjour, je souhaite un devis pour une borne de recharge. Je vous envoie mes 4 photos : compteur, tableau porte ouverte, emplacement de la borne, trajet entre les deux. Voiture : … Commune : … Maison de plus de 10 ans : oui / non.",
  );

const INTRO =
  "Le Cuivre Électrique installe des bornes de recharge pour voitures électriques à domicile, en copropriété et en entreprise, en Brabant wallon, en province de Namur et à Bruxelles. Adrian Mitric, électricien indépendant à Court-Saint-Étienne, est installateur certifié Zaptec depuis novembre 2026 et pose aussi les bornes Alfen et Hager. Tout est compris, de A à Z : le câble, les protections dans le tableau, la pose et le réglage de la borne, puis le contrôle par un organisme agréé.";

// Non publiées (document) : « Mon compteur est triphasé sans neutre » [à confirmer 10]
// et « La borne fonctionne-t-elle avec des panneaux solaires ? » [à confirmer 5].
const faqs = [
  {
    question: "Combien coûte l'installation d'une borne de recharge à domicile ?",
    answer: `Chez Le Cuivre Électrique, une borne Zaptec fournie et posée coûte de ${PRIX_ZAPTEC} TVA comprise, et une borne Alfen de ${PRIX_ALFEN}. Ce prix comprend le câble, les protections, les réglages et le contrôle par un organisme agréé. Ce sont des prix indicatifs, avec la TVA à 6 % pour un logement de plus de 10 ans.`,
  },
  {
    question: "Quelle puissance choisir : 7,4, 11 ou 22 kW ?",
    answer:
      "Cela dépend de votre compteur et de votre voiture. Avec un compteur monophasé, la borne charge jusqu'à 7,4 kW, soit environ 40 km d'autonomie par heure de charge : c'est suffisant pour une charge de nuit. Avec un compteur triphasé, 11 kW conviennent à la plupart des voitures ; 22 kW ne servent que si la voiture et le compteur le permettent.",
  },
  {
    question: "Combien de temps dure la pose ?",
    answer:
      "Une journée dans la plupart des maisons. Le contrôle par l'organisme agréé a lieu quelques jours plus tard, en notre présence.",
  },
  {
    question: "Faut-il faire contrôler une borne de recharge ?",
    answer:
      "Oui. Une borne ajoute un circuit à votre installation électrique, et ce circuit doit être contrôlé par un organisme agréé. Chez nous, le contrôle est compris dans le prix : schémas, convocation de l'organisme, redevance et présence sur place.",
  },
  {
    question: "Faut-il déclarer sa borne de recharge ?",
    answer:
      "Oui. Toute borne doit être déclarée au gestionnaire de réseau : ORES dans la plupart des communes wallonnes, Sibelga à Bruxelles. La déclaration se fait en ligne avec votre code EAN, et nous vous envoyons les informations techniques de la borne. En Wallonie, l'amende prévue en cas d'oubli est d'au moins 250 €.",
  },
  {
    question: "Peut-on remplacer une borne Shell ou la borne d'une ancienne voiture de société ?",
    answer:
      "Oui. Nous retirons l'ancienne borne et nous posons la vôtre à la place, en réutilisant le raccordement quand c'est possible. Vous rechargez ensuite avec votre propre électricité, sans abonnement.",
  },
  {
    question: "J'ai déjà acheté ma borne. Pouvez-vous la poser ?",
    answer: `Oui. La pose coûte de ${PRIX_POSE_SEULE} TVA comprise, contrôle compris. Nous vérifions d'abord la fiche technique du modèle. La borne reste couverte par la garantie de son vendeur ; notre garantie porte sur la pose et les raccordements.`,
  },
  {
    question: "Existe-t-il une prime pour une borne de recharge ?",
    answer:
      "Non. Il n'existe plus de prime ni de réduction d'impôt pour une borne à domicile : la réduction d'impôt fédérale s'est arrêtée le 31 août 2024. Il reste la TVA à 6 % pour un logement de plus de 10 ans.",
  },
  {
    question: "Ma voiture est-elle compatible ?",
    answer:
      "Oui. Toutes les voitures électriques et hybrides rechargeables récentes vendues en Europe utilisent la même prise, dite « Type 2 ». Pour un modèle plus ancien, un câble adapté suffit.",
  },
  {
    question: "Posez-vous des bornes à Bruxelles ?",
    answer:
      "Oui. Le Cuivre Électrique pose des bornes de recharge dans les 19 communes de Bruxelles, chez les clients qui ont un garage ou une place de parking privée.",
  },
  {
    question: "Qui pose la borne ?",
    answer:
      "Le Cuivre Électrique, l'entreprise d'Adrian Mitric, électricien indépendant à Court-Saint-Étienne et installateur certifié Zaptec depuis novembre 2026. Adrian est votre seul interlocuteur, du devis au contrôle.",
  },
];

// ---------------------------------------------------------------------------
// Petits composants de mise en forme, propres à cette page
// ---------------------------------------------------------------------------

const H2 = ({ id, children }: { id?: string; children: ReactNode }) => (
  <h2
    id={id}
    className="font-display text-2xl md:text-3xl font-bold text-foreground mt-14 mb-6 scroll-mt-28"
  >
    {children}
  </h2>
);

const H3 = ({ children }: { children: ReactNode }) => (
  <h3 className="font-display text-xl font-bold text-foreground mt-8 mb-3">{children}</h3>
);

const P = ({ children }: { children: ReactNode }) => (
  <p className="text-muted-foreground leading-relaxed mb-4">{children}</p>
);

const Puces = ({ items }: { items: ReactNode[] }) => (
  <ul className="space-y-3 text-foreground mb-6">
    {items.map((item, i) => (
      <li key={i} className="flex items-start gap-3">
        <span className="mt-2 w-2 h-2 rounded-full bg-primary shrink-0" />
        <span className="leading-relaxed">{item}</span>
      </li>
    ))}
  </ul>
);

const Etapes = ({ items }: { items: ReactNode[] }) => (
  <ol className="space-y-4 text-foreground mb-6">
    {items.map((item, i) => (
      <li key={i} className="flex gap-4">
        <span className="shrink-0 w-9 h-9 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center">
          {i + 1}
        </span>
        <span className="leading-relaxed pt-1">{item}</span>
      </li>
    ))}
  </ol>
);

/** Vrai tableau HTML ; défile sur le côté si l'écran est trop étroit. */
const Tableau = ({ entetes, lignes }: { entetes: string[]; lignes: ReactNode[][] }) => (
  <div className="overflow-x-auto mb-6 rounded-2xl border border-border/60">
    <table className="w-full min-w-[560px] border-collapse text-left text-sm md:text-base">
      <thead className="bg-card">
        <tr>
          {entetes.map((e) => (
            <th key={e} scope="col" className="px-4 py-3 font-semibold text-foreground">
              {e}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {lignes.map((ligne, i) => (
          <tr key={i} className="border-t border-border/60 align-top">
            {ligne.map((cellule, j) =>
              j === 0 ? (
                <th key={j} scope="row" className="px-4 py-3 font-semibold text-foreground">
                  {cellule}
                </th>
              ) : (
                <td key={j} className="px-4 py-3 text-muted-foreground leading-relaxed">
                  {cellule}
                </td>
              ),
            )}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const lien = "font-semibold text-primary underline underline-offset-4 hover:no-underline";

const Commune = ({ href, children }: { href: string; children: ReactNode }) => (
  <Link to={href} className={lien}>
    {children}
  </Link>
);

// ---------------------------------------------------------------------------

const BornesDeRecharge = () => {
  const { data: rating } = useDisplayRating();

  // Compteur anonyme : chaque clic sur un lien WhatsApp ou téléphone de cette
  // page (boutons du haut, bloc final, menu, pied de page, bouton flottant)
  // ajoute 1 au compteur du jour. Rien n'est déposé sur l'appareil et rien
  // n'est envoyé sur la personne : voir src/lib/compteur.ts.
  useEffect(() => {
    const surClic = (e: MouseEvent) => {
      const lienClique = (e.target as Element | null)?.closest?.("a[href]");
      const action = actionDuLien(lienClique?.getAttribute("href"));
      if (action) compterClic("bornes", action);
    };
    document.addEventListener("click", surClic);
    return () => document.removeEventListener("click", surClic);
  }, []);
  const noteGoogle = `Note Google : ${rating.ratingValueFormatted} sur 5, sur ${rating.reviewCount} avis.`;

  // « Nos dernières bornes » : les deux fiches citées dans le texte, dans cet ordre.
  const bornesRecentes = [
    "borne-recharge-zaptec-court-saint-etienne",
    "borne-recharge-alfen-dinant",
  ]
    .map((slug) => realisationsPourService(SLUG).find((p) => p.slug === slug))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <ServicePageLayout
      slug={SLUG}
      breadcrumbLabel="Bornes de recharge"
      seoTitle="Borne de recharge Brabant wallon – Installateur certifié Zaptec"
      seoDescription="Borne de recharge Zaptec, Alfen ou Hager posée de A à Z en Brabant wallon, province de Namur et Bruxelles. Contrôle compris, devis gratuit sous 48 h."
      seoKeywords="borne de recharge, borne de recharge Brabant wallon, installateur certifié Zaptec, Zaptec Go 2, Alfen Eve, Hager Witty, borne voiture électrique, Namur, Bruxelles"
      schemaServiceName="Installation de bornes de recharge"
      schemaServiceDescription={INTRO}
      schemaRegions={["Brabant wallon", "Province de Namur", "Région de Bruxelles-Capitale"]}
      hero={{
        eyebrow: "Bornes de recharge",
        h1: "Installation de bornes de recharge, de A à Z",
        sousTitre: "Installateur certifié Zaptec · Brabant wallon, province de Namur et Bruxelles",
        intro: INTRO,
        points: [
          "Installateur certifié Zaptec. Bornes Zaptec, Alfen et Hager, ou la vôtre.",
          "Tout est compris pour une installation standard, contrôle par un organisme agréé compris.",
          "Réponse sous 24 h, devis gratuit sous 48 h, le plus souvent sur simples photos.",
          "Pose en une journée dans la plupart des maisons.",
          noteGoogle,
        ],
        boutons: {
          devis: "Envoyer mes photos pour un devis",
          devisWhatsapp: WHATSAPP_PHOTOS,
          formulaire: "Ou par le formulaire",
          simulateur: "Estimer mon prix en 1 minute",
          appel: "Appeler le 0485 75 52 27",
        },
      }}
      simulateurCta="borne"
      faqs={faqs}
      piedDePage={
        <>
          {/* Pourquoi nous faire confiance */}
          <section className="py-12 md:py-16">
            <div className="container mx-auto">
              <div className="max-w-4xl mx-auto">
                <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-6">
                  Pourquoi nous faire confiance
                </h2>
                {/* Non publié : nombre de bornes posées depuis 2023 [à confirmer 11].
                    À ajouter quand Adrian les choisit : deux ou trois avis qui
                    parlent d'une borne. */}
                <div className="flex flex-col md:flex-row md:items-start gap-8">
                <div className="min-w-0 flex-1">
                <Puces
                  items={[
                    "Installateur certifié Zaptec : certification de la Zaptec Academy obtenue le 2 novembre 2026.",
                    <>
                      {noteGoogle}{" "}
                      <Link to="/avis" className={lien}>
                        Lire les avis
                      </Link>
                    </>,
                    "Électricien indépendant à Court-Saint-Étienne depuis 2023. TVA BE 0805 376 944.",
                  ]}
                />
                </div>
                <figure className="shrink-0 w-[180px] mx-auto md:mx-0">
                  <a
                    href={certificatZaptec}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Agrandir le certificat Zaptec d'Adrian Mitric"
                    className="block rounded-xl overflow-hidden border border-border/60 bg-white shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    <img
                      src={certificatZaptecVignette}
                      alt="Certificat Zaptec d'Adrian Mitric – formation technique Zaptec réussie"
                      width={180}
                      height={254}
                      loading="lazy"
                      decoding="async"
                      className="block w-full h-auto"
                    />
                  </a>
                  <figcaption className="mt-3 text-sm text-muted-foreground leading-relaxed text-center">
                    Certification Zaptec obtenue le 2 novembre 2026 (Zaptec Academy).{" "}
                    <span className="text-xs">Cliquez sur l'image pour l'agrandir.</span>
                  </figcaption>
                </figure>
                </div>
              </div>
            </div>
          </section>

          {/* Nos dernières bornes — snapshot du build, lisible sans JavaScript */}
          <RealisationsLiees items={bornesRecentes} titre="Nos dernières bornes" max={2} />

          {/* Bloc final */}
          <section className="py-16 md:py-20">
            <div className="container mx-auto">
              <div className="max-w-3xl mx-auto bg-gradient-copper rounded-3xl p-8 md:p-14 shadow-copper-lg text-primary-foreground">
                <h2 className="font-display text-2xl md:text-4xl font-bold mb-4">
                  Quatre photos, et vous recevez votre devis sous 48 h
                </h2>
                <p className="text-lg mb-5">
                  Envoyez-nous par WhatsApp au 0485 75 52 27, ou par le formulaire :
                </p>
                <ol className="list-decimal pl-6 space-y-2 mb-6 text-lg">
                  <li>une photo de votre compteur ;</li>
                  <li>une photo de votre tableau, porte ouverte ;</li>
                  <li>une photo de l'endroit où vous voulez la borne ;</li>
                  <li>une photo du trajet entre le tableau et la borne.</li>
                </ol>
                <p className="mb-8">
                  Ajoutez la marque de votre voiture, votre commune et l'âge de la maison (plus
                  ou moins de 10 ans). Réponse sous 24 h, devis gratuit sous 48 h.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button size="lg" variant="secondary" asChild>
                    <a
                      href={WHATSAPP_PHOTOS}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-analytics="whatsapp_click"
                      className="flex items-center gap-2"
                    >
                      <MessageCircle className="w-5 h-5" />
                      Envoyer mes photos par WhatsApp
                    </a>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    asChild
                    className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
                  >
                    <Link to="/contact" data-analytics="quote_request">
                      Envoyer mes photos par le formulaire
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </Button>
                </div>
              </div>
              <p className="max-w-3xl mx-auto mt-6 text-center text-sm text-muted-foreground">
                Page mise à jour le {MISE_A_JOUR}.
              </p>
            </div>
          </section>
        </>
      }
    >
      {/* ===== Ce qui est compris, de A à Z ===== */}
      <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-6">
        Ce qui est compris, de A à Z
      </h2>
      <P>
        Une borne posée par Le Cuivre Électrique est prête à l'emploi : vous n'avez rien d'autre
        à commander ni à coordonner.
      </P>
      <Etapes
        items={[
          <>
            <strong>L'étude de votre installation.</strong> Sur photos ou sur place : votre
            compteur, votre tableau, l'emplacement de la borne et la puissance possible.
          </>,
          <>
            <strong>Le câble entre le tableau et la borne</strong>, posé proprement sous tube.
            Nous tirons en même temps les câbles de communication pour vos futurs équipements
            (compteur digital, panneaux solaires).
          </>,
          <>
            <strong>Les protections dans le tableau</strong> : un différentiel et un disjoncteur
            réservés à la borne, ou un petit coffret dédié si le tableau est plein. Avec une
            borne Zaptec, nous posons aussi le module qui fait ralentir la borne quand la maison
            consomme beaucoup.
          </>,
          <>
            <strong>La pose de la borne et ses réglages</strong> : puissance réglée selon votre
            compteur, application installée sur votre téléphone, charge programmée sur les heures
            creuses quand la borne le permet, essai de charge avec votre voiture.
          </>,
          <>
            <strong>Le dossier et le contrôle</strong> : schémas mis à jour, passage de
            l'organisme agréé (redevance comprise) et notre présence le jour du contrôle.
          </>,
          <>
            <strong>Les explications avant de partir</strong> : comment lancer, arrêter et suivre
            une charge.
          </>,
        ]}
      />
      <P>
        <strong className="text-foreground">
          Une seule démarche reste à votre nom : la déclaration au gestionnaire de réseau.
        </strong>{" "}
        Toute borne doit être déclarée au gestionnaire de réseau : ORES dans la plupart des
        communes wallonnes, Sibelga à Bruxelles. Cela se fait en ligne, en quelques minutes, avec
        votre code EAN, qui figure sur votre facture d'électricité. Nous vous envoyons le reste
        par mail : numéro de série, puissance et date de mise en service de la borne.
      </P>
      <P>
        <strong className="text-foreground">
          Ce qui est chiffré à part, seulement si c'est nécessaire :
        </strong>{" "}
        une tranchée dans le jardin, le remplacement d'un tableau trop ancien, le renforcement du
        compteur (c'est le gestionnaire de réseau qui le fait et le facture). Vous le savez avant
        de signer : tout est écrit dans le devis.
      </P>

      {/* ===== Quelle borne choisir ? ===== */}
      <H2>Quelle borne choisir ?</H2>
      <P>
        Zaptec est notre premier choix pour une maison, Alfen le haut de gamme, Hager la borne de
        nos chantiers à plusieurs bornes. Nous posons aussi la borne que vous avez déjà achetée.
      </P>
      <Tableau
        entetes={["Borne", "Pour qui", "Ce qu'elle a de particulier"]}
        lignes={[
          [
            "Zaptec Go 2",
            "La plupart des maisons",
            "Petite (24 × 18 cm), simple, compteur certifié avec écran, pilotée depuis le téléphone. Conçue et fabriquée en Norvège.",
          ],
          [
            "Alfen Eve",
            "Qui veut le haut de gamme",
            "Câble attaché : on se gare, on branche. Écran de suivi et badge. Fabriquée aux Pays-Bas.",
          ],
          [
            "Hager Witty",
            "Lotissement, copropriété, entreprise",
            // Document : « Borne robuste, déjà posée par nos soins en série de quatre
            // dans un lotissement du Brabant wallon (2026). » [à confirmer 14] — non
            // publié. En attendant : la formule de l'introduction, qui est confirmée.
            "La borne de nos chantiers à plusieurs bornes.",
          ],
          [
            "Votre borne",
            "Vous l'avez déjà achetée",
            "Wallbox ou autre marque : nous vérifions sa fiche technique, puis nous la posons.",
          ],
        ]}
      />

      <H3>Zaptec Go 2, notre premier choix</H3>
      {/* Non publié [à confirmer 13] : « Elle a une prise : vous y branchez le câble de
          votre voiture, que vous pouvez laisser verrouillé sur la borne. » */}
      <P>
        La Zaptec Go 2 charge jusqu'à 22 kW, selon ce que permet votre compteur. Son compteur
        certifié et son petit écran montrent exactement ce que la voiture a consommé. Elle se
        règle et se suit depuis une application, et se met à jour toute seule. Son matériel est
        déjà prévu pour la recharge dans les deux sens (la voiture qui alimente la maison), une
        fonction que Zaptec annonce pour plus tard. Adrian Mitric a suivi la formation de Zaptec
        et obtenu sa certification le 2 novembre 2026.
      </P>

      <H3>Le module qui évite de faire sauter le compteur</H3>
      <P>
        Un petit module placé dans le tableau mesure ce que la maison consomme. Quand le four, la
        plaque de cuisson ou la pompe à chaleur tournent, la borne ralentit toute seule. Quand la
        maison est calme, elle charge plus vite. Ce module est compris avec chaque borne Zaptec
        que nous posons.
      </P>

      <H3>Alfen Eve, le haut de gamme</H3>
      <P>
        Une borne fabriquée aux Pays-Bas, fiable et suivie dans le temps. Nous la posons le plus
        souvent avec le câble attaché : on se gare, on branche, c'est tout. Écran de suivi, badge
        pour démarrer la charge, compteur d'énergie intégré.
      </P>

      <H3>Vous avez déjà acheté votre borne ?</H3>
      <P>
        Nous l'installons aussi. Envoyez-nous la marque et le modèle exact : nous vérifions sa
        fiche technique avant de chiffrer, car certaines bornes demandent une protection
        supplémentaire dans le tableau. La borne reste couverte par la garantie de son vendeur ;
        notre garantie porte sur la pose et les raccordements.
      </P>

      {/* ===== Combien coûte une borne de recharge posée ? ===== */}
      <H2 id="prix">Combien coûte une borne de recharge posée ?</H2>
      <P>
        Une borne fournie et posée par Le Cuivre Électrique coûte en général entre{" "}
        {nombre(BORNE.zaptec.min)} et {nombre(BORNE.alfen.max)} € TVA comprise, contrôle par
        l'organisme agréé compris.
      </P>
      <Tableau
        entetes={["Votre demande", "Prix indicatif, TVA comprise", "Ce qui est compris"]}
        lignes={[
          [
            "Borne Zaptec Go 2 fournie et posée",
            PRIX_ZAPTEC,
            "Borne, module d'équilibrage, câble depuis le tableau, protections, réglages, dossier et contrôle",
          ],
          [
            "Borne Alfen Eve fournie et posée",
            PRIX_ALFEN,
            "Borne avec câble attaché, câble depuis le tableau, protections, réglages, dossier et contrôle",
          ],
          [
            "Pose de votre propre borne",
            PRIX_POSE_SEULE,
            "Câble depuis le tableau, protections, pose, réglages, dossier et contrôle. La borne n'est pas comprise.",
          ],
          [
            "Remplacement d'une borne existante",
            "Sur devis, d'après vos photos",
            "Souvent moins cher : le câble est déjà là.",
          ],
          [
            "Plusieurs bornes, copropriété, entreprise, tranchée",
            "Sur devis",
            "Visite sur place et devis gratuits",
          ],
        ]}
      />
      <P>
        Ces prix sont calculés avec la TVA à 6 %, pour un logement de plus de 10 ans. Pour un
        logement plus récent, la TVA est de 21 % : comptez environ 14 % de plus. Le prix exact
        est celui du devis, gratuit et valable 15 jours. Prix indicatifs au {MISE_A_JOUR}.
      </P>

      <H3>Ce qui fait varier le prix</H3>
      <Puces
        items={[
          "La distance entre votre tableau et la borne.",
          "La façon de passer le câble : en apparent dans un garage, à travers un mur, ou en tranchée dans le jardin.",
          "La place libre dans votre tableau.",
          "Votre compteur, monophasé ou triphasé, et la puissance souhaitée.",
          "La borne choisie : Zaptec ou Alfen.",
          "L'âge du logement, qui décide de la TVA.",
        ]}
      />

      <H3>Primes et impôts</H3>
      <P>
        Il n'existe plus de prime ni de réduction d'impôt pour une borne à domicile : la
        réduction d'impôt fédérale s'est arrêtée le 31 août 2024. Il reste la TVA à 6 % pour un
        logement de plus de 10 ans. Ces règles changent : nous les vérifions avec vous au moment
        du devis.
      </P>

      <aside className="my-10 rounded-3xl border-2 border-primary/40 bg-primary/[0.05] p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center gap-5">
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-xl md:text-2xl font-bold text-foreground mb-1">
              Estimez votre prix en une minute
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Notre simulateur pose {NB_QUESTIONS.borne === 5 ? "cinq" : NB_QUESTIONS.borne}{" "}
              questions et affiche une estimation poste par poste.
            </p>
          </div>
          <Button variant="copper" size="lg" asChild className="shrink-0 w-full md:w-auto">
            <Link to="/simulateur?besoin=borne">
              Lancer le simulateur
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </aside>

      {/* ===== Comment ça se passe ? ===== */}
      <H2>Comment ça se passe ?</H2>
      <P>
        De votre premier message à la première charge, il y a cinq étapes et un seul
        interlocuteur : Adrian Mitric.
      </P>
      <Etapes
        items={[
          <>
            <strong>Vous envoyez quatre photos</strong> : le compteur, le tableau porte ouverte,
            l'endroit prévu pour la borne et le trajet entre les deux. Par WhatsApp ou par le
            formulaire.
          </>,
          <>
            <strong>Vous recevez une réponse sous 24 h et un devis gratuit sous 48 h.</strong> Si
            l'installation est particulière (tranchée, copropriété, tableau ancien), nous passons
            d'abord sur place, gratuitement.
          </>,
          <>
            <strong>Nous posons la borne.</strong> Câble, protections, borne, réglages, essai
            avec votre voiture : une journée dans la plupart des maisons.
          </>,
          <>
            <strong>L'organisme agréé contrôle l'installation</strong>, quelques jours plus tard.
            Nous sommes présents. Vous recevez le rapport de contrôle et les schémas à jour.
          </>,
          <>
            <strong>Vous déclarez la borne à votre gestionnaire de réseau</strong>, avec les
            informations que nous vous envoyons par mail.
          </>,
        ]}
      />

      {/* ===== Votre situation ===== */}
      <H2>Votre situation</H2>

      <H3>Remplacer une borne liée à un fournisseur ou à une ancienne voiture de société</H3>
      <P>
        Vous avez une borne Shell, ou une borne liée à une carte carburant ou à un abonnement ?
        Nous la retirons et nous posons la vôtre à la place, en réutilisant le raccordement quand
        c'est possible. Vous rechargez ensuite avec votre propre électricité, sans abonnement.
        Exemple :{" "}
        <Link to="/realisations/borne-recharge-zaptec-court-saint-etienne" className={lien}>
          remplacement d'une borne Shell par une Zaptec à Court-Saint-Étienne
        </Link>
        .
      </P>

      <H3>Voiture de société</H3>
      {/* Non publié [à confirmer 7] : « Dites-nous avec quel service votre employeur
          travaille : nous réglons la borne pour qu'elle y soit reliée. » */}
      <P>
        La Zaptec Go 2 compte chaque kWh chargé avec un compteur certifié : c'est ce que
        demandent les employeurs et les sociétés de leasing pour rembourser l'électricité de la
        voiture. Si la borne est payée par votre société, le taux de TVA est confirmé avec vous
        au devis.
      </P>

      <H3>Appartement, copropriété, lotissement</H3>
      {/* Non publié [à confirmer 14] : « Référence : quatre bornes Hager posées en 2026
          dans un lotissement du Brabant wallon, chacune avec son petit tableau. » */}
      <P>
        Chaque immeuble est différent : accord de la copropriété, compteur privé ou commun,
        distance jusqu'au parking. Nous passons sur place gratuitement et nous remettons un devis
        clair, à présenter à votre syndic.
      </P>

      <H3>Entreprise, commerce, profession libérale</H3>
      <P>
        Une ou plusieurs bornes pour vos véhicules, votre personnel ou vos clients. En Wallonie,
        certains parkings de plus de 20 places doivent avoir un point de recharge depuis le
        1er janvier 2025 : nous regardons avec vous si vous êtes concerné.
      </P>

      {/* Non publié : « Panneaux solaires » [à confirmer 5]. */}

      <H3>Heures creuses</H3>
      <P>
        En Wallonie, depuis le 1er janvier 2026, les heures creuses du tarif bihoraire vont de
        22 h à 7 h et de 11 h à 17 h, tous les jours, week-end compris. Quand la borne le permet,
        c'est le cas de la Zaptec, nous la programmons pour charger pendant ces heures.
      </P>

      <H3>Compteur monophasé ou peu puissant</H3>
      <P>
        La borne s'adapte à votre compteur : nous réglons sa puissance pour ne jamais le
        dépasser. Si vous voulez charger plus vite, le renforcement du compteur se demande au
        gestionnaire de réseau. Nous vous disons d'abord si cela vaut la peine.
      </P>

      <H3>Tableau ancien ou plein</H3>
      <P>
        Nous posons un petit coffret réservé à la borne, à côté de votre tableau. Si le tableau
        doit être remplacé, c'est un devis séparé : voir{" "}
        <Link to="/services/mise-en-conformite-rgie" className={lien}>
          mise en conformité et tableaux
        </Link>
        .
      </P>

      {/* Non publié : « Vous roulez peu ? » [à confirmer 9]. */}

      {/* ===== Où nous posons des bornes ===== */}
      <H2>Où nous posons des bornes</H2>
      <P>
        Le Cuivre Électrique pose des bornes de recharge dans tout le Brabant wallon, en province
        de Namur et à Bruxelles, au départ de Court-Saint-Étienne.
      </P>
      <Tableau
        entetes={["Zone", "Communes"]}
        lignes={[
          [
            <>
              Autour de{" "}
              <Commune href="/electricien-court-saint-etienne">Court-Saint-Étienne</Commune>
            </>,
            <>
              <Commune href="/electricien-ottignies-louvain-la-neuve">
                Ottignies-Louvain-la-Neuve
              </Commune>
              , Mont-Saint-Guibert, <Commune href="/electricien-genappe">Genappe</Commune>,
              Chastre, Villers-la-Ville, Bousval, Céroux-Mousty
            </>,
          ],
          [
            "Brabant wallon",
            <>
              <Commune href="/electricien-wavre">Wavre</Commune>, Rixensart, Lasne, Waterloo,
              Braine-l'Alleud, <Commune href="/electricien-nivelles">Nivelles</Commune>,
              Grez-Doiceau, Chaumont-Gistoux, Walhain, Jodoigne
            </>,
          ],
          ["Province de Namur", "Gembloux, Namur, Dinant"],
          [
            "Bruxelles",
            "Les 19 communes, chez les clients qui ont un garage ou une place de parking privée",
          ],
        ]}
      />
      <P>Votre commune n'est pas dans la liste ? Demandez-nous : nous répondons sous 24 h.</P>
    </ServicePageLayout>
  );
};

export default BornesDeRecharge;
