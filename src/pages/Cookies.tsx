import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import SEO from "@/components/SEO";
import Breadcrumbs from "@/components/Breadcrumbs";
import { CONSENT_KEY, openCookiePreferences } from "@/hooks/useCookieConsent";
import { GA_ID } from "@/lib/analytics/gtag";
import { CLE_SESSION_ENVOI } from "@/lib/simulateur/config";

/**
 * Page /cookies — politique cookies.
 *
 * Texte d'Adrian (dossier « textes légaux du site », 21/11/2026, section 3).
 * Le tableau ne liste que ce que le site dépose VRAIMENT : chaque ligne a été
 * relevée dans le code puis vérifiée dans un navigateur vierge (avant choix,
 * après « Refuser », après « Tout accepter »). Les noms viennent des constantes
 * du code, pour qu'un renommage se voie ici aussi.
 *
 * Toute nouvelle clé de stockage ou tout nouveau cookie du site public doit
 * être ajouté à ce tableau dans la même livraison.
 */

/** Date de la dernière mise à jour du texte. */
const MISE_A_JOUR = "21 novembre 2026";

const LIGNES: {
  categorie: string;
  nom: string;
  depose: string;
  role: string;
  duree: string;
  consentement: string;
}[] = [
  {
    categorie: "Nécessaire",
    nom: `${CONSENT_KEY} (stockage local)`,
    depose: "cuivre-electrique.com",
    role: "Retenir votre choix sur les cookies",
    duree: "6 mois, puis le choix vous est redemandé",
    consentement: "Non requis",
  },
  {
    categorie: "Nécessaire",
    nom: `${CLE_SESSION_ENVOI} (stockage de session)`,
    depose: "cuivre-electrique.com",
    role: "Après l'envoi d'une demande par le simulateur, éviter de l'envoyer une deuxième fois",
    duree: "Jusqu'à la fermeture de l'onglet",
    consentement: "Non requis",
  },
  {
    categorie: "Mesure d'audience",
    nom: `_ga, _ga_${GA_ID.replace("G-", "")}`,
    depose: "Google Analytics 4",
    role: "Compter les visites de façon agrégée",
    duree: "Cookie : 13 mois au maximum ; données conservées 2 mois chez Google",
    consentement: "Requis",
  },
];

const lien = "font-semibold text-primary underline underline-offset-4 hover:no-underline";

const Cookies = () => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SEO
        title="Politique cookies | Le Cuivre Électrique"
        description="Les cookies et le stockage utilisés par cuivre-electrique.com : nom, rôle, durée, et comment changer votre choix."
        canonical="https://cuivre-electrique.com/cookies"
        noindex={true}
      />
      <Header />
      <main className="pt-24">
        <div className="container mx-auto px-4">
          <Breadcrumbs items={[{ label: "Politique cookies", href: "/cookies" }]} />
        </div>

        <section className="py-10 md:py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-3">
                Politique cookies
              </h1>
              <p className="text-sm text-muted-foreground mb-8">
                Dernière mise à jour : {MISE_A_JOUR}
              </p>

              <div className="space-y-5 text-muted-foreground leading-relaxed">
                <p>
                  Un cookie est un petit fichier enregistré sur votre appareil par un site. Ce
                  site utilise aussi le stockage local de votre navigateur, qui fonctionne de la
                  même manière.
                </p>
                {/* Texte d'Adrian : « …et aucun outil de Google n'est chargé ». Tant que les
                    polices viennent encore de Google Fonts (lot « polices hébergées »), la
                    phrase se limite à l'outil de mesure. À rétablir en entier à ce lot. */}
                <p>
                  <strong className="text-foreground">Votre choix.</strong> À votre première
                  visite, un bandeau vous propose « Tout accepter », « Refuser » ou
                  « Personnaliser ». Tant que vous n'avez pas accepté, aucun cookie de mesure
                  n'est déposé et l'outil de mesure de Google n'est pas chargé. Refuser est aussi
                  simple qu'accepter, et le site fonctionne de la même façon. Vous pouvez changer
                  d'avis à tout moment avec « Gérer mes cookies » en bas de chaque page.
                </p>
                <p>
                  <button type="button" onClick={openCookiePreferences} className={lien}>
                    Gérer mes cookies
                  </button>
                </p>
              </div>

              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6">
                Les cookies utilisés
              </h2>
              <div className="overflow-x-auto rounded-2xl border border-border/60">
                <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                  <thead className="bg-card">
                    <tr>
                      {["Catégorie", "Nom", "Déposé par", "À quoi il sert", "Durée", "Consentement"].map(
                        (e) => (
                          <th key={e} scope="col" className="px-4 py-3 font-semibold text-foreground">
                            {e}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {LIGNES.map((l) => (
                      <tr key={l.nom} className="border-t border-border/60 align-top">
                        <td className="px-4 py-3 font-semibold text-foreground">{l.categorie}</td>
                        <td className="px-4 py-3 text-muted-foreground break-words">{l.nom}</td>
                        <td className="px-4 py-3 text-muted-foreground">{l.depose}</td>
                        <td className="px-4 py-3 text-muted-foreground">{l.role}</td>
                        <td className="px-4 py-3 text-muted-foreground">{l.duree}</td>
                        <td className="px-4 py-3 text-muted-foreground">{l.consentement}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                Si vous refusez, ou si vous retirez votre accord, les cookies de mesure déjà
                déposés sont effacés et plus rien n'est envoyé à Google.
              </p>

              <p className="mt-10 text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Responsable.</strong> Adrian Mitric – Le
                Cuivre Électrique – contact@cuivre-electrique.com. Voir aussi la{" "}
                <Link to="/confidentialite" className={lien}>
                  politique de confidentialité
                </Link>
                .
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Cookies;
