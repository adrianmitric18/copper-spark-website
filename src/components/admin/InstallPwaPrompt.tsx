import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Share, Plus, X } from "lucide-react";

const DISMISS_KEY = "ce_admin_install_dismissed_at";
const DISMISS_DAYS = 14;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  // iOS Safari
  // @ts-ignore
  window.navigator.standalone === true;

const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const isAndroid = () => /android/i.test(navigator.userAgent);

const isRecentlyDismissed = () => {
  const ts = localStorage.getItem(DISMISS_KEY);
  if (!ts) return false;
  const ageMs = Date.now() - Number(ts);
  return ageMs < DISMISS_DAYS * 24 * 60 * 60 * 1000;
};

const InstallPwaPrompt = () => {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [showAndroidHint, setShowAndroidHint] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isStandalone() || isRecentlyDismissed()) return;

    if (isIOS()) {
      setShowIosHint(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Fallback Android : si l'event ne se déclenche pas dans 3s, afficher les instructions manuelles
    let fallbackTimer: number | undefined;
    if (isAndroid()) {
      fallbackTimer = window.setTimeout(() => {
        setShowAndroidHint((prev) => prev || true);
      }, 3000);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      if (fallbackTimer) window.clearTimeout(fallbackTimer);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDismissed(true);
  };

  const handleInstall = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") {
      setDeferred(null);
    } else {
      dismiss();
    }
  };

  if (dismissed) return null;

  // Android / Chrome / Edge desktop : prompt natif
  if (deferred) {
    return (
      <Card className="p-3 sm:p-4 border-[hsl(var(--copper))]/40 bg-[hsl(var(--copper))]/5 flex items-center gap-3">
        <div className="rounded-full bg-[hsl(var(--copper))] text-white p-2 shrink-0">
          <Download className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Installer l'app sur cet appareil</p>
          <p className="text-xs text-muted-foreground">Accès rapide depuis l'écran d'accueil, plein écran.</p>
        </div>
        <Button onClick={handleInstall} variant="copper" size="sm" className="shrink-0">
          Installer
        </Button>
        <button
          onClick={dismiss}
          aria-label="Masquer"
          className="text-muted-foreground hover:text-foreground p-1 shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </Card>
    );
  }

  // iOS Safari : pas d'event natif, on affiche les instructions
  if (showIosHint) {
    return (
      <Card className="p-3 sm:p-4 border-[hsl(var(--copper))]/40 bg-[hsl(var(--copper))]/5 flex items-start gap-3">
        <div className="rounded-full bg-[hsl(var(--copper))] text-white p-2 shrink-0">
          <Download className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0 text-sm">
          <p className="font-semibold">Installer l'app sur l'iPhone</p>
          <p className="text-muted-foreground text-xs mt-0.5 leading-relaxed">
            Touchez <Share className="inline w-3.5 h-3.5 mx-0.5 -mt-0.5" /> Partager dans Safari, puis
            <span className="font-medium"> « Sur l'écran d'accueil » </span>
            <Plus className="inline w-3.5 h-3.5 mx-0.5 -mt-0.5" />
          </p>
        </div>
        <button
          onClick={dismiss}
          aria-label="Masquer"
          className="text-muted-foreground hover:text-foreground p-1 shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </Card>
    );
  }

  return null;
};

export default InstallPwaPrompt;
