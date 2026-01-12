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
      {/* Pulse animation ring - CSS animation */}
      <div className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-30" />
      
      {/* Button */}
      <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#25D366] flex items-center justify-center shadow-lg hover:shadow-[0_10px_30px_rgba(37,211,102,0.4)] transition-shadow">
        <MessageCircle className="w-7 h-7 md:w-8 md:h-8 text-white" />
      </div>

      {/* Tooltip - hidden on mobile to prevent overflow */}
      <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-4 py-2 bg-card border border-border rounded-xl text-foreground text-sm font-medium whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
        Contactez-nous sur WhatsApp
      </div>
    </motion.a>
  );
};

export default WhatsAppButton;
