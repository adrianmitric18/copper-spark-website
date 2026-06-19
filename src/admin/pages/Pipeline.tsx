import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Phone,
  Search,
  Calendar,
  Plus,
  Download,
  RefreshCw,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import { fetchLeadsWithUpcomingRdvs, updateLeadStatus } from "@/lib/admin/queries";
import {
  type Lead,
  leadSourceLabel,
  leadStatusColor,
} from "@/lib/admin/types";
import { downloadLeadsCsv } from "@/lib/admin/csv";
import { formatHeure } from "@/lib/rdv/formatters";
import AdminShell from "@/admin/layout/AdminShell";
import ManualLeadDialog from "@/components/admin/ManualLeadDialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const HOUR_MS = 60 * 60 * 1000;

const COLUMNS: { key: string; label: string; tint: string }[] = [
  { key: "nouveau", label: "Nouveau", tint: "border-orange-500/40 bg-orange-500/5" },
  { key: "traité", label: "Traité", tint: "border-yellow-500/40 bg-yellow-500/5" },
  { key: "devis envoyé", label: "Devis envoyé", tint: "border-blue-500/40 bg-blue-500/5" },
  { key: "converti", label: "Converti", tint: "border-green-500/40 bg-green-500/5" },
  { key: "perdu", label: "Perdu", tint: "border-muted bg-muted/30" },
];

// Statuts "terminés" (archivés) : sortis de la liste active par défaut.
const TERMINAL_STATUSES = new Set(["converti", "perdu"]);
const isTerminal = (status: string): boolean => TERMINAL_STATUSES.has(status);

// Colonnes actives (tout sauf terminés) — base des sous-filtres.
const ACTIVE_COLUMNS = COLUMNS.filter((c) => !isTerminal(c.key));

// Chips de filtre (réutilise le pattern Phase 1.4). Défaut = "Actifs" (exclut
// converti/perdu) ; "Terminés" regroupe converti + perdu (archive consultable).
const STATUS_CHIPS = [
  { key: "active", label: "Actifs" },
  ...ACTIVE_COLUMNS.map((c) => ({ key: c.key, label: c.label })),
  { key: "termines", label: "Terminés" },
];

// Vrai si un lead correspond au filtre courant (statut exact, "active" ou "termines").
const matchesStatusFilter = (status: string, filter: string): boolean => {
  if (filter === "active") return !isTerminal(status);
  if (filter === "termines") return isTerminal(status);
  return status === filter;
};

const ageInHours = (createdAt: string): number =>
  Math.floor((Date.now() - new Date(createdAt).getTime()) / HOUR_MS);

const formatAge = (hours: number): string => {
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "1 jour" : `${days} jours`;
};

interface LeadCardProps {
  lead: Lead;
  upcoming?: { date_rdv: string; heure_rdv: string };
  onStatusChange: (lead: Lead, newStatus: string) => void;
}

