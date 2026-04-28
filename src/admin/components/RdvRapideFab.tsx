import { Link, useLocation } from "react-router-dom";
import { Phone } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Bouton flottant "RDV rapide" visible uniquement sur mobile (md:hidden),
 * affiché sur toutes les pages admin sauf /admin/rdv-rapide elle-même
 * (pas la peine de pointer vers la page courante).
 */
const RdvRapideFab = () => {
  const { pathname } = useLocation();
  if (pathname.startsWith("/admin/rdv-rapide") || pathname === "/admin/login") {
    return null;
  }

  return (
    <Link
      to="/admin/rdv-rapide"
      aria-label="Créer un RDV rapide"
      className={cn(
        "md:hidden fixed bottom-5 right-5 z-40",
        "w-14 h-14 rounded-full bg-primary text-primary-foreground",
        "flex items-center justify-center",
        "shadow-copper-lg hover:scale-105 active:scale-95 transition-transform",
      )}
    >
      <Phone className="w-6 h-6" strokeWidth={2.5} />
      <span className="sr-only">Créer un RDV rapide</span>
    </Link>
  );
};

export default RdvRapideFab;
