import { useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import ContactSection from "@/components/ContactSection";
import DevisBorneForm from "@/components/devis-borne/DevisBorneForm";
import { DEMANDE_BORNE, PARAM_DEMANDE } from "@/lib/devis-borne/config";
import ZoneSection from "@/components/ZoneSection";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import SEO from "@/components/SEO";
import Breadcrumbs from "@/components/Breadcrumbs";
import {
  Clock,
  Send,
  PhoneCall,
  Wrench,
  Phone,
  Mail,
  FileText,
  BatteryCharging,
} from "lucide-react";

const steps = [
  {
    icon: Send,
    title: "Vous envoyez votre demande",
    body: "Formulaire ci-dessous ou téléphone, comme vous préférez.",
  },
  {
    icon: PhoneCall,
    title: "Je vous recontacte sous 24h",
    body: "Pour cadrer votre besoin et fixer la visite si nécessaire.",
  },
  {
    icon: FileText,
    title: "Visite et devis gratuit",
    body: "Sur place, je prépare un devis détaillé poste par poste.",
  },
  {
    icon: Wrench,
    title: "Si OK, on planifie l'intervention",
    body: "Date convenue ensemble, intervention soignée jusqu'à la mise en service.",
  },
];

const channels = [
  {
    icon: Phone,
    title: "Téléphone",
    detail: "0485 75 52 27",
    href: "tel:+32485755227",
    note: "Pour les urgences et un échange rapide.",
    analytics: "call_click",
  },
  {
    icon: Mail,
    title: "Email",
    detail: "contact@cuivre-electrique.com",
    href: "mailto:contact@cuivre-electrique.com",
    note: "Pour les questions et les échanges écrits.",
    analytics: "email_click",
  },
  {
    icon: FileText,
    title: "Formulaire",
    detail: "Demande détaillée",
    href: "#contact",
    note: "Pour un devis détaillé avec photos.",
    analytics: "form_anchor_click",
  },
];

/**
 * Un seul endroit pour les demandes (règle d'Adrian du 2026-11-22) : cette page,
 * avec deux choix en haut. Le choix vit dans l'adresse (`?demande=borne`) : la
 * page bornes ouvre directement le devis de borne, le reste du site ouvre la
 * demande classique. Les deux choix partagent la même adresse canonique
 * (/contact) : une seule page pour Google.
 */
const CHOIX = [
  {
    valeur: "classique",
    icone: FileText,
    titre: "Demande classique",
    aide: "Dépannage, rénovation, mise en conformité ou tout autre projet.",
  },
  {
    valeur: DEMANDE_BORNE,
    icone: BatteryCharging,
    titre: "Borne : devis sans déplacement",
    aide: "Quelques cases à cocher et vos photos : votre borne est chiffrée sans passer chez vous.",
  },
] as const;

const Contact = () => {
  const [params, setParams] = useSearchParams();
  const demande = params.get(PARAM_DEMANDE) === DEMANDE_BORNE ? DEMANDE_BORNE : "classique";

  const choisir = (valeur: string) => {
    const suite = new URLSearchParams(params);
    if (valeur === DEMANDE_BORNE) suite.set(PARAM_DEMANDE, DEMANDE_BORNE);
    else suite.delete(PARAM_DEMANDE);
    // `replace` : changer de choix n'ajoute pas une étape au bouton « retour ».
    setParams(suite, { replace: true, preventScrollReset: true });
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SEO
        title="Contact & Devis gratuit | Le Cuivre Électrique 0485 75 52 27"
        description="Contactez Le Cuivre Électrique pour un devis gratuit. Bureau : Lun-Sam 7h-19h, dimanche fermé — Disponible 7j/7 pour les urgences au 0485 75 52 27."
        keywords="contact électricien, devis gratuit, électricien Bruxelles, électricien Brabant wallon, dépannage urgent"
        canonical="https://cuivre-electrique.com/contact"
      />
      <Header />
      <main className="pt-24">
        <div className="container mx-auto px-4">
          <Breadcrumbs items={[{ label: "Contact", href: "/contact" }]} />
        </div>

        {/* === Hero + bandeau disponibilités === */}
        <section className="py-10 md:py-14">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
              Parlons de votre projet
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-6 max-w-2xl mx-auto">
              Décrivez votre besoin, je vous recontacte rapidement avec une
              première estimation et la suite à donner.
            </p>

            {/* Bandeau disponibilités — sobre, ligne unique */}
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground bg-primary/5 border border-primary/20 rounded-full px-4 py-2">
              <Clock
                className="w-4 h-4 text-primary"
                aria-hidden="true"
              />
              <span>
                <span className="font-semibold text-foreground">
                  Devis gratuit sous 48h
                </span>{" "}
                · Bureau Lun–Sam 7h–19h · Disponible 7j/7 pour les urgences
              </span>
            </div>
          </div>
        </section>

        {/* === Les deux choix : demande classique ou devis de borne === */}
        <section className="pb-2" aria-labelledby="choix-demande-titre">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 id="choix-demande-titre" className="sr-only">
              Quel type de demande ?
            </h2>
            <div role="group" aria-labelledby="choix-demande-titre" className="grid gap-3 sm:grid-cols-2">
              {CHOIX.map((c) => {
                const actif = demande === c.valeur;
                return (
                  <button
                    key={c.valeur}
                    type="button"
                    aria-pressed={actif}
                    onClick={() => choisir(c.valeur)}
                    className={`flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                      actif
                        ? "border-primary bg-primary/[0.07]"
                        : "border-border bg-card hover:border-primary/50"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`mt-1 h-4 w-4 shrink-0 rounded-full border-2 ${
                        actif ? "border-primary bg-primary" : "border-muted-foreground/50"
                      }`}
                    />
                    <span className="min-w-0">
                      <span className="flex items-center gap-2 font-display text-lg font-bold text-foreground">
                        <c.icone className="h-5 w-5 text-primary" aria-hidden="true" />
                        {c.titre}
                      </span>
                      <span className="mt-1 block text-sm text-muted-foreground leading-relaxed">{c.aide}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* === Formulaire du choix sélectionné. Les deux portent id="contact". === */}
        {demande === DEMANDE_BORNE ? <DevisBorneForm /> : <ContactSection />}

        {/* === 3 cartes canaux de contact === */}
        <section className="py-12 md:py-16 bg-muted/30 border-y border-border">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground text-center mb-8">
              Vous préférez nous joindre autrement ?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
              {channels.map((c) => (
                <a
                  key={c.title}
                  href={c.href}
                  data-analytics={c.analytics}
                  className="group flex flex-col items-start p-6 rounded-2xl bg-card border border-border/60 shadow-sm hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:border-primary group-hover:text-primary-foreground transition-colors">
                    <c.icon className="w-5 h-5 text-primary group-hover:text-primary-foreground transition-colors" aria-hidden="true" />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    {c.title}
                  </p>
                  <p className="font-display text-lg md:text-xl font-bold text-foreground mb-2 break-all">
                    {c.detail}
                  </p>
                  <p className="text-sm text-muted-foreground">{c.note}</p>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* === Section "Comment ça se passe" — 4 étapes === */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground text-center mb-10">
              Comment ça se passe
            </h2>
            <ol className="grid grid-cols-1 md:grid-cols-4 gap-5 md:gap-6">
              {steps.map((s, i) => (
                <li
                  key={s.title}
                  className="relative bg-card border border-border/60 rounded-2xl p-5 md:p-6"
                >
                  <span
                    aria-hidden="true"
                    className="absolute -top-3 -left-3 w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-display font-bold text-sm shadow-md"
                  >
                    {i + 1}
                  </span>
                  <s.icon
                    className="w-6 h-6 text-primary mb-3"
                    aria-hidden="true"
                    strokeWidth={1.75}
                  />
                  <h3 className="font-display text-base md:text-lg font-bold text-foreground mb-2 leading-snug">
                    {s.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {s.body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <ZoneSection />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Contact;
