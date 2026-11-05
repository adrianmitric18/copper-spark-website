/**
 * /admin — Accueil en TROIS BLOCS, pas plus (lot 2.2 du brief admin 2026-11) :
 *
 *   1. Aujourd'hui : les RDV du jour → Appeler · WhatsApp · Itinéraire
 *   2. Demain      : les rappels J-1 → WhatsApp · SMS (· Email si adresse) ;
 *                    un rappel envoyé disparaît du bloc
 *   3. À faire     : nouveaux leads à rappeler (< 30 jours) et devis à
 *                    relancer, 5 maximum → Appeler · WhatsApp · Terminer
 *
 * Pas de salutation, pas de statistiques, pas de « Sources ce mois », pas de
 * « 7 prochains jours » (le calendrier les montre). L'ancien cockpit est
 * conservé tel quel, non routé, dans AujourdhuiCockpit.tsx (rail 4 : on ne
 * supprime rien ; le ménage est prévu au lot 3).
 */

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  ChevronRight,
  ListChecks,
  Loader2,
  Mail,
  MessageCircle,
  Navigation,
  Phone,
  Smartphone,
  Sun,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import AdminShell from "@/admin/layout/AdminShell";
import TerminerLeadButton from "@/components/admin/TerminerLeadButton";
import {
  fetchAllRdvs,
  fetchLeadsWithUpcomingRdvs,
  hasUsableEmail,
  traceEnvoi,
  type RdvWithLead,
} from "@/lib/admin/queries";
import type { CanalEnvoi } from "@/lib/admin/envois";
import { estARappeler, isRdvActif, todayIsoLocal, type Lead } from "@/lib/admin/types";
import { formatHeure } from "@/lib/rdv/formatters";
import { envoyerEmailSiPossible, sendRappelJ1Emails, type LeadInfo } from "@/lib/rdv/emailjs";
import type { RendezVous } from "@/lib/rdv/constants";
import {
  COMPANY,
  buildSmsHref,
  buildWhatsappHref,
  smsRappelLead,
  whatsappTemplateRelance1,
  whatsappTemplateRelance2,
  whatsappTemplateRelance3,
  type RelanceDevisPayload,
} from "@/lib/admin/message-templates";

const JOUR_MS = 24 * 60 * 60 * 1000;
const A_FAIRE_MAX = 5;

const prenomDe = (nom: string): string => nom.trim().split(/\s+/)[0] || nom.trim();

const dateLongue = (iso: string): string =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("fr-BE", { weekday: "long", day: "numeric", month: "long" });

