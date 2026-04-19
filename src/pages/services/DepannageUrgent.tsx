import ServicePageLayout from "@/components/services/ServicePageLayout";
import { Phone, MessageCircle, AlertTriangle } from "lucide-react";
import { useAnalyticsEvents } from "@/hooks/useAnalyticsEvents";

const faqs = [
  {
    question: "Combien de temps pour une intervention urgente ?",
    answer:
      "Selon votre localisation et l'heure d'appel, nous intervenons généralement en 1 à 3 heures dans le Brabant wallon (Court-Saint-Étienne, Ottignies-LLN, Wavre, Nivelles…). Pour les interventions de nuit ou très éloignées, le délai peut être adapté — nous vous le confirmons immédiatement par téléphone.",
  },
  {
    question: "Quel est le tarif d'un dépannage urgent ?",
    answer:
      "Nous appliquons un forfait déplacement urgence + main d'œuvre, communiqué et accepté avant tout déplacement. Aucune mauvaise surprise : le tarif est annoncé clairement par téléphone ou WhatsApp avant que nous ne nous mettions en route.",
  },
  {
    question: "Que faire en attendant votre arrivée ?",
    answer:
      "Si possible, coupez le disjoncteur général au tableau pour mettre l'installation hors tension. Ne touchez ni au tableau ni à la prise/appareil suspect tant que le courant n'est pas coupé. En cas de fumée ou d'odeur de brûlé, quittez la pièce et appelez les pompiers (112) avant de nous joindre.",
  },
  {
    question: "Intervenez-vous la nuit et le week-end ?",
    answer:
      "Oui, notre service de dépannage est disponible 24h/24 et 7j/7. Le bureau est ouvert en semaine 8h-18h et le samedi 9h-13h ; en dehors de ces plages, le numéro 0485 75 52 27 reste joignable pour les urgences.",
  },
];

