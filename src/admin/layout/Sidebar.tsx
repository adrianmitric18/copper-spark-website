import { NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  Kanban,
  Calendar,
  Star,
  Hammer,
  HardHat,
  Phone,
  Sun,
  Moon,
  LogOut,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useDarkMode } from "@/admin/hooks/useDarkMode";
import { cn } from "@/lib/utils";

const NAV_ITEMS_PRIMARY = [
  { to: "/admin/rdv-rapide", label: "RDV rapide", icon: Phone, end: false, highlight: true },
  { to: "/admin", label: "Aujourd'hui", icon: Home, end: true },
  { to: "/admin/pipeline", label: "Leads", icon: Kanban, end: false },
  { to: "/admin/rdv", label: "Calendrier", icon: Calendar, end: false },
  { to: "/admin/interventions", label: "Chantiers", icon: HardHat, end: false },
];

const NAV_ITEMS_SECONDARY = [
  { to: "/admin/chantiers", label: "Réalisations", icon: Hammer, end: false },
  { to: "/admin/avis", label: "Avis clients", icon: Star, end: false },
];

interface SidebarProps {
  /** Email de l'admin connecté, affiché en bas de la sidebar. */
  email: string | null | undefined;
  /** Sur mobile, callback de fermeture après navigation. */
  onNavigate?: () => void;
}

const Sidebar = ({ email, onNavigate }: SidebarProps) => {
  const navigate = useNavigate();
  const { isDark, toggle } = useDarkMode();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  return (
    <aside className="h-full flex flex-col bg-card border-r border-border/50 w-64 shrink-0">
      {/* Brand */}
      <div className="p-5 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-copper flex items-center justify-center shadow-copper shrink-0">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <p className="font-display font-bold text-sm leading-tight truncate">
              Le Cuivre
            </p>
            <p className="text-xs text-primary leading-tight font-semibold">
              Back-office
            </p>
          </div>
        </div>
      </div>

      {/* Nav : groupe primaire (leads/RDV) + séparateur + groupe secondaire (contenu) */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAV_ITEMS_PRIMARY.map((item) => {
          const Icon = item.icon;
          const highlight = "highlight" in item && item.highlight;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px]",
                  isActive
                    ? "bg-primary/15 text-primary"
                    : highlight
                      ? "bg-primary/10 text-primary hover:bg-primary/15"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )
              }
            >
              <Icon className="w-4.5 h-4.5 shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}

        <div className="my-3 border-t border-border/50" />
        <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          Contenu
        </p>

        {NAV_ITEMS_SECONDARY.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px]",
                  isActive
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )
              }
            >
              <Icon className="w-4.5 h-4.5 shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer : user + actions */}
      <div className="p-3 border-t border-border/50 space-y-2">
        {email && (
          <p className="text-xs text-muted-foreground px-2 truncate" title={email}>
            {email}
          </p>
        )}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggle}
            className="flex-1 min-h-[40px]"
            aria-label={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span className="text-xs">{isDark ? "Clair" : "Sombre"}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="flex-1 min-h-[40px]"
            aria-label="Se déconnecter"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-xs">Sortir</span>
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
