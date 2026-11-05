import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchLeadsWithUpcomingRdvs,
  terminerLead,
  updateLeadStatus,
} from "@/lib/admin/queries";
import { isTerminal, type TerminalLeadStatus } from "@/lib/admin/types";

type Overview = Awaited<ReturnType<typeof fetchLeadsWithUpcomingRdvs>>;

const CLE_LEADS = ["admin-leads-overview"] as const;
const CLE_RDVS = ["admin-rdvs-all"] as const;

/**
 * Change le statut d'un lead depuis n'importe quelle liste (Leads, Aujourd'hui,
 * Calendrier) : mise à jour optimiste du cache partagé — le lead quitte la
 * liste tout de suite — puis écriture, avec retour arrière si elle échoue.
 * Un statut terminé passe par `terminerLead` (clôt aussi les RDV passés).
 *
 * Retourne `true` si le changement est enregistré.
 */
export const useChangerStatutLead = () => {
  const queryClient = useQueryClient();

  return async (
    lead: { id: string; name: string; status: string },
    status: string,
  ): Promise<boolean> => {
    if (status === lead.status) return true;

    const appliquer = (s: string) =>
      queryClient.setQueryData<Overview>(
        CLE_LEADS,
        (prev) =>
          prev && {
            ...prev,
            leads: prev.leads.map((l) => (l.id === lead.id ? { ...l, status: s } : l)),
          },
      );

    // Un refetch en cours écraserait la mise à jour optimiste : on l'annule,
    // et on garde l'état exact du cache pour un retour arrière fidèle.
    await queryClient.cancelQueries({ queryKey: CLE_LEADS });
    const avant = queryClient.getQueryData<Overview>(CLE_LEADS);
    appliquer(status);
    try {
      if (isTerminal(status)) await terminerLead(lead.id, status as TerminalLeadStatus);
      else await updateLeadStatus(lead.id, status);
      toast.success(`${lead.name} → ${status}`);
      // Le calendrier affiche le statut du lead et les RDV clôturés.
      void queryClient.invalidateQueries({ queryKey: CLE_RDVS });
      void queryClient.invalidateQueries({ queryKey: CLE_LEADS });
      return true;
    } catch (e: unknown) {
      queryClient.setQueryData<Overview>(CLE_LEADS, avant);
      const msg = e instanceof Error ? e.message : "mise à jour impossible";
      toast.error("Erreur : " + msg);
      return false;
    }
  };
};
