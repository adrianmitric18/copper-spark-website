import { Star, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const GOOGLE_REVIEWS_URL = "https://g.page/r/CVLZZFVq3KkiEAE/review";

const fallbackTestimonials = [
  {
    name: "Marc D.",
    rating: 5,
    text: "Travail impeccable et soigné. L'équipe est ponctuelle et très professionnelle. Je recommande vivement pour toute installation électrique.",
    date: "Il y a 2 semaines",
  },
  {
    name: "Sophie L.",
    rating: 5,
    text: "Excellent service ! Mise en conformité RGIE réalisée rapidement. Très bon rapport qualité-prix et conseils pertinents.",
    date: "Il y a 1 mois",
  },
  {
    name: "Philippe V.",
    rating: 5,
    text: "Dépannage rapide un dimanche soir. Très réactif et prix honnête. Un électricien de confiance que je garde précieusement.",
    date: "Il y a 3 semaines",
  },
];

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? "fill-amber-400 text-amber-400" : "text-muted"}`}
      />
    ))}
  </div>
);

const GoogleReviewsSection = () => {
  // Set to true once you paste your widget code below
  const hasWidget = false;

  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full bg-accent border border-border/50">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="text-sm font-medium text-foreground">4,9/5 sur Google</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 font-display">
            Ils nous font confiance
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Découvrez les avis laissés par nos clients sur Google
          </p>
        </div>

        {/* Widget zone or fallback */}
        {hasWidget ? (
          <div className="mb-12">
            {/* ============================================ */}
            {/* COLLER ICI LE CODE DU WIDGET GOOGLE REVIEWS  */}
            {/* ============================================ */}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {fallbackTestimonials.map((t, i) => (
              <div
                key={i}
                className="bento-card flex flex-col gap-3"
              >
                <StarRating rating={t.rating} />
                <p className="text-foreground text-sm leading-relaxed flex-1">
                  "{t.text}"
                </p>
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <span className="font-semibold text-sm text-foreground">{t.name}</span>
                  <span className="text-xs text-muted-foreground">{t.date}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA + réassurance */}
        <div className="text-center space-y-4">
          <Button
            variant="copper"
            size="lg"
            asChild
          >
            <a href={GOOGLE_REVIEWS_URL} target="_blank" rel="noopener noreferrer">
              Voir tous les avis Google
              <ExternalLink className="w-4 h-4 ml-1" />
            </a>
          </Button>
          <p className="text-sm text-muted-foreground">
            Des retours authentiques de clients satisfaits en Belgique
          </p>
        </div>
      </div>
    </section>
  );
};

export default GoogleReviewsSection;
