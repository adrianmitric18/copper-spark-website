import { ArrowDown, Phone, Star } from "lucide-react";
import LogoIcon from "@/components/LogoIcon";
import { Button } from "@/components/ui/button";
import { motion, useMotionValue, useSpring, useTransform, useMotionTemplate } from "framer-motion";
import { useEffect } from "react";
// Hero LCP image — responsive AVIF/WebP/JPG via vite-imagetools.
// Marked fetchpriority/eager/async on the <img> below for fastest LCP.
import heroPic from "@/assets/hero-lighting-design.jpg?w=640;1024;1920&format=avif;webp;jpg&as=picture";
import { useAnalyticsEvents } from "@/hooks/useAnalyticsEvents";
import { useAggregateRating } from "@/hooks/useAggregateRating";

const HeroSection = () => {
  const { trackEvent } = useAnalyticsEvents();
  const { data: rating } = useAggregateRating();

  // Mouse parallax effect only (no scroll parallax to avoid jank)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = {
    damping: 30,
    stiffness: 100
  };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      mouseX.set(x);
      mouseY.set(y);
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [mouseX, mouseY]);
  return <section id="accueil" className="relative min-h-screen flex items-center justify-center pt-24 pb-20 bg-background overflow-hidden">
      {/* Hero background image - static, no scroll parallax.
          Animation : scale-in only (pas d'opacity-0 → 1) pour ne pas
          retarder la détection LCP. */}
      <motion.div
        className="absolute inset-0 overflow-hidden"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      >
        <picture>
          <source type="image/avif" srcSet={heroPic.sources.avif} sizes="100vw" />
          <source type="image/webp" srcSet={heroPic.sources.webp} sizes="100vw" />
          <img
            src={heroPic.img.src}
            srcSet={heroPic.img.srcset}
            sizes="100vw"
            alt="Installation électrique design"
            className="w-full h-full object-cover"
            width={heroPic.img.w}
            height={heroPic.img.h}
            fetchPriority="high"
            loading="eager"
            decoding="async"
          />
        </picture>
      </motion.div>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        
        {/* Mouse-following spotlight glow - DESKTOP ONLY */}
        <motion.div className="absolute inset-0 pointer-events-none hidden md:block" style={{
          background: useMotionTemplate`radial-gradient(800px circle at ${useTransform(smoothMouseX, [0, 1], [0, 100])}% ${useTransform(smoothMouseY, [0, 1], [0, 100])}%, hsl(30, 100%, 50% / 0.25), transparent 50%)`
        }} />
        
        {/* Secondary smaller glow for intensity - DESKTOP ONLY */}
        <motion.div className="absolute inset-0 pointer-events-none hidden md:block" style={{
          background: useMotionTemplate`radial-gradient(400px circle at ${useTransform(smoothMouseX, [0, 1], [0, 100])}% ${useTransform(smoothMouseY, [0, 1], [0, 100])}%, hsl(40, 100%, 60% / 0.2), transparent 40%)`
        }} />
        
        {/* MOBILE: Automatic breathing/pulsing light effect */}
        <motion.div className="absolute inset-0 pointer-events-none md:hidden" animate={{
          opacity: [0.1, 0.35, 0.1]
        }} transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }} style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% 30%, hsl(30, 100%, 50% / 0.4), transparent 60%)'
        }} />
        
        {/* Overlay gradients */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/25 to-background/70" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/30 via-transparent to-background/30" />
      </div>

      {/* Simplified background glow - no mouse parallax to reduce jank */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[400px] md:h-[800px] bg-primary/15 rounded-full blur-[120px] animate-pulse" />

      <div className="container mx-auto relative z-10">
        <motion.div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div initial={{
          opacity: 0,
          y: 20,
          scale: 0.9
        }} animate={{
          opacity: 1,
          y: 0,
          scale: 1
        }} transition={{
          duration: 0.6,
          ease: "easeOut"
        }} className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary/15 border border-primary/40 rounded-full text-primary text-sm font-medium mb-10">
            <motion.div animate={{
            rotate: [0, 360]
          }} transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear"
          }}>
              <LogoIcon className="w-4 h-4" />
            </motion.div>
            <span className="text-2xl font-serif text-center">Artisan Électricien </span>
          </motion.div>

          {/* Main Title — fade simple pour LCP rapide (audit C5) */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="font-display text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-foreground leading-[1.1] mb-8"
          >
            <span className="block">Électricien indépendant</span>
            <span className="text-gradient-copper block mt-2">
              Brabant wallon, Wallonie &amp; Bruxelles
            </span>
          </motion.h1>

          {/* Subtitle / Slogan */}
          <motion.p initial={{
          opacity: 0,
          y: 30
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.6,
          delay: 0.2
          }} className="text-lg md:text-xl max-w-2xl mx-auto mb-6 leading-relaxed text-background">
            <span className="text-foreground font-medium">Basé à Court-Saint-Étienne</span>
          </motion.p>

          {/* Note Google — chip discrète, données dynamiques Supabase */}
          {rating && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="inline-flex items-center gap-2 mb-10"
            >
              <span className="flex" aria-hidden="true">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-primary text-primary" />
                ))}
              </span>
              <span className="text-sm text-foreground/80">
                <span className="font-semibold text-foreground">
                  {rating.ratingValueFormatted}/5
                </span>{" "}
                sur Google · {rating.reviewCount} avis
              </span>
            </motion.div>
          )}

          {/* CTA principal */}
          <motion.div initial={{
          opacity: 0,
          y: 30
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.6,
          delay: 0.4
        }} className="flex flex-col items-center gap-4">
            <Button variant="copper" size="xl" asChild className="min-w-[240px]">
              <a
                href="/contact"
                data-analytics="quote_request"
                onClick={() => trackEvent("quote_request", { source_section: "hero" })}
              >
                Demander un devis gratuit
              </a>
            </Button>

            {/* CTA urgence — discret, sous le CTA principal */}
            <a
              href="tel:+32485755227"
              data-analytics="call_click"
              onClick={() => trackEvent("call_click", { source_section: "hero_emergency" })}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <Phone className="w-4 h-4" aria-hidden="true" />
              <span>
                Urgence ?{" "}
                <span className="font-semibold text-foreground/90">
                  0485 75 52 27
                </span>
              </span>
            </a>
          </motion.div>

          {/* Horaires */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-sm text-muted-foreground mt-6 max-w-2xl mx-auto text-center"
          >
            Bureau : Lun-Ven 8h-18h, Sam 9h-13h — Dépannage urgent disponible 7j/7 24h/24
          </motion.p>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} transition={{
        duration: 0.6,
        delay: 0.7
      }} className="mt-16 text-center">
          <a href="/services" className="inline-flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
            <span className="text-sm font-medium">Découvrir nos services</span>
            <motion.div animate={{
            y: [0, 8, 0]
          }} transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}>
              <ArrowDown className="w-5 h-5" />
            </motion.div>
          </a>
        </motion.div>
      </div>
    </section>;
};
export default HeroSection;