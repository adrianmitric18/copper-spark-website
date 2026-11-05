import { Link, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_PRINCIPAL, estDansPlus } from "@/admin/layout/navigation";

/**
 * Barre d'onglets en bas, MOBILE uniquement (md:hidden).
 *
 * Pensée pour le pouce d'un électricien pressé : 5 cibles larges (≥ 56 px),
 * atteignables d'une main.
 *
 * Lot 2.1 : RDV rapide · Aujourd'hui · Leads · Heures · Plus (source unique :
 * navigation.ts). « RDV rapide » est dans la barre — c'est l'action n° 1 quand
 * le téléphone sonne — et remplace le bouton flottant, qui faisait doublon.
 * « Plus » ouvre le tiroir latéral : Calendrier, Chantiers, Réalisations, Avis
 * clients, Import archives, thème, déconnexion. Rien n'est supprimé.
 */

interface BottomTabBarProps {
  /** Ouvre le tiroir latéral (menu « Plus »). */
  onOpenMore: () => void;
}

const BASE =
  "flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 min-h-[56px] pt-1.5 pb-1 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary";

const BottomTabBar = ({ onOpenMore }: BottomTabBarProps) => {
  const { pathname } = useLocation();
  const plusActif = estDansPlus(pathname);

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
      {NAV_PRINCIPAL.map((tab) => {
        const Icon = tab.icon;
        const active = tab.match(pathname);
        return (
          <Link
            key={tab.to}
            to={tab.to}
            aria-current={active ? "page" : undefined}
            className={cn(
              BASE,
              active
                ? "text-primary"
                : tab.highlight
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.highlight ? (
              // Action n° 1 : pastille pleine, repérable sans lire.
              <span className="flex items-center justify-center w-9 h-7 rounded-full bg-primary text-primary-foreground">
                <Icon className="w-4 h-4" strokeWidth={2.5} />
              </span>
            ) : (
              <Icon className="w-5 h-5 shrink-0" strokeWidth={active ? 2.5 : 2} />
            )}
            <span className="truncate max-w-full px-0.5">{tab.label}</span>
          </Link>
        );
      })}

      <button
        type="button"
        onClick={onOpenMore}
        aria-label="Plus : calendrier, chantiers, réalisations, avis, import"
        className={cn(BASE, plusActif ? "text-primary" : "text-muted-foreground hover:text-foreground")}
      >
        <Menu className="w-5 h-5 shrink-0" strokeWidth={plusActif ? 2.5 : 2} />
        <span>Plus</span>
      </button>
    </nav>
  );
};

export default BottomTabBar;
