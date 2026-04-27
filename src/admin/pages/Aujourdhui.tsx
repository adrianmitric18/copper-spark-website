import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Phone,
  Calendar,
  AlertCircle,
  TrendingUp,
  Users,
  Sparkles,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import {
  fetchLeadsWithUpcomingRdvs,
  fetchAllRdvs,
  type RdvWithLead,
} from "@/lib/admin/queries";
import { type Lead, type UpcomingByLead, leadSourceLabel } from "@/lib/admin/types";
import { formatHeure } from "@/lib/rdv/formatters";
import AdminShell from "@/admin/layout/AdminShell";
import AdminLoading from "@/components/admin/AdminLoading";
import { toast } from "sonner";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

const ACTIVE_STATUSES = new Set(["nouveau", "traité", "devis envoyé"]);

const isoDateLocal = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const todayDateStr = (): string => isoDateLocal(new Date());

const getGreeting = (): string => {
  const h = new Date().getHours();
  if (h < 6) return "Bonne nuit";
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
};

const formatLongDate = (d: Date): string =>
  d.toLocaleDateString("fr-BE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

const Aujourdhui = () => {
  const { user, ready, loading: authLoading } = useAdminGuard();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [upcomingByLead, setUpcomingByLead] = useState<UpcomingByLead>({});
  const [rdvs, setRdvs] = useState<RdvWithLead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Aujourd'hui – Le Cuivre Admin";
  }, []);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    setLoading(true);

    Promise.all([fetchLeadsWithUpcomingRdvs(), fetchAllRdvs()])
      .then(([leadsRes, allRdvs]) => {
        if (cancelled) return;
        setLeads(leadsRes.leads);
        setUpcomingByLead(leadsRes.upcomingByLead);
        setRdvs(allRdvs);
      })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : "chargement impossible";
        toast.error("Erreur de chargement : " + msg);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [ready, user?.id]);

  // ===== Données dérivées =====
  const today = todayDateStr();

  const todayRdvs = useMemo(
    () =>
      rdvs
        .filter((r) => r.statut !== "annule" && r.date_rdv === today)
        .sort((a, b) => a.heure_rdv.localeCompare(b.heure_rdv)),
    [rdvs, today],
  );

  const weekRdvs = useMemo(() => {
    const todayDate = new Date();
    const end = new Date(todayDate.getTime() + 7 * DAY_MS);
    const endStr = isoDateLocal(end);
    return rdvs
      .filter(
        (r) =>
          r.statut !== "annule" && r.date_rdv > today && r.date_rdv <= endStr,
      )
      .sort((a, b) =>
        a.date_rdv === b.date_rdv
          ? a.heure_rdv.localeCompare(b.heure_rdv)
          : a.date_rdv.localeCompare(b.date_rdv),
      )
      .slice(0, 5);
  }, [rdvs, today]);

  const staleLeads = useMemo(() => {
    return leads
      .filter((l) => {
        if (!ACTIVE_STATUSES.has(l.status)) return false;
        if (upcomingByLead[l.id]) return false;
        const hours = (Date.now() - new Date(l.created_at).getTime()) / HOUR_MS;
        return hours >= 48;
      })
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      )
      .slice(0, 5);
  }, [leads, upcomingByLead]);

  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const thisMonth = leads.filter(
      (l) => new Date(l.created_at) >= monthStart,
    );
    const lastMonth = leads.filter((l) => {
      const d = new Date(l.created_at);
      return d >= lastMonthStart && d < monthStart;
    });

    const conv = thisMonth.filter((l) => l.status === "converti").length;
    const total = thisMonth.length;
    const rate = total ? Math.round((conv / total) * 100) : 0;

    const newLeads = leads.filter((l) => l.status === "nouveau").length;

    return {
      thisMonth: total,
      lastMonth: lastMonth.length,
      delta: total - lastMonth.length,
      conversionRate: rate,
      newLeads,
      weekRdvCount: weekRdvs.length + todayRdvs.length,
    };
  }, [leads, weekRdvs.length, todayRdvs.length]);

  if (authLoading || !user) return <AdminLoading />;

  const ageInHours = (createdAt: string): number =>
    Math.floor((Date.now() - new Date(createdAt).getTime()) / HOUR_MS);

  const formatAge = (hours: number): string => {
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return days === 1 ? "1 jour" : `${days} jours`;
  };

  return (
    <AdminShell email={user.email} mobileTitle="Aujourd'hui">
      <div className="p-4 md:p-8 space-y-6 max-w-6xl mx-auto">
        {/* Greeting */}
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground capitalize">
            {formatLongDate(new Date())}
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-bold">
            {getGreeting()}, Adrian
            {stats.newLeads > 0 && (
              <span className="text-primary"> · {stats.newLeads} {stats.newLeads === 1 ? "nouveau lead" : "nouveaux leads"}</span>
            )}
          </h1>
        </div>

        {loading ? (
          <Card className="p-12 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </Card>
        ) : (
          <>
            {/* KPIs row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="p-4 space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <Users className="w-3.5 h-3.5" />
                  Leads ce mois
                </div>
                <p className="text-2xl font-bold">{stats.thisMonth}</p>
                {stats.lastMonth > 0 && (
                  <p
                    className={`text-xs ${stats.delta >= 0 ? "text-green-600" : "text-orange-600"}`}
                  >
                    {stats.delta >= 0 ? "+" : ""}
                    {stats.delta} vs mois dernier
                  </p>
                )}
              </Card>
              <Card className="p-4 space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Conversion
                </div>
                <p className="text-2xl font-bold">{stats.conversionRate}%</p>
                <p className="text-xs text-muted-foreground">ce mois</p>
              </Card>
              <Card className="p-4 space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <Calendar className="w-3.5 h-3.5" />
                  RDV à venir
                </div>
                <p className="text-2xl font-bold">{stats.weekRdvCount}</p>
                <p className="text-xs text-muted-foreground">cette semaine</p>
              </Card>
              <Card className="p-4 space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <AlertCircle className="w-3.5 h-3.5" />À relancer
                </div>
                <p
                  className={`text-2xl font-bold ${staleLeads.length > 0 ? "text-orange-600" : ""}`}
                >
                  {staleLeads.length}
                </p>
                <p className="text-xs text-muted-foreground">{">"}48h sans action</p>
              </Card>
            </div>

            {/* À faire MAINTENANT */}
            <Card className="p-5 md:p-6 space-y-4 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Aujourd'hui</h2>
              </div>

              {todayRdvs.length === 0 && staleLeads.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <p className="text-muted-foreground">
                    Pas de RDV ni de relance urgente aujourd'hui.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Profite-en pour avancer sur les devis en attente. ☕
                  </p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {/* RDV du jour */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      RDV du jour ({todayRdvs.length})
                    </h3>
                    {todayRdvs.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic px-1">
                        Aucun RDV planifié.
                      </p>
                    ) : (
                      <ul className="space-y-1.5">
                        {todayRdvs.map((r) => (
                          <li key={r.id}>
                            <Link
                              to={`/admin/lead/${r.lead_id}`}
                              className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-background border hover:border-primary/40 transition-colors min-h-[56px]"
                            >
                              <div className="text-center w-14 shrink-0">
                                <p className="text-base font-bold text-primary">
                                  {formatHeure(r.heure_rdv)}
                                </p>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">
                                  {r.lead_name}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {r.type_visite}
                                  {r.lead_commune && ` · ${r.lead_commune}`}
                                </p>
                              </div>
                              {r.lead_phone && (
                                <a
                                  href={`tel:${r.lead_phone}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex items-center justify-center w-10 h-10 rounded-md text-primary hover:bg-primary/10 shrink-0"
                                  aria-label={`Appeler ${r.lead_name}`}
                                >
                                  <Phone className="w-4 h-4" />
                                </a>
                              )}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Leads à relancer */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />À relancer ({staleLeads.length})
                    </h3>
                    {staleLeads.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic px-1">
                        Tout est sous contrôle.
                      </p>
                    ) : (
                      <ul className="space-y-1.5">
                        {staleLeads.map((l) => (
                          <li key={l.id}>
                            <Link
                              to={`/admin/lead/${l.id}`}
                              className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-background border hover:border-orange-500/40 transition-colors min-h-[56px]"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-medium text-sm truncate">
                                    {l.name}
                                  </p>
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] px-1.5 py-0 bg-orange-500/15 text-orange-700 border-orange-500/30"
                                  >
                                    {formatAge(ageInHours(l.created_at))}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground truncate">
                                  {l.commune || ""} · {l.status}
                                </p>
                              </div>
                              <a
                                href={`tel:${l.phone}`}
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center justify-center w-10 h-10 rounded-md text-orange-700 hover:bg-orange-500/10 shrink-0"
                                aria-label={`Appeler ${l.name}`}
                              >
                                <Phone className="w-4 h-4" />
                              </a>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </Card>

            {/* Cette semaine */}
            <Card className="p-5 md:p-6 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  Les 7 prochains jours
                </h2>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/admin/rdv" className="text-sm">
                    Tout voir <ChevronRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
              {weekRdvs.length === 0 ? (
                <p className="text-sm text-muted-foreground italic py-4">
                  Pas de RDV cette semaine.
                </p>
              ) : (
                <ul className="divide-y divide-border/50 -mx-2">
                  {weekRdvs.map((r) => (
                    <li key={r.id}>
                      <Link
                        to={`/admin/lead/${r.lead_id}`}
                        className="flex items-center gap-3 px-2 py-2.5 rounded-md hover:bg-muted/50 active:bg-muted transition-colors min-h-[48px]"
                      >
                        <div className="text-center w-20 shrink-0">
                          <p className="text-xs text-muted-foreground capitalize">
                            {new Date(`${r.date_rdv}T12:00:00`).toLocaleDateString(
                              "fr-BE",
                              { weekday: "short", day: "numeric", month: "short" },
                            )}
                          </p>
                          <p className="text-sm font-bold text-primary">
                            {formatHeure(r.heure_rdv)}
                          </p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {r.lead_name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {r.type_visite}
                            {r.lead_commune && ` · ${r.lead_commune}`}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 hidden sm:block" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {/* Sources mois (compact) */}
            {stats.thisMonth > 0 && (
              <Card className="p-5 md:p-6 space-y-3">
                <h2 className="text-lg font-semibold">Sources ce mois</h2>
                <SourcesBreakdown leads={leads} />
              </Card>
            )}
          </>
        )}
      </div>
    </AdminShell>
  );
};

const SourcesBreakdown = ({ leads }: { leads: Lead[] }) => {
  const data = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthLeads = leads.filter((l) => new Date(l.created_at) >= monthStart);
    const total = monthLeads.length;
    if (total === 0) return [];
    const counts = monthLeads.reduce<Record<string, number>>((acc, l) => {
      const key = l.source || "formulaire_site";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts)
      .map(([source, count]) => ({
        source,
        count,
        percent: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [leads]);

  if (data.length === 0) return null;

  return (
    <div className="space-y-2">
      {data.map((item) => (
        <div key={item.source} className="flex items-center gap-3">
          <div className="w-32 text-sm shrink-0">{leadSourceLabel(item.source)}</div>
          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary"
              style={{ width: `${item.percent}%` }}
            />
          </div>
          <div className="text-sm tabular-nums w-16 text-right">
            {item.count} · {item.percent}%
          </div>
        </div>
      ))}
    </div>
  );
};

export default Aujourdhui;
