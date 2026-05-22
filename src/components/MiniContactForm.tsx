import { useState } from "react";
import { CheckCircle, Loader2, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAnalyticsEvents } from "@/hooks/useAnalyticsEvents";

// EmailJS configuration — alignée avec ContactSection.tsx
// Lazy-loaded au submit pour ne pas alourdir le chunk initial home (+10 KB raw sinon).
const EMAILJS_SERVICE_ID = "service_ybjga5v";
const EMAILJS_TEMPLATE_ID_ADRIAN = "template_8khdj35";
const EMAILJS_PUBLIC_KEY = "8rgPz2Ls3kaYeRHY_";

const phoneRegex = /^(?:\+32|0032|0)[1-9](?:[\s./-]?\d){7,8}$/;

interface MiniFormState {
  name: string;
  phone: string;
  message: string;
}

const initialState: MiniFormState = { name: "", phone: "", message: "" };

const MiniContactForm = () => {
  const { trackEvent } = useAnalyticsEvents();
  const [form, setForm] = useState<MiniFormState>(initialState);
  const [errors, setErrors] = useState<Partial<Record<keyof MiniFormState, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<{ name: string } | null>(null);

  const update = (key: keyof MiniFormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof MiniFormState, string>> = {};
    if (!form.name.trim() || form.name.trim().length < 2) e.name = "Nom requis";
    if (!phoneRegex.test(form.phone.trim().replace(/\s/g, "")))
      e.phone = "Numéro belge invalide (ex : 0485 75 52 27)";
    if (form.message.trim().length < 5) e.message = "Décrivez brièvement votre besoin";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    setIsSubmitting(true);

    let dbOk = false;
    let emailOk = false;

    try {
      // Insert minimal lead. Les colonnes NOT NULL du schéma (address,
      // client_type, email, services) reçoivent des fallbacks neutres
      // pour que le mini-form puisse fonctionner avec 3 champs seulement.
      try {
        const { error } = await supabase.from("leads").insert({
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: "",
          address: "Non précisée",
          client_type: "Non précisé",
          services: [],
          message: form.message.trim(),
          source: "Home mini-form",
          gdpr_consent: true,
          status: "nouveau",
        });
        if (error) throw error;
        dbOk = true;
      } catch (err) {
        console.error("Mini-form DB insert failed:", err);
      }

      const dateStr = new Date().toLocaleString("fr-BE");
      try {
        const { default: emailjs } = await import("@emailjs/browser");
        await emailjs.send(
          EMAILJS_SERVICE_ID,
          EMAILJS_TEMPLATE_ID_ADRIAN,
          {
            from_name: form.name.trim(),
            from_email: "Non fourni (mini-form home)",
            phone: form.phone.trim(),
            address: "Non précisée",
            rue: "",
            numero: "",
            code_postal: "",
            commune: "",
            client_type: "Non précisé",
            habitat_type: "Non précisé",
            build_year: "Non précisée",
            services: "Non précisé (mini-form)",
            message: form.message.trim(),
            timing: "Non précisé",
            source: "Home mini-form",
            photos: "Aucune photo jointe",
            date: dateStr,
          },
          { publicKey: EMAILJS_PUBLIC_KEY },
        );
        emailOk = true;
      } catch (err) {
        console.error("Mini-form EmailJS send failed:", err);
      }

      if (!dbOk && !emailOk) {
        setSubmitError(
          "Votre demande n'a pas pu être envoyée. Veuillez réessayer ou nous appeler au 0485 75 52 27.",
        );
        setIsSubmitting(false);
        return;
      }

      trackEvent("form_submit", {
        form_name: "mini_contact",
        source_section: "home",
      });

      setSubmitSuccess({ name: form.name.trim().split(/\s+/)[0] });
      setForm(initialState);
    } catch (err) {
      console.error("Mini-form unexpected error:", err);
      setSubmitError("Une erreur inattendue est survenue. Réessayez ou appelez le 0485 75 52 27.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <section
        aria-live="polite"
        className="py-14 md:py-20 bg-muted/30 border-y border-border"
      >
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="bg-card border border-primary/30 rounded-3xl p-8 md:p-10 text-center shadow-lg">
            <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <CheckCircle className="w-8 h-8" aria-hidden="true" strokeWidth={2} />
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">
              Merci {submitSuccess.name} !
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed mb-5">
              On revient vers vous sous 24h ouvrées avec une première estimation.
            </p>
            <p className="text-sm text-muted-foreground border-t border-border pt-4">
              Une urgence ?{" "}
              <a
                href="tel:+32485755227"
                className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
              >
                <Phone className="w-3.5 h-3.5" aria-hidden="true" />
                0485 75 52 27
              </a>
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-14 md:py-20 bg-muted/30 border-y border-border">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-8">
          <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-3">
            Recevez un devis sous{" "}
            <span className="text-gradient-copper">24h</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg">
            3 champs, 30 secondes. On vous rappelle.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-card border border-border/60 rounded-3xl p-6 md:p-8 shadow-xl space-y-4"
          noValidate
        >
          <div>
            <label htmlFor="mini-name" className="block text-sm font-medium text-card-foreground mb-2">
              Nom <span className="text-destructive">*</span>
            </label>
            <Input
              id="mini-name"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Jean Dupont"
              maxLength={100}
              className={`h-11 ${errors.name ? "border-destructive" : ""}`}
              autoComplete="name"
            />
            {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="mini-phone" className="block text-sm font-medium text-card-foreground mb-2">
              Téléphone <span className="text-destructive">*</span>
            </label>
            <Input
              id="mini-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="0485 75 52 27"
              maxLength={30}
              className={`h-11 ${errors.phone ? "border-destructive" : ""}`}
              autoComplete="tel"
            />
            {errors.phone && <p className="text-destructive text-xs mt-1">{errors.phone}</p>}
          </div>

          <div>
            <label htmlFor="mini-message" className="block text-sm font-medium text-card-foreground mb-2">
              Votre besoin <span className="text-destructive">*</span>
            </label>
            <Textarea
              id="mini-message"
              value={form.message}
              onChange={(e) => update("message", e.target.value)}
              placeholder="Ex : tableau à refaire, borne de recharge, panne…"
              rows={3}
              maxLength={1000}
              className={errors.message ? "border-destructive" : ""}
            />
            {errors.message && <p className="text-destructive text-xs mt-1">{errors.message}</p>}
          </div>

          {submitError && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">
              {submitError}
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            variant="copper"
            disabled={isSubmitting}
            data-analytics="form_submit_mini"
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Envoi en cours…
              </>
            ) : (
              "Recevoir un devis sous 24h"
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center pt-1">
            En envoyant ce formulaire, vous acceptez d'être recontacté au sujet de votre demande.
          </p>
        </form>
      </div>
    </section>
  );
};

export default MiniContactForm;
