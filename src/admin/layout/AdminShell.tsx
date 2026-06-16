import { useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Menu, X, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Sidebar from "@/admin/layout/Sidebar";
import BottomTabBar from "@/admin/layout/BottomTabBar";
import CommandPalette from "@/admin/components/CommandPalette";
import RdvRapideFab from "@/admin/components/RdvRapideFab";

interface AdminShellProps {
  email?: string | null;
  /** Titre affiché dans la barre du haut sur mobile. */
  mobileTitle?: string;
  children: ReactNode;
}

/**
 * Routes "racine" qui affichent le bouton menu (hamburger) à gauche du topbar.
 * Toutes les autres routes admin sont considérées comme sous-pages et
 * affichent un bouton retour intelligent à la place.
 */
const ROOT_ADMIN_ROUTES = new Set<string>([
  "/admin",
  "/admin/pipeline",
  "/admin/rdv",
  "/admin/rdv-rapide",
  "/admin/interventions",
  "/admin/chantiers",
  "/admin/avis",
]);

/**
 * Layout principal de la nouvelle interface admin.
 *
 * Desktop : sidebar verticale fixe à gauche, contenu à droite.
 * Mobile : sidebar cachée par défaut, accessible via bouton menu en haut.
 *           Sur les sous-pages (fiche lead, éditeur chantier...), le menu
 *           est remplacé par un bouton retour automatique.
 */
const AdminShell = ({ email, mobileTitle, children }: AdminShellProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isRootRoute = ROOT_ADMIN_ROUTES.has(location.pathname);

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
        <div className="md:hidden sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border/50 flex items-center gap-2 px-3 h-14">
          {isRootRoute ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(true)}
              aria-label="Ouvrir le menu"
              className="min-h-[44px] min-w-[44px]"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              aria-label="Retour à la page précédente"
              className="min-h-[44px] min-w-[44px]"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          {mobileTitle && (
            <p className="font-semibold truncate flex-1">{mobileTitle}</p>
          )}
          {/* Sur les sous-pages, raccourci menu hamburger en bout de barre */}
          {!isRootRoute && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(true)}
              aria-label="Ouvrir le menu"
              className="min-h-[44px] min-w-[44px]"
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* pb mobile : laisse la place à la barre d'onglets (~56px + safe area)
            pour qu'elle ne recouvre pas le bas du contenu. Aucun effet desktop. */}
        <main className="flex-1 overflow-x-hidden pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0">
          {children}
        </main>
      </div>

      {/* FAB mobile-only : créer un RDV rapide depuis n'importe où */}
      <RdvRapideFab />

      {/* Barre d'onglets mobile-only : navigation pouce. « Plus » rouvre le
          drawer Sidebar existant (rien n'est supprimé, rail 4). */}
      <BottomTabBar onOpenMore={() => setMobileOpen(true)} />
    </div>
  );
};

export default AdminShell;
