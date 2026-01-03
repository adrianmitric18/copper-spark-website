import { useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Images } from "lucide-react";
import { motion, useInView } from "framer-motion";
import LogoIcon from "@/components/LogoIcon";
import { categories } from "@/data/galleryData";

const GallerySection = () => {
  const headerRef = useRef(null);
  const isHeaderInView = useInView(headerRef, { once: true, margin: "-100px" });

  return (
    <section id="realisations" className="py-24 md:py-32 bg-background relative overflow-hidden">
      {/* Background accent */}
      <motion.div 
        className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px]"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{ 
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <div className="container mx-auto relative z-10">
        {/* Section header */}
        <div ref={headerRef} className="text-center mb-12 md:mb-16">
          <motion.span 
            initial={{ opacity: 0, y: 20 }}
            animate={isHeaderInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
            className="inline-block px-4 py-2 bg-primary/10 border border-primary/30 text-primary text-sm font-medium rounded-full mb-6"
          >
            Nos Réalisations
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            animate={isHeaderInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6"
          >
            La propreté{" "}
            <span className="text-gradient-copper">comme signature</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={isHeaderInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-muted-foreground max-w-2xl mx-auto text-lg"
          >
            Chaque câble a sa place, chaque connexion est parfaite. Découvrez notre travail minutieux.
          </motion.p>
        </div>

        {/* Category Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {categories.map((category, index) => (
            <CategoryCard 
              key={category.id}
              category={category}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

interface CategoryCardProps {
  category: typeof categories[0];
  index: number;
}

const CategoryCard = ({ category, index }: CategoryCardProps) => {
  const cardRef = useRef(null);
  const isInView = useInView(cardRef, { once: true, margin: "-50px" });

  // Generate random positions for lightning arcs
  const lightningArcs = useMemo(() => {
    return [...Array(4)].map((_, i) => ({
      id: i,
      startAngle: Math.random() * 360,
      length: 40 + Math.random() * 30,
      duration: 0.3 + Math.random() * 0.2,
      delay: Math.random() * 2,
    }));
  }, []);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.6, delay: index * 0.15 }}
    >
      <Link 
        to={`/realisations/${category.slug}`}
        className="group relative block h-[300px] md:h-[400px] rounded-2xl overflow-hidden cursor-pointer"
      >
        {/* Background Image */}
        <div className="absolute inset-0">
          <img 
            src={category.coverImage} 
            alt={category.label}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent opacity-80 group-hover:opacity-70 transition-opacity duration-500" />
        </div>
        
        {/* Animated electric vortex background - ALWAYS VISIBLE */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Central glow - always visible, intensifies on hover */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: 'radial-gradient(circle, hsl(var(--primary) / 0.5) 0%, transparent 70%)',
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.4, 0.7, 0.4],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          
          {/* Secondary pulsing ring - always visible */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border border-primary/40 opacity-50 group-hover:opacity-80 transition-opacity duration-500"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5,
            }}
          />
          
          {/* Orbiting particles - always visible */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-primary opacity-40 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                boxShadow: '0 0 10px hsl(var(--primary)), 0 0 20px hsl(var(--primary) / 0.5)',
              }}
              animate={{
                x: [
                  Math.cos((i * Math.PI * 2) / 8) * 60,
                  Math.cos((i * Math.PI * 2) / 8 + Math.PI) * 80,
                  Math.cos((i * Math.PI * 2) / 8) * 60,
                ],
                y: [
                  Math.sin((i * Math.PI * 2) / 8) * 60,
                  Math.sin((i * Math.PI * 2) / 8 + Math.PI) * 80,
                  Math.sin((i * Math.PI * 2) / 8) * 60,
                ],
              }}
              transition={{
                duration: 3 + i * 0.3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.2,
              }}
            />
          ))}

          {/* Lightning arcs - always visible */}
          {lightningArcs.map((arc) => (
            <motion.div
              key={arc.id}
              className="absolute top-1/2 left-1/2 h-0.5 bg-gradient-to-r from-primary via-primary to-transparent origin-left opacity-50 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                width: arc.length,
                rotate: `${arc.startAngle}deg`,
                boxShadow: '0 0 8px hsl(var(--primary)), 0 0 16px hsl(var(--primary) / 0.5)',
              }}
              animate={{
                opacity: [0, 0.8, 0],
                scaleX: [0.3, 1, 0.3],
              }}
              transition={{
                duration: arc.duration,
                repeat: Infinity,
                repeatDelay: 1 + arc.delay,
                ease: "easeOut",
              }}
            />
          ))}
          
          {/* Rotating ring of dots - always visible */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 opacity-40 group-hover:opacity-80 transition-opacity duration-500"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full bg-primary/60"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: `rotate(${i * 30}deg) translateX(70px)`,
                }}
              />
            ))}
          </motion.div>
        </div>

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
          {/* Icon */}
          <motion.div 
            className="absolute top-6 right-6 w-12 h-12 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center backdrop-blur-sm"
            whileHover={{ scale: 1.1, rotate: 180 }}
            transition={{ duration: 0.5 }}
          >
            <LogoIcon className="w-6 h-6 text-primary" />
          </motion.div>

          {/* Image count badge */}
          <div className="absolute top-6 left-6 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center gap-2">
            <Images className="w-4 h-4 text-primary" />
            <span className="text-sm text-foreground">{category.images.length} photos</span>
          </div>

          {/* Text content */}
          <div className="relative z-10">
            <motion.span 
              className="inline-block px-3 py-1 bg-primary/20 border border-primary/30 text-primary text-xs font-medium rounded-full mb-3"
              whileHover={{ scale: 1.05 }}
            >
              {category.description}
            </motion.span>
            <h3 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors duration-300">
              {category.label}
            </h3>
            
            {/* View gallery link */}
            <div className="flex items-center gap-2 text-primary opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
              <span className="text-sm font-medium">Voir la galerie</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Hover border effect */}
        <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-primary/50 transition-colors duration-500" />
      </Link>
    </motion.div>
  );
};

export default GallerySection;
