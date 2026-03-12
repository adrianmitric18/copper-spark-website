import { Star, ExternalLink, MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";

const GOOGLE_REVIEWS_URL = "https://g.page/r/CVLZZFVq3KkiEBM/review";

const testimonials = [
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
  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-5">
            Avis clients
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 font-display">
            Ils nous font confiance
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Découvrez les retours de nos clients satisfaits à Bruxelles et en Wallonie
          </p>
        </div>

        {/* Average rating badge */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-card border border-border/60 shadow-sm">
            <span className="text-3xl font-bold text-foreground">4,9</span>
            <div className="flex flex-col items-start">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-xs text-muted-foreground mt-0.5">sur Google</span>
            </div>
          </div>
        </div>

        {/* Testimonial cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col gap-3"
            >
              <StarRating rating={t.rating} />
              <p className="text-foreground text-sm leading-relaxed flex-1">
                "{t.text}"
              </p>
              <div className="flex items-center justify-between pt-3 border-t border-border/40">
                <span className="font-semibold text-sm text-foreground">{t.name}</span>
                <span className="text-xs text-muted-foreground">{t.date}</span>
              </div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="text-center space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button variant="copper" size="lg" asChild>
              <a href={GOOGLE_REVIEWS_URL} target="_blank" rel="noopener noreferrer">
                Voir tous les avis Google
                <ExternalLink className="w-4 h-4 ml-1" />
              </a>
            </Button>
            <Button variant="copperOutline" size="lg" asChild>
              <a href={GOOGLE_REVIEWS_URL} target="_blank" rel="noopener noreferrer">
                <MessageSquarePlus className="w-4 h-4 mr-1" />
                Laisser un avis
              </a>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Des retours authentiques de clients satisfaits en Belgique
          </p>
        </div>
      </div>
    </section>
  );
};

export default GoogleReviewsSection;
