import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import SEO from "@/components/SEO";
import Breadcrumbs from "@/components/Breadcrumbs";

const sections = [
  {
    title: "1. Responsable du traitement",
    body: (
      <ul className="space-y-2">
        <li><strong className="text-foreground">Responsable :</strong> Adrian Mitric (Le Cuivre Électrique), indépendant personne physique</li>
        <li><strong className="text-foreground">Siège :</strong> 1490 Court-Saint-Étienne, Belgique</li>
        <li><strong className="text-foreground">N° BCE / TVA :</strong> BE 0805.376.944</li>
        <li><strong className="text-foreground">Email RGPD :</strong> contact@cuivre-electrique.com</li>
      </ul>
    ),
  },
  {
    title: "2. Données collectées",
    body: (
      <>
        <p className="mb-4">
          Nous collectons uniquement les données strictement nécessaires aux
          finalités décrites ci-dessous :
        </p>
        <ul className="list-disc list-inside space-y-2">
          <li><strong className="text-foreground">Identification :</strong> nom, prénom</li>
          <li><strong className="text-foreground">Coordonnées :</strong> email, téléphone, adresse du chantier</li>
          <li><strong className="text-foreground">Projet :</strong> type de demande, photos éventuelles, message libre</li>
          <li><strong className="text-foreground">Statistiques web (avec votre consentement) :</strong> pages visitées, source de trafic, type d'appareil — via Google Analytics 4 et Google Ads en mode anonymisé</li>
          <li><strong className="text-foreground">Cookies :</strong> voir la section dédiée plus bas</li>
        </ul>
      </>
    ),
  },
  {
    title: "2 bis. Simulateur de prix",
    body: (
      <>
        <p className="mb-4">
          Le simulateur accessible sur{" "}
          <strong className="text-foreground">/simulateur</strong> est un outil
          d'estimation. Le calcul de la fourchette se fait{" "}
          <strong className="text-foreground">entièrement dans votre navigateur</strong> :
          tant que vous ne validez pas le formulaire, aucune de vos réponses ne
          nous est transmise.
        </p>
        <ul className="list-disc list-inside space-y-2 mb-4">
          <li>
            <strong className="text-foreground">Données collectées :</strong> nom et
            prénom, numéro de GSM (obligatoire), adresse email (facultative), vos
            réponses aux quatre questions, la fourchette qui vous a été affichée,
            et la photo de tableau électrique si vous choisissez d'en joindre une
          </li>
          <li>
            <strong className="text-foreground">Finalité :</strong> vous recontacter
            au sujet de cette demande d'estimation et préparer un devis — base
            légale : mesures précontractuelles (RGPD art. 6.1.b)
          </li>
          <li>
            <strong className="text-foreground">Durée de conservation :</strong> 12
            mois en l'absence de suite, alignée sur les demandes de devis. Au-delà,
            la demande est supprimée
          </li>
          <li>
            <strong className="text-foreground">Photo du tableau :</strong> stockée
            de façon privée, jamais publiée, jamais accessible publiquement, et
            consultable uniquement par Le Cuivre Électrique
          </li>
        </ul>
        <p>
          Vos données ne sont ni revendues, ni transmises à des plateformes de
          mise en relation. Vous pouvez demander leur suppression à tout moment en
          écrivant à{" "}
          <a
            href="mailto:contact@cuivre-electrique.com"
            className="text-primary hover:underline"
          >
            contact@cuivre-electrique.com
          </a>
          , sans avoir à vous justifier.
        </p>
      </>
    ),
  },
  {
    title: "3. Finalités et bases légales",
    body: (
      <ul className="list-disc list-inside space-y-3">
        <li>
          <strong className="text-foreground">Répondre à vos demandes de devis et exécuter le contrat</strong> —
          base légale : exécution d'un contrat ou mesures précontractuelles (RGPD art. 6.1.b)
        </li>
        <li>
          <strong className="text-foreground">Facturation et obligations comptables / fiscales</strong> —
          base légale : obligation légale (RGPD art. 6.1.c, conservation 7 ans en droit belge)
        </li>
        <li>
          <strong className="text-foreground">Mesure d'audience et amélioration du site</strong> —
          base légale : consentement (RGPD art. 6.1.a), recueilli via le bandeau cookies
        </li>
        <li>
          <strong className="text-foreground">Gestion d'éventuels litiges</strong> —
          base légale : intérêt légitime du responsable (RGPD art. 6.1.f)
        </li>
      </ul>
    ),
  },
  {
    title: "4. Durée de conservation",
    body: (
      <ul className="list-disc list-inside space-y-2">
        <li><strong className="text-foreground">Demande de devis sans suite :</strong> 12 mois</li>
        <li><strong className="text-foreground">Client actif :</strong> durée de la relation contractuelle + 7 ans (obligation comptable)</li>
        <li><strong className="text-foreground">Photos de chantier :</strong> 7 ans (preuve de l'intervention)</li>
        <li><strong className="text-foreground">Cookies analytiques :</strong> 13 mois maximum (recommandation CNIL/APD)</li>
        <li><strong className="text-foreground">Logs techniques d'hébergement :</strong> 12 mois</li>
      </ul>
    ),
  },
  {
    title: "5. Destinataires et sous-traitants",
    body: (
      <>
        <p className="mb-4">
          Vos données sont accessibles uniquement à Adrian Mitric et aux
          sous-traitants techniques strictement nécessaires :
        </p>
        <ul className="list-disc list-inside space-y-2">
          <li><strong className="text-foreground">Cloudflare Pages</strong> (hébergement du site, USA — clauses contractuelles types)</li>
          <li><strong className="text-foreground">Supabase</strong> (base de données et stockage photos, UE)</li>
          <li><strong className="text-foreground">EmailJS</strong> (envoi des emails de notification de devis, USA — clauses contractuelles types)</li>
          <li><strong className="text-foreground">Google Analytics 4 / Google Ads</strong> (mesure d'audience anonymisée, avec votre consentement)</li>
        </ul>
        <p className="mt-4">
          Aucune donnée n'est revendue ni cédée à des tiers à des fins commerciales.
        </p>
      </>
    ),
  },
  {
    title: "6. Transferts hors Union européenne",
    body: (
      <p>
        Certains sous-traitants (Cloudflare, EmailJS, Google) sont situés aux
        États-Unis. Les transferts sont encadrés par les clauses contractuelles
        types adoptées par la Commission européenne et, lorsque applicable, par
        les certifications « EU-US Data Privacy Framework ». Vous pouvez nous
        demander une copie des garanties mises en place.
      </p>
    ),
  },
  {
    title: "7. Vos droits",
    body: (
      <>
        <p className="mb-4">
          Conformément aux articles 15 à 22 du RGPD, vous disposez à tout moment
          des droits suivants :
        </p>
        <ul className="list-disc list-inside space-y-2 mb-4">
          <li>Droit d'accès, de rectification et d'effacement</li>
          <li>Droit à la limitation et à l'opposition au traitement</li>
          <li>Droit à la portabilité des données</li>
          <li>Droit de retirer votre consentement à tout moment (sans effet rétroactif)</li>
          <li>Droit d'introduire une réclamation auprès de l'Autorité de Protection des Données :
            {" "}<a href="https://www.autoriteprotectiondonnees.be" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">autoriteprotectiondonnees.be</a></li>
        </ul>
        <p>
          Pour exercer ces droits, écrivez-nous à{" "}
          <a href="mailto:contact@cuivre-electrique.com" className="text-primary hover:underline">
            contact@cuivre-electrique.com
          </a>
          . Nous répondons dans un délai d'un mois maximum.
        </p>
      </>
    ),
  },
  {
    title: "8. Cookies",
    body: (
      <>
        <p className="mb-4">
          Le site utilise trois familles de cookies :
        </p>
        <ul className="list-disc list-inside space-y-2 mb-4">
          <li><strong className="text-foreground">Strictement nécessaires</strong> — fonctionnement du site (sans consentement requis)</li>
          <li><strong className="text-foreground">Mesure d'audience</strong> — Google Analytics 4 (consentement requis)</li>
          <li><strong className="text-foreground">Marketing</strong> — Google Ads (consentement requis)</li>
        </ul>
        <p>
          Vous pouvez à tout moment modifier vos choix via le bouton « Gérer mes
          cookies » présent dans le pied de page. Le mode « Consent Mode v2 » de
          Google est appliqué : tant que vous n'avez pas consenti, aucune donnée
          publicitaire ni analytique n'est transmise.
        </p>
      </>
    ),
  },
  {
    title: "9. Sécurité",
    body: (
      <p>
        Les données sont stockées sur des serveurs sécurisés au sein de l'Union
        européenne (Supabase) ou couverts par les clauses contractuelles types.
        Les transferts sont chiffrés en TLS 1.2+. L'accès aux données est limité
        au responsable du traitement.
      </p>
    ),
  },
  {
    title: "10. Modification de la politique",
    body: (
      <p>
        Cette politique peut être mise à jour pour refléter les évolutions
        légales ou techniques. La date de dernière mise à jour est indiquée en
        haut de page. En cas de modification substantielle, nous vous en
        informerons via le bandeau cookies ou par email.
      </p>
    ),
  },
];

const Confidentialite = () => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SEO
        title="Politique de confidentialité | Le Cuivre Électrique"
        description="Politique de confidentialité du Cuivre Électrique : données collectées, finalités, durée de conservation, droits RGPD et cookies."
        canonical="https://cuivre-electrique.com/confidentialite"
        noindex={true}
      />
      <Header />
      <main className="pt-24">
        <section className="py-16 md:py-24">
          <div className="container mx-auto max-w-4xl px-4">
            <Breadcrumbs items={[{ label: "Politique de confidentialité", href: "/confidentialite" }]} />
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-3">
              Politique de confidentialité
            </h1>
            <p className="text-sm text-muted-foreground mb-10">
              Dernière mise à jour : 1<sup>er</sup> mai 2026
            </p>

            <div className="space-y-6 text-muted-foreground">
              {sections.map((s) => (
                <div
                  key={s.title}
                  className="bg-card border border-border/50 rounded-2xl p-6 md:p-8"
                >
                  <h2 className="font-display text-xl md:text-2xl font-bold text-foreground mb-4">
                    {s.title}
                  </h2>
                  <div className="leading-relaxed">{s.body}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Confidentialite;
