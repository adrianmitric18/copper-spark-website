/**
 * Modale d'écran de succès affichée après la création (ou modification) d'une
 * intervention. Présente les 4 actions principales :
 *   - Ajouter à Google Calendar (multi-jours en 1 événement)
 *   - SMS de confirmation
 *   - WhatsApp de confirmation
 *   - Email (texte + Copier HTML stylé)
 *
 * Le mode 'rectification' utilisera les templates "Mise à jour de votre
 * planning" plutôt que la confirmation initiale (Phase 2).
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  CalendarPlus,
  MessageSquare,
  Send,
  Mail,
  Copy,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { buildGoogleCalendarRangeUrl } from "@/lib/admin/google-calendar-link";
import {
  smsTemplateChantier,
  whatsappTemplateChantier,
  emailPlaintextChantier,
  emailHtmlChantier,
  emailSubjectChantier,
  buildSmsHref,
  buildWhatsappHref,
  buildMailtoHref,
  type ChantierProgrammePayload,
} from "@/lib/admin/message-templates";
import type { Intervention } from "@/lib/admin/interventions";

interface InterventionSuccessScreenProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  intervention: Intervention;
  /** Infos client pour les liens deep / Calendar. */
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  clientAddress?: string;
}

const InterventionSuccessScreen = ({
  open,
  onOpenChange,
  intervention,
  clientName,
  clientPhone,
  clientEmail,
  clientAddress,
}: InterventionSuccessScreenProps) => {
  const payload: ChantierProgrammePayload = {
    clientName,
    typeIntervention: intervention.type_intervention,
    dateDebut: intervention.date_debut,
    dateFin: intervention.date_fin,
    heureDebut: intervention.heure_debut.slice(0, 5),
    heureFin: intervention.heure_fin.slice(0, 5),
    address: clientAddress,
    notesClient: intervention.notes_client ?? undefined,
  };

  const calendarUrl = buildGoogleCalendarRangeUrl({
    title: `${intervention.type_intervention} – ${clientName}`,
    dateDebut: intervention.date_debut,
    heureDebut: intervention.heure_debut.slice(0, 5),
    dateFin: intervention.date_fin,
    heureFin: intervention.heure_fin.slice(0, 5),
    description: [
      `Client : ${clientName}`,
      `Téléphone : ${clientPhone}`,
      `Type : ${intervention.type_intervention}`,
      clientAddress ? `Adresse : ${clientAddress}` : null,
      intervention.notes_internes ? `\nNotes internes :\n${intervention.notes_internes}` : null,
    ]
      .filter(Boolean)
      .join("\n"),
    location: clientAddress,
  });

  const smsHref = buildSmsHref(clientPhone, smsTemplateChantier(payload));
  const whatsappHref = buildWhatsappHref(clientPhone, whatsappTemplateChantier(payload));
  const mailtoHref = buildMailtoHref(
    clientEmail,
    emailSubjectChantier(payload),
    emailPlaintextChantier(payload),
  );

  const copyEmailHtml = async () => {
    const html = emailHtmlChantier(payload);
    try {
      if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
        const blobHtml = new Blob([html], { type: "text/html" });
        const blobText = new Blob([emailPlaintextChantier(payload)], { type: "text/plain" });
        await navigator.clipboard.write([
          new ClipboardItem({ "text/html": blobHtml, "text/plain": blobText }),
        ]);
      } else {
        await navigator.clipboard.writeText(html);
      }
      toast.success("Email HTML copié", {
        description: "Colle-le dans Gmail/Outlook (Ctrl+V) — il se collera stylé.",
      });
    } catch {
      toast.error("Copie impossible", {
        description: "Ton navigateur ne supporte pas la copie automatique.",
      });
    }
  };

  const dateRange =
    intervention.date_debut === intervention.date_fin
      ? new Date(intervention.date_debut).toLocaleDateString("fr-BE", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })
      : `${new Date(intervention.date_debut).toLocaleDateString("fr-BE", { day: "numeric", month: "short" })} → ${new Date(intervention.date_fin).toLocaleDateString("fr-BE", { day: "numeric", month: "short" })}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-center mb-2">
            <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center">Chantier programmé</DialogTitle>
          <DialogDescription className="text-center">
            <span className="font-medium text-foreground capitalize">{dateRange}</span>
            <br />
            {intervention.heure_debut.slice(0, 5).replace(":", "h")}
            {" - "}
            {intervention.heure_fin.slice(0, 5).replace(":", "h")}
            {intervention.date_debut !== intervention.date_fin && " chaque jour"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Button asChild size="lg" className="w-full h-12 text-base font-semibold">
            <a href={calendarUrl} target="_blank" rel="noopener noreferrer">
              <CalendarPlus className="w-5 h-5" />
              Ajouter à Google Calendar
            </a>
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 text-sm font-semibold border-primary/40 text-primary hover:bg-primary/10"
            >
              <a href={smsHref}>
                <MessageSquare className="w-4 h-4" />
                SMS
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 text-sm font-semibold border-primary/40 text-primary hover:bg-primary/10"
            >
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                <Send className="w-4 h-4" />
                WhatsApp
              </a>
            </Button>
          </div>

          {clientEmail ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-12 text-sm font-semibold border-primary/40 text-primary hover:bg-primary/10"
                >
                  <a href={mailtoHref}>
                    <Mail className="w-4 h-4" />
                    Ouvrir email (texte)
                  </a>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={copyEmailHtml}
                  className="h-12 text-sm font-semibold border-primary/40 text-primary hover:bg-primary/10"
                >
                  <Copy className="w-4 h-4" />
                  Copier HTML stylé
                </Button>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed px-1">
                <strong>Ouvrir email</strong> ouvre l'app mail avec un texte propre.
                <br />
                <strong>Copier HTML</strong> copie la version stylée — colle-la
                dans Gmail/Outlook (Ctrl+V) pour un email pro avec mise en forme.
              </p>
            </div>
          ) : (
            <p className="text-xs text-center text-muted-foreground italic">
              Pas d'email saisi pour ce client — boutons email indisponibles.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InterventionSuccessScreen;
