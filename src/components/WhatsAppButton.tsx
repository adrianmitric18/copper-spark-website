import { MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

const WhatsAppButton = () => {
  const phoneNumber = "32485755227";
  const message = encodeURIComponent("Bonjour, je souhaite obtenir un devis pour mes travaux électriques.");
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

  return (
    <motion.a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-40 group"
      aria-label="Contacter via WhatsApp"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ 
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay: 1.5
      }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Pulse animation ring */}
      <motion.div 
        className="absolute inset-0 rounded-full bg-[#25D366]"
        animate={{ 
          scale: [1, 1.5, 1],
          opacity: [0.4, 0, 0.4]
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div 
        className="absolute inset-0 rounded-full bg-[#25D366]"
        animate={{ 
          scale: [1, 1.3, 1],
          opacity: [0.3, 0, 0.3]
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5
        }}
      />
      
      {/* Button */}
      <motion.div 
        className="relative w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#25D366] flex items-center justify-center shadow-lg"
        whileHover={{ 
          boxShadow: "0 10px 30px rgba(37, 211, 102, 0.4)"
        }}
      >
        <MessageCircle className="w-7 h-7 md:w-8 md:h-8 text-white" />
      </motion.div>

      {/* Tooltip */}
      <motion.div 
        className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-4 py-2 bg-card border border-border rounded-xl text-foreground text-sm font-medium whitespace-nowrap pointer-events-none"
        initial={{ opacity: 0, x: 10, scale: 0.95 }}
        whileHover={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        Contactez-nous sur WhatsApp
      </motion.div>
    </motion.a>
  );
};

export default WhatsAppButton;
