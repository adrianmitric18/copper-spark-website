import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";

interface AdminShellProps {
  /** Titre principal affiché dans le header. */
  title: string;
  /** Texte secondaire optionnel sous le titre (ex: email admin, compteur). */
  subtitle?: ReactNode;
  /**
   * Si fourni, affiche un bouton retour à gauche au lieu du Logo.
   * Utilisé par les pages de détail (/admin/lead/:id).
   */
  back?: { to: string; label?: string };
  /** Boutons / actions affichés à droite du header. */
  actions?: ReactNode;
  /** Contenu principal de la page. */
  children: ReactNode;
}

/**
 * Layout partagé entre toutes les pages /admin.
 * Header sticky avec backdrop-blur, container centré, et zone main
 * en dessous. Remplace le header dupliqué 4× dans les pages admin.
 */
const AdminShell = ({ title, subtitle, back, actions, children }: AdminShellProps) => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-10">
        {back ? (
          // Layout "détail" : back arrow + titre + actions
          <div className="container mx-auto px-4 py-4 flex items-center gap-4">
            <Button asChild variant="ghost" size="sm">
              <Link to={back.to}>
                <ArrowLeft className="w-4 h-4" /> {back.label ?? "Retour"}
              </Link>
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold truncate">{title}</h1>
              {subtitle && (
                <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
              )}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        ) : (
          // Layout "principal" : Logo + bloc titre + actions à droite
          <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Logo />
              <div className="hidden sm:block">
                <p className="text-sm font-semibold">{title}</p>
                {subtitle && (
                  <p className="text-xs text-muted-foreground">{subtitle}</p>
                )}
              </div>
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        )}
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">{children}</main>
    </div>
  );
};

export default AdminShell;
