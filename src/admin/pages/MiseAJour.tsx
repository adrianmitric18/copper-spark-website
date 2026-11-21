/**
 * /admin/mise-a-jour — « Mise à jour proposée » (lot statuts automatiques).
 *
 * Rattrapage des fiches d'avant la mise en service : RDV passés jamais
 * clôturés, anciennes visites sans devis, leads sans action depuis 60 jours.
 * RIEN ne s'applique tant qu'Adrian n'a pas tapé « Appliquer » : sur chaque
 * ligne il peut décocher, ou changer le statut proposé (Converti / Devis
 * envoyé / Sans suite / Perdu).
 *
 * En dessous : ce que l'automatique a fait sur cet appareil (journal local ;
 * la trace durable est dans les notes de chaque lead).
 */

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import AdminShell from "@/admin/layout/AdminShell";
import {
  appliquerRattrapage,
  fetchAllRdvs,
  fetchLeadsWithUpcomingRdvs,
  type LigneRattrapage,
} from "@/lib/admin/queries";
import { fetchAllInterventions } from "@/lib/admin/interventions";
import {
  LIBELLE_RATTRAPAGE,
  STATUTS_RATTRAPAGE,
  calculerPropositions,
  type StatutRattrapage,
} from "@/lib/admin/statuts-auto";
import { marquerJournalVu } from "@/lib/admin/journal-auto";
import { CLE_CHANTIERS, CLE_LEADS, CLE_RDVS, useJournalAuto } from "@/admin/hooks/useStatutsAuto";

