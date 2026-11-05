import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Eye, Calendar, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatHeure } from "@/lib/rdv/formatters";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import { fetchAllRdvs, terminerRdv, updateLeadStatus, type RdvWithLead } from "@/lib/admin/queries";
import { STATUT_REACTIVATION, isRdvPasse, isStatutAvecRdv, isTerminal } from "@/lib/admin/types";
import TerminerLeadButton from "@/components/admin/TerminerLeadButton";
import { TON } from "@/lib/admin/badges";
import AdminShell from "@/admin/layout/AdminShell";

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

// Un RDV passé encore ouvert n'est jamais affiché « Confirmé » (définition
// unique : isRdvPasse dans @/lib/admin/types).
const statutBadge = (s: string, passe = false) => {
  if (passe) {
    return <Badge variant="outline" className={TON.orange}>RDV passé</Badge>;
  }
  switch (s) {
    case "annule":
      return <Badge variant="outline" className={TON.rouge}>Annulé</Badge>;
    case "termine":
      return <Badge variant="outline" className={TON.gris}>Terminé</Badge>;
    case "rappel_envoye":
      return <Badge variant="outline" className={TON.bleu}>Rappel envoyé</Badge>;
    default:
      return <Badge variant="outline" className={TON.vert}>Confirmé</Badge>;
  }
};

