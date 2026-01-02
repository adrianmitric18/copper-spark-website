import { Zap, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, useMotionValue, useSpring, useTransform, useMotionTemplate } from "framer-motion";
import { useEffect, useState } from "react";
import heroImage from "@/assets/hero-lighting-design.jpg";
const HeroSection = () => {
  const titleWords = ["L'excellence", "électrique"];
  const subtitleWords = ["à", "Bruxelles", "&", "Wallonie"];

  // Mouse parallax effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Scroll parallax effect
  const scrollY = useMotionValue(0);
  const scrollParallax = useTransform(scrollY, [0, 800], [0, 200]);
  const scrollOpacity = useTransform(scrollY, [0, 600], [1, 0.3]);
  const scrollScale = useTransform(scrollY, [0, 800], [1, 1.15]);
  const springConfig = {
    damping: 30,
    stiffness: 100
  };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  // Transform for different parallax intensities
  const parallaxX1 = useTransform(smoothMouseX, [0, 1], [-15, 15]);
  const parallaxY1 = useTransform(smoothMouseY, [0, 1], [-15, 15]);
  const parallaxX2 = useTransform(smoothMouseX, [0, 1], [-25, 25]);
  const parallaxY2 = useTransform(smoothMouseY, [0, 1], [-25, 25]);
  const parallaxX3 = useTransform(smoothMouseX, [0, 1], [-40, 40]);
  const parallaxY3 = useTransform(smoothMouseY, [0, 1], [-40, 40]);
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      mouseX.set(x);
      mouseY.set(y);
    };
    const handleScroll = () => {
      scrollY.set(window.scrollY);
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll, {
      passive: true
    });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [mouseX, mouseY, scrollY]);
  return <section id="accueil" className="relative min-h-screen flex items-center justify-center pt-24 pb-20 bg-background overflow-hidden">
      {/* Hero background image with interactive lighting effect */}
      <motion.div className="absolute inset-0 overflow-hidden group" style={{
      opacity: scrollOpacity
    }}>
        {/* Base image */}
        <motion.img src={heroImage} alt="Installation électrique design" className="w-full h-full object-cover transition-all duration-500" initial={{
        scale: 1.3,
        opacity: 0
      }} animate={{
        scale: 1,
        opacity: 1
      }} transition={{
        duration: 2,
        ease: "easeOut"
      }} style={{
        y: scrollParallax,
        scale: scrollScale
      }} />
        
        {/* Mouse-following spotlight glow - DESKTOP ONLY */}
        <motion.div className="absolute inset-0 pointer-events-none hidden md:block" style={{
        background: useMotionTemplate`radial-gradient(800px circle at ${useTransform(smoothMouseX, [0, 1], [0, 100])}% ${useTransform(smoothMouseY, [0, 1], [0, 100])}%, hsl(30, 100%, 50% / 0.25), transparent 50%)`
      }} />
        
        {/* Secondary smaller glow for intensity - DESKTOP ONLY */}
        <motion.div className="absolute inset-0 pointer-events-none hidden md:block" style={{
        background: useMotionTemplate`radial-gradient(400px circle at ${useTransform(smoothMouseX, [0, 1], [0, 100])}% ${useTransform(smoothMouseY, [0, 1], [0, 100])}%, hsl(40, 100%, 60% / 0.2), transparent 40%)`
      }} />
        
        {/* Brightness boost on mouse area - DESKTOP ONLY */}
        <motion.div className="absolute inset-0 pointer-events-none mix-blend-overlay hidden md:block" style={{
        background: useMotionTemplate`radial-gradient(600px circle at ${useTransform(smoothMouseX, [0, 1], [0, 100])}% ${useTransform(smoothMouseY, [0, 1], [0, 100])}%, hsl(35, 100%, 70% / 0.3), transparent 50%)`
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
        
        {/* MOBILE: Moving light spot */}
        <motion.div className="absolute inset-0 pointer-events-none md:hidden" animate={{
        background: ['radial-gradient(400px circle at 30% 40%, hsl(35, 100%, 55% / 0.25), transparent 50%)', 'radial-gradient(400px circle at 70% 50%, hsl(35, 100%, 55% / 0.25), transparent 50%)', 'radial-gradient(400px circle at 50% 60%, hsl(35, 100%, 55% / 0.25), transparent 50%)', 'radial-gradient(400px circle at 30% 40%, hsl(35, 100%, 55% / 0.25), transparent 50%)']
      }} transition={{
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut"
      }} />
        
        {/* MOBILE: Subtle shimmer effect */}
        <motion.div className="absolute inset-0 pointer-events-none md:hidden mix-blend-overlay" animate={{
        opacity: [0, 0.3, 0]
      }} transition={{
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
        delay: 1.5
      }} style={{
        background: 'linear-gradient(45deg, transparent 30%, hsl(40, 100%, 60% / 0.2) 50%, transparent 70%)'
      }} />
        
        {/* Overlay - lighter for visibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/25 to-background/70" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/30 via-transparent to-background/30" />
      </motion.div>

      {/* Subtle floating particles that react to mouse */}
      {[...Array(15)].map((_, i) => <motion.div key={`particle-${i}`} className="absolute rounded-full pointer-events-none" style={{
      width: 3 + Math.random() * 5,
      height: 3 + Math.random() * 5,
      left: `${10 + Math.random() * 80}%`,
      top: `${10 + Math.random() * 80}%`,
      background: `radial-gradient(circle, hsl(35, 100%, 65%) 0%, transparent 70%)`,
      boxShadow: `0 0 15px 5px hsl(30, 100%, 50% / 0.4)`
    }} animate={{
      y: [0, -20, 0],
      opacity: [0.3, 0.8, 0.3],
      scale: [1, 1.3, 1]
    }} transition={{
      duration: 3 + Math.random() * 2,
      delay: i * 0.2,
      repeat: Infinity,
      ease: "easeInOut"
    }} />)}

      {/* Subtle energy waves emanating from center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        {[...Array(2)].map((_, i) => <motion.div key={`wave-${i}`} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{
        border: '1px solid hsl(30, 100%, 50% / 0.2)',
        boxShadow: '0 0 20px 5px hsl(30, 100%, 50% / 0.1)'
      }} initial={{
        width: 100,
        height: 100,
        opacity: 0.6
      }} animate={{
        width: [100, 800],
        height: [100, 800],
        opacity: [0.4, 0]
      }} transition={{
        duration: 5,
        delay: i * 2.5,
        repeat: Infinity,
        ease: "easeOut"
      }} />)}
      </div>

      {/* Pulsing rings from center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        {[...Array(3)].map((_, i) => <motion.div key={`ring-${i}`} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/30" initial={{
        width: 100,
        height: 100,
        opacity: 0.8
      }} animate={{
        width: [100, 600],
        height: [100, 600],
        opacity: [0.6, 0]
      }} transition={{
        duration: 4,
        delay: i * 1.3,
        repeat: Infinity,
        ease: "easeOut"
      }} />)}
      </div>

      {/* Background gradient effects with parallax */}
      <motion.div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px]" style={{
      x: parallaxX3,
      y: parallaxY3
    }} animate={{
      scale: [1, 1.2, 1],
      opacity: [0.3, 0.6, 0.3]
    }} transition={{
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut"
    }} />
      
      {/* Grid pattern overlay with subtle parallax */}
      <motion.div className="absolute inset-0 opacity-[0.02]" style={{
      backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
      backgroundSize: '60px 60px',
      x: parallaxX1,
      y: parallaxY1
    }} />

      <div className="container mx-auto relative z-10">
        <motion.div className="max-w-4xl mx-auto text-center" style={{
        x: parallaxX1,
        y: parallaxY1
      }}>
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
              <Zap className="w-4 h-4" />
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
        }} className="text-lg md:text-xl max-w-xl mx-auto mb-10 leading-relaxed text-background">
            On alimente vos idées,{" "}
            <span className="text-foreground font-medium">
              sans court-circuiter votre journée !
            </span>
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
                  <Zap className="w-5 h-5" />
                  0485 75 52 27
                </a>
              </Button>
            </motion.div>
          </motion.div>
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
          <a href="#services" className="inline-flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
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