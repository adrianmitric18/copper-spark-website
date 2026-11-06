/**
 * /admin/avis-a-demander — « Avis à demander » (lot 2b.2 du brief admin 2026-11).
 *
 * Les leads dont le travail est fait (statut « converti » ou chantier terminé)
 * et à qui aucun avis Google n'a encore été demandé. Taper SMS ou WhatsApp
 * ouvre le message d'avis, trace « Avis demandé » dans les notes du lead et
 * sort la ligne de la liste. « Ne pas demander » trace « Avis : non ».
 */

import { useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, MessageCircle, Smartphone, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import AdminShell from "@/admin/layout/AdminShell";
import AdminLoading from "@/components/admin/AdminLoading";
import { fetchLeadsWithUpcomingRdvs, traceEnvoi, traceNote } from "@/lib/admin/queries";
import { fetchAllInterventions } from "@/lib/admin/interventions";
import { TRACE_AVIS_DEMANDE, TRACE_AVIS_REFUSE, leadsAvisADemander } from "@/lib/admin/avis";
import { ajouterTrace, formatTraceEnvoi, formatTraceNote, type CanalEnvoi } from "@/lib/admin/envois";
import { buildSmsHref, buildWhatsappHref, messageDemandeAvis } from "@/lib/admin/message-templates";
import type { Lead } from "@/lib/admin/types";

type Overview = Awaited<ReturnType<typeof fetchLeadsWithUpcomingRdvs>>;
const CLE_LEADS = ["admin-leads-overview"] as const;

const prenomDe = (nom: string): string => nom.trim().split(/\s+/)[0] || nom.trim();

const AvisADemander = () => {
  const { user, ready } = useAdminGuard();
  const queryClient = useQueryClient();

  useEffect(() => {
    document.title = "Avis à demander – Le Cuivre Admin";
  }, []);

  const leadsQuery = useQuery({
    queryKey: CLE_LEADS,
    queryFn: fetchLeadsWithUpcomingRdvs,
    enabled: ready,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  const chantiersQuery = useQuery({
    queryKey: ["admin-interventions"],
    queryFn: fetchAllInterventions,
    enabled: ready,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    const erreur = leadsQuery.error || chantiersQuery.error;
    if (erreur) toast.error("Erreur : " + (erreur instanceof Error ? erreur.message : "chargement impossible"));
  }, [leadsQuery.error, chantiersQuery.error]);

  const aDemander = useMemo(
    () => leadsAvisADemander(leadsQuery.data?.leads ?? [], chantiersQuery.data ?? []),
    [leadsQuery.data, chantiersQuery.data],
  );

  // Rechargement différé : plusieurs taps rapprochés n'en déclenchent qu'un,
  // une fois les écritures passées — sinon le rechargement du premier ferait
  // réapparaître la ligne du second, pas encore écrite.
  const rechargement = useRef<number | null>(null);
  const rechargerBientot = () => {
    if (rechargement.current !== null) window.clearTimeout(rechargement.current);
    rechargement.current = window.setTimeout(() => {
      rechargement.current = null;
      void queryClient.invalidateQueries({ queryKey: CLE_LEADS });
    }, 2500);
  };
  useEffect(
    () => () => {
      if (rechargement.current !== null) window.clearTimeout(rechargement.current);
    },
    [],
  );

  // La ligne quitte la liste tout de suite (la trace est ajoutée au cache),
  // puis l'écriture part en arrière-plan : elle n'empêche jamais l'ouverture
  // du message.
  const sortirDeLaListe = (lead: Lead, ligne: string, ecrire: () => Promise<string | null>) => {
    queryClient.setQueryData<Overview>(
      CLE_LEADS,
      (prev) =>
        prev && {
          ...prev,
          leads: prev.leads.map((l) =>
            l.id === lead.id ? { ...l, notes_internes: ajouterTrace(l.notes_internes, ligne) } : l,
          ),
        },
    );
    void ecrire().then((ecrite) => {
      if (!ecrite) {
        toast.warning("Trace non enregistrée", {
          description: `${lead.name} reviendra dans la liste au prochain chargement.`,
        });
      }
      rechargerBientot();
    });
  };

  const demander = (lead: Lead, canal: CanalEnvoi) =>
    sortirDeLaListe(lead, formatTraceEnvoi(canal, TRACE_AVIS_DEMANDE), () =>
      traceEnvoi(lead.id, canal, TRACE_AVIS_DEMANDE),
    );

  const nePasDemander = (lead: Lead) => {
    sortirDeLaListe(lead, formatTraceNote(TRACE_AVIS_REFUSE), () => traceNote(lead.id, TRACE_AVIS_REFUSE));
    toast.success(`${lead.name} : pas de demande d'avis`);
  };

  if (!ready || !user) return <AdminLoading />;

  const chargement = leadsQuery.isLoading || chantiersQuery.isLoading;
  // Sans les deux jeux de données, la liste serait fausse : on le dit, on
  // n'affiche pas « personne à relancer ».
  const erreurChargement = Boolean(leadsQuery.error || chantiersQuery.error);

  return (
    <AdminShell mobileTitle="Avis à demander">
      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Star className="w-7 h-7 text-primary shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <h1 className="text-2xl font-display font-bold">
              Avis à demander{aDemander.length ? ` (${aDemander.length})` : ""}
            </h1>
            <p className="text-xs text-muted-foreground">Chantiers finis, sans demande d'avis Google</p>
          </div>
        </div>

        {chargement ? (
          <div className="space-y-2" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-28 rounded-lg bg-muted/40 animate-pulse" />
            ))}
          </div>
        ) : erreurChargement ? (
          <Card className="p-6 text-center space-y-3">
            <p role="alert" className="text-sm">
              La liste n'a pas pu être chargée. Vérifie la connexion, puis réessaie.
            </p>
            <Button
              variant="outline"
              className="min-h-[44px]"
              onClick={() => {
                void leadsQuery.refetch();
                void chantiersQuery.refetch();
              }}
            >
              Réessayer
            </Button>
          </Card>
        ) : aDemander.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            Personne à relancer : un avis a été demandé à tous les clients dont le chantier est fini.
          </Card>
        ) : (
          <ul className="space-y-2">
            {aDemander.map((l) => {
              const texte = messageDemandeAvis(prenomDe(l.name), l.services?.[0] || "votre projet");
              return (
                <li key={l.id}>
                  <Card className="p-3 space-y-2">
                    <Link to={`/admin/lead/${l.id}`} className="flex items-center gap-3 group">
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium truncate group-hover:underline">{l.name}</span>
                        <span className="block text-xs text-muted-foreground truncate">
                          {l.status === "converti" ? "Converti" : "Chantier terminé"}
                          {l.commune && ` · ${l.commune}`}
                        </span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
                    </Link>
                    {/* Sans numéro, aucun message ne peut partir : on ne trace rien,
                        la fiche permet de le compléter. */}
                    {!l.phone?.trim() && (
                      <p className="text-sm text-muted-foreground">
                        Pas de téléphone : ouvre la fiche pour l'ajouter.
                      </p>
                    )}
                    <div className={l.phone?.trim() ? "grid grid-cols-2 gap-2" : "hidden"}>
                      <Button
                        asChild
                        size="sm"
                        className="min-h-[44px] bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp/90"
                      >
                        <a
                          href={buildWhatsappHref(l.phone, texte)}
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => demander(l, "WhatsApp")}
                          aria-label={`Demander un avis à ${l.name} par WhatsApp`}
                        >
                          <MessageCircle className="w-4 h-4" /> WhatsApp
                        </a>
                      </Button>
                      <Button asChild size="sm" className="min-h-[44px] bg-sms text-sms-foreground hover:bg-sms/90">
                        <a
                          href={buildSmsHref(l.phone, texte)}
                          onClick={() => demander(l, "SMS")}
                          aria-label={`Demander un avis à ${l.name} par SMS`}
                        >
                          <Smartphone className="w-4 h-4" /> SMS
                        </a>
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-full min-h-[40px]"
                      onClick={() => nePasDemander(l)}
                    >
                      Ne pas demander
                    </Button>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </AdminShell>
  );
};

export default AvisADemander;
