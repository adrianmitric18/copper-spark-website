import { Phone, FileText } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAnalyticsEvents } from "@/hooks/useAnalyticsEvents";

const MobileStickyBar = () => {
  const { trackEvent } = useAnalyticsEvents();
  const { pathname } = useLocation();

  // Ne pas afficher la barre publique de conversion sur l'espace admin
  if (pathname.startsWith("/admin")) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card/95 backdrop-blur-md border-t border-border/60 px-4 py-3 safe-area-bottom">
      <div className="flex gap-3">
        <a
          href="tel:+32485755227"
          data-analytics="call_click"
          onClick={() => trackEvent("call_click", { source_section: "mobile_sticky_bar" })}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-md active:scale-95 transition-transform"
        >
          <Phone className="w-4 h-4" />
          Appeler
        </a>
        <Link
          to="/contact"
          data-analytics="quote_request"
          onClick={() => trackEvent("quote_request", { source_section: "mobile_sticky_bar" })}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-primary text-primary font-semibold text-sm active:scale-95 transition-transform"
        >
          <FileText className="w-4 h-4" />
          Devis gratuit
        </Link>
      </div>
    </div>
  );
};

export default MobileStickyBar;
