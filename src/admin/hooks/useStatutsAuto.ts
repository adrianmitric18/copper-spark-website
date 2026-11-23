import { useEffect, useSyncExternalStore } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { appliquerActionsAuto, fetchAllRdvs, fetchLeadsWithUpcomingRdvs, supprimerPhotosAuto } from "@/lib/admin/queries";
import { fetchAllInterventions } from "@/lib/admin/interventions";
import { calculerActionsAuto } from "@/lib/admin/statuts-auto";
import { SUPPRESSION_PHOTOS_ACTIVE, photosASupprimer } from "@/lib/admin/photos-auto";
import { abonnerJournal, ajouterAuJournal, lireJournal, type JournalAuto } from "@/lib/admin/journal-auto";

// Clés de cache partagées avec Aujourd'hui, Leads, le calendrier et Chantiers.
export const CLE_LEADS = ["admin-leads-overview"] as const;
export const CLE_RDVS = ["admin-rdvs-all"] as const;
export const CLE_CHANTIERS = ["admin-interventions"] as const;

/** Pas plus d'un passage toutes les 5 minutes (navigation entre écrans, retours répétés). */
const INTERVALLE_MS = 5 * 60 * 1000;
/** Au retour sur l'app, des données de plus de 30 s sont rechargées. */
const FRAICHEUR_MS = 30_000;

let dernierPassage = 0;
let enCours = false;

const passer = async (queryClient: QueryClient): Promise<void> => {
  if (enCours) return;
  if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
  if (Date.now() - dernierPassage < INTERVALLE_MS) return;
  enCours = true;
  try {
    // fetchQuery recharge les caches partagés : au retour sur l'app, l'accueil
    // et les listes sont à jour même si rien n'est à clôturer.
    const [overview, rdvs, chantiers] = await Promise.all([
      queryClient.fetchQuery({ queryKey: CLE_LEADS, queryFn: fetchLeadsWithUpcomingRdvs, staleTime: FRAICHEUR_MS }),
      queryClient.fetchQuery({ queryKey: CLE_RDVS, queryFn: fetchAllRdvs, staleTime: FRAICHEUR_MS }),
      queryClient.fetchQuery({ queryKey: CLE_CHANTIERS, queryFn: fetchAllInterventions, staleTime: FRAICHEUR_MS }),
    ]);
    dernierPassage = Date.now();

    // Photos des demandes de plus de 6 mois (règle : photos-auto.ts). Avant les
    // statuts, sur les données telles qu'elles sont en base. Rien ne part tant
    // que l'interrupteur est à false.
    if (SUPPRESSION_PHOTOS_ACTIVE) {
      const cibles = photosASupprimer(overview.leads, rdvs, chantiers);
      const effacees = cibles.length > 0 ? await supprimerPhotosAuto(cibles) : [];
      if (effacees.length > 0) {
        await queryClient.invalidateQueries({ queryKey: CLE_LEADS });
        ajouterAuJournal(
          effacees.map((c) => ({
            leadId: c.leadId,
            nom: c.leadName,
            texte: `${c.chemins.length} photo${c.chemins.length > 1 ? "s" : ""} supprimée${c.chemins.length > 1 ? "s" : ""} (demande de plus de 6 mois)`,
          })),
        );
      }
    }

    const actions = calculerActionsAuto(overview.leads, rdvs, chantiers);
    if (actions.length === 0) return;

    const faites = await appliquerActionsAuto(actions);
    if (faites.length === 0) return;
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: CLE_LEADS }),
      queryClient.invalidateQueries({ queryKey: CLE_RDVS }),
    ]);

    const visibles = faites.filter((a) => a.resume);
    if (visibles.length === 0) return;
    ajouterAuJournal(visibles.map((a) => ({ leadId: a.leadId, nom: a.leadName, texte: a.resume as string })));
    const n = visibles.length;
    toast.info(
      n === 1
        ? `${visibles[0].leadName} : mis à jour automatiquement`
        : `${n} fiches mises à jour automatiquement`,
      { description: n === 1 ? (visibles[0].resume as string) : "Détail sur l'accueil, bandeau du haut." },
    );
  } catch (e) {
    // Hors ligne, session expirée… : on réessaiera au prochain retour sur l'app.
    console.warn("Mise à jour automatique reportée :", e);
  } finally {
    enCours = false;
  }
};

/**
 * Statuts automatiques : tourne à l'ouverture de l'admin ET à chaque retour
 * sur l'app (PWA laissée ouverte sur le téléphone : visibilitychange, focus,
 * pageshow), au plus une fois toutes les 5 minutes. Pas de serveur, pas de cron.
 * Monté une fois, dans AdminShell.
 */
export const useStatutsAuto = (actif: boolean): void => {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!actif) return;
    const lancer = () => void passer(queryClient);
    lancer();
    document.addEventListener("visibilitychange", lancer);
    window.addEventListener("focus", lancer);
    window.addEventListener("pageshow", lancer);
    return () => {
      document.removeEventListener("visibilitychange", lancer);
      window.removeEventListener("focus", lancer);
      window.removeEventListener("pageshow", lancer);
    };
  }, [actif, queryClient]);
};

/** Journal des mises à jour automatiques (bandeau de l'accueil, écran « Mise à jour »). */
export const useJournalAuto = (): JournalAuto => useSyncExternalStore(abonnerJournal, lireJournal, lireJournal);
