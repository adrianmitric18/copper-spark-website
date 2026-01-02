import { Zap, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section
      id="accueil"
      className="relative min-h-screen flex items-center justify-center pt-20 pb-16 bg-gradient-hero overflow-hidden"
    >
      {/* Decorative elements */}
      <div className="absolute top-1/4 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-10 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      
      {/* Floating icons */}
      <div className="absolute top-32 right-[15%] opacity-20 animate-float">
        <Zap className="w-16 h-16 text-primary" />
      </div>
      <div className="absolute bottom-32 left-[10%] opacity-20 animate-float animation-delay-500">
        <Zap className="w-12 h-12 text-primary" />
      </div>

      <div className="container mx-auto text-center relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent rounded-full text-accent-foreground text-sm font-medium mb-8 opacity-0 animate-fade-up">
            <Zap className="w-4 h-4" />
            <span>Électricien certifié en Belgique</span>
          </div>

          {/* Main Title */}
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight mb-6 opacity-0 animate-fade-up animation-delay-100">
            Votre électricien de confiance à{" "}
            <span className="text-gradient-copper">Bruxelles</span> et en{" "}
            <span className="text-gradient-copper">Wallonie</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 opacity-0 animate-fade-up animation-delay-200">
            Installation, mise en conformité et dépannage.{" "}
            <span className="text-foreground font-medium">
              On alimente vos idées, sans court-circuiter votre journée !
            </span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 opacity-0 animate-fade-up animation-delay-300">
            <Button variant="copper" size="xl" asChild>
              <a href="#contact" className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Demander un devis gratuit
              </a>
            </Button>
            <Button variant="emergency" size="xl" asChild>
              <a href="tel:+32123456789" className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Urgence 24h/24
              </a>
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="mt-16 pt-10 border-t border-border/50 opacity-0 animate-fade-up animation-delay-400">
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                  <span className="font-display font-bold text-primary">15+</span>
                </div>
                <span className="text-sm">ans d'expérience</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                  <span className="font-display font-bold text-primary">500+</span>
                </div>
                <span className="text-sm">projets réalisés</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                  <span className="font-display font-bold text-primary">100%</span>
                </div>
                <span className="text-sm">clients satisfaits</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
