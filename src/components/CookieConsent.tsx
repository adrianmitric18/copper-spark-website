import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const STORAGE_KEY = "cookie_consent";

type Consent = {
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
};

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

const applyConsent = (analytics: boolean, marketing: boolean) => {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("consent", "update", {
    ad_storage: marketing ? "granted" : "denied",
    ad_user_data: marketing ? "granted" : "denied",
    ad_personalization: marketing ? "granted" : "denied",
    analytics_storage: analytics ? "granted" : "denied",
  });
};

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setVisible(true);
      } else {
        const parsed: Consent = JSON.parse(raw);
        applyConsent(!!parsed.analytics, !!parsed.marketing);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  const save = (a: boolean, m: boolean) => {
    const consent: Consent = { analytics: a, marketing: m, timestamp: new Date().toISOString() };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
    } catch {
      /* ignore */
    }
    applyConsent(a, m);
    setVisible(false);
    setCustomizeOpen(false);
  };

  const acceptAll = () => save(true, true);
  const rejectAll = () => save(false, false);
  const savePrefs = () => save(analytics, marketing);

  if (!visible) return null;

  return (
    <>
      <div
        role="dialog"
        aria-live="polite"
        aria-label="Consentement aux cookies"
        className="fixed bottom-0 left-0 right-0 z-[100] p-3 sm:p-4 pb-[calc(env(safe-area-inset-bottom)+12px)] sm:pb-4 animate-fade-in"
      >
        <div className="mx-auto max-w-4xl bg-card/95 backdrop-blur-md border border-border/60 rounded-2xl shadow-2xl p-4 sm:p-5">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="font-display font-bold text-foreground text-base sm:text-lg mb-1">
                🍪 Cookies & confidentialité
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Nous utilisons des cookies pour analyser le trafic et améliorer votre expérience. Vous pouvez accepter, refuser ou personnaliser votre choix.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 md:flex-nowrap md:shrink-0">
              <Button onClick={acceptAll} variant="copper" size="sm" className="flex-1 md:flex-none">
                Tout accepter
              </Button>
              <Button onClick={rejectAll} variant="outline" size="sm" className="flex-1 md:flex-none">
                Refuser
              </Button>
              <button
                type="button"
                onClick={() => setCustomizeOpen(true)}
                className="text-sm text-primary hover:underline underline-offset-4 px-2 py-1 whitespace-nowrap"
              >
                Personnaliser
              </button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={customizeOpen} onOpenChange={setCustomizeOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Préférences cookies</DialogTitle>
            <DialogDescription>
              Choisissez les catégories de cookies que vous souhaitez activer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex items-start justify-between gap-4 p-3 rounded-lg border border-border/50 bg-muted/30 opacity-70">
              <div className="flex-1">
                <Label className="text-foreground font-semibold">Cookies essentiels</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Nécessaires au fonctionnement du site. Toujours actifs.
                </p>
              </div>
              <Switch checked disabled aria-label="Cookies essentiels (toujours actifs)" />
            </div>

            <div className="flex items-start justify-between gap-4 p-3 rounded-lg border border-border/50">
              <div className="flex-1">
                <Label htmlFor="analytics-toggle" className="text-foreground font-semibold cursor-pointer">
                  Cookies analytiques
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Google Analytics 4 — mesure d'audience anonymisée.
                </p>
              </div>
              <Switch
                id="analytics-toggle"
                checked={analytics}
                onCheckedChange={setAnalytics}
              />
            </div>

            <div className="flex items-start justify-between gap-4 p-3 rounded-lg border border-border/50">
              <div className="flex-1">
                <Label htmlFor="marketing-toggle" className="text-foreground font-semibold cursor-pointer">
                  Cookies marketing
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Google Ads — mesure des conversions publicitaires.
                </p>
              </div>
              <Switch
                id="marketing-toggle"
                checked={marketing}
                onCheckedChange={setMarketing}
              />
            </div>
          </div>

          <DialogFooter>
            <Button onClick={savePrefs} variant="copper" className="w-full sm:w-auto">
              Enregistrer mes préférences
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CookieConsent;
