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
  const [marketing, setMarketing] = useState(initialChoices.marketing);

  useEffect(() => {
    if (open) {
      setAnalytics(initialChoices.analytics);
      setMarketing(initialChoices.marketing);
    }
  }, [open, initialChoices.analytics, initialChoices.marketing]);

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
            Choisissez les catégories de cookies que vous souhaitez activer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-start justify-between gap-4 p-3 rounded-lg border border-border/50 bg-muted/30 opacity-70">
            <div className="flex-1">
              <Label className="text-foreground font-semibold">Cookies essentiels</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Nécessaires au fonctionnement du site.
              </p>
            </div>
            <Switch checked disabled aria-label="Cookies essentiels (toujours actifs)" />
          </div>

          <div className="flex items-start justify-between gap-4 p-3 rounded-lg border border-border/50">
            <div className="flex-1">
              <Label htmlFor="analytics-toggle" className="text-foreground font-semibold cursor-pointer">
                Cookies analytiques (GA4)
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Nous aident à comprendre comment vous utilisez le site.
              </p>
            </div>
            <Switch
              id="analytics-toggle"
              checked={analytics}
              onCheckedChange={setAnalytics}
              aria-label="Activer les cookies analytiques"
            />
          </div>

          <div className="flex items-start justify-between gap-4 p-3 rounded-lg border border-border/50">
            <div className="flex-1">
              <Label htmlFor="marketing-toggle" className="text-foreground font-semibold cursor-pointer">
                Cookies marketing (Google Ads)
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Permettent de mesurer l'efficacité de nos campagnes.
              </p>
            </div>
            <Switch
              id="marketing-toggle"
              checked={marketing}
              onCheckedChange={setMarketing}
              aria-label="Activer les cookies marketing"
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
              onSave({ analytics, marketing });
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
