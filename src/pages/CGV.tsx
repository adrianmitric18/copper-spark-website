import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import SEO from "@/components/SEO";
import Breadcrumbs from "@/components/Breadcrumbs";

const sections = [
  {
    title: "1. Identité du prestataire",
    body: (
      <ul className="space-y-2">
        <li><strong className="text-foreground">Prestataire :</strong> Adrian Mitric, indépendant personne physique, exerçant sous l'enseigne « Le Cuivre Électrique »</li>
        <li><strong className="text-foreground">Siège :</strong> 1490 Court-Saint-Étienne, Belgique</li>
        <li><strong className="text-foreground">N° BCE / TVA :</strong> BE 0805.376.944</li>
        <li><strong className="text-foreground">Téléphone :</strong> +32 485 75 52 27</li>
        <li><strong className="text-foreground">Email :</strong> contact@cuivre-electrique.com</li>
        <li><strong className="text-foreground">Activité :</strong> installation électrique, mise en conformité RGIE, dépannage, bornes de recharge, photovoltaïque</li>
      </ul>
    ),
  },
  {
    title: "2. Champ d'application",
    body: (
      <p>
        Les présentes Conditions Générales de Vente (CGV) régissent toute prestation
        réalisée par Le Cuivre Électrique pour des clients particuliers (B2C) ou
        professionnels en Belgique. Toute commande, devis signé ou intervention
        emporte acceptation pleine et entière des CGV en vigueur à la date de la
        commande. Toute condition contraire émanant du client est inopposable, sauf
        accord écrit.
      </p>
    ),
  },
  {
    title: "3. Devis et commande",
    body: (
      <>
        <p className="mb-4">
          Tout devis est établi gratuitement après visite ou échange détaillé. Il
          est valable 30 jours à compter de sa date d'émission, sauf indication
          contraire. Le devis devient un contrat lorsqu'il est signé par le client
          (signature manuscrite, électronique ou retour email explicite).
        </p>
        <p>
          Toute modification de la commande en cours de chantier fera l'objet d'un
          avenant écrit, qui pourra ajuster le prix et les délais.
        </p>
      </>
    ),
  },
  {
    title: "4. Prix",
    body: (
      <>
        <p className="mb-4">
          Les prix sont exprimés en euros, hors TVA et hors TVA selon les
          mentions du devis. Le taux de TVA applicable dépend de la nature des
          travaux et de l'âge du bâtiment :
        </p>
        <ul className="list-disc list-inside space-y-2 mb-4">
          <li>21 % : taux standard pour la fourniture de matériel et les travaux neufs</li>
          <li>6 % : travaux de rénovation dans une habitation privée de plus de 10 ans, sous conditions (attestation client à signer)</li>
        </ul>
        <p>
          Le devis détaille le matériel, la main-d'œuvre, les déplacements et la TVA
          applicable. Aucun frais caché n'est ajouté en fin de chantier.
        </p>
      </>
    ),
  },
  {
    title: "5. Paiement (40 / 50 / 10)",
    body: (
      <>
        <p className="mb-4">
          Sauf mention contraire au devis, l'échéancier standard pour les
          chantiers supérieurs à 1 000 € HTVA est le suivant :
        </p>
        <ul className="list-disc list-inside space-y-2 mb-4">
          <li><strong className="text-foreground">40 %</strong> à la commande, à réception du devis signé</li>
          <li><strong className="text-foreground">50 %</strong> à mi-chantier ou à la livraison du matériel principal</li>
          <li><strong className="text-foreground">10 %</strong> à la fin des travaux, sur présentation de la facture finale</li>
        </ul>
        <p className="mb-4">
          Pour les chantiers inférieurs à 1 000 € HTVA et les dépannages :
          paiement comptant à la fin de l'intervention (virement, espèces, ou
          Bancontact si disponible).
        </p>
        <p>
          En cas de retard de paiement, des intérêts de retard au taux légal belge
          (loi du 02/08/2002 pour les transactions B2B, taux légal civil pour les
          B2C) ainsi qu'une indemnité forfaitaire de 40 € (B2B) seront appliqués
          de plein droit, sans mise en demeure préalable.
        </p>
      </>
    ),
  },
  {
    title: "6. Délais d'exécution",
    body: (
      <p>
        Les délais annoncés sont des estimations de bonne foi. Tout retard
        imputable à des circonstances indépendantes de notre volonté (maladie,
        rupture de stock fournisseur, accès chantier, intervention d'un autre
        corps de métier, intempéries) est notifié au client dès que possible et
        ne peut donner lieu à indemnité.
      </p>
    ),
  },
  {
    title: "7. Droit de rétractation (B2C)",
    body: (
      <>
        <p className="mb-4">
          Conformément aux articles VI.47 et suivants du Code de droit économique
          belge, le client particulier dispose d'un délai de 14 jours calendaires
          pour exercer son droit de rétractation, sans avoir à justifier de
          motifs, lorsque le contrat est conclu à distance ou hors établissement.
        </p>
        <p className="mb-4">
          Pour exercer ce droit, le client adresse une notification écrite (email
          à contact@cuivre-electrique.com ou courrier) avant l'expiration du délai.
        </p>
        <p>
          <strong className="text-foreground">Renonciation expresse :</strong>{" "}
          si le client souhaite que l'intervention démarre avant la fin du délai
          de rétractation (par exemple en dépannage urgent), il l'autorise
          expressément. Dans ce cas, en cas de rétractation ultérieure, il devra
          payer le montant correspondant aux prestations déjà fournies.
        </p>
      </>
    ),
  },
  {
    title: "8. Garanties",
    body: (
      <>
        <p className="mb-4">
          Les installations sont conformes au Règlement Général sur les
          Installations Électriques (RGIE) en vigueur en Belgique. Le matériel
          posé bénéficie de la garantie constructeur (Schneider, Niko, Hager,
          Alfen, etc.).
        </p>
        <p className="mb-4">
          La main-d'œuvre est garantie 2 ans à compter de la date de fin de
          chantier (garantie légale de conformité, articles 1649bis et suivants
          du Code civil belge), pour tout vice n'étant pas dû à un mauvais usage
          ou à une intervention d'un tiers postérieure à notre passage.
        </p>
        <p>
          La garantie ne couvre pas l'usure normale, les dégâts liés à un défaut
          d'entretien, à une surtension d'origine externe (foudre, réseau électrique)
          ou à une modification de l'installation par un tiers.
        </p>
      </>
    ),
  },
  {
    title: "9. Responsabilité",
    body: (
      <p>
        Le Cuivre Électrique est assuré en responsabilité civile professionnelle
        pour son activité d'installation électrique. La responsabilité du
        prestataire est limitée au montant de la prestation concernée et ne peut
        être engagée pour des dommages indirects (perte d'exploitation, perte
        de données, etc.). Les attestations d'assurance peuvent être communiquées
        sur demande.
      </p>
    ),
  },
  {
    title: "10. Réception des travaux",
    body: (
      <p>
        À la fin du chantier, le client est invité à constater la conformité des
        travaux. Sauf réserve écrite formulée dans les 8 jours, les travaux sont
        réputés acceptés. Pour les installations soumises à contrôle (RGIE,
        bornes de recharge), le rapport de l'organisme agréé (Vinçotte, BTV,
        AIB-Vinçotte ou équivalent) est communiqué au client.
      </p>
    ),
  },
  {
    title: "11. Réserve de propriété",
    body: (
      <p>
        Le matériel fourni reste la propriété du Cuivre Électrique jusqu'au
        paiement intégral du prix par le client, conformément à la loi belge sur
        la réserve de propriété.
      </p>
    ),
  },
  {
    title: "12. Données personnelles",
    body: (
      <p>
        Les données collectées dans le cadre du devis et du chantier sont
        traitées conformément au RGPD et à la loi belge du 30 juillet 2018. Pour
        en savoir plus, voir notre{" "}
        <a href="/confidentialite" className="text-primary hover:underline">
          politique de confidentialité
        </a>
        .
      </p>
    ),
  },
  {
    title: "13. Litiges et droit applicable",
    body: (
      <>
        <p className="mb-4">
          Les présentes CGV sont régies par le droit belge. En cas de litige, les
          parties s'efforcent de trouver une solution amiable.
        </p>
        <p className="mb-4">
          À défaut, le client consommateur peut saisir gratuitement le service de
          médiation pour le consommateur :{" "}
          <a
            href="https://mediationconsommateur.be"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            mediationconsommateur.be
          </a>{" "}
          ou la plateforme européenne de règlement en ligne des litiges :{" "}
          <a
            href="https://ec.europa.eu/consumers/odr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            ec.europa.eu/consumers/odr
          </a>
          .
        </p>
        <p>
          À défaut d'accord, les tribunaux du Brabant wallon (arrondissement
          judiciaire compétent pour Court-Saint-Étienne) sont seuls compétents.
        </p>
      </>
    ),
  },
];

const CGV = () => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SEO
        title="Conditions Générales de Vente | Le Cuivre Électrique"
        description="Conditions Générales de Vente du Cuivre Électrique : devis, prix, TVA, paiement, garanties, droit de rétractation et règlement des litiges en Belgique."
        canonical="https://cuivre-electrique.com/cgv"
        noindex={true}
      />
      <Header />
      <main className="pt-24">
        <section className="py-16 md:py-24">
          <div className="container mx-auto max-w-4xl px-4">
            <Breadcrumbs items={[{ label: "Conditions Générales de Vente", href: "/cgv" }]} />
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-3">
              Conditions Générales de Vente
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

export default CGV;
