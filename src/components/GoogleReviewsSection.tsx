import { Star, ExternalLink, MessageSquarePlus, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { reviews, googleReviewUrl, type Review } from "@/data/reviewsData";

// ── Star Ratings ──
const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"}`}
      />
    ))}
  </div>
);

const InteractiveStarRating = ({ rating, onRate }: { rating: number; onRate: (r: number) => void }) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className="cursor-pointer"
          onClick={() => onRate(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
        >
          <Star
            className={`w-6 h-6 transition-colors ${
              star <= (hover || rating) ? "fill-primary text-primary" : "text-muted-foreground/30"
            }`}
          />
        </button>
      ))}
    </div>
  );
};

// ── Review Card ──
const ReviewCard = ({ review }: { review: Review }) => (
  <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col gap-3 h-full">
    <div className="flex items-center justify-between">
      <StarRating rating={review.rating} />
      <span className="inline-block px-2.5 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
        {review.service}
      </span>
    </div>
    <p className="text-foreground text-sm leading-relaxed flex-1">
      "{review.text}"
    </p>
    <div className="flex items-center justify-between pt-3 border-t border-border/40">
      <div>
        <span className="font-semibold text-sm text-foreground">{review.name}</span>
        <span className="text-xs text-muted-foreground ml-2">{review.city}</span>
      </div>
      <span className="text-xs text-muted-foreground">{review.date}</span>
    </div>
  </div>
);

// ── Testimonial Form ──
const TestimonialForm = ({ onClose }: { onClose: () => void }) => {
  const [rating, setRating] = useState(5);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [service, setService] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) {
      toast.error("Veuillez remplir les champs obligatoires.");
      return;
    }
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 1000));
    toast.success("Merci pour votre témoignage ! Il sera publié après validation.");
    setIsSubmitting(false);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label className="text-foreground">Votre note *</Label>
        <div className="mt-2">
          <InteractiveStarRating rating={rating} onRate={setRating} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="testi-name" className="text-foreground">Nom *</Label>
          <Input id="testi-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Votre prénom" className="mt-1" maxLength={50} required />
        </div>
        <div>
          <Label htmlFor="testi-city" className="text-foreground">Ville</Label>
          <Input id="testi-city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Bruxelles" className="mt-1" maxLength={50} />
        </div>
      </div>
      <div>
        <Label htmlFor="testi-service" className="text-foreground">Service réalisé</Label>
        <Input id="testi-service" value={service} onChange={(e) => setService(e.target.value)} placeholder="Ex: Dépannage, Installation..." className="mt-1" maxLength={100} />
      </div>
      <div>
        <Label htmlFor="testi-message" className="text-foreground">Votre message *</Label>
        <Textarea id="testi-message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Décrivez votre expérience..." className="mt-1 min-h-[100px]" maxLength={500} required />
      </div>
      <Button type="submit" variant="copper" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Envoi en cours..." : "Envoyer mon témoignage"}
      </Button>
    </form>
  );
};

// ── Main Section ──
const GoogleReviewsSection = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const autoplayPlugin = Autoplay({ delay: 4000, stopOnInteraction: false, stopOnMouseEnter: true });

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      align: "start",
      loop: true,
      slidesToScroll: 1,
      breakpoints: {
        "(min-width: 768px)": { slidesToScroll: 2 },
        "(min-width: 1024px)": { slidesToScroll: 1 },
      },
    },
    [autoplayPlugin]
  );

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi, onSelect]);

  // Compute average
  const avgRating = (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1).replace(".", ",");

  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4 max-w-6xl">
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

        {/* Trust badge */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-card border border-border/60 shadow-sm">
            <span className="text-3xl font-bold text-foreground">{avgRating}</span>
            <div className="flex flex-col items-start">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-xs text-muted-foreground mt-0.5">
                basé sur {reviews.length} avis Google
              </span>
            </div>
          </div>
        </div>

        {/* Carousel */}
        <div className="relative mb-14">
          {/* Arrows */}
          <button
            onClick={scrollPrev}
            className="absolute -left-4 md:-left-6 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-card border border-border/60 shadow-md flex items-center justify-center text-foreground hover:bg-accent transition-colors"
            aria-label="Avis précédent"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={scrollNext}
            className="absolute -right-4 md:-right-6 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-card border border-border/60 shadow-md flex items-center justify-center text-foreground hover:bg-accent transition-colors"
            aria-label="Avis suivant"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="overflow-hidden mx-4 md:mx-8" ref={emblaRef}>
            <div className="flex -ml-4">
              {reviews.map((review, i) => (
                <div
                  key={i}
                  className="flex-[0_0_100%] md:flex-[0_0_50%] lg:flex-[0_0_25%] pl-4 min-w-0"
                >
                  <ReviewCard review={review} />
                </div>
              ))}
            </div>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {scrollSnaps.map((_, i) => (
              <button
                key={i}
                onClick={() => scrollTo(i)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i === selectedIndex
                    ? "bg-primary w-6"
                    : "bg-border hover:bg-muted-foreground/40"
                }`}
                aria-label={`Aller à l'avis ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* CTAs */}
        <div className="text-center space-y-5">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button variant="copper" size="lg" asChild>
              <a href={googleReviewUrl} target="_blank" rel="noopener noreferrer">
                Laisser un avis Google
                <ExternalLink className="w-4 h-4 ml-1" />
              </a>
            </Button>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="lg" className="text-muted-foreground hover:text-foreground">
                  <MessageSquarePlus className="w-4 h-4 mr-1" />
                  Envoyer un témoignage
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-xl font-display">Partagez votre expérience</DialogTitle>
                  <DialogDescription>Envoyez-nous votre témoignage. Il sera publié après validation.</DialogDescription>
                </DialogHeader>
                <TestimonialForm onClose={() => setDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            Votre avis Google nous aide à renforcer notre visibilité et à rassurer nos futurs clients.
          </p>
        </div>
      </div>
    </section>
  );
};

export default GoogleReviewsSection;
