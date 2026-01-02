import { Zap, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section
      id="accueil"
      className="relative min-h-screen flex items-center justify-center pt-24 pb-20 bg-background overflow-hidden"
    >
      {/* Background gradient effects */}
      <div className="absolute inset-0 bg-gradient-dark" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-primary/3 rounded-full blur-[100px]" />
      
      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />

      <div className="container mx-auto relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary/10 border border-primary/30 rounded-full text-primary text-sm font-medium mb-10 opacity-0 animate-fade-up">
            <Zap className="w-4 h-4" />
            <span>Artisan Électricien Premium</span>
          </div>

          {/* Main Title - Massive */}
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black text-foreground leading-[1.1] mb-8 opacity-0 animate-fade-up animation-delay-100">
            L'excellence électrique<br />
            <span className="text-gradient-copper">à Bruxelles & Wallonie</span>
          </h1>

          {/* Subtitle / Slogan */}
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 opacity-0 animate-fade-up animation-delay-200 leading-relaxed">
            On alimente vos idées,{" "}
            <span className="text-foreground font-medium">
              sans court-circuiter votre journée !
            </span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 opacity-0 animate-fade-up animation-delay-300">
            <Button variant="copper" size="xl" asChild className="min-w-[200px]">
              <a href="#contact" className="flex items-center gap-2">
                Demander un devis gratuit
              </a>
            </Button>
            <Button variant="copperOutline" size="xl" asChild className="min-w-[200px]">
              <a href="tel:+32485755227" className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                0485 75 52 27
              </a>
            </Button>
          </div>

          {/* Scroll indicator */}
          <div className="mt-20 opacity-0 animate-fade-up animation-delay-500">
            <a 
              href="#services" 
              className="inline-flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <span className="text-sm font-medium">Découvrir nos services</span>
              <ArrowDown className="w-5 h-5 animate-float" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
