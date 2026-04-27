import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import UpcomingRdvCard from "@/components/admin/UpcomingRdvCard";
import StaleLeadsCard from "@/components/admin/StaleLeadsCard";
import InstallPwaPrompt from "@/components/admin/InstallPwaPrompt";
import ManualLeadDialog from "@/components/admin/ManualLeadDialog";
import { Loader2, LogOut, Eye, Phone, Trash2, Star, Calendar, RefreshCw, Download } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatHeure } from "@/lib/rdv/formatters";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import {
  fetchLeadsWithUpcomingRdvs,
  deleteLeadWithPhotos,
} from "@/lib/admin/queries";
import {
  type Lead,
  type UpcomingByLead,
  LEAD_STATUS_FILTERS,
  LEAD_SERVICES,
  leadStatusColor,
  leadSourceLabel,
} from "@/lib/admin/types";
import { downloadLeadsCsv } from "@/lib/admin/csv";
import AdminShell from "@/components/admin/AdminShell";
import AdminLoading from "@/components/admin/AdminLoading";

const PAGE_SIZE = 20;

const DeleteDialog = ({
  lead,
  trigger,
  onConfirm,
}: {
  lead: Lead;
  trigger: React.ReactNode;
  onConfirm: (lead: Lead) => void;
}) => (
  <AlertDialog>
    <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Supprimer ce lead ?</AlertDialogTitle>
        <AlertDialogDescription>
          Cette action est irréversible. Le lead <strong>{lead.name}</strong> et toutes ses données (photos incluses) seront définitivement supprimés.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Annuler</AlertDialogCancel>
        <AlertDialogAction onClick={() => onConfirm(lead)} className={buttonVariants({ variant: "destructive" })}>
          Oui, supprimer
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, ready, loading: authLoading } = useAdminGuard();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [upcomingByLead, setUpcomingByLead] = useState<UpcomingByLead>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"desc" | "asc">("desc");
  const [page, setPage] = useState(1);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);

  useEffect(() => { document.title = "Dashboard Admin – Le Cuivre Électrique"; }, []);

  const reloadLeads = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const { leads, upcomingByLead } = await fetchLeadsWithUpcomingRdvs();
      setLeads(leads);
      setUpcomingByLead(upcomingByLead);
      setLastFetchedAt(new Date());
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "connexion impossible";
      setLoadError(msg);
      toast.error("Erreur de chargement : " + msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!ready) return;
    void reloadLeads();
  }, [ready, user?.id]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  const onDeleteLead = async (lead: Lead) => {
    try {
      await deleteLeadWithPhotos(lead);
      setLeads((prev) => prev.filter((l) => l.id !== lead.id));
      toast.success("Lead supprimé");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "suppression impossible";
      toast.error("Erreur : " + msg);
    }
  };

  const filtered = useMemo(() => {
    let list = [...leads];
    if (statusFilter !== "all") list = list.filter(l => l.status === statusFilter);
    if (serviceFilter !== "all") list = list.filter(l => l.services?.includes(serviceFilter));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(l =>
        l.name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.phone.toLowerCase().includes(q) ||
        (l.address || "").toLowerCase().includes(q) ||
        (l.commune || "").toLowerCase().includes(q) ||
        (l.code_postal || "").toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      const da = new Date(a.created_at).getTime();
      const db = new Date(b.created_at).getTime();
      return sort === "desc" ? db - da : da - db;
    });
    return list;
  }, [leads, statusFilter, serviceFilter, search, sort]);

  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthLeads = leads.filter(l => new Date(l.created_at) >= monthStart);
    const sourceCounts = monthLeads.reduce<Record<string, number>>((acc, lead) => {
      const key = lead.source || "formulaire_site";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return {
      nouveau: leads.filter(l => l.status === "nouveau").length,
      enCours: leads.filter(l => l.status === "traité" || l.status === "devis envoyé").length,
      converti: leads.filter(l => l.status === "converti").length,
      perdu: leads.filter(l => l.status === "perdu").length,
      mois: monthLeads.length,
      sources: Object.entries(sourceCounts)
        .map(([source, count]) => ({ source, count, percent: monthLeads.length ? Math.round((count / monthLeads.length) * 100) : 0 }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 4),
    };
  }, [leads]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageLeads = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const formatDate = (s: string) =>
    new Date(s).toLocaleString("fr-BE", { dateStyle: "short", timeStyle: "short" });

  const formatLastFetched = (date: Date | null): string => {
    if (!date) return "";
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) return "à l'instant";
    if (minutes < 60) return `il y a ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `il y a ${hours}h`;
    return date.toLocaleDateString("fr-BE");
  };

  if (authLoading || !user) return <AdminLoading />;

  return (
    <AdminShell
      title="Back-office"
      subtitle={user.email}
      actions={
        <>
          <Button asChild variant="outline" size="sm" className="min-h-[40px]">
            <Link to="/admin/rdv"><Calendar className="w-4 h-4" /> <span className="hidden sm:inline">RDV</span></Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="min-h-[40px]">
            <Link to="/admin/avis"><Star className="w-4 h-4" /> <span className="hidden sm:inline">Gérer les avis</span></Link>
          </Button>
          <Button variant="outline" size="sm" onClick={handleLogout} className="min-h-[40px]">
            <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Déconnexion</span>
          </Button>
        </>
      }
    >
      {/* PWA install prompt (Android natif / iOS instructions) */}
      <InstallPwaPrompt />

      {/* Prochains RDV */}
      <UpcomingRdvCard />

      {/* Leads à relancer (auto-masqué si aucun) */}
      <StaleLeadsCard leads={leads} upcomingByLead={upcomingByLead} />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="p-4"><p className="text-xs text-muted-foreground">Nouveaux</p><p className="text-2xl font-bold text-orange-600">{stats.nouveau}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">En cours</p><p className="text-2xl font-bold text-yellow-600">{stats.enCours}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">Convertis</p><p className="text-2xl font-bold text-green-600">{stats.converti}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">Perdus</p><p className="text-2xl font-bold text-muted-foreground">{stats.perdu}</p></Card>
        <Card className="p-4 col-span-2 md:col-span-1"><p className="text-xs text-muted-foreground">Total ce mois</p><p className="text-2xl font-bold text-primary">{stats.mois}</p></Card>
      </div>

      {stats.sources.length > 0 && (
        <Card className="p-4 space-y-3">
          <p className="text-sm font-semibold">Sources des leads ce mois</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {stats.sources.map((item) => (
              <div key={item.source} className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">{leadSourceLabel(item.source)}</p>
                <p className="text-lg font-bold text-primary">{item.percent}%</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Leads</h1>
          <p className="text-sm text-muted-foreground">
            Demandes du site et leads ajoutés manuellement.
            {lastFetchedAt && (
              <>
                {" · "}
                <span className="text-xs">Mis à jour {formatLastFetched(lastFetchedAt)}</span>
              </>
            )}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={reloadLeads}
            disabled={loading}
            className="min-h-[40px]"
            aria-label="Actualiser la liste"
            title="Actualiser"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Actualiser</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => downloadLeadsCsv(filtered)}
            disabled={filtered.length === 0}
            className="min-h-[40px]"
            aria-label="Exporter les leads filtrés en CSV"
          >
            <Download className="w-4 h-4" />
            Export CSV
            {filtered.length > 0 && filtered.length !== leads.length && (
              <span className="text-xs text-muted-foreground ml-1">
                ({filtered.length})
              </span>
            )}
          </Button>
          <ManualLeadDialog />
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger><SelectValue placeholder="Statut" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous statuts</SelectItem>
              {LEAD_STATUS_FILTERS.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={serviceFilter} onValueChange={(v) => { setServiceFilter(v); setPage(1); }}>
            <SelectTrigger><SelectValue placeholder="Service" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous services</SelectItem>
              {LEAD_SERVICES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input
            placeholder="Rechercher (nom, tél, email...)"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          <Select value={sort} onValueChange={(v: "asc" | "desc") => setSort(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Plus récents d'abord</SelectItem>
              <SelectItem value="asc">Plus anciens d'abord</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Leads */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>
      ) : loadError ? (
        <Card className="p-6 text-center space-y-4">
          <div className="space-y-1">
            <p className="font-semibold">Impossible de charger les leads.</p>
            <p className="text-sm text-muted-foreground">Erreur : {loadError}</p>
          </div>
          <Button type="button" variant="copper" onClick={reloadLeads} className="min-h-[44px]">
            <RefreshCw className="w-4 h-4" /> Réessayer
          </Button>
        </Card>
      ) : pageLeads.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">Aucun lead trouvé.</Card>
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden md:block overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Commune</TableHead>
                  <TableHead>Services</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageLeads.map(lead => (
                  <TableRow key={lead.id}>
                    <TableCell className="text-sm">{formatDate(lead.created_at)}</TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-1.5">
                        <span>{lead.name}</span>
                        {upcomingByLead[lead.id] && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Calendar className="w-4 h-4 text-[hsl(var(--copper))] shrink-0" aria-label="RDV planifié" />
                            </TooltipTrigger>
                            <TooltipContent>
                              RDV planifié le {upcomingByLead[lead.id].date_rdv} à {formatHeure(upcomingByLead[lead.id].heure_rdv)}
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <a href={`tel:${lead.phone}`} className="text-primary hover:underline">{lead.phone}</a>
                    </TableCell>
                    <TableCell className="text-sm">{lead.commune || <span className="text-muted-foreground italic">—</span>}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {lead.services?.slice(0, 2).map(s => (
                          <Badge key={s} variant="secondary" className="text-xs">{s.split(" ")[0]}</Badge>
                        ))}
                        {lead.services?.length > 2 && <Badge variant="outline" className="text-xs">+{lead.services.length - 2}</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge className={`capitalize ${leadStatusColor(lead.status)}`} variant="outline">{lead.status}</Badge>
                        <Badge variant="secondary" className="w-fit text-xs">{leadSourceLabel(lead.source)}</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button asChild size="icon" variant="ghost" className="text-primary hover:bg-primary/10" aria-label={`Appeler ${lead.name}`}>
                          <a href={`tel:${lead.phone}`}><Phone className="w-4 h-4" /></a>
                        </Button>
                        <Button asChild size="sm" variant="outline">
                          <Link to={`/admin/lead/${lead.id}`}><Eye className="w-4 h-4" /> Détails</Link>
                        </Button>
                        <DeleteDialog
                          lead={lead}
                          onConfirm={onDeleteLead}
                          trigger={
                            <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10" aria-label="Supprimer">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          }
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {pageLeads.map(lead => (
              <Card key={lead.id} className="p-4 space-y-3 active:bg-muted/30 transition-colors">
                <Link to={`/admin/lead/${lead.id}`} className="block space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-base flex items-center gap-1.5">
                        <span className="truncate">{lead.name}</span>
                        {upcomingByLead[lead.id] && (
                          <Calendar className="w-4 h-4 text-[hsl(var(--copper))] shrink-0" aria-label="RDV planifié" />
                        )}
                      </p>
                      {lead.commune && <p className="text-sm text-muted-foreground">{lead.commune}</p>}
                      <p className="text-xs text-muted-foreground">{formatDate(lead.created_at)}</p>
                      <Badge variant="secondary" className="mt-1 w-fit text-xs">{leadSourceLabel(lead.source)}</Badge>
                      {upcomingByLead[lead.id] && (
                        <p className="text-xs text-[hsl(var(--copper))] font-medium mt-1">
                          📅 RDV {upcomingByLead[lead.id].date_rdv} · {formatHeure(upcomingByLead[lead.id].heure_rdv)}
                        </p>
                      )}
                    </div>
                    <Badge className={`capitalize ${leadStatusColor(lead.status)} shrink-0`} variant="outline">{lead.status}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {lead.services?.map(s => (
                      <Badge key={s} variant="secondary" className="text-xs">{s.split(" ")[0]}</Badge>
                    ))}
                  </div>
                </Link>
                <div className="flex gap-2 pt-1">
                  <Button asChild size="default" variant="outline" className="flex-1 min-h-[44px]">
                    <a href={`tel:${lead.phone}`} onClick={(e) => e.stopPropagation()}><Phone className="w-4 h-4" /> Appeler</a>
                  </Button>
                  <Button asChild size="default" variant="copper" className="flex-1 min-h-[44px]">
                    <Link to={`/admin/lead/${lead.id}`}>Fiche</Link>
                  </Button>
                  <DeleteDialog
                    lead={lead}
                    onConfirm={onDeleteLead}
                    trigger={
                      <Button size="icon" variant="outline" className="text-destructive hover:bg-destructive/10 min-h-[44px] min-w-[44px]" aria-label="Supprimer">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    }
                  />
                </div>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Précédent</Button>
              <span className="text-sm text-muted-foreground">Page {page} / {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Suivant</Button>
            </div>
          )}
        </>
      )}
    </AdminShell>
  );
};

export default AdminDashboard;
