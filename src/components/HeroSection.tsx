import { Zap, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";
import heroImage from "@/assets/hero-abstract.jpg";

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

  const springConfig = { damping: 30, stiffness: 100 };
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
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [mouseX, mouseY, scrollY]);

  return (
    <section
      id="accueil"
      className="relative min-h-screen flex items-center justify-center pt-24 pb-20 bg-background overflow-hidden"
    >
      {/* Hero background image with scroll parallax - MORE VISIBLE */}
      <motion.div 
        className="absolute inset-0 overflow-hidden"
        style={{ opacity: scrollOpacity }}
      >
        <motion.img 
          src={heroImage} 
          alt="Installation électrique design" 
          className="w-full h-full object-cover"
          initial={{ scale: 1.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
          style={{ 
            y: scrollParallax,
            scale: scrollScale,
          }}
        />
        {/* LIGHTER overlay - image more visible */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/30 to-background/70" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/30 via-transparent to-background/30" />
      </motion.div>

      {/* Animated light beams */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-[200vh] w-[2px] bg-gradient-to-b from-transparent via-primary/40 to-transparent"
            style={{ left: `${15 + i * 18}%`, top: '-50%' }}
            initial={{ opacity: 0, y: '-100%' }}
            animate={{ 
              opacity: [0, 0.8, 0],
              y: ['0%', '100%'],
            }}
            transition={{
              duration: 3,
              delay: i * 0.4,
              repeat: Infinity,
              repeatDelay: 2,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Floating orbs with glow */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`orb-${i}`}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 4 + Math.random() * 8,
            height: 4 + Math.random() * 8,
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 80}%`,
            background: `radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)`,
            boxShadow: `0 0 20px 10px hsl(var(--primary) / 0.3)`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() > 0.5 ? 20 : -20, 0],
            scale: [1, 1.5, 1],
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            duration: 4 + Math.random() * 3,
            delay: i * 0.3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}

      {/* MINI LIGHTNING SPARKS - Everywhere! */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 15 }}>
        {[...Array(35)].map((_, i) => {
          const x = Math.random() * 100;
          const y = Math.random() * 100;
          const size = 8 + Math.random() * 20;
          const delay = Math.random() * 5;
          const duration = 0.15 + Math.random() * 0.2;
          
          return (
            <motion.svg
              key={`mini-bolt-${i}`}
              className="absolute"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                width: size,
                height: size * 2,
              }}
              viewBox="0 0 20 40"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: [0, 1, 1, 0],
                scale: [0.5, 1.2, 1, 0],
              }}
              transition={{
                duration: duration,
                delay: delay,
                repeat: Infinity,
                repeatDelay: 1.5 + Math.random() * 3,
                times: [0, 0.2, 0.6, 1]
              }}
            >
              <path
                d="M12,0 L8,15 L14,16 L6,40 L10,22 L4,21 L12,0"
                fill="hsl(45, 100%, 70%)"
                filter="url(#mini-glow)"
              />
              <defs>
                <filter id="mini-glow" x="-100%" y="-100%" width="300%" height="300%">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
            </motion.svg>
          );
        })}
      </div>

      {/* ELECTRIC CRACKLES - Tiny sparks that pop */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 14 }}>
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={`crackle-${i}`}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{
              duration: 0.1,
              delay: i * 0.15,
              repeat: Infinity,
              repeatDelay: 2 + Math.random() * 4,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16">
              <motion.line
                x1="8" y1="0" x2="8" y2="6"
                stroke="hsl(40, 100%, 65%)"
                strokeWidth="1.5"
                strokeLinecap="round"
                filter="url(#spark-glow)"
              />
              <motion.line
                x1="8" y1="10" x2="8" y2="16"
                stroke="hsl(40, 100%, 65%)"
                strokeWidth="1.5"
                strokeLinecap="round"
                filter="url(#spark-glow)"
              />
              <motion.line
                x1="0" y1="8" x2="6" y2="8"
                stroke="hsl(40, 100%, 65%)"
                strokeWidth="1.5"
                strokeLinecap="round"
                filter="url(#spark-glow)"
              />
              <motion.line
                x1="10" y1="8" x2="16" y2="8"
                stroke="hsl(40, 100%, 65%)"
                strokeWidth="1.5"
                strokeLinecap="round"
                filter="url(#spark-glow)"
              />
              <defs>
                <filter id="spark-glow" x="-200%" y="-200%" width="500%" height="500%">
                  <feGaussianBlur stdDeviation="1.5" result="blur"/>
                  <feMerge>
                    <feMergeNode in="blur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
            </svg>
          </motion.div>
        ))}
      </div>

      {/* SPARK BURSTS - Small explosions of light */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 13 }}>
        {[...Array(25)].map((_, i) => (
          <motion.div
            key={`burst-${i}`}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: 4,
              height: 4,
              background: 'hsl(45, 100%, 75%)',
              borderRadius: '50%',
              boxShadow: '0 0 10px 5px hsl(40, 100%, 60%), 0 0 20px 10px hsl(30, 100%, 50% / 0.6), 0 0 30px 15px hsl(25, 95%, 45% / 0.3)',
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 2, 0],
            }}
            transition={{
              duration: 0.25,
              delay: i * 0.2,
              repeat: Infinity,
              repeatDelay: 3 + Math.random() * 4,
            }}
          />
        ))}
      </div>

      {/* Pulsing rings from center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={`ring-${i}`}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/30"
            initial={{ width: 100, height: 100, opacity: 0.8 }}
            animate={{ 
              width: [100, 600],
              height: [100, 600],
              opacity: [0.6, 0],
            }}
            transition={{
              duration: 4,
              delay: i * 1.3,
              repeat: Infinity,
              ease: "easeOut"
            }}
          />
        ))}
      </div>

      {/* Background gradient effects with parallax */}
      <motion.div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px]"
        style={{ x: parallaxX3, y: parallaxY3 }}
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{ 
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Grid pattern overlay with subtle parallax */}
      <motion.div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
          x: parallaxX1,
          y: parallaxY1,
        }}
      />

      <div className="container mx-auto relative z-10">
        <motion.div 
          className="max-w-4xl mx-auto text-center"
          style={{ x: parallaxX1, y: parallaxY1 }}
        >
          {/* Badge */}
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary/15 border border-primary/40 rounded-full text-primary text-sm font-medium mb-10"
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Zap className="w-4 h-4" />
            </motion.div>
            <span>Artisan Électricien Premium</span>
          </motion.div>

          {/* Main Title - Word by word animation */}
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-foreground leading-[1.1] mb-8">
            <span className="block">
              {titleWords.map((word, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, y: 50, rotateX: -90 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0 }}
                  transition={{ 
                    duration: 0.6, 
                    delay: 0.2 + index * 0.15,
                    ease: [0.25, 0.46, 0.45, 0.94]
                  }}
                  className="inline-block mr-4"
                >
                  {word}
                </motion.span>
              ))}
            </span>
            <span className="text-gradient-copper block mt-2">
              {subtitleWords.map((word, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, y: 50, rotateX: -90 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0 }}
                  transition={{ 
                    duration: 0.6, 
                    delay: 0.5 + index * 0.12,
                    ease: [0.25, 0.46, 0.45, 0.94]
                  }}
                  className="inline-block mr-3 md:mr-4"
                >
                  {word}
                </motion.span>
              ))}
            </span>
          </h1>

          {/* Subtitle / Slogan */}
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed"
          >
            On alimente vos idées,{" "}
            <span className="text-foreground font-medium">
              sans court-circuiter votre journée !
            </span>
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button variant="copper" size="xl" asChild className="min-w-[200px]">
                <a href="#contact" className="flex items-center gap-2">
                  Demander un devis gratuit
                </a>
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
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
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.5 }}
          className="mt-16 text-center"
        >
          <a 
            href="#services" 
            className="inline-flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <span className="text-sm font-medium">Découvrir nos services</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <ArrowDown className="w-5 h-5" />
            </motion.div>
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
