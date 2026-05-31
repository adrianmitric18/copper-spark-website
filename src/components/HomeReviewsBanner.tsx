import { Star } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAnalyticsEvents } from "@/hooks/useAnalyticsEvents";
import { useGoogleRating, FALLBACK_GOOGLE_RATING } from "@/hooks/useGoogleRating";

const HomeReviewsBanner = () => {
  const { trackEvent } = useAnalyticsEvents();
  // Note Google LIVE (edge function + cache 24h). Fallback immédiat pour ne
  // jamais masquer le bandeau pendant le fetch.
  const { data } = useGoogleRating();
  const rating = data ?? FALLBACK_GOOGLE_RATING;

  return (
    <section className="py-12 md:py-16 bg-muted/30">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="rounded-2xl border border-primary/30 bg-card shadow-sm px-6 py-6 md:py-5 flex flex-col md:flex-row items-center justify-between gap-5">
          {/* Left: rating */}
          <div className="flex items-center gap-3 text-center md:text-left">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <div className="flex flex-col md:flex-row md:items-baseline md:gap-2">
              <span className="font-display font-bold text-foreground text-lg">
                {rating.ratingFormatted}/5 sur Google
              </span>
              <span className="text-muted-foreground text-sm">
                {rating.userRatingsTotal}+ avis Google vérifiés
              </span>
            </div>
          </div>

          {/* Right: CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Button variant="copper" asChild className="w-full sm:w-auto">
              <Link to="/avis">Voir tous les avis</Link>
            </Button>
            <Button variant="copperOutline" asChild className="w-full sm:w-auto">
              <a
                href="https://g.page/r/CVLZZFVq3KkiEBM/review"
                target="_blank"
                rel="noopener noreferrer"
                data-analytics="review_click"
                onClick={() => trackEvent("review_click", { source_section: "home_reviews_banner" })}
              >
                Laisser un avis
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeReviewsBanner;