const AdminRdv = () => {
  const { user, ready } = useAdminGuard();
  const [filter, setFilter] = useState<FilterKey>("a_venir");
  const queryClient = useQueryClient();
  const [terminant, setTerminant] = useState<string | null>(null);

  // Lot 2.5 — clôturer un RDV passé depuis le calendrier. Même règle que sur la
  // fiche : le RDV passe en « terminé » et le lead quitte « RDV confirmé » /
  // rdv_pris pour « traité » (il reste ouvert pour le devis).
  const terminerRdvPasse = async (r: RdvWithLead) => {
    setTerminant(r.id);
    try {
      await terminerRdv(r.id);
      if (isStatutAvecRdv(r.lead_status)) {
        try {
          await updateLeadStatus(r.lead_id, STATUT_REACTIVATION);
        } catch (stErr: unknown) {
          const m = stErr instanceof Error ? stErr.message : "mise à jour impossible";
          toast.warning("RDV terminé, mais le statut du lead n'a pas changé", { description: m });
        }
      }
      toast.success(`RDV terminé — ${r.lead_name}`);
      void queryClient.invalidateQueries({ queryKey: ["admin-rdvs-all"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-leads-overview"] });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "clôture impossible";
      toast.error("Erreur : " + msg);
    } finally {
      setTerminant(null);
    }
  };

  useEffect(() => {
    document.title = "Tous les RDV – Admin";
  }, []);

  const rdvsQuery = useQuery({
    queryKey: ["admin-rdvs-all"],
    queryFn: fetchAllRdvs,
    enabled: ready,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (rdvsQuery.error) {
      const msg = rdvsQuery.error instanceof Error ? rdvsQuery.error.message : "chargement impossible";
      toast.error("Erreur de chargement : " + msg);
    }
  }, [rdvsQuery.error]);

  const rdvs = useMemo(() => rdvsQuery.data ?? [], [rdvsQuery.data]);
  const loading = rdvsQuery.isLoading;

  const filtered = useMemo(() => {
    const today = todayStr();
    const now = new Date();
    const startWeek = new Date(now);
    startWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    const endWeek = new Date(startWeek);
    endWeek.setDate(startWeek.getDate() + 6);
    const endMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    return rdvs.filter((r) => {
      if (filter === "annules") return r.statut === "annule";
      if (filter === "passes") return r.statut !== "annule" && r.date_rdv < today;
      if (r.statut === "annule") return false;
      if (filter === "a_venir") return r.date_rdv >= today;
      if (filter === "aujourdhui") return r.date_rdv === today;
      if (filter === "semaine") return r.date_rdv >= fmt(startWeek) && r.date_rdv <= fmt(endWeek);
      if (filter === "mois")
        return r.date_rdv >= fmt(new Date(now.getFullYear(), now.getMonth(), 1)) && r.date_rdv <= fmt(endMonth);
      return true;
    });
  }, [rdvs, filter]);

  return (
    <AdminShell email={user?.email} mobileTitle="Calendrier">
      <div className="p-4 md:p-6 space-y-5">
      <div className="flex items-center gap-2">
        <Calendar className="w-6 h-6 text-[hsl(var(--copper))]" />
        <h1 className="text-2xl md:text-3xl font-display font-bold">Calendrier</h1>
      </div>

      <Card className="p-3">
        <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1 sm:flex-wrap sm:overflow-visible">
          {FILTERS.map((f) => (
            <Button
              key={f.key}
              variant={filter === f.key ? "copper" : "outline"}
              size="sm"
              onClick={() => setFilter(f.key)}
              className="shrink-0 min-h-[40px]"
            >
              {f.label}
            </Button>
          ))}
        </div>
      </Card>

      <p className="text-sm text-muted-foreground">{filtered.length} rendez-vous affichés</p>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-14 rounded-lg bg-muted/40 animate-pulse"
              style={{ animationDelay: `${i * 80}ms` }}
            />
          ))}
        </div>
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
                      <Link to={`/admin/lead/${r.lead_id}`} className="text-primary hover:underline">
                        {r.lead_name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm">
                      {r.lead_phone ? (
                        <a href={`tel:${r.lead_phone}`} className="text-primary hover:underline">
                          {r.lead_phone}
                        </a>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{r.type_visite}</TableCell>
                    <TableCell className="text-sm">
                      {r.lead_commune || <span className="text-muted-foreground italic">—</span>}
                    </TableCell>
                    <TableCell>{statutBadge(r.statut, isRdvPasse(r))}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isRdvPasse(r) && (
                          <Button
                            size="sm"
                            variant="copper"
                            disabled={terminant === r.id}
                            onClick={() => terminerRdvPasse(r)}
                          >
                            {terminant === r.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4" />
                            )}
                            Terminer le RDV
                          </Button>
                        )}
                        {!isTerminal(r.lead_status) && (
                          <TerminerLeadButton
                            lead={{ id: r.lead_id, name: r.lead_name, status: r.lead_status }}
                            label="Terminer le lead"
                          />
                        )}
                        <Button asChild size="sm" variant="outline">
                          <Link to={`/admin/lead/${r.lead_id}`}>
                            <Eye className="w-4 h-4" /> Fiche
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Mobile */}
          <div className="md:hidden space-y-3">
            {filtered.map((r) => (
              <Card key={r.id} className="p-4 space-y-2 active:bg-muted/30 transition-colors">
                <Link to={`/admin/lead/${r.lead_id}`} className="block">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-[hsl(var(--copper))]">
                        {formatDateCourt(r.date_rdv)} · {formatHeure(r.heure_rdv)}
                      </p>
                      <p className="font-semibold">{r.lead_name}</p>
                      <p className="text-xs text-muted-foreground">{r.type_visite}</p>
                      {r.lead_commune && <p className="text-xs text-muted-foreground">{r.lead_commune}</p>}
                    </div>
                    {statutBadge(r.statut, isRdvPasse(r))}
                  </div>
                </Link>
                {isRdvPasse(r) && (
                  <Button
                    variant="copper"
                    className="w-full min-h-[44px]"
                    disabled={terminant === r.id}
                    onClick={() => terminerRdvPasse(r)}
                  >
                    {terminant === r.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    Terminer le RDV
                  </Button>
                )}
                <div className="flex gap-2 pt-2">
                  {r.lead_phone && (
                    <Button asChild size="default" variant="outline" className="flex-1 min-h-[44px]">
                      <a href={`tel:${r.lead_phone}`}>Appeler</a>
                    </Button>
                  )}
                  <Button asChild size="default" variant="copper" className="flex-1 min-h-[44px]">
                    <Link to={`/admin/lead/${r.lead_id}`}>Fiche lead</Link>
                  </Button>
                  {!isTerminal(r.lead_status) && (
                    <TerminerLeadButton
                      lead={{ id: r.lead_id, name: r.lead_name, status: r.lead_status }}
                      label={isRdvPasse(r) ? "Terminer le lead" : "Terminer"}
                      className="min-h-[44px]"
                    />
                  )}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
      </div>
    </AdminShell>
  );
};

export default AdminRdv;
