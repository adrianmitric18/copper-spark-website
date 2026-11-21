import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { CookieChoices } from "@/hooks/useCookieConsent";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialChoices: CookieChoices;
  onSave: (choices: CookieChoices) => void;
};

const CookiePreferencesModal = ({ open, onOpenChange, initialChoices, onSave }: Props) => {
  const [analytics, setAnalytics] = useState(initialChoices.analytics);

  useEffect(() => {
    if (open) setAnalytics(initialChoices.analytics);
  }, [open, initialChoices.analytics]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md"
        aria-labelledby="cookie-prefs-title"
        aria-describedby="cookie-prefs-desc"
      >
        <DialogHeader>
          <DialogTitle id="cookie-prefs-title" className="font-display">
            Préférences cookies
          </DialogTitle>
          <DialogDescription id="cookie-prefs-desc">
            Choisissez ce que vous acceptez. Sans votre accord, aucun cookie de mesure n'est
            déposé et le site fonctionne de la même façon.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-start justify-between gap-4 p-3 rounded-lg border border-border/50 bg-muted/30 opacity-70">
            <div className="flex-1">
              <Label className="text-foreground font-semibold">Nécessaires</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Retiennent votre choix sur les cookies. Toujours actifs.
              </p>
            </div>
            <Switch checked disabled aria-label="Cookies nécessaires (toujours actifs)" />
          </div>

          <div className="flex items-start justify-between gap-4 p-3 rounded-lg border border-border/50">
            <div className="flex-1">
              <Label htmlFor="analytics-toggle" className="text-foreground font-semibold cursor-pointer">
                Mesure d'audience (Google Analytics 4)
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Compte les visites de façon agrégée. Google n'est chargé que si vous l'activez.
              </p>
            </div>
            <Switch
              id="analytics-toggle"
              checked={analytics}
              onCheckedChange={setAnalytics}
              aria-label="Activer la mesure d'audience"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            variant="copper"
            onClick={() => {
              onSave({ analytics });
              onOpenChange(false);
            }}
          >
            Enregistrer mes préférences
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CookiePreferencesModal;