const DepannageUrgent = () => {
  const { trackEvent } = useAnalyticsEvents();
  return (
    <ServicePageLayout
      slug="depannage-urgent"
      breadcrumbLabel="Dépannage urgent 24h/24"
      seoTitle="Dépannage électrique urgent 24h/24 en Brabant wallon | Le Cuivre Électrique"
      seoDescription="Panne électrique, court-circuit, disjoncteur qui saute ? Dépannage urgent 24h/24, 7j/7, à Court-Saint-Étienne et dans tout le Brabant wallon. 0485 75 52 27."
      seoKeywords="dépannage électrique urgent, électricien 24h/24, panne électrique Brabant wallon, court-circuit, disjoncteur qui saute, électricien Court-Saint-Étienne"
      schemaServiceName="Dépannage électrique urgent 24h/24"
      schemaServiceDescription="Service de dépannage électrique d'urgence disponible 24h/24 et 7j/7 dans tout le Brabant wallon, en Wallonie et à Bruxelles."
      hero={{
        eyebrow: "Dépannage urgent",
        h1: "Dépannage électrique urgent — 24h/24, 7j/7",
        intro:
          "Une panne électrique ne peut pas attendre. Adrian intervient rapidement dans le Brabant wallon, en Wallonie et à Bruxelles pour rétablir votre installation en toute sécurité, jour et nuit, week-ends compris.",
      }}
      faqs={faqs}
    >
      {/* Bloc urgence */}
      <div className="bg-primary/10 border-2 border-primary/40 rounded-2xl p-6 md:p-8 mb-10">
        <div className="flex items-start gap-4">
          <AlertTriangle className="w-10 h-10 text-primary shrink-0" />
          <div className="flex-1">
            <p className="font-display text-xl md:text-2xl font-bold text-foreground mb-2">
              Panne en cours ? Appelez maintenant
            </p>
            <p className="text-muted-foreground mb-4">
              Réponse immédiate, intervention rapide.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="tel:+32485755227"
                data-analytics="call_click"
                onClick={() => trackEvent("call_click", { source_section: "depannage_urgence_block" })}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-lg shadow-copper hover:shadow-copper-lg transition-shadow"
              >
                <Phone className="w-5 h-5" />
                0485 75 52 27
              </a>
              <a
                href="https://wa.me/32485755227?text=Urgence%20%C3%A9lectrique"
                target="_blank"
                rel="noopener noreferrer"
                data-analytics="whatsapp_click"
                onClick={() => trackEvent("whatsapp_click", { source_section: "depannage_urgence_block" })}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-primary text-primary font-semibold hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                WhatsApp urgence
              </a>
            </div>
          </div>
        </div>
      </div>

      <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6">
        Types de pannes traitées
      </h2>
      <ul className="space-y-3 text-foreground mb-10">
        {[
          "Panne électrique générale (plus aucun courant)",
          "Disjoncteur ou différentiel qui saute en boucle",
          "Prise qui grille, qui chauffe, ou qui ne fonctionne plus",
          "Tableau électrique défaillant ou obsolète",
          "Court-circuit après un orage ou un dégât des eaux",
          "Panne partielle (plus de courant dans une partie de la maison)",
          "Éclairage qui ne fonctionne plus",
          "Bruit, étincelles, odeur de brûlé sur le tableau",
        ].map((item) => (
          <li key={item} className="flex items-start gap-3">
            <span className="mt-2 w-2 h-2 rounded-full bg-primary shrink-0" />
            <span className="leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>

      <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6">
        Zones d'intervention urgente
      </h2>
      <p className="text-muted-foreground leading-relaxed mb-4">
        Nous intervenons en priorité dans tout le Brabant wallon depuis notre base
        de Court-Saint-Étienne :
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4 text-sm">
        {[
          "Court-Saint-Étienne",
          "Ottignies-Louvain-la-Neuve",
          "Wavre",
          "Nivelles",
          "Waterloo",
          "Genappe",
          "Rixensart",
          "Lasne",
          "Braine-l'Alleud",
          "Jodoigne",
          "Gembloux",
          "Namur",
          "Bruxelles",
        ].map((city) => (
          <div
            key={city}
            className="px-3 py-2 bg-card border border-border/60 rounded-lg text-foreground"
          >
            {city}
          </div>
        ))}
      </div>
      <p className="text-muted-foreground text-sm">
        Vous n'êtes pas dans cette liste ? Appelez-nous : selon disponibilité, nous
        intervenons aussi sur le reste de la Wallonie.
      </p>

      <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6">
        Tarification transparente
      </h2>
      <p className="text-muted-foreground leading-relaxed mb-4">
        Notre dépannage urgence fonctionne avec un <strong>forfait déplacement</strong>{" "}
        + un tarif horaire main d'œuvre. Le forfait est communiqué et accepté avant
        tout déplacement, par téléphone ou WhatsApp. Pas de mauvaise surprise au
        moment de la facture.
      </p>
      <p className="text-muted-foreground leading-relaxed">
        Le matériel éventuellement nécessaire (différentiel, disjoncteur, prise…)
        est facturé en sus, après votre accord.
      </p>

      <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6">
        Conseils sécurité en attendant l'arrivée
      </h2>
      <ul className="space-y-3 text-foreground mb-6">
        <li className="flex items-start gap-3">
          <span className="mt-2 w-2 h-2 rounded-full bg-primary shrink-0" />
          <span>
            <strong>Coupez le disjoncteur général</strong> au tableau si vous savez
            le faire en sécurité.
          </span>
        </li>
        <li className="flex items-start gap-3">
          <span className="mt-2 w-2 h-2 rounded-full bg-primary shrink-0" />
          <span>
            <strong>Ne touchez pas</strong> au tableau, à une prise qui chauffe ou à
            un appareil suspect tant que le courant n'est pas coupé.
          </span>
        </li>
        <li className="flex items-start gap-3">
          <span className="mt-2 w-2 h-2 rounded-full bg-primary shrink-0" />
          <span>
            <strong>En cas de fumée ou flammes</strong>, quittez immédiatement la
            pièce et appelez le 112 avant de nous joindre.
          </span>
        </li>
        <li className="flex items-start gap-3">
          <span className="mt-2 w-2 h-2 rounded-full bg-primary shrink-0" />
          <span>
            <strong>Débranchez les appareils sensibles</strong> (informatique,
            électroménager) si l'installation est instable.
          </span>
        </li>
      </ul>
    </ServicePageLayout>
  );
};

export default DepannageUrgent;
