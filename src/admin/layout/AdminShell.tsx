import { useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Sidebar from "@/admin/layout/Sidebar";
import CommandPalette from "@/admin/components/CommandPalette";

interface AdminShellProps {
  email?: string | null;
  /** Titre affiché dans la barre du haut sur mobile. */
  mobileTitle?: string;
  children: ReactNode;
}

/**
 * Layout principal de la nouvelle interface admin.
 *
 * Desktop : sidebar verticale fixe à gauche, contenu à droite.
 * Mobile : sidebar cachée par défaut, accessible via bouton menu en haut.
 */
const AdminShell = ({ email, mobileTitle, children }: AdminShellProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Palette globale Cmd+K disponible sur toutes les pages admin */}
      <CommandPalette />

      {/* Sidebar desktop : toujours visible */}
      <div className="hidden md:flex sticky top-0 h-screen">
        <Sidebar email={email} />
      </div>

      {/* Sidebar mobile : drawer overlay */}
      {mobileOpen && (
        <>
          <button
            type="button"
            aria-label="Fermer le menu"
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed left-0 top-0 bottom-0 z-50 md:hidden">
            <Sidebar email={email} onNavigate={() => setMobileOpen(false)} />
          </div>
        </>
      )}

      {/* Zone principale */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar mobile uniquement */}
        <div className="md:hidden sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border/50 flex items-center gap-3 px-4 h-14">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
            aria-label="Ouvrir le menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
          {mobileTitle && (
            <p className="font-semibold truncate">{mobileTitle}</p>
          )}
        </div>

        <main className="flex-1 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
};

export default AdminShell;
