import { motion } from "framer-motion";
import logoImage from "@/assets/logo-cuivre-electrique.png";

const Logo = () => {
  return (
    <a href="#accueil" className="flex items-center group">
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
        
        {/* Logo image with animations */}
        <motion.img 
          src={logoImage} 
          alt="Le Cuivre Électrique" 
          className="h-14 md:h-16 w-auto relative z-10"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          whileHover={{ 
            filter: "drop-shadow(0 0 15px rgba(205, 127, 50, 0.6))",
          }}
        />

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
    </a>
  );
};

export default Logo;
