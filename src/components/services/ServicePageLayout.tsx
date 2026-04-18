import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Phone, MessageCircle, ArrowRight, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import SEO from "@/components/SEO";
import StructuredData from "@/components/StructuredData";
import Breadcrumbs from "@/components/Breadcrumbs";
import HomeReviewsBanner from "@/components/HomeReviewsBanner";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export interface ServiceFAQ {
  question: string;
  answer: string;
}

export interface ServicePageProps {
  /** Slug used for canonical/breadcrumb (e.g. "depannage-urgent") */
  slug: string;
  breadcrumbLabel: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords?: string;
  /** Service name passed to Schema.org Service node */
  schemaServiceName: string;
  schemaServiceDescription: string;
  /** Hero */
  hero: {
    eyebrow: string;
    h1: string;
    intro: string;
  };
  /** Free body content (sections) */
  children: ReactNode;
  faqs: ServiceFAQ[];
}

const ServicePageLayout = ({
  slug,
  breadcrumbLabel,
  seoTitle,
  seoDescription,
  seoKeywords,
  schemaServiceName,
  schemaServiceDescription,
  hero,
  children,
  faqs,
}: ServicePageProps) => {
  const canonical = `https://cuivre-electrique.com/services/${slug}`;
  const whatsappUrl =
    "https://wa.me/32485755227?text=" +
    encodeURIComponent("Bonjour, je souhaite un devis pour : " + schemaServiceName);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SEO
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        canonical={canonical}
      />
      <StructuredData
        type="Service"
        serviceName={schemaServiceName}
        serviceDescription={schemaServiceDescription}
      />
      <StructuredData type="FAQPage" questions={faqs} />
      <Header />

      <main className="pt-24">
        <div className="container mx-auto px-4">
          <Breadcrumbs
            items={[
              { label: "Services", href: "/services" },
              { label: breadcrumbLabel, href: `/services/${slug}` },
            ]}
          />
        </div>

        {/* Hero */}
        <section className="relative py-12 md:py-20 overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `radial-gradient(hsl(var(--foreground)) 1px, transparent 1px)`,
              backgroundSize: "30px 30px",
            }}
          />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

          <div className="container mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-4xl mx-auto text-center"
            >
              <span className="inline-block px-4 py-2 bg-primary/10 border border-primary/30 text-primary text-sm font-medium rounded-full mb-6">
                {hero.eyebrow}
              </span>
              <h1 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                {hero.h1}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto mb-10">
                {hero.intro}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button variant="copper" size="lg" asChild>
                  <a
                    href="tel:+32485755227"
                    data-analytics="call_click"
                    className="flex items-center gap-2"
                  >
                    <Phone className="w-5 h-5" />
                    0485 75 52 27
                  </a>
                </Button>
                <Button variant="copperOutline" size="lg" asChild>
                  <Link to="/contact" data-analytics="quote_request">
                    Demander un devis
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
                <Button variant="ghost" size="lg" asChild>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-analytics="whatsapp_click"
                    className="flex items-center gap-2"
                  >
                    <MessageCircle className="w-5 h-5" />
                    WhatsApp
                  </a>
                </Button>
              </div>

              <a
                href="#contenu"
                className="inline-flex flex-col items-center gap-2 mt-10 text-muted-foreground hover:text-primary transition-colors"
              >
                <span className="text-sm">En savoir plus</span>
                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <ChevronDown className="w-5 h-5" />
                </motion.div>
              </a>
            </motion.div>
          </div>
        </section>

        {/* Body content */}
        <section id="contenu" className="py-12 md:py-16">
          <div className="container mx-auto">
            <div className="max-w-4xl mx-auto prose-service">
              {children}
            </div>
          </div>
        </section>

        {/* FAQ */}
        {faqs.length > 0 && (
          <section className="py-12 md:py-20 bg-card">
            <div className="container mx-auto">
              <div className="max-w-3xl mx-auto">
                <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground text-center mb-10">
                  Questions fréquentes
                </h2>
                <Accordion type="single" collapsible className="space-y-3">
                  {faqs.map((faq, i) => (
                    <AccordionItem
                      key={i}
                      value={`item-${i}`}
                      className="bg-background border border-border/60 rounded-2xl px-5"
                    >
                      <AccordionTrigger className="text-left font-semibold text-foreground hover:text-primary">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground leading-relaxed">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </div>
          </section>
        )}

        {/* Bandeau avis Google compact */}
        <HomeReviewsBanner />

        {/* CTA final */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto">
            <div className="max-w-3xl mx-auto text-center bg-gradient-copper rounded-3xl p-10 md:p-14 shadow-copper-lg">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
                Demandez votre devis gratuit
              </h2>
              <p className="text-primary-foreground/90 text-lg mb-8 max-w-xl mx-auto">
                Une question, un projet ? Adrian vous répond personnellement, basé à
                Court-Saint-Étienne et disponible dans tout le Brabant wallon.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button size="lg" variant="secondary" asChild>
                  <a
                    href="tel:+32485755227"
                    data-analytics="call_click"
                    className="flex items-center gap-2"
                  >
                    <Phone className="w-5 h-5" />
                    0485 75 52 27
                  </a>
                </Button>
                <Button size="lg" variant="outline" asChild className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                  <Link to="/contact" data-analytics="quote_request">
                    Formulaire de devis
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default ServicePageLayout;
