import { Link, useLocation, useNavigate } from "react-router-dom";
import { Sun, Moon, LogOut, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useDarkMode } from "@/admin/hooks/useDarkMode";
import { cn } from "@/lib/utils";
import { NAV_PLUS, NAV_PRINCIPAL, type NavItem } from "@/admin/layout/navigation";

interface SidebarProps {
  /** Email de l'admin connecté, affiché en bas de la sidebar. */
  email: string | null | undefined;
  /** Sur mobile, callback de fermeture après navigation. */
  onNavigate?: () => void;
  /**
   * "complet" (bureau) : les 4 entrées principales puis le groupe « Plus ».
   * "plus" (tiroir du téléphone) : seulement le groupe « Plus » — les 4 entrées
   * principales sont déjà dans la barre du bas.
   */
  variant?: "complet" | "plus";
}

/**
 * Menu latéral. Même ordre que la barre du bas (source unique : navigation.ts) :
 * RDV rapide · Aujourd'hui · Leads · Heures, puis « Plus » = Calendrier,
 * Chantiers, Réalisations, Avis clients, Import archives.
 */
const Sidebar = ({ email, onNavigate, variant = "complet" }: SidebarProps) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { isDark, toggle } = useDarkMode();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  const entree = (item: NavItem) => {
    const Icon = item.icon;
    const active = item.match(pathname);
    return (
      <Link
        key={item.to}
        to={item.to}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px]",
          active
            ? "bg-primary/15 text-primary"
            : item.highlight
              ? "bg-primary/10 text-primary hover:bg-primary/15"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        <Icon className="w-[18px] h-[18px] shrink-0" />
        <span className="truncate">{item.label}</span>
      </Link>
    );
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
            <p className="font-display font-bold text-sm leading-tight truncate">Le Cuivre</p>
            <p className="text-xs text-primary leading-tight font-semibold">Back-office</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Menu">
        {variant === "complet" && (
          <>
            {NAV_PRINCIPAL.map(entree)}
            <div className="my-3 border-t border-border/50" />
          </>
        )}
        <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Plus
        </p>
        {NAV_PLUS.map(entree)}
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
