/**
 * Dialog d'annulation d'une intervention.
 *
 * Demande confirmation + raison optionnelle (exposable au client). Au submit :
 *   1. Met le statut à 'annule' en BDD
 *   2. Affiche les 4 boutons (Calendar / SMS / WA / Email) pour prévenir
 *      le client avec le template d'annulation
 *
 * Le calendar lien d'annulation n'a pas vraiment de sens (on ne crée pas un
 * événement "annulation"), donc on affiche seulement 3 boutons : SMS / WA / Email.
 * À charge d'Adrian de supprimer manuellement l'événement Google Calendar
 * d'origine.
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  XCircle,
  MessageSquare,
  Send,
  Mail,
  Copy,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import {
  smsTemplateChantierAnnulation,
  whatsappTemplateChantierAnnulation,
  emailPlaintextChantierAnnulation,
  emailHtmlChantierAnnulation,
  emailSubjectChantierAnnulation,
  buildSmsHref,
  buildWhatsappHref,
  buildMailtoHref,
  type ChantierAnnulationPayload,
} from "@/lib/admin/message-templates";
import type { Intervention } from "@/lib/admin/interventions";

interface InterventionAnnulationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  intervention: Intervention;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  /** Bascule statut → 'annule' en BDD. Doit lever en cas d'erreur. */
  onConfirm: (raison: string | null) => Promise<void>;
  submitting?: boolean;
}

const InterventionAnnulationDialog = ({
  open,
  onOpenChange,
  intervention,
  clientName,
  clientPhone,
  clientEmail,
  onConfirm,
  submitting = false,
}: InterventionAnnulationDialogProps) => {
  const [step, setStep] = useState<"form" | "confirmed">("form");
  const [raison, setRaison] = useState("");

  const payload: ChantierAnnulationPayload = {
    clientName,
    typeIntervention: intervention.type_intervention,
    dateDebut: intervention.date_debut,
    dateFin: intervention.date_fin,
    raison: raison.trim() || undefined,
  };

  const smsHref = buildSmsHref(clientPhone, smsTemplateChantierAnnulation(payload));
  const whatsappHref = buildWhatsappHref(
    clientPhone,
    whatsappTemplateChantierAnnulation(payload),
  );
  const mailtoHref = buildMailtoHref(
    clientEmail,
    emailSubjectChantierAnnulation(payload),
    emailPlaintextChantierAnnulation(payload),
  );

  const copyEmailHtml = async () => {
    const html = emailHtmlChantierAnnulation(payload);
    try {
      if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
        const blobHtml = new Blob([html], { type: "text/html" });
        const blobText = new Blob([emailPlaintextChantierAnnulation(payload)], {
          type: "text/plain",
        });
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
      toast.error("Copie impossible");
    }
  };

  const handleConfirm = async () => {
    try {
      await onConfirm(raison.trim() || null);
      setStep("confirmed");
    } catch {
      // L'erreur est déjà gérée par le caller (toast)
    }
  };

  const handleClose = (o: boolean) => {
    if (!o) {
      setStep("form");
      setRaison("");
    }
    onOpenChange(o);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        {step === "form" ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                Annuler ce chantier ?
              </DialogTitle>
              <DialogDescription>
                Le statut sera mis à "Annulé" et tu pourras prévenir le client
                par SMS, WhatsApp ou email juste après.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 py-2">
              <Label htmlFor="raison" className="text-sm font-medium">
                Raison à communiquer au client
                <span className="text-muted-foreground font-normal ml-1">(optionnel)</span>
              </Label>
              <Textarea
                id="raison"
                value={raison}
                onChange={(e) => setRaison(e.target.value)}
                placeholder='Ex: "imprévu personnel" ou "report demandé par mon fournisseur"'
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                Apparaîtra dans le message envoyé au client. Si vide, le message
                ne mentionnera pas de raison.
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleClose(false)}
                disabled={submitting}
              >
                Garder le chantier
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleConfirm}
                disabled={submitting}
                className="min-w-[140px]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Annulation…
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    Confirmer l'annulation
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-center">Chantier annulé</DialogTitle>
              <DialogDescription className="text-center">
                Préviens le client avec le message d'annulation.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
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
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="h-12 text-sm font-semibold border-primary/40 text-primary hover:bg-primary/10"
                  >
                    <a href={mailtoHref}>
                      <Mail className="w-4 h-4" />
                      Ouvrir email
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
                    Copier HTML
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-center text-muted-foreground italic">
                  Pas d'email saisi pour ce client.
                </p>
              )}

              <p className="text-xs text-muted-foreground italic mt-2 text-center">
                ⚠️ Pense à supprimer manuellement l'événement Google Calendar.
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleClose(false)}
                className="w-full"
              >
                Fermer
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default InterventionAnnulationDialog;