const dateHeure = (iso: string): string =>
  new Date(iso).toLocaleString("fr-BE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

const MiseAJour = () => {
  const { user, ready } = useAdminGuard();
  const queryClient = useQueryClient();
  const journal = useJournalAuto();
  // Choix d'Adrian par lead : case (dé)cochée et statut retenu. Absent = proposition d'origine.
  const [coches, setCoches] = useState<Record<string, boolean>>({});
  const [statuts, setStatuts] = useState<Record<string, StatutRattrapage>>({});
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    document.title = "Mise à jour proposée – Le Cuivre Admin";
    // Ouvrir l'écran, c'est avoir vu le bandeau.
    marquerJournalVu();
  }, []);

  const options = { enabled: ready, staleTime: 60_000, refetchOnWindowFocus: false } as const;
  const leadsQuery = useQuery({ queryKey: CLE_LEADS, queryFn: fetchLeadsWithUpcomingRdvs, ...options });
  const rdvsQuery = useQuery({ queryKey: CLE_RDVS, queryFn: fetchAllRdvs, ...options });
  const chantiersQuery = useQuery({ queryKey: CLE_CHANTIERS, queryFn: fetchAllInterventions, ...options });

  const chargement = leadsQuery.isLoading || rdvsQuery.isLoading || chantiersQuery.isLoading;
  const erreur = leadsQuery.error || rdvsQuery.error || chantiersQuery.error;

  // Sans les trois jeux de données, la liste serait fausse : on n'affiche rien.
  const propositions = useMemo(
    () =>
      leadsQuery.data && rdvsQuery.data && chantiersQuery.data
        ? calculerPropositions(leadsQuery.data.leads, rdvsQuery.data, chantiersQuery.data)
        : [],
    [leadsQuery.data, rdvsQuery.data, chantiersQuery.data],
  );

  const estCoche = (id: string, defaut: boolean): boolean => coches[id] ?? defaut;
  const retenues: LigneRattrapage[] = propositions
    .filter((p) => estCoche(p.leadId, p.coche))
    .map((p) => ({
      leadId: p.leadId,
      leadName: p.leadName,
      statutAvant: p.statutAvant,
      statut: statuts[p.leadId] ?? p.propose,
      dateDevis: p.dateDevis,
    }));
  const toutCoche = propositions.length > 0 && retenues.length === propositions.length;

  const basculerTout = () =>
    setCoches(Object.fromEntries(propositions.map((p) => [p.leadId, !toutCoche])));

  const appliquer = async () => {
    if (retenues.length === 0) return;
    setEnCours(true);
    try {
      const echecs = await appliquerRattrapage(retenues);
      const ok = retenues.length - echecs.length;
      if (ok > 0) {
        toast.success(`${ok} fiche${ok > 1 ? "s" : ""} mise${ok > 1 ? "s" : ""} à jour`, {
          description: "Les leads terminés sont dans l'onglet « Terminés ».",
        });
      }
      if (echecs.length > 0) {
        toast.warning(`Non appliqué : ${echecs.join(", ")}`, { description: "Réessaie dans un instant." });
      }
      setCoches({});
      setStatuts({});
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: CLE_LEADS }),
        queryClient.invalidateQueries({ queryKey: CLE_RDVS }),
      ]);
    } finally {
      setEnCours(false);
    }
  };

  return (
    <AdminShell email={user?.email} mobileTitle="Mise à jour proposée">
      <div className="p-4 md:p-8 space-y-4 max-w-3xl mx-auto pb-28">
        <div>
          <h1 className="text-xl md:text-2xl font-display font-bold">Mise à jour proposée</h1>
          <p className="text-sm text-muted-foreground">
            Anciennes fiches à remettre d'aplomb. Rien ne change tant que tu n'as pas tapé « Appliquer ».
            Décoche une ligne pour la laisser telle quelle, ou change le statut proposé.
          </p>
        </div>

        {chargement ? (
          <div className="space-y-2" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-24 rounded-lg bg-muted/40 animate-pulse" />
            ))}
          </div>
        ) : erreur ? (
          <Card className="p-4">
            <p role="alert" className="text-sm text-destructive">
              Impossible de charger les leads, les rendez-vous et les chantiers : la liste ne peut pas être
              établie sans eux. Réessaie dans un instant.
            </p>
          </Card>
        ) : propositions.length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted-foreground">
            <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-primary" aria-hidden="true" />
            Rien à rattraper : toutes les fiches sont à jour.
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">
                {propositions.length} fiche{propositions.length > 1 ? "s" : ""} · {retenues.length} cochée
                {retenues.length > 1 ? "s" : ""}
              </p>
              <Button type="button" variant="ghost" size="sm" onClick={basculerTout} className="min-h-[44px]">
                {toutCoche ? "Tout décocher" : "Tout cocher"}
              </Button>
            </div>
            <ul className="space-y-2">
              {propositions.map((p) => {
                const coche = estCoche(p.leadId, p.coche);
                const choix = statuts[p.leadId] ?? p.propose;
                return (
                  <li key={p.leadId}>
                    <Card className={`p-3 space-y-2 ${coche ? "" : "opacity-70"}`}>
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={coche}
                          onCheckedChange={(v) => setCoches((prev) => ({ ...prev, [p.leadId]: v === true }))}
                          className="h-6 w-6 shrink-0 mt-0.5"
                          aria-label={`Mettre à jour ${p.leadName}`}
                        />
                        <div className="min-w-0 flex-1">
                          <Link
                            to={`/admin/lead/${p.leadId}`}
                            className="font-medium hover:underline inline-flex items-center gap-1 max-w-full"
                          >
                            <span className="truncate">{p.leadName}</span>
                            <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {p.commune ? `${p.commune} · ` : ""}
                            {p.raison}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pl-9">
                        <span className="text-sm text-muted-foreground shrink-0 first-letter:uppercase">
                          {p.statutAvant} →
                        </span>
                        <select
                          value={choix}
                          onChange={(e) => {
                            const v = e.target.value as StatutRattrapage;
                            setStatuts((prev) => ({ ...prev, [p.leadId]: v }));
                            // Choisir un statut, c'est vouloir l'appliquer.
                            setCoches((prev) => ({ ...prev, [p.leadId]: true }));
                          }}
                          className="min-h-[44px] flex-1 min-w-0 rounded-md border border-border bg-background px-2 text-sm font-medium"
                          aria-label={`Nouveau statut de ${p.leadName}`}
                        >
                          {STATUTS_RATTRAPAGE.map((s) => (
                            <option key={s} value={s}>
                              {LIBELLE_RATTRAPAGE[s]}
                            </option>
                          ))}
                        </select>
                      </div>
                    </Card>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {journal.entrees.length > 0 && (
          <Card className="p-3 sm:p-4 space-y-2">
            <h2 className="font-semibold">Fait automatiquement</h2>
            <p className="text-xs text-muted-foreground">
              Sur cet appareil. Chaque changement est aussi noté dans la fiche du lead.
            </p>
            <ul className="divide-y divide-border/60">
              {journal.entrees.map((e, i) => (
                <li key={`${e.quand}-${e.leadId}-${i}`}>
                  <Link to={`/admin/lead/${e.leadId}`} className="flex items-center gap-2 py-2 min-h-[44px] group">
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium truncate group-hover:underline">{e.nom}</span>
                      <span className="block text-xs text-muted-foreground">
                        {dateHeure(e.quand)} · {e.texte}
                      </span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      {/* Bouton figé au-dessus de la barre d'onglets : toujours sous le pouce. */}
      {propositions.length > 0 && (
        <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] md:bottom-0 md:left-auto md:right-0 md:w-[calc(100%-16rem)] z-20 border-t border-border/50 bg-background/95 backdrop-blur p-3">
          <div className="max-w-3xl mx-auto">
            <Button
              type="button"
              variant="copper"
              size="lg"
              className="w-full min-h-[48px]"
              disabled={enCours || retenues.length === 0}
              onClick={appliquer}
            >
              {enCours ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Appliquer ({retenues.length})
            </Button>
          </div>
        </div>
      )}
    </AdminShell>
  );
};

export default MiseAJour;
