import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Phone, ArrowRight, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import SEO from "@/components/SEO";
import StructuredData from "@/components/StructuredData";
import HomeReviewsBanner from "@/components/HomeReviewsBanner";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useAnalyticsEvents } from "@/hooks/useAnalyticsEvents";

export interface ZoneFAQ {
  question: string;
  answer: string;
}

export interface ZonePageProps {
  /** Slug used for canonical (e.g. "electricien-wavre") */
  slug: string;
  cityName: string;
  seoTitle: string;
  seoDescription: string;
  h1: string;
  intro: string;
  children: ReactNode;
  faqs: ZoneFAQ[];
}

const ZonePageLayout = ({
  slug,
  cityName,
  seoTitle,
  seoDescription,
  h1,
  intro,
  children,
  faqs,
}: ZonePageProps) => {
  const canonical = `https://cuivre-electrique.com/${slug}`;
  const { trackEvent } = useAnalyticsEvents();

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SEO
        title={seoTitle}
        description={seoDescription}
        canonical={canonical}
        keywords={`électricien ${cityName}, dépannage électrique ${cityName}, mise en conformité RGIE ${cityName}, borne de recharge ${cityName}`}
      />
      <StructuredData
        type="LocalBusinessZone"
        areaServed={cityName}
        pageUrl={canonical}
      />
      <StructuredData type="FAQPage" questions={faqs} />
      <Header />

      <main className="pt-24">
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
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 text-primary text-sm font-medium rounded-full mb-6">
                <MapPin className="w-4 h-4" />
                Zone d'intervention
              </span>
              <h1 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                {h1}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto mb-10">
                {intro}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button variant="copper" size="lg" asChild>
                  <Link
                    to="/contact"
                    data-analytics="quote_request"
                    onClick={() => trackEvent("quote_request", { source_section: "zone_page_hero", zone: slug })}
                  >
                    Demander un devis
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
                <Button variant="copperOutline" size="lg" asChild>
                  <a
                    href="tel:+32485755227"
                    data-analytics="call_click"
                    onClick={() => trackEvent("call_click", { source_section: "zone_page_hero", zone: slug })}
                    className="flex items-center gap-2"
                  >
                    <Phone className="w-5 h-5" />
                    0485 75 52 27
                  </a>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Body content */}
        <section className="py-12 md:py-16">
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
                  Questions des habitants de {cityName}
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

        <HomeReviewsBanner />

        {/* CTA final */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto">
            <div className="max-w-3xl mx-auto text-center bg-gradient-copper rounded-3xl p-10 md:p-14 shadow-copper-lg">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
                Votre électricien à {cityName}
              </h2>
              <p className="text-primary-foreground/90 text-lg mb-8 max-w-xl mx-auto">
                Devis gratuit et sans engagement. Adrian vous répond personnellement.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button size="lg" variant="secondary" asChild>
                  <a
                    href="tel:+32485755227"
                    data-analytics="call_click"
                    onClick={() => trackEvent("call_click", { source_section: "zone_page_cta", zone: slug })}
                    className="flex items-center gap-2"
                  >
                    <Phone className="w-5 h-5" />
                    0485 75 52 27
                  </a>
                </Button>
                <Button size="lg" variant="outline" asChild className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                  <Link
                    to="/contact"
                    data-analytics="quote_request"
                    onClick={() => trackEvent("quote_request", { source_section: "zone_page_cta", zone: slug })}
                  >
                    Demander un devis
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

export default ZonePageLayout;
