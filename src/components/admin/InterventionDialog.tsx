/**
 * Dialog de création / édition d'une intervention (chantier programmé).
 *
 * Utilisé sur /admin/lead/:id pour le bouton "Programmer le chantier"
 * et pour la modification depuis la fiche d'intervention.
 */

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Loader2, Hammer } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TYPE_INTERVENTIONS,
  HORAIRES_DEFAUT_PAR_TYPE,
  inclutWeekend,
  interventionFormSchema,
  type InterventionFormValues,
  type Intervention,
  type TypeIntervention,
} from "@/lib/admin/interventions";

interface InterventionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Mode édition : pré-remplit le formulaire avec une intervention existante. */
  intervention?: Intervention | null;
  /** Type suggéré au démarrage (depuis services du lead par exemple). */
  defaultType?: TypeIntervention;
  /** Callback de soumission. Doit gérer create ou update selon le mode. */
  onSubmit: (values: InterventionFormValues) => Promise<void>;
  submitting?: boolean;
}

const InterventionDialog = ({
  open,
  onOpenChange,
  intervention,
  defaultType,
  onSubmit,
  submitting = false,
}: InterventionDialogProps) => {
  const todayIso = new Date().toISOString().slice(0, 10);
  const isEdit = !!intervention;

  const initialType: TypeIntervention =
    intervention?.type_intervention as TypeIntervention | undefined ??
    defaultType ??
    "Autre";
  const initialHoraires = HORAIRES_DEFAUT_PAR_TYPE[initialType];

  const form = useForm<InterventionFormValues>({
    resolver: zodResolver(interventionFormSchema),
    defaultValues: {
      typeIntervention: initialType,
      dateDebut: intervention?.date_debut ?? todayIso,
      dateFin: intervention?.date_fin ?? todayIso,
      heureDebut: intervention?.heure_debut?.slice(0, 5) ?? initialHoraires.heureDebut,
      heureFin: intervention?.heure_fin?.slice(0, 5) ?? initialHoraires.heureFin,
      notesClient: intervention?.notes_client ?? "",
      notesInternes: intervention?.notes_internes ?? "",
    },
  });

  // Reset le formulaire à chaque ouverture (notamment pour switcher du mode
  // édition au mode création quand le user ferme/ouvre).
  useEffect(() => {
    if (open) {
      form.reset({
        typeIntervention: initialType,
        dateDebut: intervention?.date_debut ?? todayIso,
        dateFin: intervention?.date_fin ?? todayIso,
        heureDebut: intervention?.heure_debut?.slice(0, 5) ?? initialHoraires.heureDebut,
        heureFin: intervention?.heure_fin?.slice(0, 5) ?? initialHoraires.heureFin,
        notesClient: intervention?.notes_client ?? "",
        notesInternes: intervention?.notes_internes ?? "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, intervention?.id]);

  // Auto-suggère les horaires selon le type, tant que l'admin n'a pas modifié.
  const [autoHoraires, setAutoHoraires] = useState(!isEdit);
  const typeWatch = form.watch("typeIntervention");
  useEffect(() => {
    if (autoHoraires && typeWatch) {
      const h = HORAIRES_DEFAUT_PAR_TYPE[typeWatch as TypeIntervention];
      form.setValue("heureDebut", h.heureDebut);
      form.setValue("heureFin", h.heureFin);
    }
  }, [typeWatch, autoHoraires, form]);

  // Auto-aligne dateFin sur dateDebut tant qu'elle n'a pas été touchée
  // ou si elle reste antérieure (cas chantier 1 jour).
  const dateDebutWatch = form.watch("dateDebut");
  const dateFinWatch = form.watch("dateFin");
  useEffect(() => {
    if (dateDebutWatch && (!dateFinWatch || dateFinWatch < dateDebutWatch)) {
      form.setValue("dateFin", dateDebutWatch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateDebutWatch]);

  const showWeekendWarning =
    dateDebutWatch && dateFinWatch && inclutWeekend(dateDebutWatch, dateFinWatch);

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Hammer className="w-5 h-5 text-primary" />
            {isEdit ? "Modifier le chantier" : "Programmer le chantier"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Mets à jour les dates ou les notes — le client devra être prévenu."
              : "Bloque les dates du chantier et envoie la confirmation au client."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type d'intervention */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Type de chantier *</Label>
            <Controller
              control={form.control}
              name="typeIntervention"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v) => {
                    field.onChange(v);
                    setAutoHoraires(true);
                  }}
                >
                  <SelectTrigger className="h-11 text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_INTERVENTIONS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.typeIntervention && (
              <p className="text-xs text-destructive">
                {form.formState.errors.typeIntervention.message}
              </p>
            )}
          </div>

          {/* Dates début / fin */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Date début *</Label>
              <Input
                type="date"
                min={todayIso}
                {...form.register("dateDebut")}
                className="h-11 text-base"
              />
              {form.formState.errors.dateDebut && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.dateDebut.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Date fin *</Label>
              <Input
                type="date"
                min={dateDebutWatch || todayIso}
                {...form.register("dateFin")}
                className="h-11 text-base"
              />
              {form.formState.errors.dateFin && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.dateFin.message}
                </p>
              )}
            </div>
          </div>

          {/* Warning week-end */}
          {showWeekendWarning && (
            <div className="flex items-start gap-2 p-3 rounded-md bg-yellow-500/10 border border-yellow-500/30">
              <AlertTriangle className="w-4 h-4 text-yellow-700 shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-800">
                Le chantier inclut un samedi ou un dimanche. Vérifie que c'est
                voulu — sinon, ajuste les dates.
              </p>
            </div>
          )}

          {/* Heures début / fin */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Heure début *</Label>
              <Input
                type="time"
                step="900"
                {...form.register("heureDebut", {
                  onChange: () => setAutoHoraires(false),
                })}
                className="h-11 text-base"
              />
              {form.formState.errors.heureDebut && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.heureDebut.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Heure fin *</Label>
              <Input
                type="time"
                step="900"
                {...form.register("heureFin", {
                  onChange: () => setAutoHoraires(false),
                })}
                className="h-11 text-base"
              />
              {form.formState.errors.heureFin && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.heureFin.message}
                </p>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground -mt-2">
            {dateDebutWatch && dateFinWatch && dateDebutWatch !== dateFinWatch
              ? "Ces horaires s'appliquent à chaque jour du chantier."
              : "Plage horaire de la journée."}
          </p>

          {/* Notes client (visible dans templates) */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">
              Note pour le client
              <span className="text-muted-foreground font-normal ml-1">(optionnel)</span>
            </Label>
            <Textarea
              {...form.register("notesClient")}
              placeholder="Ex: Apportez vos plans de l'installation actuelle si vous les avez retrouvés."
              rows={2}
              className="text-base"
            />
            <p className="text-xs text-muted-foreground">
              Apparaîtra dans le SMS / WhatsApp / Email de confirmation.
            </p>
          </div>

          {/* Notes internes (privé) */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">
              Notes internes
              <span className="text-muted-foreground font-normal ml-1">(privé)</span>
            </Label>
            <Textarea
              {...form.register("notesInternes")}
              placeholder="Matériel à prévoir, contacts, accès parking..."
              rows={2}
              className="text-base"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={submitting} className="min-w-[140px]">
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enregistrement…
                </>
              ) : isEdit ? (
                "Mettre à jour"
              ) : (
                "Confirmer le chantier"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InterventionDialog;
