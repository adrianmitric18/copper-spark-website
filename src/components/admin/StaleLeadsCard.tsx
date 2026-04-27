import { useMemo } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ChevronRight, Phone } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Lead, UpcomingByLead } from "@/lib/admin/types";

interface StaleLeadsCardProps {
  leads: Lead[];
  upcomingByLead: UpcomingByLead;
  /** Seuil en heures au-delà duquel un lead actif est considéré comme à relancer. */
  thresholdHours?: number;
  /** Nombre max de leads listés. */
  maxItems?: number;
}

const HOUR_MS = 60 * 60 * 1000;

const ACTIVE_STATUSES = new Set(["nouveau", "traité", "devis envoyé"]);

const ageInHours = (createdAt: string): number => {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / HOUR_MS);
};

const formatAge = (hours: number): string => {
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "1 jour" : `${days} jours`;
};

/**
 * Surface les leads en pipeline actif qui n'ont pas eu d'action depuis
 * `thresholdHours` heures et n'ont pas de RDV planifié. Aide Adrian à
 * ne pas oublier de relancer.
 *
 * Affiche rien si aucun lead ne matche — pas de bruit visuel inutile.
 */
const StaleLeadsCard = ({
  leads,
  upcomingByLead,
  thresholdHours = 48,
  maxItems = 5,
}: StaleLeadsCardProps) => {
  const stale = useMemo(() => {
    return leads
      .filter((l) => {
        if (!ACTIVE_STATUSES.has(l.status)) return false;
        if (upcomingByLead[l.id]) return false; // RDV planifié → pas urgent
        return ageInHours(l.created_at) >= thresholdHours;
      })
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .slice(0, maxItems);
  }, [leads, upcomingByLead, thresholdHours, maxItems]);

  if (stale.length === 0) return null;

  return (
    <Card className="p-5 space-y-3 border-orange-500/40 bg-orange-500/5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-orange-600">
          <AlertCircle className="w-5 h-5" />
          À relancer ({stale.length})
        </h2>
        <span className="text-xs text-muted-foreground">
          Sans réponse depuis &gt;{thresholdHours}h
        </span>
      </div>

      <ul className="divide-y -mx-2">
        {stale.map((lead) => {
          const hours = ageInHours(lead.created_at);
          return (
            <li key={lead.id}>
              <div className="flex items-center gap-2 px-2 py-2.5 sm:py-2 rounded-md hover:bg-muted/50 active:bg-muted transition-colors">
                <Link
                  to={`/admin/lead/${lead.id}`}
                  className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center sm:gap-3 min-h-[44px] justify-center"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm truncate">{lead.name}</p>
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 bg-orange-500/15 text-orange-700 border-orange-500/30"
                    >
                      {formatAge(hours)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {lead.commune ? `${lead.commune} · ` : ""}
                    {lead.status} · {(lead.services || []).slice(0, 2).join(", ")}
                  </p>
                </Link>

                <a
                  href={`tel:${lead.phone}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center justify-center w-10 h-10 rounded-md text-orange-700 hover:bg-orange-500/10 shrink-0"
                  aria-label={`Appeler ${lead.name}`}
                >
                  <Phone className="w-4 h-4" />
                </a>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 hidden sm:block" />
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
};

export default StaleLeadsCard;
