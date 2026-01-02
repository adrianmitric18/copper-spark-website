import { Star, Quote, MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, useInView } from "framer-motion";
import { useRef, useState, memo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
interface Testimonial {
  id: number;
  name: string;
  location: string;
  rating: number;
  text: string;
  service: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Marie D.",
    location: "Bruxelles",
    rating: 5,
    text: "Travail impeccable ! L'électricien est arrivé rapidement pour un dépannage urgent. Très professionnel, propre et les prix sont honnêtes. Je recommande vivement !",
    service: "Dépannage urgent"
  },
  {
    id: 2,
    name: "Philippe V.",
    location: "Waterloo",
    rating: 4,
    text: "Installation de notre borne de recharge effectuée en une demi-journée. Travail soigné, juste un petit délai pour obtenir le rendez-vous mais le résultat est top.",
    service: "Borne de recharge"
  },
  {
    id: 3,
    name: "Sophie L.",
    location: "Namur",
    rating: 5,
    text: "Mise en conformité RGIE de notre maison ancienne. Le tableau électrique est magnifique, tout est étiqueté proprement. Un vrai artisan !",
    service: "Mise en conformité"
  },
  {
    id: 4,
    name: "Jean-Marc B.",
    location: "Liège",
    rating: 4,
    text: "Rénovation complète de l'électricité avec éclairage LED design. Très bon travail, quelques ajustements ont été nécessaires mais le rendu final est superbe.",
    service: "Rénovation & LED"
  },
];

const StarRating = memo(({ rating, interactive = false, onRate }: { rating: number; interactive?: boolean; onRate?: (r: number) => void }) => {
  const [hover, setHover] = useState(0);
  
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`w-5 h-5 transition-colors ${interactive ? 'cursor-pointer' : 'cursor-default'}`}
          onClick={() => interactive && onRate?.(star)}
          onMouseEnter={() => interactive && setHover(star)}
          onMouseLeave={() => interactive && setHover(0)}
          disabled={!interactive}
        >
          <Star
            className={`w-5 h-5 ${
              star <= (interactive ? (hover || rating) : rating)
                ? 'fill-primary text-primary'
                : 'text-muted-foreground/30'
            }`}
          />
        </button>
      ))}
    </div>
  );
});

const TestimonialCard = memo(({ testimonial, index }: { testimonial: Testimonial; index: number }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="relative bg-card border border-border/50 rounded-2xl p-6 shadow-lg hover:shadow-xl hover:border-primary/30 transition-all duration-300"
    >
      <Quote className="absolute top-4 right-4 w-8 h-8 text-primary/20" aria-hidden="true" />
      <StarRating rating={testimonial.rating} />
      <span className="inline-block mt-3 px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
        {testimonial.service}
      </span>
      <p className="mt-4 text-muted-foreground leading-relaxed">
        "{testimonial.text}"
      </p>
      <div className="mt-4 pt-4 border-t border-border/50">
        <p className="font-semibold text-foreground">{testimonial.name}</p>
        <p className="text-sm text-muted-foreground">{testimonial.location}</p>
      </div>
    </motion.div>
  );
});

const ReviewForm = ({ onClose }: { onClose: () => void }) => {
  const [rating, setRating] = useState(5);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [service, setService] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !message.trim()) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate submission (would need backend to actually store)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success("Merci pour votre avis ! Il sera publié après validation.");
    setIsSubmitting(false);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label className="text-foreground">Votre note *</Label>
        <div className="mt-2">
          <StarRating rating={rating} interactive onRate={setRating} />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name" className="text-foreground">Nom *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Votre prénom"
            className="mt-1"
            maxLength={50}
            required
          />
        </div>
        <div>
          <Label htmlFor="location" className="text-foreground">Ville</Label>
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Bruxelles"
            className="mt-1"
            maxLength={50}
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="service" className="text-foreground">Service effectué</Label>
        <Input
          id="service"
          value={service}
          onChange={(e) => setService(e.target.value)}
          placeholder="Ex: Dépannage, Installation..."
          className="mt-1"
          maxLength={100}
        />
      </div>
      
      <div>
        <Label htmlFor="message" className="text-foreground">Votre avis *</Label>
        <Textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Décrivez votre expérience..."
          className="mt-1 min-h-[100px]"
          maxLength={500}
          required
        />
      </div>
      
      <Button type="submit" variant="copper" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Envoi en cours..." : "Envoyer mon avis"}
      </Button>
    </form>
  );
};

const TestimonialsSection = () => {
  const headerRef = useRef(null);
  const isHeaderInView = useInView(headerRef, { once: true, margin: "-100px" });
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <section id="avis" className="py-24 md:py-32 bg-muted/30 relative overflow-hidden">
      {/* Background accent */}
      <motion.div 
        className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2"
        animate={{ 
          x: [50, -50, 50],
          scale: [1, 1.2, 1]
        }}
        transition={{ 
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <div className="container mx-auto relative z-10">
        {/* Section header */}
        <div ref={headerRef} className="text-center mb-16">
          <motion.span 
            initial={{ opacity: 0, y: 20 }}
            animate={isHeaderInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
            className="inline-block px-4 py-2 bg-primary/10 border border-primary/30 text-primary text-sm font-medium rounded-full mb-6"
          >
            Avis Clients
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            animate={isHeaderInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6"
          >
            Ce que disent{" "}
            <span className="text-gradient-copper">nos clients</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={isHeaderInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-muted-foreground max-w-2xl mx-auto text-lg"
          >
            La satisfaction de nos clients est notre meilleure carte de visite. Découvrez leurs témoignages.
          </motion.p>
        </div>

        {/* Testimonials grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard key={testimonial.id} testimonial={testimonial} index={index} />
          ))}
        </div>

        {/* CTA to leave review */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={isHeaderInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center"
        >
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="copper" size="lg" className="gap-2">
                <MessageSquarePlus className="w-5 h-5" />
                Laisser un avis
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl font-display">Partagez votre expérience</DialogTitle>
                <DialogDescription>Laissez-nous votre avis sur nos services électriques.</DialogDescription>
              </DialogHeader>
              <ReviewForm onClose={() => setDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;