const LeadCard = ({ lead, upcoming, onStatusChange }: LeadCardProps) => {
  const hours = ageInHours(lead.created_at);
  const isOld = hours >= 48 && lead.status !== "converti" && lead.status !== "perdu";

  return (
    <Card className="p-3 space-y-2 hover:border-primary/40 transition-colors">
      <Link to={`/admin/lead/${lead.id}`} className="block space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm truncate">{lead.name}</p>
            {/* Sur un lead terminé, on montre le statut (gagné/perdu) — visible
                en clair dans l'onglet « Terminés ». */}
            {isTerminal(lead.status) && (
              <Badge
                variant="outline"
                className={`mt-1 text-[10px] px-1.5 py-0 ${leadStatusColor(lead.status)}`}
              >
                {lead.status}
              </Badge>
            )}
            {lead.commune && (
              <p className="text-xs text-muted-foreground truncate">{lead.commune}</p>
            )}
          </div>
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 shrink-0 ${
              isOld
                ? "bg-orange-500/15 text-orange-700 border-orange-500/30"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {formatAge(hours)}
          </Badge>
        </div>

        {lead.services && lead.services.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {lead.services.slice(0, 2).map((s) => (
              <Badge key={s} variant="secondary" className="text-[10px] px-1.5 py-0">
                {s.split(" ")[0]}
              </Badge>
            ))}
            {lead.services.length > 2 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                +{lead.services.length - 2}
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
          <span>{leadSourceLabel(lead.source)}</span>
          {upcoming && (
            <span className="flex items-center gap-1 text-primary font-medium">
              <Calendar className="w-3 h-3" />
              {upcoming.date_rdv} · {formatHeure(upcoming.heure_rdv)}
            </span>
          )}
        </div>
      </Link>

      <div className="flex items-center gap-1 pt-1 border-t border-border/40">
        <a
          href={`tel:${lead.phone}`}
          className="flex items-center justify-center flex-1 h-9 rounded-md text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
          aria-label={`Appeler ${lead.name}`}
        >
          <Phone className="w-3.5 h-3.5" />
          <span className="ml-1">Appeler</span>
        </a>
        <select
          value={lead.status}
          onChange={(e) => onStatusChange(lead, e.target.value)}
          className="text-xs h-9 px-2 rounded-md bg-background border border-border hover:border-primary/40 cursor-pointer min-w-0"
          aria-label="Changer le statut"
          onClick={(e) => e.stopPropagation()}
        >
          {COLUMNS.map((c) => (
            <option key={c.key} value={c.key}>
              → {c.label}
            </option>
          ))}
        </select>
      </div>
    </Card>
  );
};

// Phase 1.4 — ancien squelette du board kanban, conservé commenté (rail 4 :
// ne rien supprimer). Remplacé par un squelette de liste dans le rendu.
// const KanbanSkeleton = () => (
//   <div className="overflow-x-auto -mx-4 md:-mx-6 px-4 md:px-6 pb-2">
//     <div className="flex gap-3 min-w-max md:min-w-0">
//       {COLUMNS.map((col) => (
//         <div key={col.key} className={`flex-1 min-w-[280px] md:min-w-0 rounded-xl border ${col.tint} p-3 space-y-2`}>
//           ... colonnes ...
//         </div>
//       ))}
//     </div>
//   </div>
// );

const Pipeline = () => {
  const { user, ready } = useAdminGuard();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  // Défaut "active" : la liste principale n'affiche pas les leads terminés
  // (converti/perdu) — ils restent accessibles via le chip "Terminés".
  const [statusFilter, setStatusFilter] = useState<string>("active");

  useEffect(() => {
    document.title = "Leads – Le Cuivre Admin";
  }, []);

  // Cache partagé avec Aujourd'hui : nav instantanée entre les 2 pages.
  const leadsQuery = useQuery({
    queryKey: ["admin-leads-overview"],
    queryFn: fetchLeadsWithUpcomingRdvs,
    enabled: ready,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (leadsQuery.error) {
      const msg = leadsQuery.error instanceof Error ? leadsQuery.error.message : "chargement impossible";
      toast.error("Erreur : " + msg);
    }
  }, [leadsQuery.error]);

  const leads = useMemo(() => leadsQuery.data?.leads ?? [], [leadsQuery.data]);
  const upcomingByLead = useMemo(
    () => leadsQuery.data?.upcomingByLead ?? {},
    [leadsQuery.data],
  );
  const loading = leadsQuery.isLoading;

  const reload = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-leads-overview"] });
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return leads;
    const q = search.toLowerCase();
    return leads.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.phone.toLowerCase().includes(q) ||
        (l.commune || "").toLowerCase().includes(q) ||
        (l.code_postal || "").toLowerCase().includes(q),
    );
  }, [leads, search]);

  // Liste plate filtrée par chip ("Actifs" / sous-statut / "Terminés") puis triée.
  // Actifs : plus anciens d'abord (urgence). Terminés : plus récents d'abord (historique).
  const listed = useMemo(() => {
    const arr = filtered.filter((l) => matchesStatusFilter(l.status, statusFilter));
    // Terminés : historique → plus récents d'abord. Actifs / sous-statuts :
    // plus anciens d'abord (l'urgence remonte en tête).
    const reverse = statusFilter === "termines";
    return [...arr].sort((a, b) => {
      const da = new Date(a.created_at).getTime();
      const db = new Date(b.created_at).getTime();
      return reverse ? db - da : da - db;
    });
  }, [filtered, statusFilter]);

  const handleStatusChange = async (lead: Lead, newStatus: string) => {
    if (newStatus === lead.status) return;
    // Optimistic update direct dans le cache React Query
    queryClient.setQueryData<Awaited<ReturnType<typeof fetchLeadsWithUpcomingRdvs>>>(
      ["admin-leads-overview"],
      (prev) => prev && {
        ...prev,
        leads: prev.leads.map((l) => (l.id === lead.id ? { ...l, status: newStatus } : l)),
      },
    );
    try {
      await updateLeadStatus(lead.id, newStatus);
      toast.success(`${lead.name} → ${newStatus}`);
    } catch (e: unknown) {
      // Rollback : revert au statut d'avant
      queryClient.setQueryData<Awaited<ReturnType<typeof fetchLeadsWithUpcomingRdvs>>>(
        ["admin-leads-overview"],
        (prev) => prev && {
          ...prev,
          leads: prev.leads.map((l) => (l.id === lead.id ? { ...l, status: lead.status } : l)),
        },
      );
      const msg = e instanceof Error ? e.message : "mise à jour impossible";
      toast.error("Erreur : " + msg);
    }
  };

  return (
    <AdminShell email={user?.email} mobileTitle="Leads">
      <div className="p-4 md:p-6 space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold">
              Leads
            </h1>
            <p className="text-sm text-muted-foreground">
              {filtered.length} {filtered.length === 1 ? "lead" : "leads"}
              {search && " (filtré)"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={reload}
              disabled={loading}
              className="min-h-[40px]"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Actualiser</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => downloadLeadsCsv(filtered)}
              disabled={filtered.length === 0}
              className="min-h-[40px]"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </Button>
            <ManualLeadDialog />
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Rechercher (nom, tél, email, commune)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-11"
          />
        </div>

        {/* Filtres par statut (Phase 1.4 — liste filtrable, pouce, sans scroll horizontal du contenu) */}
        <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1">
          {STATUS_CHIPS.map((chip) => {
            const count = filtered.filter((l) =>
              matchesStatusFilter(l.status, chip.key),
            ).length;
            const active = statusFilter === chip.key;
            return (
              <button
                key={chip.key}
                type="button"
                onClick={() => setStatusFilter(chip.key)}
                aria-pressed={active}
                className={cn(
                  "shrink-0 min-h-[40px] px-3 rounded-full border text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border hover:border-primary/40",
                )}
              >
                {chip.label}
                {count > 0 && (
                  <span className={cn("ml-1.5 text-xs", active ? "opacity-90" : "text-muted-foreground")}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Liste verticale (Phase 1.4) — réutilise LeadCard en une colonne */}
        {loading ? (
          <div className="space-y-2 max-w-2xl">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-24 rounded-lg bg-muted/40 animate-pulse"
                style={{ animationDelay: `${i * 80}ms` }}
              />
            ))}
          </div>
        ) : listed.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground">
            Aucun lead pour ce filtre.
          </Card>
        ) : (
          <div className="space-y-2 max-w-2xl">
            {listed.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                upcoming={upcomingByLead[lead.id]}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && leads.length === 0 && (
          <Card className="p-12 text-center text-muted-foreground space-y-3">
            <Plus className="w-8 h-8 mx-auto text-muted-foreground/50" />
            <p>Aucun lead pour le moment.</p>
            <p className="text-sm">
              Les demandes via le formulaire du site apparaîtront ici. Tu peux
              aussi en ajouter manuellement avec le bouton &laquo; Nouveau lead &raquo;.
            </p>
          </Card>
        )}
      </div>
    </AdminShell>
  );
};

export default Pipeline;
