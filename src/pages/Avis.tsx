import { useEffect, useState } from "react";
import { Star, ExternalLink, Quote } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import SEO from "@/components/SEO";
import StructuredData from "@/components/StructuredData";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAnalyticsEvents } from "@/hooks/useAnalyticsEvents";
import { useAggregateRating } from "@/hooks/useAggregateRating";
import { useDisplayRating } from "@/hooks/useDisplayRating";

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

const AverageStars = ({ value }: { value: number }) => {
  const fullStars = Math.floor(value);
  const partial = Math.max(0, Math.min(1, value - fullStars));
  const partialPct = Math.round(partial * 100);

  return (
    <div className="flex gap-0.5" aria-label={`Note moyenne ${value} sur 5`}>
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star key={`full-${i}`} className="w-6 h-6 fill-amber-400 text-amber-400" />
      ))}
      {fullStars < 5 && (
        <div className="relative w-6 h-6">
          <Star className="w-6 h-6 text-muted-foreground/25 absolute inset-0" />
          {partialPct > 0 && (
            <div className="overflow-hidden absolute inset-0" style={{ width: `${partialPct}%` }}>
              <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
            </div>
          )}
        </div>
      )}
      {Array.from({ length: Math.max(0, 5 - fullStars - 1) }).map((_, i) => (
        <Star key={`empty-${i}`} className="w-6 h-6 text-muted-foreground/25" />
      ))}
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
  const { trackEvent } = useAnalyticsEvents();
  // Affichage visible + meta : source unique (Google manuel puis fallback testimonials).
  const { data: display } = useDisplayRating();
  // JSON-LD aggregateRating : reste sur les testimonials first-party (décision SEO).
  const { data: aggregate } = useAggregateRating();

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
        title={
          display
            ? `Avis clients — ${display.ratingValueFormatted}/5 sur Google | Le Cuivre Électrique`
            : "Avis clients sur Google | Le Cuivre Électrique"
        }
        description={
          display
            ? `Découvrez les avis Google de nos clients en Brabant wallon, Wallonie et Bruxelles. Note moyenne ${display.ratingValueFormatted}/5 sur ${display.reviewCount} avis vérifiés.`
            : "Découvrez les avis Google de nos clients en Brabant wallon, Wallonie et Bruxelles. Avis vérifiés du Cuivre Électrique."
        }
        keywords="avis électricien Brabant wallon, avis Le Cuivre Électrique, témoignages clients, avis Google électricien"
        canonical="https://cuivre-electrique.com/avis"
      />
      {/* Aggregate rating exposé en JSON-LD pour rich snippets Google sur
          la page dédiée aux avis. Le hook ne renvoie le bloc que si
          reviewCount >= seuil (cf. useAggregateRating.MIN_REVIEWS_FOR_AGGREGATE). */}
      <StructuredData
        type="LocalBusiness"
        aggregateRating={
          aggregate
            ? {
                ratingValue: aggregate.ratingValueSchema,
                reviewCount: aggregate.reviewCount,
              }
            : undefined
        }
      />
      <Header />

      <main className="pt-24">
        <div className="container mx-auto px-4">
          <Breadcrumbs items={[{ label: "Avis", href: "/avis" }]} />
        </div>

        {/* HERO — titre + note dynamique + CTA principal Google (brief V3) */}
        <section className="py-12 md:py-20">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              Vos avis sur Google
            </h1>
            {display && (
              <div className="flex flex-col items-center gap-4 mb-8">
                <AverageStars value={display.ratingValue} />
                <p className="text-muted-foreground text-lg md:text-xl leading-relaxed">
                  <span className="text-foreground font-bold tabular-nums">
                    {display.ratingValueFormatted}/5
                  </span>{" "}
                  sur Google ·{" "}
                  <span className="text-foreground font-bold tabular-nums">
                    {display.reviewCount}+
                  </span>{" "}
                  avis vérifiés
                </p>
              </div>
            )}
            <Button variant="copper" size="xl" asChild className="group">
              <a
                href={GOOGLE_REVIEW_URL}
                target="_blank"
                rel="noopener noreferrer"
                data-analytics="review_click"
                onClick={() => trackEvent("review_click", { source_section: "avis_page_hero" })}
                className="inline-flex items-center gap-2"
              >
                Laissez votre avis sur Google
                <ExternalLink className="w-4 h-4" aria-hidden="true" />
              </a>
            </Button>
            <p className="text-xs text-muted-foreground mt-4">
              Vous serez redirigé vers notre fiche Google Business
            </p>
          </div>
        </section>

        {/* REVIEWS — 5 derniers en évidence puis le reste (brief V3) */}
        <section className="pb-16 md:pb-24 border-t border-border pt-16 md:pt-20">
          <div className="container mx-auto px-4 max-w-6xl">
            {loading ? (
              <p className="text-center text-muted-foreground">Chargement des avis…</p>
            ) : reviews.length === 0 ? (
              <p className="text-center text-muted-foreground">
                Aucun avis disponible pour le moment.
              </p>
            ) : (
              <>
                <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground text-center mb-10">
                  Les derniers avis
                </h2>

                {/* 5 derniers avis : grille 5 colonnes desktop, scroll horizontal mobile.
                    On évite un carrousel JS pour rester léger ; le scroll-snap mobile
                    donne le même feeling de carousel sans JS supplémentaire. */}
                <div
                  className="-mx-4 md:mx-0 px-4 md:px-0 overflow-x-auto md:overflow-visible snap-x snap-mandatory md:snap-none flex md:grid md:grid-cols-2 lg:grid-cols-5 gap-5 md:gap-4 pb-4 md:pb-0"
                >
                  {reviews.slice(0, 5).map((r) => (
                    <article
                      key={r.id}
                      className="snap-start shrink-0 w-[85vw] sm:w-[60vw] md:w-auto bg-card border border-primary/20 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-300 flex flex-col gap-3"
                    >
                      <StarRow rating={r.rating} size="w-3.5 h-3.5" />
                      <p className="text-foreground/90 text-sm leading-relaxed flex-1 line-clamp-6">
                        “{r.message}”
                      </p>
                      <div className="pt-3 border-t border-border/40">
                        <p className="font-semibold text-sm text-foreground">{r.name}</p>
                        <div className="flex items-center justify-between mt-0.5">
                          {r.city ? (
                            <p className="text-xs text-muted-foreground">{r.city}</p>
                          ) : (
                            <span />
                          )}
                          <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                            <Quote className="w-3 h-3" aria-hidden="true" />
                            Google · {formatDate(r.created_at)}
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                {reviews.length > 5 && (
                  <>
                    <h3 className="font-display text-xl md:text-2xl font-bold text-foreground text-center mt-16 mb-8">
                      Tous les avis
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {reviews.slice(5, visible).map((r) => (
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
              </>
            )}
          </div>
        </section>

        {/* BANDEAU BAS — encourager à laisser un avis (brief V3) */}
        <section className="pb-20 md:pb-28">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="rounded-2xl border border-primary/30 bg-card p-8 md:p-10 text-center">
              <h2 className="font-display text-xl md:text-2xl font-bold text-foreground mb-3">
                Laissez votre avis
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6 max-w-xl mx-auto">
                Vous avez fait appel à mes services ? Votre avis m'aide à
                grandir et aide d'autres clients à choisir en toute confiance.
              </p>
              <Button variant="copper" size="lg" asChild>
                <a
                  href={GOOGLE_REVIEW_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-analytics="review_click"
                  onClick={() => trackEvent("review_click", { source_section: "avis_page_bottom_cta" })}
                  className="inline-flex items-center gap-2"
                >
                  Laisser un avis Google
                  <ExternalLink className="w-4 h-4" aria-hidden="true" />
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
