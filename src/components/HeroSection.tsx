import { Zap, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";
import heroImage from "@/assets/hero-electricite.jpg";

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
      {/* Hero background image with scroll parallax */}
      <motion.div 
        className="absolute inset-0 overflow-hidden"
        style={{ opacity: scrollOpacity }}
      >
        <motion.img 
          src={heroImage} 
          alt="Installation électrique design" 
          className="w-full h-full object-cover"
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{ 
            y: scrollParallax,
            scale: scrollScale,
          }}
        />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/70 to-background/90" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-transparent to-background/60" />
      </motion.div>

      {/* Background gradient effects with parallax */}
      <div className="absolute inset-0 bg-gradient-dark opacity-50" />
      <motion.div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px]"
        style={{ x: parallaxX3, y: parallaxY3 }}
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.5, 0.8, 0.5]
        }}
        transition={{ 
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div 
        className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px]"
        style={{ x: parallaxX2, y: parallaxY2 }}
        animate={{ 
          scale: [1, 1.15, 1],
        }}
        transition={{ 
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Grid pattern overlay with subtle parallax */}
      <motion.div 
        className="absolute inset-0 opacity-[0.03]"
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
