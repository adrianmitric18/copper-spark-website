import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAnalyticsEvents } from "@/hooks/useAnalyticsEvents";

const CTAFinal = () => {
  const { trackEvent } = useAnalyticsEvents();

  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Prêt à démarrer votre projet&nbsp;?
          </h2>
          <p className="text-muted-foreground mb-8 text-lg">
            Devis gratuit, réponse rapide. Brabant wallon, Wallonie &amp; Bruxelles.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center">
            <Button variant="copper" size="xl" asChild className="min-w-[220px]">
              <a
                href="/contact"
                data-analytics="quote_request"
                onClick={() => trackEvent("quote_request", { source_section: "cta_final" })}
              >
                Demander un devis
              </a>
            </Button>
            <Button variant="copperOutline" size="xl" asChild className="min-w-[220px]">
              <a
                href="tel:+32485755227"
                data-analytics="call_click"
                onClick={() => trackEvent("call_click", { source_section: "cta_final" })}
              >
                <Phone className="w-5 h-5 mr-2" aria-hidden="true" />
                0485 75 52 27
              </a>
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mt-6">
            Bureau&nbsp;: Lun-Ven 8h-18h, Sam 9h-13h — Dépannage urgent 24h/24, 7j/7
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTAFinal;