const adresseDe = (r: RdvWithLead): string =>
  [
    [r.lead_rue, r.lead_numero].filter(Boolean).join(" "),
    [r.lead_code_postal, r.lead_commune].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(", ");

const itineraire = (r: RdvWithLead): string | null => {
  const q = [r.lead_rue, r.lead_numero, r.lead_code_postal, r.lead_commune].filter(Boolean).join(" ").trim();
  return q ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}` : null;
};

/** WhatsApp du jour : « je confirme ma visite aujourd'hui ». */
const texteDuJour = (r: RdvWithLead): string =>
  `Bonjour ${prenomDe(r.lead_name)} 👋 C'est ${COMPANY.ownerFirstName}, du Cuivre Électrique. Je confirme ma visite aujourd'hui à ${formatHeure(r.heure_rdv)}. À tout à l'heure !`;

/** Rappel J-1 (SMS / WhatsApp) : lignes 🔧 / 📍 seulement si l'info existe. */
const texteRappel = (r: RdvWithLead): string => {
  const lignes = [
    `Bonjour ${prenomDe(r.lead_name)} 👋 C'est ${COMPANY.ownerFirstName}, du Cuivre Électrique.`,
    "Petit rappel pour demain :",
    `🗓️ ${dateLongue(r.date_rdv)} à ${formatHeure(r.heure_rdv)}`,
  ];
  if (r.type_visite) lignes.push(`🔧 ${r.type_visite}`);
  const adresse = adresseDe(r);
  if (adresse) lignes.push(`📍 ${adresse}`);
  lignes.push(`Si ça ne convient plus, prévenez-moi au ${COMPANY.tel} et on décale sans souci.`);
  lignes.push(`À demain ! ${COMPANY.ownerFirstName}`);
  return lignes.join("\n");
};

// Relances devis : J+3 → 1, J+7 → 2, J+14 → 3.
type Palier = 1 | 2 | 3;
const palierDe = (jours: number): Palier | null => (jours >= 14 ? 3 : jours >= 7 ? 2 : jours >= 3 ? 1 : null);
const joursDepuisIso = (iso: string): number => {
  const [y, m, d] = iso.split("-").map(Number);
  const debut = new Date(y, m - 1, d, 12).getTime();
  const n = new Date();
  return Math.round((new Date(n.getFullYear(), n.getMonth(), n.getDate(), 12).getTime() - debut) / JOUR_MS);
};
const texteRelance = (palier: Palier, payload: RelanceDevisPayload): string =>
  palier === 1
    ? whatsappTemplateRelance1(payload)
    : palier === 2
      ? whatsappTemplateRelance2(payload)
      : whatsappTemplateRelance3(payload);

type AFaire =
  | { genre: "rappel"; lead: Lead; detail: string }
  | { genre: "relance"; lead: Lead; detail: string; palier: Palier };

const ageTexte = (createdAt: string): string => {
  const h = Math.floor((Date.now() - new Date(createdAt).getTime()) / 3_600_000);
  if (h < 24) return `reçu il y a ${Math.max(h, 1)} h`;
  const j = Math.floor(h / 24);
  return `reçu il y a ${j} jour${j > 1 ? "s" : ""}`;
};

// Boutons d'action : trois par ligne sur un téléphone de 360 px de large,
// cibles de 44 px. Texte et marges resserrés pour que « WhatsApp » tienne.
const ACTION = "min-h-[44px] min-w-0 px-1 gap-1 text-[13px] sm:px-3 sm:gap-2 sm:text-sm";

const Bloc = ({
  titre,
  sousTitre,
  icone,
  children,
}: {
  titre: string;
  sousTitre?: string;
  icone: ReactNode;
  children: ReactNode;
}) => (
  <Card className="p-3 sm:p-4 md:p-6 space-y-3">
    <div className="flex items-baseline justify-between gap-2 flex-wrap">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        {icone}
        {titre}
      </h2>
      {sousTitre && <p className="text-sm text-muted-foreground first-letter:uppercase">{sousTitre}</p>}
    </div>
    {children}
  </Card>
);

const Vide = ({ children }: { children: ReactNode }) => (
  <p className="text-sm text-muted-foreground py-2">{children}</p>
);

const Aujourdhui = () => {
  const { user, ready } = useAdminGuard();
  const queryClient = useQueryClient();
  const [emailEnCours, setEmailEnCours] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Aujourd'hui – Le Cuivre Admin";
  }, []);

  // Caches partagés avec Leads et le calendrier (navigation instantanée).
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

  useEffect(() => {
    if (leadsQuery.error) {
      const msg = leadsQuery.error instanceof Error ? leadsQuery.error.message : "chargement des leads impossible";
      toast.error("Erreur : " + msg);
    }
  }, [leadsQuery.error]);
  useEffect(() => {
    if (rdvsQuery.error) {
      const msg = rdvsQuery.error instanceof Error ? rdvsQuery.error.message : "chargement des RDV impossible";
      toast.error("Erreur : " + msg);
    }
  }, [rdvsQuery.error]);

  const leads = useMemo(() => leadsQuery.data?.leads ?? [], [leadsQuery.data]);
  const upcomingByLead = useMemo(() => leadsQuery.data?.upcomingByLead ?? {}, [leadsQuery.data]);
  const rdvs = useMemo(() => rdvsQuery.data ?? [], [rdvsQuery.data]);
  const loading = leadsQuery.isLoading || rdvsQuery.isLoading;

  const aujourdhui = todayIsoLocal();
  const demain = todayIsoLocal(new Date(Date.now() + JOUR_MS));

  // Bloc 1 — RDV du jour (ni annulés ni terminés).
  const rdvDuJour = useMemo(
    () =>
      rdvs
        .filter((r) => isRdvActif(r.statut) && r.date_rdv === aujourdhui)
        .sort((a, b) => a.heure_rdv.localeCompare(b.heure_rdv)),
    [rdvs, aujourdhui],
  );

  // Bloc 2 — rappels J-1 : un rappel envoyé disparaît du bloc.
  const rdvDeDemain = useMemo(
    () => rdvs.filter((r) => isRdvActif(r.statut) && r.date_rdv === demain),
    [rdvs, demain],
  );
  const rappelsAEnvoyer = useMemo(
    () =>
      rdvDeDemain
        .filter((r) => r.statut !== "rappel_envoye")
        .sort((a, b) => a.heure_rdv.localeCompare(b.heure_rdv)),
    [rdvDeDemain],
  );
  const rappelsEnvoyes = rdvDeDemain.length - rappelsAEnvoyer.length;

  // Bloc 3 — à faire : nouveaux leads à rappeler (< 30 jours) puis devis à relancer.
  const aFaireTous = useMemo<AFaire[]>(() => {
    const rappels: AFaire[] = leads
      .filter((l) => estARappeler(l, Boolean(upcomingByLead[l.id])))
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map((l) => ({ genre: "rappel", lead: l, detail: `Nouveau · ${ageTexte(l.created_at)}` }));
    const relances: AFaire[] = [];
    for (const l of leads) {
      if (l.status !== "devis envoyé" || !l.devis_envoye_at) continue;
      const jours = joursDepuisIso(l.devis_envoye_at);
      const palier = palierDe(jours);
      if (palier === null) continue;
      relances.push({ genre: "relance", lead: l, palier, detail: `Devis envoyé il y a ${jours} jours · relance ${palier}` });
    }
    relances.sort((a, b) => (a.lead.devis_envoye_at ?? "").localeCompare(b.lead.devis_envoye_at ?? ""));
    return [...rappels, ...relances];
  }, [leads, upcomingByLead]);
  const aFaire = aFaireTous.slice(0, A_FAIRE_MAX);

  // Taper SMS / WhatsApp marque le RDV « rappel envoyé » et trace l'envoi.
  // Fire-and-forget : n'empêche jamais l'ouverture du message.
  const marquerRappelEnvoye = async (r: RdvWithLead, canal: CanalEnvoi) => {
    try {
      void traceEnvoi(r.lead_id, canal, "Rappel J-1");
      const { error } = await supabase
        .from("rendez_vous")
        .update({ statut: "rappel_envoye", rappel_envoye_at: new Date().toISOString() })
        .eq("id", r.id);
      if (error) throw error;
      void queryClient.invalidateQueries({ queryKey: ["admin-rdvs-all"] });
    } catch (e: unknown) {
      const m = e instanceof Error ? e.message : "mise à jour impossible";
      toast.warning("Rappel non marqué comme envoyé : " + m);
    }
  };

  const envoyerRappelEmail = async (r: RdvWithLead) => {
    setEmailEnCours(r.id);
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
      const res = await envoyerEmailSiPossible(lead, () => sendRappelJ1Emails(lead, rdv));
      if (res.statut === "envoye") {
        toast.success("Rappel email envoyé");
        await marquerRappelEnvoye(r, "Email");
      } else if (res.statut === "non_envoye") {
        toast.info("Pas d'email pour ce client : utilise SMS ou WhatsApp.");
      } else {
        toast.warning("Rappel email non parti : " + (res.erreur ?? "envoi impossible"), {
          description: "Préviens le client par SMS ou WhatsApp.",
        });
      }
    } finally {
      setEmailEnCours(null);
    }
  };

  return (
    <AdminShell email={user?.email} mobileTitle="Aujourd'hui">
      <div className="p-4 md:p-8 space-y-4 max-w-3xl mx-auto">
        <h1 className="sr-only">Accueil</h1>

        {loading ? (
          <div className="space-y-4" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-28 rounded-lg bg-muted/40 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* 1 — Aujourd'hui */}
            <Bloc
              titre={`Aujourd'hui${rdvDuJour.length ? ` (${rdvDuJour.length})` : ""}`}
              sousTitre={dateLongue(aujourdhui)}
              icone={<Sun className="w-5 h-5 text-primary" aria-hidden="true" />}
            >
              {rdvDuJour.length === 0 ? (
                <Vide>Aucun RDV aujourd'hui.</Vide>
              ) : (
                <ul className="space-y-2">
                  {rdvDuJour.map((r) => {
                    const maps = itineraire(r);
                    return (
                      <li key={r.id} className="rounded-lg border bg-background p-2.5 sm:p-3 space-y-2">
                        <Link to={`/admin/lead/${r.lead_id}`} className="flex items-center gap-3 group">
                          <span className="text-lg font-bold text-primary tabular-nums shrink-0">
                            {formatHeure(r.heure_rdv)}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block font-medium truncate group-hover:underline">{r.lead_name}</span>
                            <span className="block text-xs text-muted-foreground truncate">
                              {r.type_visite}
                              {r.lead_commune && ` · ${r.lead_commune}`}
                            </span>
                          </span>
                          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
                        </Link>
                        <div className={`grid gap-2 ${maps ? "grid-cols-3" : "grid-cols-2"}`}>
                          <Button asChild size="sm" variant="copper" className={ACTION}>
                            <a href={`tel:${r.lead_phone}`} aria-label={`Appeler ${r.lead_name}`}>
                              <Phone className="w-4 h-4" /> Appeler
                            </a>
                          </Button>
                          <Button
                            asChild
                            size="sm"
                            className={`${ACTION} bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp/90`}
                          >
                            <a
                              href={buildWhatsappHref(r.lead_phone, texteDuJour(r))}
                              target="_blank"
                              rel="noreferrer"
                              onClick={() => void traceEnvoi(r.lead_id, "WhatsApp", "Confirmation du jour")}
                              aria-label={`WhatsApp à ${r.lead_name}`}
                            >
                              <MessageCircle className="w-4 h-4" /> WhatsApp
                            </a>
                          </Button>
                          {maps && (
                            <Button asChild size="sm" variant="outline" className={ACTION}>
                              <a href={maps} target="_blank" rel="noreferrer" aria-label={`Itinéraire vers ${r.lead_name}`}>
                                <Navigation className="w-4 h-4" /> Itinéraire
                              </a>
                            </Button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Bloc>

            {/* 2 — Demain : rappels J-1 */}
            <Bloc
              titre={`Demain${rappelsAEnvoyer.length ? ` (${rappelsAEnvoyer.length})` : ""}`}
              sousTitre={dateLongue(demain)}
              icone={<Bell className="w-5 h-5 text-primary" aria-hidden="true" />}
            >
              {rappelsAEnvoyer.length === 0 ? (
                <Vide>
                  {rappelsEnvoyes > 0
                    ? `Rappels envoyés (${rappelsEnvoyes}). Plus rien à faire pour demain.`
                    : "Aucun RDV demain."}
                </Vide>
              ) : (
                <>
                  <ul className="space-y-2">
                    {rappelsAEnvoyer.map((r) => {
                      const email = hasUsableEmail(r.lead_email);
                      return (
                        <li key={r.id} className="rounded-lg border bg-background p-2.5 sm:p-3 space-y-2">
                          <Link to={`/admin/lead/${r.lead_id}`} className="flex items-center gap-3 group">
                            <span className="text-lg font-bold text-primary tabular-nums shrink-0">
                              {formatHeure(r.heure_rdv)}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block font-medium truncate group-hover:underline">{r.lead_name}</span>
                              <span className="block text-xs text-muted-foreground truncate">
                                {r.type_visite}
                                {r.lead_commune && ` · ${r.lead_commune}`}
                              </span>
                            </span>
                            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
                          </Link>
                          <div className={`grid gap-2 ${email ? "grid-cols-3" : "grid-cols-2"}`}>
                            <Button
                              asChild
                              size="sm"
                              className={`${ACTION} bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp/90`}
                            >
                              <a
                                href={buildWhatsappHref(r.lead_phone, texteRappel(r))}
                                target="_blank"
                                rel="noreferrer"
                                onClick={() => void marquerRappelEnvoye(r, "WhatsApp")}
                                aria-label={`Rappel WhatsApp à ${r.lead_name}`}
                              >
                                <MessageCircle className="w-4 h-4" /> WhatsApp
                              </a>
                            </Button>
                            <Button
                              asChild
                              size="sm"
                              className={`${ACTION} bg-sms text-sms-foreground hover:bg-sms/90`}
                            >
                              <a
                                href={buildSmsHref(r.lead_phone, texteRappel(r))}
                                onClick={() => void marquerRappelEnvoye(r, "SMS")}
                                aria-label={`Rappel SMS à ${r.lead_name}`}
                              >
                                <Smartphone className="w-4 h-4" /> SMS
                              </a>
                            </Button>
                            {email && (
                              <Button
                                size="sm"
                                variant="outline"
                                className={ACTION}
                                disabled={emailEnCours === r.id}
                                onClick={() => envoyerRappelEmail(r)}
                                aria-label={`Rappel email à ${r.lead_name}`}
                              >
                                {emailEnCours === r.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Mail className="w-4 h-4" />
                                )}
                                Email
                              </Button>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                  {rappelsEnvoyes > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {rappelsEnvoyes} rappel{rappelsEnvoyes > 1 ? "s" : ""} déjà envoyé{rappelsEnvoyes > 1 ? "s" : ""}.
                    </p>
                  )}
                </>
              )}
            </Bloc>

            {/* 3 — À faire */}
            <Bloc
              titre={`À faire${aFaireTous.length ? ` (${aFaireTous.length})` : ""}`}
              icone={<ListChecks className="w-5 h-5 text-primary" aria-hidden="true" />}
            >
              {aFaire.length === 0 ? (
                <Vide>Rien à rappeler, rien à relancer.</Vide>
              ) : (
                <>
                  <ul className="space-y-2">
                    {aFaire.map((item) => {
                      const l = item.lead;
                      const texte =
                        item.genre === "rappel"
                          ? smsRappelLead(l.name)
                          : texteRelance(item.palier, {
                              clientName: prenomDe(l.name),
                              devisEnvoyeAt: l.devis_envoye_at as string,
                            });
                      const titreTrace = item.genre === "rappel" ? "Rappel lead" : `Relance devis ${item.palier}`;
                      return (
                        <li key={`${item.genre}-${l.id}`} className="rounded-lg border bg-background p-2.5 sm:p-3 space-y-2">
                          <Link to={`/admin/lead/${l.id}`} className="flex items-center gap-3 group">
                            <span className="min-w-0 flex-1">
                              <span className="block font-medium truncate group-hover:underline">{l.name}</span>
                              <span className="block text-xs text-muted-foreground truncate">
                                {item.detail}
                                {l.commune && ` · ${l.commune}`}
                              </span>
                            </span>
                            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
                          </Link>
                          <div className="grid grid-cols-3 gap-2">
                            <Button asChild size="sm" variant="copper" className={ACTION}>
                              <a href={`tel:${l.phone}`} aria-label={`Appeler ${l.name}`}>
                                <Phone className="w-4 h-4" /> Appeler
                              </a>
                            </Button>
                            <Button
                              asChild
                              size="sm"
                              className={`${ACTION} bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp/90`}
                            >
                              <a
                                href={buildWhatsappHref(l.phone, texte)}
                                target="_blank"
                                rel="noreferrer"
                                onClick={() => void traceEnvoi(l.id, "WhatsApp", titreTrace)}
                                aria-label={`WhatsApp à ${l.name}`}
                              >
                                <MessageCircle className="w-4 h-4" /> WhatsApp
                              </a>
                            </Button>
                            <TerminerLeadButton lead={l} className={`${ACTION} w-full`} />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                  {aFaireTous.length > aFaire.length && (
                    <Button asChild variant="ghost" size="sm" className="min-h-[40px]">
                      <Link to="/admin/pipeline">
                        Voir les {aFaireTous.length - aFaire.length} autres dans Leads <ChevronRight className="w-4 h-4" />
                      </Link>
                    </Button>
                  )}
                </>
              )}
            </Bloc>
          </>
        )}
      </div>
    </AdminShell>
  );
};

export default Aujourdhui;
