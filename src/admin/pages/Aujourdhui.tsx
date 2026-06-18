import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Phone,
  Calendar,
  AlertCircle,
  TrendingUp,
  Users,
  Sparkles,
  ChevronRight,
  HardHat,
  Navigation,
  Bell,
  MessageCircle,
  Smartphone,
  Mail,
  Loader2,
  PhoneCall,
  CalendarPlus,
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
import { fetchAllInterventions } from "@/lib/admin/interventions";
import { type Lead, leadSourceLabel } from "@/lib/admin/types";
import { formatHeure } from "@/lib/rdv/formatters";
import { sendRappelJ1Emails, type LeadInfo } from "@/lib/rdv/emailjs";
import { type RendezVous } from "@/lib/rdv/constants";
import { buildSmsHref, buildWhatsappHref, smsRappelLead, COMPANY } from "@/lib/admin/message-templates";
import { supabase } from "@/integrations/supabase/client";
import AdminShell from "@/admin/layout/AdminShell";
import { toast } from "sonner";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

const ACTIVE_STATUSES = new Set(["nouveau", "traité", "devis envoyé"]);

// T7 — « Leads à rappeler » : leads en attente d'un coup de fil. On exclut
// « devis envoyé » (suivi par le flux relances devis) et garde les statuts qui
// veulent dire « pas encore recontacté / sans suite ».
const CALLBACK_STATUSES = new Set(["nouveau", "traité"]);
const CALLBACK_LIMIT = 8;

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

/**
 * Lien d'itinéraire Google Maps depuis les morceaux d'adresse du lead.
 * Renvoie null si on n'a aucune info exploitable (pas de bouton affiché).
 */
const buildMapsDir = (parts: (string | null | undefined)[]): string | null => {
  const query = parts.filter(Boolean).join(" ").trim();
  if (!query) return null;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
};

// Phase 2.1 — email réel (sinon pas d'envoi auto, on s'en tient à SMS/WhatsApp).
const hasUsableEmail = (email: string | null | undefined): boolean => {
  if (!email) return false;
  const e = email.trim().toLowerCase();
  return e.includes("@") && e !== "non fourni" && !e.endsWith("@local.cuivre-electrique.com");
};

