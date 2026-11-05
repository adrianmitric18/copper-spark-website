import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { archiverLeads, fetchDernierRdvParLead } from "@/lib/admin/queries";
import { fetchAllInterventions } from "@/lib/admin/interventions";
import {
  ARCHIVE_APRES_JOURS,
  derniereActionMs,
  estArchivable,
  joursDepuis,
  libelleStatutLead,
  type Lead,
  type UpcomingByLead,
} from "@/lib/admin/types";

interface ArchiverAnciensDialogProps {
  leads: Lead[];
  upcomingByLead: UpcomingByLead;
}

/**
 * « Archiver les anciens » (Leads) : liste les leads actifs sans RDV à venir
 * et sans action depuis 60 jours ; Adrian coche, ils passent en « sans suite »
 * en un lot. Rien n'est supprimé : ils restent dans l'onglet « Terminés » et
 * peuvent être réactivés.
 *
 * « Action » = création, envoi du devis, dernier message tracé dans les notes,
 * dernier RDV, dernier chantier (cf. derniereActionMs dans types.ts). Un lead
 * qui a un chantier programmé ou en cours n'est jamais proposé.
 */
const ArchiverAnciensDialog = ({ leads, upcomingByLead }: ArchiverAnciensDialogProps) => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [coches, setCoches] = useState<Set<string>>(new Set());
  const [enCours, setEnCours] = useState(false);

  // Chargés seulement à l'ouverture. Sans ces deux jeux de données, la liste ne
  // peut pas être juste : on n'affiche rien plutôt qu'une liste fausse.
  const rdvQuery = useQuery({
    queryKey: ["admin-rdv-dernier-par-lead"],
    queryFn: fetchDernierRdvParLead,
    enabled: open,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  const chantiersQuery = useQuery({
    queryKey: ["admin-interventions"],
    queryFn: fetchAllInterventions,
    enabled: open,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const chargement = rdvQuery.isLoading || chantiersQuery.isLoading;
  const erreur = rdvQuery.error || chantiersQuery.error;

  const candidats = useMemo(() => {
    if (!rdvQuery.data || !chantiersQuery.data) return [];
    const dernierRdv = rdvQuery.data;
    const chantierOuvert = new Set<string>();
    const dernierChantier: Record<string, string> = {};
    for (const c of chantiersQuery.data) {
      if (c.statut === "programme" || c.statut === "en_cours") chantierOuvert.add(c.lead_id);
      if (c.statut !== "annule" && (!dernierChantier[c.lead_id] || c.date_fin > dernierChantier[c.lead_id])) {
        dernierChantier[c.lead_id] = c.date_fin;
      }
    }
    const out: { lead: Lead; jours: number }[] = [];
    for (const l of leads) {
      const ctx = {
        aUnRdvAVenir: Boolean(upcomingByLead[l.id]),
        dernierRdvIso: dernierRdv[l.id] ?? null,
        aUnChantierOuvert: chantierOuvert.has(l.id),
        dernierChantierIso: dernierChantier[l.id] ?? null,
      };
      if (!estArchivable(l, ctx)) continue;
      out.push({
        lead: l,
        jours: joursDepuis(derniereActionMs(l, ctx.dernierRdvIso, ctx.dernierChantierIso)),
      });
    }
    return out.sort((a, b) => b.jours - a.jours);
  }, [leads, upcomingByLead, rdvQuery.data, chantiersQuery.data]);

  // Ne garder cochés que des leads encore proposés (la liste peut changer).
  const idsCoches = candidats.filter((c) => coches.has(c.lead.id)).map((c) => c.lead.id);
  const toutCoche = candidats.length > 0 && idsCoches.length === candidats.length;

  const basculer = (id: string) =>
    setCoches((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const basculerTout = () =>
    setCoches(toutCoche ? new Set() : new Set(candidats.map((c) => c.lead.id)));

  const archiver = async () => {
    if (idsCoches.length === 0) return;
    setEnCours(true);
    try {
      await archiverLeads(idsCoches);
      const pluriel = idsCoches.length > 1 ? "s" : "";
      toast.success(`${idsCoches.length} lead${pluriel} passé${pluriel} en « sans suite »`, {
        description: "À retrouver dans l'onglet « Terminés ».",
      });
      setCoches(new Set());
      setOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["admin-leads-overview"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-rdvs-all"] });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "archivage impossible";
      toast.error("Erreur : " + msg);
    } finally {
      setEnCours(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setCoches(new Set());
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="min-h-[40px]">
          <Archive className="w-4 h-4" />
          <span>Archiver les anciens</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-dvh h-dvh sm:h-auto sm:max-h-[85vh] w-full sm:max-w-lg flex flex-col p-4 sm:p-6 sm:rounded-lg">
        <DialogHeader className="pr-8 text-left">
          <DialogTitle>Archiver les anciens</DialogTitle>
          <DialogDescription>
            Leads actifs sans RDV à venir et sans action depuis {ARCHIVE_APRES_JOURS} jours. Coche ceux à
            classer : ils passent en « sans suite » et restent dans « Terminés ».
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto -mx-1 px-1">
          {chargement ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : erreur ? (
            <p role="alert" className="text-sm text-destructive py-6">
              Impossible de charger les rendez-vous et les chantiers : la liste ne peut pas être établie
              sans eux. Ferme et réessaie.
            </p>
          ) : candidats.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Rien à archiver : aucun lead actif n'est resté sans action depuis {ARCHIVE_APRES_JOURS} jours.
            </p>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2 pb-2">
                <p className="text-sm text-muted-foreground">
                  {candidats.length} lead{candidats.length > 1 ? "s" : ""} proposé{candidats.length > 1 ? "s" : ""}
                </p>
                <Button type="button" variant="ghost" size="sm" onClick={basculerTout} className="min-h-[40px]">
                  {toutCoche ? "Tout décocher" : "Tout cocher"}
                </Button>
              </div>
              <ul className="space-y-1.5">
                {candidats.map(({ lead, jours }) => (
                  <li key={lead.id}>
                    <label className="flex min-h-[56px] items-center gap-3 rounded-md border bg-background px-3 py-2 cursor-pointer">
                      <Checkbox
                        checked={coches.has(lead.id)}
                        onCheckedChange={() => basculer(lead.id)}
                        className="h-6 w-6 shrink-0"
                        aria-label={`Archiver ${lead.name}`}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium text-sm truncate">{lead.name}</span>
                        <span className="block text-xs text-muted-foreground truncate">
                          {lead.commune ? `${lead.commune} · ` : ""}
                          {libelleStatutLead(lead.status, false)} · dernière action il y a {jours} jours
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="copper"
            size="lg"
            onClick={archiver}
            disabled={enCours || idsCoches.length === 0}
            className="w-full min-h-[48px]"
          >
            {enCours ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
            Passer en « sans suite » ({idsCoches.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ArchiverAnciensDialog;
