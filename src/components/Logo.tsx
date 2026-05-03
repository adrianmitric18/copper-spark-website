import { motion } from "framer-motion";
// Logo header — affiché à h-14 (56px) / h-16 (64px). Variants 128w + 256w
// (retina) en AVIF/WebP. PNG kept as ultimate fallback.
import logoPic from "@/assets/logo-cuivre-electrique.png?w=128;256&format=avif;webp;png&as=picture";

const Logo = () => {
  return (
    <div className="flex items-center group">
      <motion.div 
        className="relative"
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.3 }}
      >
        {/* Glow effect behind logo */}
        <motion.div 
          className="absolute inset-0 bg-primary/30 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          animate={{ 
            scale: [1, 1.2, 1],
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Logo image with animations — picture wrapped in motion.div pour
            permettre l'AVIF/WebP responsive sans perdre les animations. */}
        <motion.div
          className="relative z-10"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          whileHover={{
            filter: "drop-shadow(0 0 15px rgba(205, 127, 50, 0.6))",
          }}
        >
          <picture>
            <source type="image/avif" srcSet={logoPic.sources.avif} sizes="(min-width: 768px) 64px, 56px" />
            <source type="image/webp" srcSet={logoPic.sources.webp} sizes="(min-width: 768px) 64px, 56px" />
            <img
              src={logoPic.img.src}
              alt="Le Cuivre Électrique"
              className="h-14 md:h-16 w-auto"
              width={logoPic.img.w}
              height={logoPic.img.h}
              loading="eager"
              decoding="async"
            />
          </picture>
        </motion.div>

        {/* Subtle pulse animation on the logo */}
        <motion.div 
          className="absolute inset-0 border-2 border-primary/20 rounded-full opacity-0 group-hover:opacity-100"
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0, 0.5, 0]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeOut"
          }}
        />
      </motion.div>
    </div>
  );
};

export default Logo;
