import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Calendar, Clock, Pencil, X, ExternalLink, Loader2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { formatDateLong, formatHeure, formatDuree } from "@/lib/rdv/formatters";
import { buildGoogleCalendarUrl } from "@/lib/rdv/googleCalendar";
import type { RendezVous } from "@/lib/rdv/constants";
import type { LeadInfo } from "@/lib/rdv/emailjs";

interface Props {
  rdv: RendezVous;
  lead: LeadInfo;
  cancelling: boolean;
  onEdit: () => void;
  onCancel: () => void;
}

const RendezVousCard = ({ rdv, lead, cancelling, onEdit, onCancel }: Props) => {
  const [open, setOpen] = useState(false);
  const gcalUrl = buildGoogleCalendarUrl({
    date_rdv: rdv.date_rdv,
    heure_rdv: rdv.heure_rdv,
    duree_minutes: rdv.duree_minutes,
    type_visite: rdv.type_visite,
    client_name: lead.name,
    client_phone: lead.phone,
    notes_internes: rdv.notes_internes,
    rue: lead.rue,
    numero: lead.numero,
    code_postal: lead.code_postal,
    commune: lead.commune,
  });

  return (
    <Card className="p-6 border-2 border-[hsl(var(--copper))] bg-[hsl(var(--copper))]/5 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[hsl(var(--copper))]" />
          <h2 className="font-semibold text-lg">Rendez-vous planifié</h2>
        </div>
        <Badge variant="outline" className="capitalize border-[hsl(var(--copper))] text-[hsl(var(--copper))]">
          {rdv.statut === "rappel_envoye" ? "Rappel envoyé" : rdv.statut}
        </Badge>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 text-sm">
        <div className="flex items-start gap-2">
          <Calendar className="w-4 h-4 mt-0.5 text-muted-foreground" />
          <div>
            <p className="text-muted-foreground">Date</p>
            <p className="font-medium">{formatDateLong(rdv.date_rdv)}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Clock className="w-4 h-4 mt-0.5 text-muted-foreground" />
          <div>
            <p className="text-muted-foreground">Heure & durée</p>
            <p className="font-medium">{formatHeure(rdv.heure_rdv)} ({formatDuree(rdv.duree_minutes)})</p>
          </div>
        </div>
        <div className="sm:col-span-2">
          <p className="text-muted-foreground">Type de visite</p>
          <p className="font-medium">{rdv.type_visite}</p>
        </div>
        {rdv.notes_internes && (
          <div className="sm:col-span-2">
            <p className="text-muted-foreground">Notes internes</p>
            <p className="font-medium whitespace-pre-wrap">{rdv.notes_internes}</p>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 pt-2">
        <Button asChild variant="copper" size="sm" className="flex-1">
          <a href={gcalUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-4 h-4" /> Ajouter à Google Calendar
          </a>
        </Button>
        <Button onClick={onEdit} variant="outline" size="sm" className="flex-1">
          <Pencil className="w-4 h-4" /> Modifier
        </Button>
        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10">
              {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />} Annuler
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Annuler ce rendez-vous ?</AlertDialogTitle>
              <AlertDialogDescription>
                Le client recevra un email d'annulation. Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Garder le RDV</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => { setOpen(false); onCancel(); }}
                className={buttonVariants({ variant: "destructive" })}
              >
                Oui, annuler le RDV
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Card>
  );
};

export default RendezVousCard;
