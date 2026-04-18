import { motion } from "framer-motion";
import { HelpCircle, Euro, Wrench, Zap, CheckCircle, Sun, Car, Lightbulb, Clock, Phone } from "lucide-react";
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

const faqItems = [
  {
    question: "Intervenez-vous en urgence ?",
    answer: "Oui. Nous proposons un service de dépannage électrique rapide en cas de panne, court-circuit, disjoncteur qui saute ou situation dangereuse. Selon la disponibilité, une intervention le jour même est possible."
  },
  {
    question: "Travaillez-vous pour les particuliers et les professionnels ?",
    answer: "Oui. Nous intervenons aussi bien chez les particuliers (maisons, appartements) que chez les professionnels (commerces, bureaux)."
  },
  {
    question: "Dans quelles zones intervenez-vous ?",
    answer: "Nous nous déplaçons à Bruxelles et dans toute la Wallonie."
  },
  {
    question: "Réalisez-vous les mises en conformité électriques ?",
    answer: "Oui. Nous réalisons la mise en conformité complète de votre installation selon le RGIE, ainsi que les adaptations nécessaires suite au contrôle."
  },
  {
    question: "Travaillez-vous avec un organisme de contrôle ?",
    answer: "Oui. Nous collaborons avec des organismes agréés et pouvons coordonner le passage du contrôleur après les travaux."
  },
  {
    question: "Le devis est-il gratuit ?",
    answer: "Oui. Le devis est gratuit et sans engagement pour toute demande classique. En cas de diagnostic technique approfondi ou de déplacement spécifique, des frais peuvent s'appliquer (déduits si les travaux sont acceptés)."
  },
  {
    question: "Fournissez-vous le matériel ?",
    answer: "Oui. Nous pouvons fournir et installer tout le matériel nécessaire. Si vous souhaitez fournir certains éléments, cela peut être discuté au préalable."
  },
  {
    question: "Le chantier est-il laissé propre ?",
    answer: "Oui. Nous travaillons avec soin, protégeons les zones sensibles et laissons un chantier propre en fin d'intervention."
  }
];

const pricingCategories = [
  {
    icon: Wrench,
    title: "Dépannage électrique",
    items: [
      { label: "Diagnostic & intervention", price: "à partir de 80 €" },
      { label: "Dépannage urgent (soir / week-end)", price: "sur devis" }
    ]
  },
  {
    icon: Zap,
    title: "Installation électrique",
    items: [
      { label: "Installation complète (maison / appartement)", price: "sur devis personnalisé" },
      { label: "Rénovation partielle", price: "sur devis personnalisé" }
    ]
  },
  {
    icon: CheckCircle,
    title: "Mise en conformité RGIE",
    items: [
      { label: "Mise en conformité simple", price: "sur devis personnalisé" },
      { label: "Mise en conformité complète avec adaptations", price: "sur devis" }
    ]
  },
  {
    icon: Sun,
    title: "Panneaux photovoltaïques",
    items: [
      { label: "Installation complète", price: "sur devis personnalisé" }
    ]
  },
  {
    icon: Car,
    title: "Bornes de recharge",
    items: [
      { label: "Installation borne domestique", price: "sur devis personnalisé" }
    ]
  },
  {
    icon: Lightbulb,
    title: "Éclairage intérieur & extérieur",
    items: [
      { label: "Installation ou remplacement", price: "sur devis personnalisé" }
    ]
  },
  {
    icon: Clock,
    title: "Main-d'œuvre",
    items: [
      { label: "Tarif horaire", price: "50 € / heure" },
      { label: "Frais de déplacement", price: "selon zone et type d'intervention" }
    ]
  }
];

const FAQ = () => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SEO 
        title="Questions fréquentes | Électricien Le Cuivre Électrique"
        description="Retrouvez les réponses à vos questions et nos tarifs indicatifs. Dépannage, installation, mise en conformité RGIE. Devis gratuit."
        keywords="FAQ électricien, tarifs électricien, prix électricité, questions fréquentes, devis électricité, Bruxelles, Wallonie"
        canonical="https://cuivre-electrique.com/faq"
      />
      <StructuredData 
        type="FAQPage" 
        questions={faqItems}
      />
      <StructuredData 
        type="BreadcrumbList" 
        items={[
          { name: "Accueil", url: "https://cuivre-electrique.com" },
          { name: "FAQ & Tarifs", url: "https://cuivre-electrique.com/faq" }
        ]}
      />
      <Header />
      <WhatsAppButton />

      {/* Hero Section */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-20 bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto px-4">
          <Breadcrumbs items={[{ label: "FAQ & Tarifs", href: "/faq" }]} />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6">
              <HelpCircle className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Questions fréquentes</span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              FAQ & <span className="text-primary">Tarifs</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Retrouvez les réponses à vos questions et nos tarifs indicatifs.
            </p>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <HelpCircle className="w-6 h-6 text-primary" />
              </div>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                Foire aux questions
              </h2>
            </div>

            <Accordion type="single" collapsible className="space-y-4">
              {faqItems.map((item, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="bg-card border border-border rounded-xl px-6 data-[state=open]:shadow-lg transition-shadow"
                >
                  <AccordionTrigger className="text-left font-medium text-foreground hover:text-primary py-5">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-5">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Euro className="w-6 h-6 text-primary" />
              </div>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                Tarifs indicatifs
              </h2>
            </div>

            <p className="text-muted-foreground mb-10 pl-15">
              💡 Les prix ci-dessous sont donnés à titre indicatif. Le prix final dépend toujours du chantier, du matériel et de la complexité des travaux.
            </p>

            <div className="grid gap-6 md:grid-cols-2">
              {pricingCategories.map((category, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <category.icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-display font-bold text-foreground">
                      {category.title}
                    </h3>
                  </div>
                  <ul className="space-y-3">
                    {category.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex justify-between items-start gap-4">
                        <span className="text-muted-foreground text-sm">{item.label}</span>
                        <span className="text-foreground font-medium text-sm whitespace-nowrap">
                          {item.price}
                        </span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
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
              Besoin d'un devis ou d'un conseil ?
            </h2>
            <p className="text-muted-foreground mb-8">
              Contactez-nous, nous vous répondons rapidement.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="gap-2">
                <Link to="/contact">
                  <Phone className="w-4 h-4" />
                  Demander un devis gratuit
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href="tel:+32485755227">
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
