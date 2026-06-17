import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Home,
  Kanban,
  Plus,
  Star,
  User,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { fetchLeadsWithUpcomingRdvs } from "@/lib/admin/queries";
import type { Lead } from "@/lib/admin/types";
import { leadSourceLabel } from "@/lib/admin/types";

/**
 * Palette de commande globale (Cmd/Ctrl + K).
 * Recherche dans les leads (nom, téléphone, email, commune) et propose les
 * navigations rapides vers les sections principales du back-office.
 */
const CommandPalette = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);

  // Raccourci clavier global Cmd/Ctrl + K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Phase 2.3 — ouverture depuis le bouton loupe mobile (la topbar dispatche
  // cet événement). Réutilise la même palette que le Cmd+K desktop.
  useEffect(() => {
    const openHandler = () => setOpen(true);
    window.addEventListener("admin:open-search", openHandler);
    return () => window.removeEventListener("admin:open-search", openHandler);
  }, []);

  // Précharge les leads quand la palette s'ouvre la première fois.
  useEffect(() => {
    if (!open || leads.length > 0) return;
    fetchLeadsWithUpcomingRdvs()
      .then(({ leads }) => setLeads(leads))
      .catch(() => {
        // Silencieux : la palette reste fonctionnelle pour la nav
      });
  }, [open, leads.length]);

  const go = (to: string) => {
    setOpen(false);
    navigate(to);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Rechercher un lead, naviguer..." />
      <CommandList>
        <CommandEmpty>Aucun résultat.</CommandEmpty>

        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => go("/admin")}>
            <Home className="mr-2 h-4 w-4" />
            <span>Aujourd'hui</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/admin/pipeline")}>
            <Kanban className="mr-2 h-4 w-4" />
            <span>Leads</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/admin/rdv")}>
            <Calendar className="mr-2 h-4 w-4" />
            <span>Calendrier (rendez-vous)</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/admin/avis")}>
            <Star className="mr-2 h-4 w-4" />
            <span>Avis clients</span>
          </CommandItem>
        </CommandGroup>

        {leads.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={`Leads (${leads.length})`}>
              {leads.slice(0, 50).map((lead) => (
                <CommandItem
                  key={lead.id}
                  // Concatène les champs cherchables pour que cmdk les match
                  value={`${lead.name} ${lead.email} ${lead.phone} ${lead.commune ?? ""} ${lead.code_postal ?? ""}`}
                  onSelect={() => go(`/admin/lead/${lead.id}`)}
                >
                  <User className="mr-2 h-4 w-4 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">{lead.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {lead.commune ? `${lead.commune} · ` : ""}
                      {lead.status} · {leadSourceLabel(lead.source)}
                    </p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
};

export default CommandPalette;
