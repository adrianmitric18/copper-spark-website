/**
 * Page d'index des interventions (chantiers programmés).
 *
 * Filtres temporels : à venir / en cours / terminées / toutes.
 * Filtres en query string (?filter=upcoming) pour permettre des deep links
 * depuis le dashboard.
 */

import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Hammer, Calendar, Clock, ChevronRight, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import {
  fetchAllInterventions,
  STATUT_LABELS,
  STATUT_BADGE_CLASSES,
  type Intervention,
  type StatutIntervention,
} from "@/lib/admin/interventions";
import { fetchLeadsWithUpcomingRdvs } from "@/lib/admin/queries";
import AdminShell from "@/admin/layout/AdminShell";
import AdminLoading from "@/components/admin/AdminLoading";
import { toast } from "sonner";

type FilterMode = "upcoming" | "in_progress" | "done" | "all";

const FILTER_OPTIONS: { value: FilterMode; label: string }[] = [
  { value: "upcoming", label: "À venir" },
  { value: "in_progress", label: "En cours" },
  { value: "done", label: "Terminées" },
  { value: "all", label: "Toutes" },
];

const todayIso = (): string => new Date().toISOString().slice(0, 10);

const formatDateLong = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("fr-BE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

const formatHeure = (t: string) => {
  const [h, m] = t.split(":");
  return m === "00" ? `${h}h` : `${h}h${m}`;
};

const Interventions = () => {
  const { user, ready } = useAdminGuard();
  const [searchParams, setSearchParams] = useSearchParams();
  const filter: FilterMode = (searchParams.get("filter") as FilterMode) || "upcoming";
  const setFilter = (f: FilterMode) => {
    if (f === "upcoming") {
      searchParams.delete("filter");
    } else {
      searchParams.set("filter", f);
    }
    setSearchParams(searchParams);
  };

  useEffect(() => {
    document.title = "Chantiers – Le Cuivre Admin";
  }, []);

  const interventionsQuery = useQuery({
    queryKey: ["admin-interventions"],
    queryFn: fetchAllInterventions,
    enabled: ready,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const leadsQuery = useQuery({
    queryKey: ["admin-leads-overview"],
    queryFn: fetchLeadsWithUpcomingRdvs,
    enabled: ready,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (interventionsQuery.error) {
      const msg =
        interventionsQuery.error instanceof Error
          ? interventionsQuery.error.message
          : "chargement impossible";
      toast.error("Erreur : " + msg);
    }
  }, [interventionsQuery.error]);

  const leadsById = useMemo(() => {
    const map = new Map<string, { name: string; phone: string }>();
    (leadsQuery.data?.leads ?? []).forEach((l) => {
      map.set(l.id, { name: l.name, phone: l.phone });
    });
    return map;
  }, [leadsQuery.data]);

  const filtered = useMemo<Intervention[]>(() => {
    const all = interventionsQuery.data ?? [];
    const today = todayIso();
    switch (filter) {
      case "upcoming":
        return all.filter(
          (i) => i.statut === "programme" && i.date_debut >= today,
        );
      case "in_progress":
        return all.filter(
          (i) =>
            i.statut === "en_cours" ||
            (i.statut === "programme" && i.date_debut <= today && i.date_fin >= today),
        );
      case "done":
        return all.filter((i) => i.statut === "termine");
      case "all":
      default:
        return all;
    }
  }, [interventionsQuery.data, filter]);

  const counts = useMemo(() => {
    const all = interventionsQuery.data ?? [];
    const today = todayIso();
    return {
      upcoming: all.filter((i) => i.statut === "programme" && i.date_debut >= today).length,
      in_progress: all.filter(
        (i) =>
          i.statut === "en_cours" ||
          (i.statut === "programme" && i.date_debut <= today && i.date_fin >= today),
      ).length,
      done: all.filter((i) => i.statut === "termine").length,
      all: all.length,
    };
  }, [interventionsQuery.data]);

  if (!ready || !user) return <AdminLoading />;

  return (
    <AdminShell mobileTitle="Chantiers">
      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Hammer className="w-7 h-7 text-primary shrink-0" />
          <div className="min-w-0">
            <h1 className="text-2xl font-display font-bold">Chantiers programmés</h1>
            <p className="text-xs text-muted-foreground">
              Suivi des interventions multi-jours après acceptation de devis
            </p>
          </div>
        </div>

        {/* Filtres — sticky top sur mobile pour rester accessible au scroll.
            Sur desktop, comportement standard. */}
        <div className="sticky top-14 md:top-0 -mx-4 md:mx-0 px-4 md:px-0 py-2 md:py-0 bg-background/95 backdrop-blur md:bg-transparent md:backdrop-blur-none z-10 md:z-auto border-b md:border-b-0 border-border/50">
          <div className="flex flex-nowrap md:flex-wrap gap-2 overflow-x-auto md:overflow-visible scrollbar-thin pb-1 md:pb-0">
            {FILTER_OPTIONS.map((opt) => {
              const active = filter === opt.value;
              const count = counts[opt.value];
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFilter(opt.value)}
                  className={`shrink-0 h-11 px-4 rounded-md border text-sm font-medium transition flex items-center gap-2 ${
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:border-primary/40"
                  }`}
                >
                  {opt.label}
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full ${
                      active
                        ? "bg-primary-foreground/20"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Liste */}
        {interventionsQuery.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="p-8 text-center">
            <Hammer className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">
              Aucun chantier dans cette vue.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((it) => {
              const leadInfo = leadsById.get(it.lead_id);
              const sameDay = it.date_debut === it.date_fin;
              const statut = it.statut as StatutIntervention;
              return (
                <Link
                  key={it.id}
                  to={`/admin/lead/${it.lead_id}`}
                  className="block group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg"
                >
                  <Card className="p-4 min-h-[88px] hover:border-primary/40 active:bg-muted/40 transition-colors group-hover:shadow-sm">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <p className="font-semibold truncate">
                          {leadInfo?.name ?? "Lead inconnu"}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {it.type_intervention}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge className={STATUT_BADGE_CLASSES[statut]}>
                          {STATUT_LABELS[statut]}
                        </Badge>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5 capitalize">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">
                          {sameDay
                            ? formatDateLong(it.date_debut)
                            : `${formatDateLong(it.date_debut)} → ${formatDateLong(it.date_fin)}`}
                        </span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        {formatHeure(it.heure_debut.slice(0, 5))}
                        {" - "}
                        {formatHeure(it.heure_fin.slice(0, 5))}
                      </span>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        <div className="pt-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/admin">← Retour au dashboard</Link>
          </Button>
        </div>
      </div>
    </AdminShell>
  );
};

export default Interventions;
