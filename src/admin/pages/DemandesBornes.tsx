/**
 * /admin/demandes-bornes — combien de demandes de bornes, mois par mois.
 *
 * Deux colonnes viennent des leads (formulaire, simulateur), deux du compteur
 * anonyme des clics de la page bornes (WhatsApp, téléphone). Le compteur ne
 * contient que des nombres par jour : aucun nom, aucune adresse.
 * Toute la logique est dans src/lib/admin/demandes-bornes.ts.
 */

import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { BatteryCharging } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import AdminShell from "@/admin/layout/AdminShell";
import AdminLoading from "@/components/admin/AdminLoading";
import { supabase } from "@/integrations/supabase/client";
import { fetchLeadsWithUpcomingRdvs } from "@/lib/admin/queries";
import {
  decompteParMois,
  libelleMois,
  type LigneCompteur,
} from "@/lib/admin/demandes-bornes";

/** `null` = la table n'existe pas encore (migration non appliquée). */
async function fetchCompteur(): Promise<LigneCompteur[] | null> {
  const { data, error } = await (supabase as unknown as SupabaseClient)
    .from("compteur_clics")
    .select("jour, page, action, nombre")
    .order("jour", { ascending: false });
  if (error) return null;
  return (data ?? []) as LigneCompteur[];
}

const DemandesBornes = () => {
  const { user, ready } = useAdminGuard();

  useEffect(() => {
    document.title = "Demandes de bornes – Le Cuivre Admin";
  }, []);

  const leadsQuery = useQuery({
    queryKey: ["admin-leads-overview"],
    queryFn: fetchLeadsWithUpcomingRdvs,
    enabled: ready,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  const compteurQuery = useQuery({
    queryKey: ["admin-compteur-clics"],
    queryFn: fetchCompteur,
    enabled: ready,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const lignes = useMemo(
    () => decompteParMois(leadsQuery.data?.leads ?? [], compteurQuery.data ?? []),
    [leadsQuery.data, compteurQuery.data],
  );

  if (!ready || !user) return <AdminLoading />;

  const chargement = leadsQuery.isLoading || compteurQuery.isLoading;
  const compteurAbsent = compteurQuery.data === null;

  return (
    <AdminShell mobileTitle="Demandes de bornes">
      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <BatteryCharging className="w-7 h-7 text-primary shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <h1 className="text-2xl font-display font-bold">Demandes de bornes</h1>
            <p className="text-xs text-muted-foreground">
              Par mois : demandes reçues, et clics sur la page bornes
            </p>
          </div>
        </div>

        {leadsQuery.error && (
          <Card className="p-4 text-sm">
            Les demandes n'ont pas pu être chargées. Vérifie ta connexion et recharge la page.
          </Card>
        )}

        {compteurAbsent && (
          <Card className="p-4 text-sm">
            Le compteur de clics n'est pas encore activé : la migration « compteur_clics » doit
            être appliquée dans Supabase. Les colonnes WhatsApp et Téléphone restent à 0 d'ici là.
          </Card>
        )}

        {chargement ? (
          <div className="space-y-2" aria-busy="true">
            {[0, 1].map((i) => (
              <div key={i} className="h-16 rounded-lg bg-muted/40 animate-pulse" />
            ))}
          </div>
        ) : lignes.length === 0 ? (
          <Card className="p-6 text-sm text-muted-foreground">
            Aucune demande de borne ni aucun clic enregistré pour l'instant.
          </Card>
        ) : (
          <Card className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th scope="col" className="p-3 font-semibold">Mois</th>
                  <th scope="col" className="p-3 font-semibold text-right">Formulaire</th>
                  <th scope="col" className="p-3 font-semibold text-right">Simulateur</th>
                  <th scope="col" className="p-3 font-semibold text-right">Devis sur photos</th>
                  <th scope="col" className="p-3 font-semibold text-right">Clics WhatsApp</th>
                  <th scope="col" className="p-3 font-semibold text-right">Clics téléphone</th>
                </tr>
              </thead>
              <tbody>
                {lignes.map((l) => (
                  <tr key={l.mois} className="border-b border-border last:border-0">
                    <th scope="row" className="p-3 font-medium text-left whitespace-nowrap">
                      {libelleMois(l.mois)}
                    </th>
                    <td className="p-3 text-right tabular-nums">{l.formulaire}</td>
                    <td className="p-3 text-right tabular-nums">{l.simulateur}</td>
                    <td className="p-3 text-right tabular-nums">{l.devisPhotos}</td>
                    <td className="p-3 text-right tabular-nums">{l.whatsapp}</td>
                    <td className="p-3 text-right tabular-nums">{l.telephone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        <p className="text-xs text-muted-foreground leading-relaxed">
          « Formulaire », « Simulateur » et « Devis sur photos » comptent les demandes arrivées dans
          les leads avec le service « Borne de recharge ». Les clics sont ceux des boutons WhatsApp et téléphone de
          la page bornes : un clic n'est pas forcément un message ou un appel abouti. Le compteur
          n'enregistre qu'un nombre par jour, sans rien sur la personne.
        </p>
      </div>
    </AdminShell>
  );
};

export default DemandesBornes;
