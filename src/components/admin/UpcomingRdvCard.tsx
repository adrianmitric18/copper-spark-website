import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronRight, Loader2 } from "lucide-react";
import { formatHeure } from "@/lib/rdv/formatters";

type UpcomingRdv = {
  id: string;
  lead_id: string;
  date_rdv: string;
  heure_rdv: string;
  type_visite: string;
  statut: string;
  lead_name: string;
  lead_commune: string | null;
};

const JOURS_COURT = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const MOIS_COURT = ["jan", "fév", "mar", "avr", "mai", "juin", "juil", "août", "sep", "oct", "nov", "déc"];

const formatDateCourt = (dateStr: string) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return `${JOURS_COURT[date.getDay()]} ${d} ${MOIS_COURT[m - 1]}`;
};

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const tomorrowStr = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const UpcomingRdvCard = () => {
  const [rdvs, setRdvs] = useState<UpcomingRdv[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const today = todayStr();
      const { data, error } = await supabase
        .from("rendez_vous")
        .select("id, lead_id, date_rdv, heure_rdv, type_visite, statut, leads(name, commune)")
        .neq("statut", "annule")
        .gte("date_rdv", today)
        .order("date_rdv", { ascending: true })
        .order("heure_rdv", { ascending: true });
      if (!error && data) {
        setRdvs(
          (data as any[]).map((r) => ({
            id: r.id,
            lead_id: r.lead_id,
            date_rdv: r.date_rdv,
            heure_rdv: r.heure_rdv,
            type_visite: r.type_visite,
            statut: r.statut,
            lead_name: r.leads?.name ?? "—",
            lead_commune: r.leads?.commune ?? null,
          }))
        );
      }
      setLoading(false);
    })();
  }, []);

  const today = todayStr();
  const tomorrow = tomorrowStr();
  const visible = useMemo(() => rdvs.slice(0, 5), [rdvs]);

  return (
    <Card className="p-5 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-[hsl(var(--copper))]">
          <Calendar className="w-5 h-5" /> Prochains RDV ({rdvs.length})
        </h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="animate-spin w-5 h-5" /></div>
      ) : rdvs.length === 0 ? (
        <p className="text-sm text-muted-foreground italic py-2">Aucun RDV planifié pour l'instant.</p>
      ) : (
        <ul className="divide-y -mx-2">
          {visible.map((r) => (
            <li key={r.id}>
              <Link
                to={`/admin/lead/${r.lead_id}`}
                className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 px-2 py-3 sm:py-2.5 rounded-md hover:bg-muted/60 active:bg-muted transition-colors min-h-[56px]"
              >
                <div className="sm:min-w-[140px]">
                  <p className="text-sm font-bold text-[hsl(var(--copper))]">
                    {formatDateCourt(r.date_rdv)} · {formatHeure(r.heure_rdv)}
                  </p>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm truncate">{r.lead_name}</p>
                    {r.date_rdv === today && (
                      <Badge className="bg-orange-500 text-white border-orange-500 text-[10px] px-1.5 py-0">AUJOURD'HUI</Badge>
                    )}
                    {r.date_rdv === tomorrow && (
                      <Badge className="bg-blue-500 text-white border-blue-500 text-[10px] px-1.5 py-0">DEMAIN</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {r.type_visite}
                    {r.lead_commune && <span className="ml-1">· {r.lead_commune}</span>}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 hidden sm:block" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      {rdvs.length > 5 && (
        <Button asChild variant="outline" size="sm" className="w-full">
          <Link to="/admin/rdv">Voir tous les RDV ({rdvs.length})</Link>
        </Button>
      )}
    </Card>
  );
};

export default UpcomingRdvCard;
