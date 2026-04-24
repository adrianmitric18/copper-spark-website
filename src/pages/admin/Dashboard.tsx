import { useEffect, useMemo, useState } from "react";

import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import Logo from "@/components/Logo";
import UpcomingRdvCard from "@/components/admin/UpcomingRdvCard";
import InstallPwaPrompt from "@/components/admin/InstallPwaPrompt";
import ManualLeadDialog from "@/components/admin/ManualLeadDialog";
import { Loader2, LogOut, Eye, Phone, Trash2, Star, Calendar } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatHeure } from "@/lib/rdv/formatters";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";

type Lead = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  rue: string | null;
  numero: string | null;
  code_postal: string | null;
  commune: string | null;
  client_type: string;
  services: string[];
  message: string;
  timing: string | null;
  source: string | null;
  photo_urls: string[] | null;
  status: string;
  notes: string | null;
  notes_internes?: string | null;
};

const STATUSES = ["nouveau", "traité", "devis envoyé", "converti", "perdu"];
const SERVICES = [
  "Installation électrique / Rénovation",
  "Dépannage urgent",
  "Mise en conformité RGIE",
  "Borne de recharge voiture électrique",
  "Panneaux photovoltaïques",
  "Éclairage intérieur / extérieur",
  "Autre (préciser dans le message)",
];

const statusColor = (s: string) => {
  switch (s) {
    case "nouveau": return "bg-orange-500/15 text-orange-600 border-orange-500/30";
    case "traité": return "bg-yellow-500/15 text-yellow-700 border-yellow-500/30";
    case "devis envoyé": return "bg-blue-500/15 text-blue-600 border-blue-500/30";
    case "converti": return "bg-green-500/15 text-green-700 border-green-500/30";
    case "perdu": return "bg-muted text-muted-foreground border-border";
    default: return "";
  }
};

const PAGE_SIZE = 20;

const SOURCE_LABELS: Record<string, string> = {
  formulaire_site: "Site web",
  telephone: "Téléphone",
  whatsapp: "WhatsApp",
  facebook: "Facebook",
  recommandation: "Recommandation",
  chantier: "Chantier",
  autre: "Autre",
};

const sourceLabel = (source?: string | null) => SOURCE_LABELS[source || ""] || source || "Site web";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, isAdmin } = useAdminAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [upcomingByLead, setUpcomingByLead] = useState<Record<string, { date_rdv: string; heure_rdv: string }>>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"desc" | "asc">("desc");
  const [page, setPage] = useState(1);

  useEffect(() => { document.title = "Dashboard Admin – Le Cuivre Électrique"; }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/admin/login");
      return;
    }
    if (!isAdmin) {
      toast.error("Accès refusé");
      navigate("/");
      return;
    }
    fetchLeads();
  }, [user, authLoading, isAdmin, navigate]);

  const fetchLeads = async () => {
    setLoading(true);
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const [leadsRes, rdvRes] = await Promise.all([
      supabase.from("leads").select("*").order("created_at", { ascending: false }),
      supabase
        .from("rendez_vous")
        .select("lead_id, date_rdv, heure_rdv")
        .neq("statut", "annule")
        .gte("date_rdv", todayStr)
        .order("date_rdv", { ascending: true })
        .order("heure_rdv", { ascending: true }),
    ]);
    if (leadsRes.error) {
      toast.error("Erreur de chargement : " + leadsRes.error.message);
    } else {
      setLeads((leadsRes.data as Lead[]) || []);
    }
    if (!rdvRes.error && rdvRes.data) {
      const map: Record<string, { date_rdv: string; heure_rdv: string }> = {};
      for (const r of rdvRes.data as any[]) {
        if (!map[r.lead_id]) map[r.lead_id] = { date_rdv: r.date_rdv, heure_rdv: r.heure_rdv };
      }
      setUpcomingByLead(map);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  const deleteLead = async (lead: Lead) => {
    try {
      if (lead.photo_urls?.length) {
        const { error: storageErr } = await supabase.storage.from("lead-photos").remove(lead.photo_urls);
        if (storageErr) console.warn("Photos non supprimées:", storageErr.message);
      }
      const { error } = await supabase.from("leads").delete().eq("id", lead.id);
      if (error) throw error;
      setLeads(prev => prev.filter(l => l.id !== lead.id));
      toast.success("Lead supprimé");
    } catch (e: any) {
      toast.error("Erreur : " + (e?.message || "suppression impossible"));
    }
  };

  const DeleteDialog = ({ lead, trigger }: { lead: Lead; trigger: React.ReactNode }) => (
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
          <AlertDialogAction onClick={() => deleteLead(lead)} className={buttonVariants({ variant: "destructive" })}>
            Oui, supprimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

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

  if (authLoading || (!user && !authLoading)) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <>
      <div className="min-h-screen bg-background">
        <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-10">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Logo />
              <div className="hidden sm:block">
                <p className="text-sm font-semibold">Back-office</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm" className="min-h-[40px]">
                <Link to="/admin/rdv"><Calendar className="w-4 h-4" /> <span className="hidden sm:inline">RDV</span></Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="min-h-[40px]">
                <Link to="/admin/avis"><Star className="w-4 h-4" /> <span className="hidden sm:inline">Gérer les avis</span></Link>
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout} className="min-h-[40px]">
                <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Déconnexion</span>
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6 space-y-6">
          {/* PWA install prompt (Android natif / iOS instructions) */}
          <InstallPwaPrompt />

          {/* Prochains RDV */}
          <UpcomingRdvCard />

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
                    <p className="text-xs text-muted-foreground">{sourceLabel(item.source)}</p>
                    <p className="text-lg font-bold text-primary">{item.percent}%</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold">Leads</h1>
              <p className="text-sm text-muted-foreground">Demandes du site et leads ajoutés manuellement.</p>
            </div>
            <ManualLeadDialog />
          </div>

          {/* Filters */}
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger><SelectValue placeholder="Statut" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous statuts</SelectItem>
                  {STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={serviceFilter} onValueChange={(v) => { setServiceFilter(v); setPage(1); }}>
                <SelectTrigger><SelectValue placeholder="Service" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous services</SelectItem>
                  {SERVICES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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
                            <Badge className={`capitalize ${statusColor(lead.status)}`} variant="outline">{lead.status}</Badge>
                            <Badge variant="secondary" className="w-fit text-xs">{sourceLabel(lead.source)}</Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button asChild size="sm" variant="outline">
                              <Link to={`/admin/lead/${lead.id}`}><Eye className="w-4 h-4" /> Détails</Link>
                            </Button>
                            <DeleteDialog
                              lead={lead}
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
                          <Badge variant="secondary" className="mt-1 w-fit text-xs">{sourceLabel(lead.source)}</Badge>
                          {upcomingByLead[lead.id] && (
                            <p className="text-xs text-[hsl(var(--copper))] font-medium mt-1">
                              📅 RDV {upcomingByLead[lead.id].date_rdv} · {formatHeure(upcomingByLead[lead.id].heure_rdv)}
                            </p>
                          )}
                        </div>
                        <Badge className={`capitalize ${statusColor(lead.status)} shrink-0`} variant="outline">{lead.status}</Badge>
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
        </main>
      </div>
    </>
  );
};

export default AdminDashboard;
