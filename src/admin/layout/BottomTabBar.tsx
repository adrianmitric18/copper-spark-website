import { Link, useLocation } from "react-router-dom";
import { Home, Users, HardHat, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Barre d'onglets en bas, MOBILE uniquement (md:hidden).
 *
 * Pensée pour le pouce d'un électricien pressé : 4 cibles larges (≥ 56 px),
 * atteignables d'une main, plutôt que le hamburger en haut à gauche (le coin
 * le plus pénible à toucher sur un grand téléphone).
 *
 * 3 onglets = navigation directe (Aujourd'hui / Leads / Chantiers).
 * Le 4e « Plus » rouvre le drawer latéral existant (Sidebar) pour accéder au
 * reste (Calendrier, Réalisations, Avis, thème, déconnexion) — rien n'est
 * supprimé, on réutilise la Sidebar (rail 4).
 *
 * Le FAB « RDV rapide » (RdvRapideFab) reste au-dessus de cette barre : c'est
 * l'action n°1 quand le téléphone sonne.
 */

interface TabDef {
  to: string;
  label: string;
  icon: typeof Home;
  /** Correspondance stricte (ex. /admin) vs préfixe (ex. /admin/pipeline...). */
  exact?: boolean;
}

const TABS: TabDef[] = [
  { to: "/admin", label: "Aujourd'hui", icon: Home, exact: true },
  { to: "/admin/pipeline", label: "Leads", icon: Users },
  { to: "/admin/interventions", label: "Chantiers", icon: HardHat },
];

interface BottomTabBarProps {
  /** Ouvre le drawer latéral (menu « Plus »). */
  onOpenMore: () => void;
}

const BottomTabBar = ({ onOpenMore }: BottomTabBarProps) => {
  const { pathname } = useLocation();

  const isActive = (tab: TabDef): boolean =>
    tab.exact ? pathname === tab.to : pathname.startsWith(tab.to);

  return (
    <nav
      aria-label="Navigation principale"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      className={cn(
        "md:hidden fixed bottom-0 inset-x-0 z-30",
        "bg-card/95 backdrop-blur border-t border-border/60",
        "flex items-stretch",
      )}
    >
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const active = isActive(tab);
        return (
          <Link
            key={tab.to}
            to={tab.to}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5",
              "min-h-[56px] pt-1.5 pb-1 text-[11px] font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary",
              active ? "text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="w-5 h-5 shrink-0" strokeWidth={active ? 2.5 : 2} />
            <span className="truncate max-w-full">{tab.label}</span>
          </Link>
        );
      })}

      <button
        type="button"
        onClick={onOpenMore}
        aria-label="Ouvrir le menu (plus d'options)"
        className={cn(
          "flex-1 flex flex-col items-center justify-center gap-0.5",
          "min-h-[56px] pt-1.5 pb-1 text-[11px] font-medium transition-colors",
          "text-muted-foreground hover:text-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary",
        )}
      >
        <Menu className="w-5 h-5 shrink-0" strokeWidth={2} />
        <span>Plus</span>
      </button>
    </nav>
  );
};

export default BottomTabBar;
