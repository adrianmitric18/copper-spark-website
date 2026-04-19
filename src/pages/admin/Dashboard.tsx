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
import { Loader2, LogOut, Eye, Phone } from "lucide-react";
import { toast } from "sonner";

type Lead = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  client_type: string;
  services: string[];
  message: string;
  timing: string | null;
  source: string | null;
  photo_urls: string[] | null;
  status: string;
  notes: string | null;
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

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, isAdmin } = useAdminAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"desc" | "asc">("desc");
  const [page, setPage] = useState(1);

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
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Erreur de chargement : " + error.message);
    } else {
      setLeads((data as Lead[]) || []);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
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
        l.address.toLowerCase().includes(q)
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
    return {
      nouveau: leads.filter(l => l.status === "nouveau").length,
      enCours: leads.filter(l => l.status === "traité" || l.status === "devis envoyé").length,
      converti: leads.filter(l => l.status === "converti").length,
      perdu: leads.filter(l => l.status === "perdu").length,
      mois: leads.filter(l => new Date(l.created_at) >= monthStart).length,
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
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4" /> Déconnexion
            </Button>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card className="p-4"><p className="text-xs text-muted-foreground">Nouveaux</p><p className="text-2xl font-bold text-orange-600">{stats.nouveau}</p></Card>
            <Card className="p-4"><p className="text-xs text-muted-foreground">En cours</p><p className="text-2xl font-bold text-yellow-600">{stats.enCours}</p></Card>
            <Card className="p-4"><p className="text-xs text-muted-foreground">Convertis</p><p className="text-2xl font-bold text-green-600">{stats.converti}</p></Card>
            <Card className="p-4"><p className="text-xs text-muted-foreground">Perdus</p><p className="text-2xl font-bold text-muted-foreground">{stats.perdu}</p></Card>
            <Card className="p-4 col-span-2 md:col-span-1"><p className="text-xs text-muted-foreground">Total ce mois</p><p className="text-2xl font-bold text-primary">{stats.mois}</p></Card>
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
                      <TableHead>Services</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageLeads.map(lead => (
                      <TableRow key={lead.id}>
                        <TableCell className="text-sm">{formatDate(lead.created_at)}</TableCell>
                        <TableCell className="font-medium">{lead.name}</TableCell>
                        <TableCell>
                          <a href={`tel:${lead.phone}`} className="text-primary hover:underline">{lead.phone}</a>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {lead.services?.slice(0, 2).map(s => (
                              <Badge key={s} variant="secondary" className="text-xs">{s.split(" ")[0]}</Badge>
                            ))}
                            {lead.services?.length > 2 && <Badge variant="outline" className="text-xs">+{lead.services.length - 2}</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`capitalize ${statusColor(lead.status)}`} variant="outline">{lead.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button asChild size="sm" variant="outline">
                            <Link to={`/admin/lead/${lead.id}`}><Eye className="w-4 h-4" /> Détails</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>

              {/* Mobile cards */}
              <div className="md:hidden space-y-3">
                {pageLeads.map(lead => (
                  <Card key={lead.id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">{lead.name}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(lead.created_at)}</p>
                      </div>
                      <Badge className={`capitalize ${statusColor(lead.status)}`} variant="outline">{lead.status}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {lead.services?.map(s => (
                        <Badge key={s} variant="secondary" className="text-xs">{s.split(" ")[0]}</Badge>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button asChild size="sm" variant="outline" className="flex-1">
                        <a href={`tel:${lead.phone}`}><Phone className="w-4 h-4" /> Appeler</a>
                      </Button>
                      <Button asChild size="sm" variant="copper" className="flex-1">
                        <Link to={`/admin/lead/${lead.id}`}>Détails</Link>
                      </Button>
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
