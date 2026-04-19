import { useEffect, useState } from "react";
import { Star, ExternalLink, Quote } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import SEO from "@/components/SEO";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAnalyticsEvents } from "@/hooks/useAnalyticsEvents";

interface Testimonial {
  id: string;
  name: string;
  city: string | null;
  rating: number;
  message: string;
  service: string | null;
  created_at: string;
}

const GOOGLE_REVIEW_URL = "https://g.page/r/CVLZZFVq3KkiEBM/review";
const AVERAGE_RATING = 4.94;
const TOTAL_REVIEWS = 17;
const PAGE_SIZE = 12;

const StarRow = ({ rating, size = "w-4 h-4" }: { rating: number; size?: string }) => (
  <div className="flex gap-0.5" aria-label={`${rating} étoiles sur 5`}>
    {Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`${size} ${
          i < rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/25"
        }`}
      />
    ))}
  </div>
);

const AverageStars = () => {
  // 4.94 -> 4 full + 1 ~94% filled
  return (
    <div className="flex gap-0.5">
      {[0, 1, 2, 3].map((i) => (
        <Star key={i} className="w-6 h-6 fill-amber-400 text-amber-400" />
      ))}
      <div className="relative w-6 h-6">
        <Star className="w-6 h-6 text-muted-foreground/25 absolute inset-0" />
        <div className="overflow-hidden absolute inset-0" style={{ width: "94%" }}>
          <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
        </div>
      </div>
    </div>
  );
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-BE", {
    year: "numeric",
    month: "long",
  });

const Avis = () => {
  const [reviews, setReviews] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(PAGE_SIZE);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("id, name, city, rating, message, service, created_at")
        .eq("approved", true)
        .order("created_at", { ascending: false });
      if (!active) return;
      if (!error && data) setReviews(data as Testimonial[]);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SEO
        title="Avis clients — 4,94/5 sur Google | Le Cuivre Électrique"
        description="Découvrez les avis Google de nos clients en Brabant wallon, Wallonie et Bruxelles. Note moyenne 4,94/5 sur 17 avis vérifiés."
        keywords="avis électricien Brabant wallon, avis Le Cuivre Électrique, témoignages clients, avis Google électricien"
        canonical="https://cuivre-electrique.com/avis"
      />
      <Header />

      <main className="pt-24">
        <div className="container mx-auto px-4">
          <Breadcrumbs items={[{ label: "Avis", href: "/avis" }]} />
        </div>

        {/* HERO */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-5">
              Avis clients vérifiés
            </span>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              Les avis de nos clients
            </h1>
            <div className="flex flex-col items-center gap-3">
              <AverageStars />
              <p className="text-muted-foreground text-lg">
                <span className="text-foreground font-bold">{TOTAL_REVIEWS} avis Google</span>{" "}
                — Note moyenne{" "}
                <span className="text-foreground font-bold">{AVERAGE_RATING.toString().replace(".", ",")}/5</span>
              </p>
              <p className="text-sm text-muted-foreground opacity-70">
                14 commentaires détaillés ci-dessous
              </p>
            </div>
          </div>
        </section>

        {/* CTA GOOGLE PRINCIPAL */}
        <section className="pb-12 md:pb-16">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="rounded-3xl border-2 border-primary/40 bg-card/60 backdrop-blur-sm shadow-lg p-8 md:p-10 text-center">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">
                ⭐ Votre avis compte !
              </h2>
              <p className="text-muted-foreground leading-relaxed max-w-xl mx-auto mb-6">
                Vous avez fait appel à nos services ? Merci de partager votre expérience
                sur Google. Cela nous aide énormément à nous développer et permet à
                d'autres clients de nous trouver.
              </p>
              <Button variant="copper" size="xl" asChild>
                <a
                  href={GOOGLE_REVIEW_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-analytics="review_click"
                  className="inline-flex items-center gap-2"
                >
                  Laisser un avis sur Google
                  <ExternalLink className="w-4 h-4" />
                </a>
              </Button>
              <p className="text-xs text-muted-foreground mt-4">
                Vous serez redirigé vers notre fiche Google Business
              </p>
            </div>
          </div>
        </section>

        {/* REVIEWS GRID */}
        <section className="pb-16 md:pb-24">
          <div className="container mx-auto px-4 max-w-6xl">
            {loading ? (
              <p className="text-center text-muted-foreground">Chargement des avis…</p>
            ) : reviews.length === 0 ? (
              <p className="text-center text-muted-foreground">
                Aucun avis disponible pour le moment.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {reviews.slice(0, visible).map((r) => (
                    <article
                      key={r.id}
                      className="relative bg-card border border-border/50 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 flex flex-col gap-4"
                    >
                      <Quote className="absolute top-4 right-4 w-7 h-7 text-primary/15" aria-hidden="true" />
                      <div className="flex items-center justify-between pr-8">
                        <StarRow rating={r.rating} />
                        {r.service && (
                          <span className="inline-block px-2.5 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                            {r.service}
                          </span>
                        )}
                      </div>
                      <p className="text-foreground/90 text-sm leading-relaxed flex-1">
                        "{r.message}"
                      </p>
                      <div className="flex items-center justify-between pt-3 border-t border-border/40">
                        <div>
                          <p className="font-semibold text-sm text-foreground">{r.name}</p>
                          {r.city && (
                            <p className="text-xs text-muted-foreground">{r.city}</p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(r.created_at)}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>

                {visible < reviews.length && (
                  <div className="text-center mt-10">
                    <Button
                      variant="copperOutline"
                      onClick={() => setVisible((v) => v + PAGE_SIZE)}
                    >
                      Voir plus d'avis
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* CTA BAS */}
        <section className="pb-20 md:pb-28">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="rounded-2xl border border-border/60 bg-muted/30 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-5 text-center md:text-left">
              <p className="font-display text-lg md:text-xl font-semibold text-foreground">
                Vous aussi, partagez votre avis
              </p>
              <Button variant="copper" asChild>
                <a
                  href={GOOGLE_REVIEW_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-analytics="review_click"
                  className="inline-flex items-center gap-2"
                >
                  Laisser un avis Google
                  <ExternalLink className="w-4 h-4" />
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Avis;
