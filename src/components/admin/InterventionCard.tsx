/**
 * Carte d'affichage d'une intervention sur la fiche lead.
 *
 * Affiche : type, plage de dates, horaires, statut (badge), notes éventuelles.
 * Boutons : Modifier · Renvoyer confirmation · Annuler · Transformer en chantier vitrine.
 *
 * Phase 1 : carte de lecture + bouton "Renvoyer confirmation" (rouvre l'écran succès).
 * Phase 2 ajoutera Modifier + Annuler.
 * Phase 3 ajoutera "Transformer en chantier vitrine".
 */

import { useState } from "react";
import {
  Hammer,
  Calendar,
  Clock,
  Send,
  Edit2,
  XCircle,
  Image,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  type Intervention,
  STATUT_LABELS,
  STATUT_BADGE_CLASSES,
  type StatutIntervention,
} from "@/lib/admin/interventions";
import InterventionSuccessScreen from "./InterventionSuccessScreen";

interface InterventionCardProps {
  intervention: Intervention;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  clientAddress?: string;
  onEdit?: () => void;
  onCancel?: () => void;
  onTransformToProject?: () => void;
}

const formatDateLong = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("fr-BE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

const formatHeure = (t: string) => {
  const [h, m] = t.split(":");
  return m === "00" ? `${h}h` : `${h}h${m}`;
};

const InterventionCard = ({
  intervention,
  clientName,
  clientPhone,
  clientEmail,
  clientAddress,
  onEdit,
  onCancel,
  onTransformToProject,
}: InterventionCardProps) => {
  const [resendOpen, setResendOpen] = useState(false);

  const statut = intervention.statut as StatutIntervention;
  const sameDay = intervention.date_debut === intervention.date_fin;
  const isAnnule = statut === "annule";

  return (
    <Card className="p-4 sm:p-5 border-primary/30 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Hammer className="w-5 h-5 text-primary shrink-0" />
          <h3 className="font-semibold truncate">{intervention.type_intervention}</h3>
        </div>
        <Badge className={STATUT_BADGE_CLASSES[statut]}>
          {STATUT_LABELS[statut]}
        </Badge>
      </div>

      <div className="space-y-1.5 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="w-4 h-4 shrink-0" />
          <span className="capitalize text-foreground">
            {sameDay
              ? formatDateLong(intervention.date_debut)
              : `${formatDateLong(intervention.date_debut)} → ${formatDateLong(intervention.date_fin)}`}
          </span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-4 h-4 shrink-0" />
          <span className="text-foreground">
            {formatHeure(intervention.heure_debut.slice(0, 5))}
            {" - "}
            {formatHeure(intervention.heure_fin.slice(0, 5))}
            {!sameDay && " chaque jour"}
          </span>
        </div>
      </div>

      {intervention.notes_client && (
        <div className="text-xs bg-muted/50 rounded-md p-2.5">
          <p className="text-muted-foreground mb-1">Note client :</p>
          <p className="whitespace-pre-wrap">{intervention.notes_client}</p>
        </div>
      )}

      {intervention.notes_internes && (
        <div className="text-xs bg-yellow-50 dark:bg-yellow-950/20 rounded-md p-2.5">
          <p className="text-muted-foreground mb-1">Notes internes :</p>
          <p className="whitespace-pre-wrap">{intervention.notes_internes}</p>
        </div>
      )}

      {!isAnnule && (
        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setResendOpen(true)}
          >
            <Send className="w-3.5 h-3.5" />
            Renvoyer confirmation
          </Button>
          {onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit2 className="w-3.5 h-3.5" />
              Modifier
            </Button>
          )}
          {onTransformToProject && !intervention.project_id && (
            <Button variant="outline" size="sm" onClick={onTransformToProject}>
              <Image className="w-3.5 h-3.5" />
              Transformer en chantier vitrine
            </Button>
          )}
          {onCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="text-destructive hover:bg-destructive/10"
            >
              <XCircle className="w-3.5 h-3.5" />
              Annuler
            </Button>
          )}
        </div>
      )}

      {intervention.project_id && (
        <p className="text-xs text-muted-foreground italic flex items-center gap-1.5">
          <Image className="w-3 h-3" />
          Lié à un chantier vitrine
        </p>
      )}

      <InterventionSuccessScreen
        open={resendOpen}
        onOpenChange={setResendOpen}
        intervention={intervention}
        mode="confirmation"
        clientName={clientName}
        clientPhone={clientPhone}
        clientEmail={clientEmail}
        clientAddress={clientAddress}
      />
    </Card>
  );
};

export default InterventionCard;
