import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import CookiePreferencesModal from "./CookiePreferencesModal";
import {
  OPEN_PREFERENCES_EVENT,
  useCookieConsent,
  type CookieChoices,
} from "@/hooks/useCookieConsent";

const CookieConsentBanner = () => {
  const { stored, needsChoice, acceptAll, rejectAll, savePreferences } = useCookieConsent();
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const handler = () => setModalOpen(true);
    window.addEventListener(OPEN_PREFERENCES_EVENT, handler);
    return () => window.removeEventListener(OPEN_PREFERENCES_EVENT, handler);
  }, []);

  const initialChoices: CookieChoices = stored?.choices ?? { analytics: true, marketing: true };

  const handleSave = (choices: CookieChoices) => {
    savePreferences(choices);
  };

  return (
    <>
      {needsChoice && (
        <div
          role="dialog"
          aria-live="polite"
          aria-labelledby="cookie-banner-title"
          aria-describedby="cookie-banner-desc"
          className="fixed bottom-0 left-0 right-0 z-[200] p-3 sm:p-4 pb-[calc(env(safe-area-inset-bottom)+12px)] sm:pb-4 animate-slide-in-bottom"
          style={{ animation: "slide-up 300ms ease-out" }}
        >
          <div className="mx-auto max-w-[600px] bg-card/95 backdrop-blur-md border border-border/60 rounded-2xl shadow-2xl p-4 sm:p-5">
            <div className="flex flex-col gap-3">
              <div>
                <h2
                  id="cookie-banner-title"
                  className="font-display font-bold text-foreground text-base sm:text-lg mb-1"
                >
                  🍪 Cookies & confidentialité
                </h2>
                <p id="cookie-banner-desc" className="text-sm text-muted-foreground leading-relaxed">
                  Nous utilisons des cookies pour analyser le trafic et améliorer votre expérience.
                  Vous pouvez accepter, refuser ou personnaliser votre choix.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={acceptAll} variant="copper" size="sm" className="flex-1 sm:flex-none">
                  Tout accepter
                </Button>
                <Button onClick={rejectAll} variant="outline" size="sm" className="flex-1 sm:flex-none">
                  Refuser
                </Button>
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="text-sm text-primary hover:underline underline-offset-4 px-2 py-1 whitespace-nowrap"
                >
                  Personnaliser
                </button>
              </div>
            </div>
          </div>
          <style>{`
            @keyframes slide-up {
              from { transform: translateY(100%); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
          `}</style>
        </div>
      )}

      <CookiePreferencesModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        initialChoices={initialChoices}
        onSave={handleSave}
      />
    </>
  );
};

export default CookieConsentBanner;
