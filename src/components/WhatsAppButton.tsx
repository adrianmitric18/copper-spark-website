import { MessageCircle } from "lucide-react";

const WhatsAppButton = () => {
  const phoneNumber = "32485755227";
  const message = encodeURIComponent("Bonjour, je souhaite obtenir un devis pour mes travaux électriques.");
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-40 group"
      aria-label="Contacter via WhatsApp"
    >
      {/* Pulse animation ring */}
      <div className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-30" />
      
      {/* Button */}
      <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#25D366] flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300">
        <MessageCircle className="w-7 h-7 md:w-8 md:h-8 text-white" />
      </div>

      {/* Tooltip */}
      <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-4 py-2 bg-card border border-border rounded-xl text-foreground text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 transition-all duration-200 pointer-events-none">
        Contactez-nous sur WhatsApp
      </div>
    </a>
  );
};

export default WhatsAppButton;