// Texte de rappel J-1 pour SMS/WhatsApp (lignes 🔧/📍 affichées seulement si l'info existe).
const rappelText = (r: RdvWithLead): string => {
  const dateLong = new Date(`${r.date_rdv}T12:00:00`).toLocaleDateString("fr-BE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const prenom = r.lead_name.trim().split(/\s+/)[0] || r.lead_name;
  const adresse = [
    [r.lead_rue, r.lead_numero].filter(Boolean).join(" "),
    [r.lead_code_postal, r.lead_commune].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(", ");
  const lines = [
    `Bonjour ${prenom} 👋 C'est ${COMPANY.ownerFirstName}, du Cuivre Électrique.`,
    `Petit rappel pour demain :`,
    `🗓️ ${dateLong} à ${formatHeure(r.heure_rdv)}`,
  ];
  if (r.type_visite) lines.push(`🔧 ${r.type_visite}`);
  if (adresse) lines.push(`📍 ${adresse}`);
  lines.push(`Si ça ne convient plus, prévenez-moi au ${COMPANY.tel} et on décale sans souci.`);
  lines.push(`À demain ! ${COMPANY.ownerFirstName}`);
  return lines.join("\n");
};

const Aujourdhui = () => {
  const { user, ready } = useAdminGuard();
  const queryClient = useQueryClient();
  const [rappelSending, setRappelSending] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Aujourd'hui – Le Cuivre Admin";
  }, []);

  // Cache 60s en mémoire — instant entre Aujourd'hui ↔ Pipeline.
  const leadsQuery = useQuery({
    queryKey: ["admin-leads-overview"],
    queryFn: fetchLeadsWithUpcomingRdvs,
    enabled: ready,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const rdvsQuery = useQuery({
    queryKey: ["admin-rdvs-all"],
    queryFn: fetchAllRdvs,
    enabled: ready,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const interventionsQuery = useQuery({
    queryKey: ["admin-interventions"],
    queryFn: fetchAllInterventions,
    enabled: ready,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  // Toast d'erreur si une requête plante (retry géré par React Query)
  useEffect(() => {
    if (leadsQuery.error) {
      const msg = leadsQuery.error instanceof Error ? leadsQuery.error.message : "chargement leads impossible";
      toast.error("Erreur : " + msg);
    }
  }, [leadsQuery.error]);

  useEffect(() => {
    if (rdvsQuery.error) {
      const msg = rdvsQuery.error instanceof Error ? rdvsQuery.error.message : "chargement RDV impossible";
      toast.error("Erreur : " + msg);
    }
  }, [rdvsQuery.error]);

  const leads = useMemo(() => leadsQuery.data?.leads ?? [], [leadsQuery.data]);
  const upcomingByLead = useMemo(
    () => leadsQuery.data?.upcomingByLead ?? {},
    [leadsQuery.data],
  );
  const rdvs = useMemo(() => rdvsQuery.data ?? [], [rdvsQuery.data]);
  const loading = leadsQuery.isLoading || rdvsQuery.isLoading;

  // ===== Données dérivées =====
  const today = todayDateStr();

  const todayRdvs = useMemo(
    () =>
      rdvs
        .filter((r) => r.statut !== "annule" && r.date_rdv === today)
        .sort((a, b) => a.heure_rdv.localeCompare(b.heure_rdv)),
    [rdvs, today],
  );

  const tomorrowRdvs = useMemo(() => {
    const tStr = isoDateLocal(new Date(Date.now() + DAY_MS));
    return rdvs
      .filter((r) => r.statut !== "annule" && r.date_rdv === tStr)
      .sort((a, b) => a.heure_rdv.localeCompare(b.heure_rdv));
  }, [rdvs]);

  // Phase 2.1 — envoie le rappel J-1 par email (client + mémo Adrian) via la
  // fonction existante sendRappelJ1Emails, puis marque le RDV "rappel_envoye".
  // Pas de cron (rail 5) : déclenchement manuel groupé depuis le cockpit.
  const sendRappelEmail = async (r: RdvWithLead) => {
    setRappelSending(r.id);
    try {
      const lead: LeadInfo = {
        id: r.lead_id,
        name: r.lead_name,
        email: r.lead_email,
        phone: r.lead_phone,
        rue: r.lead_rue,
        numero: r.lead_numero,
        code_postal: r.lead_code_postal,
        commune: r.lead_commune,
      };
      const rdv = {
        id: r.id,
        lead_id: r.lead_id,
        date_rdv: r.date_rdv,
        heure_rdv: r.heure_rdv,
        duree_minutes: r.duree_minutes,
        type_visite: r.type_visite,
        notes_internes: null,
        statut: r.statut,
        rappel_envoye_at: null,
        created_at: "",
        updated_at: "",
      } as RendezVous;
      await sendRappelJ1Emails(lead, rdv);
      await supabase
        .from("rendez_vous")
        .update({ statut: "rappel_envoye", rappel_envoye_at: new Date().toISOString() })
        .eq("id", r.id);
      toast.success("Rappel email envoyé (client + mémo pour toi)");
      queryClient.invalidateQueries({ queryKey: ["admin-rdvs-all"] });
    } catch (e: unknown) {
      const m = e instanceof Error ? e.message : "envoi impossible";
      toast.error("Rappel non envoyé : " + m);
    } finally {
      setRappelSending(null);
    }
  };

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

  // T7 — Liste de travail « Leads à rappeler » : tous les leads actifs sans RDV
  // à venir, du plus ancien au plus récent (ne laisser personne traîner).
  // Heuristique 100 % sans DB : statut + absence de RDV à venir + ancienneté.
  // Plus large que la mini-liste « À relancer » du héro (>48h) : ici c'est la
  // file complète des appels à passer, avec actions 1-tap.
  const leadsARappeler = useMemo(() => {
    return leads
      .filter((l) => {
        if (!CALLBACK_STATUSES.has(l.status)) return false;
        if (upcomingByLead[l.id]) return false;
        return Boolean(l.phone);
      })
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      )
      .slice(0, CALLBACK_LIMIT);
  }, [leads, upcomingByLead]);

  // Chantiers programmés cette semaine (du jour à +7 jours, statut programme/en_cours
  // dont la plage englobe la fenêtre).
  const upcomingInterventionsCount = useMemo(() => {
    const all = interventionsQuery.data ?? [];
    const todayDate = new Date();
    const endDate = new Date(todayDate.getTime() + 7 * DAY_MS);
    const todayStr = isoDateLocal(todayDate);
    const endStr = isoDateLocal(endDate);
    return all.filter((i) => {
      if (i.statut === "annule" || i.statut === "termine") return false;
      // chevauchement plage [date_debut, date_fin] avec [today, today+7]
      return i.date_fin >= todayStr && i.date_debut <= endStr;
    }).length;
  }, [interventionsQuery.data]);

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

  const ageInHours = (createdAt: string): number =>
    Math.floor((Date.now() - new Date(createdAt).getTime()) / HOUR_MS);

  const formatAge = (hours: number): string => {
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return days === 1 ? "1 jour" : `${days} jours`;
  };

  return (
    <AdminShell email={user?.email} mobileTitle="Aujourd'hui">
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
          <SkeletonContent />
        ) : (
          <>
            {/* KPIs row — 2 cols mobile / 3 cols tablette / 5 cols desktop large.
                Sur mobile : 5 cards = 2/2/1 lignes. Sur tablette : 3/2 lignes. */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
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
              <Link
                to="/admin/interventions?filter=upcoming"
                className="block group"
              >
                <Card className="p-4 space-y-1 h-full transition-colors group-hover:border-primary/40">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs">
                    <HardHat className="w-3.5 h-3.5" />
                    Chantiers
                  </div>
                  <p
                    className={`text-2xl font-bold ${upcomingInterventionsCount > 0 ? "text-primary" : ""}`}
                  >
                    {upcomingInterventionsCount}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    cette semaine
                  </p>
                </Card>
              </Link>
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
                        {todayRdvs.map((r) => {
                          const mapsUrl = buildMapsDir([
                            r.lead_rue,
                            r.lead_numero,
                            r.lead_code_postal,
                            r.lead_commune,
                          ]);
                          return (
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
                                {mapsUrl && (
                                  <a
                                    href={mapsUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex items-center justify-center w-10 h-10 rounded-md text-muted-foreground hover:bg-muted shrink-0"
                                    aria-label={`Itinéraire vers ${r.lead_name}`}
                                  >
                                    <Navigation className="w-4 h-4" />
                                  </a>
                                )}
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
                          );
                        })}
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

            {/* Leads à rappeler (T7) — file des appels à passer : leads actifs
                sans RDV, du plus ancien au plus récent. Appeler / SMS / WhatsApp
                / Caler RDV en 1 tap. Heuristique sans DB. */}
            {leadsARappeler.length > 0 && (
              <Card className="p-5 md:p-6 space-y-3">
                <div className="flex items-center gap-2">
                  <PhoneCall className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold">
                    Leads à rappeler ({leadsARappeler.length})
                  </h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  Pas encore de RDV : un appel, un SMS, ou cale une date direct.
                  Les plus anciens en premier.
                </p>
                <ul className="space-y-2">
                  {leadsARappeler.map((l) => {
                    const rappelMsg = smsRappelLead(l.name);
                    return (
                      <li
                        key={l.id}
                        className="flex items-center gap-2 flex-wrap rounded-lg border bg-background px-3 py-2"
                      >
                        <Link
                          to={`/admin/lead/${l.id}`}
                          className="flex-1 min-w-[10rem] group"
                        >
                          <p className="font-medium text-sm truncate flex items-center gap-2 group-hover:text-primary transition-colors">
                            {l.name}
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 bg-muted text-muted-foreground border-border"
                            >
                              {formatAge(ageInHours(l.created_at))}
                            </Badge>
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {l.commune || "—"} · {l.status}
                            {l.services?.[0] && ` · ${l.services[0]}`}
                          </p>
                        </Link>
                        <Button asChild size="sm" className="min-h-[40px]">
                          <a href={`tel:${l.phone}`} aria-label={`Appeler ${l.name}`}>
                            <Phone className="w-4 h-4" /> Appeler
                          </a>
                        </Button>
                        <Button asChild size="sm" variant="outline" className="min-h-[40px]">
                          <a href={buildSmsHref(l.phone, rappelMsg)} aria-label={`SMS à ${l.name}`}>
                            <Smartphone className="w-4 h-4" /> SMS
                          </a>
                        </Button>
                        <Button
                          asChild
                          size="sm"
                          className="min-h-[40px] bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp/90"
                        >
                          <a
                            href={buildWhatsappHref(l.phone, rappelMsg)}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`WhatsApp à ${l.name}`}
                          >
                            <MessageCircle className="w-4 h-4" /> WA
                          </a>
                        </Button>
                        <Button asChild size="sm" variant="outline" className="min-h-[40px]">
                          <Link
                            to={`/admin/lead/${l.id}?rdv=1`}
                            aria-label={`Caler un RDV avec ${l.name}`}
                          >
                            <CalendarPlus className="w-4 h-4" /> Caler RDV
                          </Link>
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            )}

            {/* Rappels demain (Phase 2.1) — préviens les RDV du lendemain */}
            {tomorrowRdvs.length > 0 && (
              <Card className="p-5 md:p-6 space-y-3">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold">
                    Rappels demain ({tomorrowRdvs.length})
                  </h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  Préviens tes RDV de demain : SMS / WhatsApp en 1 tap, ou email de rappel.
                </p>
                <ul className="space-y-2">
                  {tomorrowRdvs.map((r) => {
                    const already = r.statut === "rappel_envoye";
                    return (
                      <li
                        key={r.id}
                        className="flex items-center gap-2 flex-wrap rounded-lg border bg-background px-3 py-2"
                      >
                        <div className="flex-1 min-w-[10rem]">
                          <p className="font-medium text-sm truncate flex items-center gap-2">
                            {formatHeure(r.heure_rdv)} · {r.lead_name}
                            {already && (
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1.5 py-0 bg-blue-500/10 text-blue-600 border-blue-500/30"
                              >
                                Rappel envoyé
                              </Badge>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {r.type_visite}
                            {r.lead_commune && ` · ${r.lead_commune}`}
                          </p>
                        </div>
                        <Button asChild size="sm" variant="outline" className="min-h-[40px]">
                          <a href={buildSmsHref(r.lead_phone, rappelText(r))} aria-label={`SMS rappel ${r.lead_name}`}>
                            <Smartphone className="w-4 h-4" /> SMS
                          </a>
                        </Button>
                        <Button
                          asChild
                          size="sm"
                          className="min-h-[40px] bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp/90"
                        >
                          <a
                            href={buildWhatsappHref(r.lead_phone, rappelText(r))}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`WhatsApp rappel ${r.lead_name}`}
                          >
                            <MessageCircle className="w-4 h-4" /> WA
                          </a>
                        </Button>
                        {hasUsableEmail(r.lead_email) && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="min-h-[40px]"
                            disabled={rappelSending === r.id}
                            onClick={() => sendRappelEmail(r)}
                            aria-label={`Envoyer le rappel email à ${r.lead_name}`}
                          >
                            {rappelSending === r.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Mail className="w-4 h-4" />
                            )}
                            Email
                          </Button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </Card>
            )}

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

/**
 * Squelettes affichés pendant le chargement initial.
 * Mime la structure de la page chargée pour que le layout ne saute pas.
 */
const SkeletonBlock = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse rounded bg-muted/60 ${className}`} />
);

const SkeletonContent = () => (
  <>
    {/* 4 KPI */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[0, 1, 2, 3].map((i) => (
        <Card key={i} className="p-4 space-y-2">
          <SkeletonBlock className="h-3 w-24" />
          <SkeletonBlock className="h-8 w-16" />
          <SkeletonBlock className="h-3 w-20" />
        </Card>
      ))}
    </div>

    {/* Aujourd'hui card */}
    <Card className="p-5 md:p-6 space-y-4 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <SkeletonBlock className="h-6 w-40" />
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <SkeletonBlock className="h-4 w-32" />
          {[0, 1].map((i) => (
            <SkeletonBlock key={i} className="h-14 w-full" />
          ))}
        </div>
        <div className="space-y-2">
          <SkeletonBlock className="h-4 w-32" />
          {[0, 1].map((i) => (
            <SkeletonBlock key={i} className="h-14 w-full" />
          ))}
        </div>
      </div>
    </Card>

    {/* Cette semaine */}
    <Card className="p-5 md:p-6 space-y-3">
      <SkeletonBlock className="h-6 w-48" />
      {[0, 1, 2].map((i) => (
        <SkeletonBlock key={i} className="h-12 w-full" />
      ))}
    </Card>
  </>
);

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
