import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import Logo from "@/components/Logo";
import { Loader2, ArrowLeft, Eye, Calendar } from "lucide-react";
import { toast } from "sonner";
import { formatHeure } from "@/lib/rdv/formatters";

type RdvRow = {
  id: string;
  lead_id: string;
  date_rdv: string;
  heure_rdv: string;
  type_visite: string;
  statut: string;
  lead_name: string;
  lead_phone: string;
  lead_commune: string | null;
};

type FilterKey = "a_venir" | "aujourdhui" | "semaine" | "mois" | "passes" | "annules";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "a_venir", label: "À venir" },
  { key: "aujourdhui", label: "Aujourd'hui" },
  { key: "semaine", label: "Cette semaine" },
  { key: "mois", label: "Ce mois" },
  { key: "passes", label: "Passés" },
  { key: "annules", label: "Annulés" },
];

const JOURS_COURT = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const MOIS_COURT = ["jan", "fév", "mar", "avr", "mai", "juin", "juil", "août", "sep", "oct", "nov", "déc"];
const formatDateCourt = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return `${JOURS_COURT[date.getDay()]} ${d} ${MOIS_COURT[m - 1]} ${y}`;
};

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const statutBadge = (s: string) => {
  switch (s) {
    case "annule":
      return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">Annulé</Badge>;
    case "termine":
      return <Badge variant="outline" className="bg-muted text-muted-foreground">Terminé</Badge>;
    case "rappel_envoye":
      return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">Rappel envoyé</Badge>;
    default:
      return <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/30">Confirmé</Badge>;
  }
};

const AdminRdv = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, isAdmin } = useAdminAuth();
  const [rdvs, setRdvs] = useState<RdvRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>("a_venir");

  useEffect(() => { document.title = "Tous les RDV – Admin"; }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/admin/login"); return; }
    if (!isAdmin) { toast.error("Accès refusé"); navigate("/"); return; }
    fetchAll();
  }, [user, authLoading, isAdmin, navigate]);

  const fetchAll = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("rendez_vous")
      .select("id, lead_id, date_rdv, heure_rdv, type_visite, statut, leads(name, phone, commune)")
      .order("date_rdv", { ascending: true })
      .order("heure_rdv", { ascending: true });
    if (error) {
      toast.error("Erreur de chargement : " + error.message);
    } else {
      setRdvs(
        ((data as any[]) || []).map((r) => ({
          id: r.id,
          lead_id: r.lead_id,
          date_rdv: r.date_rdv,
          heure_rdv: r.heure_rdv,
          type_visite: r.type_visite,
          statut: r.statut,
          lead_name: r.leads?.name ?? "—",
          lead_phone: r.leads?.phone ?? "",
          lead_commune: r.leads?.commune ?? null,
        }))
      );
    }
    setLoading(false);
  };

  const filtered = useMemo(() => {
    const today = todayStr();
    const now = new Date();
    const startWeek = new Date(now); startWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    const endWeek = new Date(startWeek); endWeek.setDate(startWeek.getDate() + 6);
    const endMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    return rdvs.filter((r) => {
      if (filter === "annules") return r.statut === "annule";
      if (filter === "passes") return r.statut !== "annule" && r.date_rdv < today;
      if (r.statut === "annule") return false;
      if (filter === "a_venir") return r.date_rdv >= today;
      if (filter === "aujourdhui") return r.date_rdv === today;
      if (filter === "semaine") return r.date_rdv >= fmt(startWeek) && r.date_rdv <= fmt(endWeek);
      if (filter === "mois") return r.date_rdv >= fmt(new Date(now.getFullYear(), now.getMonth(), 1)) && r.date_rdv <= fmt(endMonth);
      return true;
    });
  }, [rdvs, filter]);

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo />
            <div className="hidden sm:block">
              <p className="text-sm font-semibold">Tous les rendez-vous</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/admin"><ArrowLeft className="w-4 h-4" /> Retour</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-5">
        <div className="flex items-center gap-2">
          <Calendar className="w-6 h-6 text-[hsl(var(--copper))]" />
          <h1 className="text-2xl font-bold">Tous les rendez-vous</h1>
        </div>

        <Card className="p-3">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <Button
                key={f.key}
                variant={filter === f.key ? "copper" : "outline"}
                size="sm"
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </Card>

        <p className="text-sm text-muted-foreground">{filtered.length} rendez-vous affichés</p>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground">Aucun RDV pour ce filtre.</Card>
        ) : (
          <>
            {/* Desktop */}
            <Card className="hidden md:block overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Heure</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Commune</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-sm">{formatDateCourt(r.date_rdv)}</TableCell>
                      <TableCell className="text-sm font-semibold">{formatHeure(r.heure_rdv)}</TableCell>
                      <TableCell className="font-medium">
                        <Link to={`/admin/lead/${r.lead_id}`} className="text-primary hover:underline">{r.lead_name}</Link>
                      </TableCell>
                      <TableCell className="text-sm">
                        {r.lead_phone ? <a href={`tel:${r.lead_phone}`} className="text-primary hover:underline">{r.lead_phone}</a> : "—"}
                      </TableCell>
                      <TableCell className="text-sm">{r.type_visite}</TableCell>
                      <TableCell className="text-sm">{r.lead_commune || <span className="text-muted-foreground italic">—</span>}</TableCell>
                      <TableCell>{statutBadge(r.statut)}</TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="outline">
                          <Link to={`/admin/lead/${r.lead_id}`}><Eye className="w-4 h-4" /> Fiche</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>

            {/* Mobile */}
            <div className="md:hidden space-y-3">
              {filtered.map((r) => (
                <Card key={r.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-[hsl(var(--copper))]">{formatDateCourt(r.date_rdv)} · {formatHeure(r.heure_rdv)}</p>
                      <p className="font-semibold">{r.lead_name}</p>
                      <p className="text-xs text-muted-foreground">{r.type_visite}</p>
                      {r.lead_commune && <p className="text-xs text-muted-foreground">{r.lead_commune}</p>}
                    </div>
                    {statutBadge(r.statut)}
                  </div>
                  <div className="flex gap-2 pt-2">
                    {r.lead_phone && (
                      <Button asChild size="sm" variant="outline" className="flex-1">
                        <a href={`tel:${r.lead_phone}`}>Appeler</a>
                      </Button>
                    )}
                    <Button asChild size="sm" variant="copper" className="flex-1">
                      <Link to={`/admin/lead/${r.lead_id}`}>Fiche lead</Link>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default AdminRdv;
