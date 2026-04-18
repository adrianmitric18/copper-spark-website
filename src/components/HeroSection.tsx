import { ArrowDown } from "lucide-react";
import LogoIcon from "@/components/LogoIcon";
import { Button } from "@/components/ui/button";
import { motion, useMotionValue, useSpring, useTransform, useMotionTemplate } from "framer-motion";
import { useEffect } from "react";
import heroImage from "@/assets/hero-lighting-design.jpg";

const HeroSection = () => {
  const titleWords = ["Électricien", "agréé"];
  const subtitleWords = ["Brabant", "wallon,", "Wallonie", "&", "Bruxelles"];

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
      {/* Hero background image - static, no scroll parallax */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Base image with fixed dimensions */}
        <motion.img 
          src={heroImage} 
          alt="Installation électrique design" 
          className="w-full h-full object-cover"
          width={1920}
          height={1080}
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
        
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

          {/* Main Title - Word by word animation */}
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-foreground leading-[1.1] mb-8">
            <span className="block">
              {titleWords.map((word, index) => <motion.span key={index} initial={{
              opacity: 0,
              y: 50,
              rotateX: -90
            }} animate={{
              opacity: 1,
              y: 0,
              rotateX: 0
            }} transition={{
              duration: 0.6,
              delay: 0.2 + index * 0.15,
              ease: [0.25, 0.46, 0.45, 0.94]
            }} className="inline-block mr-4">
                  {word}
                </motion.span>)}
            </span>
            <span className="text-gradient-copper block mt-2">
              {subtitleWords.map((word, index) => <motion.span key={index} initial={{
              opacity: 0,
              y: 50,
              rotateX: -90
            }} animate={{
              opacity: 1,
              y: 0,
              rotateX: 0
            }} transition={{
              duration: 0.6,
              delay: 0.5 + index * 0.12,
              ease: [0.25, 0.46, 0.45, 0.94]
            }} className="inline-block mr-3 md:mr-4">
                  {word}
                </motion.span>)}
            </span>
          </h1>

          {/* Subtitle / Slogan */}
          <motion.p initial={{
          opacity: 0,
          y: 30
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.6,
          delay: 1
          }} className="text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed text-background">
            <span className="text-foreground font-medium">Basé à Court-Saint-Étienne</span> — Installation, dépannage 24h/24, conformité RGIE, bornes de recharge et photovoltaïque.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div initial={{
          opacity: 0,
          y: 30
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.6,
          delay: 1.2
        }} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.div whileHover={{
            scale: 1.05
          }} whileTap={{
            scale: 0.98
          }}>
              <Button variant="copper" size="xl" asChild className="min-w-[200px]">
                <a href="/contact" className="flex items-center gap-2">
                  Demander un devis gratuit
                </a>
              </Button>
            </motion.div>
            <motion.div whileHover={{
            scale: 1.05
          }} whileTap={{
            scale: 0.98
          }}>
              <Button variant="copperOutline" size="xl" asChild className="min-w-[200px]">
                <a href="tel:+32485755227" className="flex items-center gap-2">
                  <LogoIcon className="w-5 h-5" />
                  0485 75 52 27
                </a>
              </Button>
            </motion.div>
          </motion.div>

          {/* Horaires */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.2 }}
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
        delay: 1.5
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