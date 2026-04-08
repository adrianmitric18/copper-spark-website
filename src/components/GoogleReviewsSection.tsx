import { Star, ExternalLink, MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// ── Easy-to-change URLs ──
const googleReviewUrl = "https://g.page/r/CVLZZFVq3KkiEBM/review";
const testimonialFormUrl = "#";

const testimonials = [
  {
    name: "Martial Xhignesse",
    rating: 5,
    text: "Service impeccable ! Respect des délais, respect du devis ! Travail très bien effectué et surtout de façon très propre !!! Je referai appel c'est certain. Merci pour le travail",
    date: "Il y a 12 semaines",
  },
  {
    name: "Benoit Mansion",
    rating: 5,
    text: "J'ai fait appel au Cuivre Electrique à plusieurs reprises, que ce soit pour un chantier important (nouvelle cuisine), ou de petits dépannages. J'ai chaque fois été très satisfait. Adrian est fiable, compétent, et à l'écoute de ses clients, je recommande !",
    date: "Il y a 12 semaines",
  },
  {
    name: "Guillaume",
    rating: 5,
    text: "Service de qualité et bonne communication, à prix juste. Ne pas hésiter !",
    date: "Il y a 12 semaines",
  },
  {
    name: "Nicolai Mitric",
    rating: 5,
    text: "Parfait travail, merci Cuivre Électrique",
    date: "Il y a 12 semaines",
  },
  {
    name: "Dany Smeyers",
    rating: 5,
    text: "Adrian est hyper compétent et rigoureux dans son travail et ses conseils sont des plus précieux ! Merci pour le travail accompli dans notre maison",
    date: "Il y a 12 semaines",
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

const GoogleReviewsSection = () => {
  const [dialogOpen, setDialogOpen] = useState(false);

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
