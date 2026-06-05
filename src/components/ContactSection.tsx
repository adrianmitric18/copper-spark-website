import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, Mail, CheckCircle, Upload, X, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { motion, useInView } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAnalyticsEvents } from "@/hooks/useAnalyticsEvents";
import emailjs from "@emailjs/browser";
import imageCompression from "browser-image-compression";

// EmailJS configuration (Public Key is safe to expose client-side)
const EMAILJS_SERVICE_ID = "service_ybjga5v";
const EMAILJS_TEMPLATE_ID_ADRIAN = "template_8khdj35";
const EMAILJS_TEMPLATE_ID_PROSPECT = "template_ej9kepa";
const EMAILJS_PUBLIC_KEY = "8rgPz2Ls3kaYeRHY_";

const CLIENT_TYPES = [
  "Particulier",
  "Entreprise / Professionnel",
  "Syndic de copropriété",
  "Agence immobilière",
  "Architecte / Bureau d'étude",
  "Autre",
];

const SERVICES = [
  "Installation électrique / Rénovation",
  "Dépannage urgent",
  "Mise en conformité RGIE",
  "Borne de recharge voiture électrique",
  "Panneaux photovoltaïques",
  "Éclairage intérieur / extérieur",
  "Autre (préciser dans le message)",
];

const HABITAT_OPTIONS = ["Neuve", "En rénovation", "Existante"];

const TIMINGS = [
  "Urgent — dans les 24h",
  "Dans la semaine",
  "Dans le mois",
  "Pas de pression, je prépare mon projet",
];

const SOURCES = [
  "Recherche Google",
  "Bouche-à-oreille / Recommandation",
  "Google Maps",
  "Réseaux sociaux",
  "Publicité en ligne",
  "Plateforme (TrustUp, Bobex, Solvari...)",
  "Autre",
];

const MAX_PHOTOS = 3;
const MAX_PHOTO_SIZE_MB = 5;
const COMPRESS_THRESHOLD_MB = 2;

interface PhotoFile {
  file: File;
  previewUrl: string;
}

interface FormState {
  name: string;
  email: string;
  phone: string;
  rue: string;
  numero: string;
  codePostal: string;
  commune: string;
  clientType: string;
  habitatType: string;
  buildYear: string;
  services: string[];
  message: string;
  timing: string;
  source: string;
  gdprConsent: boolean;
}

const initialState: FormState = {
  name: "",
  email: "",
  phone: "",
  rue: "",
  numero: "",
  codePostal: "",
  commune: "",
  clientType: "",
  habitatType: "",
  buildYear: "",
  services: [],
  message: "",
  timing: "",
  source: "",
  gdprConsent: false,
};

const phoneRegex = /^(?:\+32|0032|0)[1-9](?:[\s./-]?\d){7,8}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ContactSection = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { trackEvent } = useAnalyticsEvents();

  const [form, setForm] = useState<FormState>(initialState);
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState | "photos", string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  // Confirmation visuelle améliorée (brief 2026-05-01) — overlay de succès
  // affiché après l'envoi avant la redirection vers /merci.
  const [submitSuccess, setSubmitSuccess] = useState<{ name: string } | null>(null);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const toggleService = (service: string) => {
    setForm((prev) => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter((s) => s !== service)
        : [...prev.services, service],
    }));
    if (errors.services) setErrors((prev) => ({ ...prev, services: undefined }));
  };

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList) return;
    const remaining = MAX_PHOTOS - photos.length;
    const incoming = Array.from(fileList).slice(0, remaining);
    const newPhotos: PhotoFile[] = [];

    for (const file of incoming) {
      if (file.size > MAX_PHOTO_SIZE_MB * 1024 * 1024) {
        toast({
          title: "Photo trop lourde",
          description: `${file.name} dépasse ${MAX_PHOTO_SIZE_MB} Mo et a été ignorée.`,
          variant: "destructive",
        });
        continue;
      }
      newPhotos.push({ file, previewUrl: URL.createObjectURL(file) });
    }

    setPhotos((prev) => [...prev, ...newPhotos]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePhoto = (idx: number) => {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[idx].previewUrl);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim() || form.name.trim().length < 2) e.name = "Nom et prénom requis";

    // Téléphone OU email — au moins un (assouplissement 2026-05-22)
    const phoneFilled = form.phone.trim().length > 0;
    const emailFilled = form.email.trim().length > 0;
    if (!phoneFilled && !emailFilled) {
      e.phone = "Téléphone ou email requis";
      e.email = "Téléphone ou email requis";
    } else {
      if (phoneFilled && !phoneRegex.test(form.phone.trim().replace(/\s/g, ""))) {
        e.phone = "Numéro belge invalide (ex : 0485 75 52 27)";
      }
      if (emailFilled && !emailRegex.test(form.email.trim())) {
        e.email = "Email invalide";
      }
    }

    // Adresse complète requise (business need 2026-05-23) : Adrian a besoin
    // de la rue + numéro + CP + commune pour son process opérationnel.
    if (!form.rue.trim()) e.rue = "Rue requise";
    if (!form.numero.trim()) e.numero = "Numéro requis";
    if (!/^\d{4}$/.test(form.codePostal.trim())) e.codePostal = "Code postal belge (4 chiffres)";
    if (!form.commune.trim()) e.commune = "Commune requise";

    if (form.services.length === 0) e.services = "Sélectionnez au moins un service";
    if (form.message.trim().length < 20) e.message = "Décrivez votre projet (min. 20 caractères)";
    if (!form.gdprConsent) e.gdprConsent = "Consentement requis";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const uploadPhotos = async (): Promise<string[]> => {
    if (photos.length === 0) return [];
    const urls: string[] = [];
    for (let i = 0; i < photos.length; i++) {
      let file = photos[i].file;
      if (file.size > COMPRESS_THRESHOLD_MB * 1024 * 1024) {
        try {
          file = await imageCompression(file, {
            maxSizeMB: COMPRESS_THRESHOLD_MB,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
          });
        } catch (err) {
          console.warn("Compression failed, uploading original", err);
        }
      }
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
      const { error } = await supabase.storage.from("lead-photos").upload(path, file, {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });
      if (error) throw new Error(`Upload photo ${i + 1} : ${error.message}`);
      urls.push(path);
      setUploadProgress(Math.round(((i + 1) / photos.length) * 100));
    }
    return urls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) {
      toast({ title: "Formulaire incomplet", description: "Corrigez les erreurs.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    let photoUrls: string[] = [];
    let dbOk = false;
    let emailOk = false;

    try {
      // 1. Upload photos
      try {
        photoUrls = await uploadPhotos();
      } catch (err) {
        console.error("Photo upload failed:", err);
        toast({
          title: "Photos non envoyées",
          description: "Nous traitons votre demande sans les photos.",
          variant: "destructive",
        });
      }

      // 2. Insert lead in DB
      const rue = form.rue.trim();
      const numero = form.numero.trim();
      const codePostal = form.codePostal.trim();
      const commune = form.commune.trim();

      // Construit l'adresse depuis ce qui est fourni — adresse complète
      // optionnelle (passage 5 champs requis 2026-05-22). Si seul `commune`
      // est rempli, c'est suffisant pour qualifier la zone.
      const streetPart = [rue, numero].filter(Boolean).join(" ").trim();
      const cityPart = [codePostal, commune].filter(Boolean).join(" ").trim();
      const fullAddress = [streetPart, cityPart].filter(Boolean).join(", ");

      // Pré-qualification — habitatType et buildYear sont désormais
      // optionnels. On préfixe au message DB uniquement ce qui est rempli.
      const prequalParts: string[] = [];
      if (form.habitatType) prequalParts.push(`[Habitation] ${form.habitatType}`);
      if (form.buildYear.trim()) prequalParts.push(`[Construction] ${form.buildYear.trim()}`);
      const prequalHeader = prequalParts.length > 0 ? prequalParts.join(" · ") + "\n\n" : "";
      const enrichedMessage = prequalHeader + form.message.trim();

      try {
        const { error } = await supabase.from("leads").insert({
          name: form.name.trim(),
          // email facultatif (tél OU email) : la RLS leads exige 3-255 car. ->
          // fallback non vide pour ne pas perdre le lead quand seul le tél est fourni.
          email: form.email.trim() || "Non fourni",
          phone: form.phone.trim(),
          address: fullAddress,
          rue,
          numero,
          code_postal: codePostal,
          commune,
          client_type: form.clientType,
          services: form.services,
          message: enrichedMessage,
          timing: form.timing || null,
          source: form.source || null,
          photo_urls: photoUrls.length > 0 ? photoUrls : null,
          gdpr_consent: form.gdprConsent,
          status: "nouveau",
        });
        if (error) throw error;
        dbOk = true;
      } catch (err) {
        console.error("DB insert failed:", err);
      }

      // 3. Send emails via EmailJS
      const servicesStr = form.services.join(", ");
      const dateStr = new Date().toLocaleString("fr-BE");

      // Generate signed URLs (7 days) for clickable photo links in Adrian's email
      let photosStr = "Aucune photo jointe";
      if (photoUrls.length > 0) {
        try {
          const signedLinks = await Promise.all(
            photoUrls.map(async (path, idx) => {
              const { data, error } = await supabase.storage
                .from("lead-photos")
                .createSignedUrl(path, 604800);
              if (error || !data?.signedUrl) return `📎 Photo ${idx + 1} (lien indisponible)`;
              return `<a href='${data.signedUrl}' target='_blank'>📎 Photo ${idx + 1}</a>`;
            })
          );
          photosStr = signedLinks.join("<br>");
        } catch (err) {
          console.error("Signed URL generation failed:", err);
          photosStr = photoUrls.map((_, i) => `📎 Photo ${i + 1} (lien indisponible)`).join("<br>");
        }
      }

      const addressHtml = [streetPart, cityPart].filter(Boolean).join("<br>") || "Adresse non précisée";
      const addressPlain = [streetPart, cityPart].filter(Boolean).join("\n") || "Adresse non précisée";

      const adrianParams = {
        from_name: form.name.trim(),
        from_email: form.email.trim() || "Non fourni",
        phone: form.phone.trim() || "Non fourni",
        address: addressHtml,
        rue,
        numero,
        code_postal: codePostal,
        commune,
        client_type: form.clientType || "Non précisé",
        habitat_type: form.habitatType || "Non précisé",
        build_year: form.buildYear.trim() || "Non précisée",
        services: servicesStr,
        message: enrichedMessage,
        timing: form.timing || "Non précisé",
        source: form.source || "Non précisé",
        photos: photosStr,
        date: dateStr,
      };

      const prospectParams = {
        from_name: form.name.trim(),
        from_email: form.email.trim(),
        to_email: form.email.trim(),
        phone: form.phone.trim(),
        address: addressPlain,
        rue,
        numero,
        code_postal: codePostal,
        commune,
        services: servicesStr,
        timing: form.timing || "Non précisé",
        message: form.message.trim(),
      };

      try {
        await Promise.all([
          emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID_ADRIAN, adrianParams, { publicKey: EMAILJS_PUBLIC_KEY }),
          emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID_PROSPECT, prospectParams, { publicKey: EMAILJS_PUBLIC_KEY }),
        ]);
        emailOk = true;
      } catch (err) {
        console.error("EmailJS send failed:", err);
      }

      if (!dbOk && !emailOk) {
        setSubmitError(
          "Votre demande n'a pas pu être envoyée. Veuillez réessayer ou nous appeler au 0485 75 52 27."
        );
        setIsSubmitting(false);
        return;
      }

      // 4. Track GA4
      trackEvent("form_submit", {
        form_name: "contact",
        source_section: "contact_page",
        services: form.services,
        client_type: form.clientType,
        has_photos: photoUrls.length > 0,
        source: form.source || undefined,
      });

      // 5. Confirmation visuelle (brief 2026-05-01) puis redirection
      const firstName = form.name.trim().split(/\s+/)[0];
      setSubmitSuccess({ name: firstName });
      setTimeout(() => navigate("/merci"), 2400);
    } catch (err) {
      console.error("Submit error:", err);
      setSubmitError("Une erreur inattendue est survenue. Réessayez ou appelez le 0485 75 52 27.");
      setIsSubmitting(false);
    }
  };

  const requiredMark = <span className="text-destructive ml-0.5">*</span>;

  // Confirmation visuelle améliorée — affichée à la place du formulaire
  // pendant 2,4s avant la redirection vers /merci.
  if (submitSuccess) {
    return (
      <section
        id="contact"
        className="py-24 md:py-32 bg-background"
        aria-live="polite"
      >
        <div className="container mx-auto px-4 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="bg-card border border-primary/30 rounded-3xl p-8 md:p-12 text-center shadow-lg"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 220, damping: 14 }}
              className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
            >
              <CheckCircle className="w-9 h-9" aria-hidden="true" strokeWidth={2} />
            </motion.div>
            <h3 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">
              Merci {submitSuccess.name} !
            </h3>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-6">
              Je vous recontacte personnellement dans les 24h ouvrées avec une
              première estimation et la suite à donner.
            </p>
            <p className="text-sm text-muted-foreground border-t border-border pt-5">
              Une urgence ?{" "}
              <a
                href="tel:+32485755227"
                className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
              >
                <Phone className="w-3.5 h-3.5" aria-hidden="true" />
                0485 75 52 27
              </a>
            </p>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section id="contact" ref={sectionRef} className="pt-4 md:pt-8 pb-20 md:pb-28 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-16">
          {/* Left column - Info (passe APRÈS le formulaire en mobile) */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5 }}
              className="inline-block px-4 py-2 bg-primary/10 border border-primary/30 text-primary text-sm font-medium rounded-full mb-6"
            >
              Devis gratuit
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6"
            >
              Demandez votre <span className="text-gradient-copper">devis gratuit</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-muted-foreground mb-8 text-lg leading-relaxed"
            >
              Décrivez-nous votre projet et recevez une réponse personnalisée sous 24-48h ouvrables.
            </motion.p>

            <div className="space-y-4">
              <a
                href="tel:+32485755227"
                data-analytics="call_click"
                onClick={() => trackEvent("call_click", { source_section: "contact_page_card" })}
                className="flex items-center gap-4 p-5 rounded-2xl bg-card border border-border/50 shadow-lg hover:shadow-xl hover:border-primary/30 transition-all duration-300 group"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
                  <Phone className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Appelez-nous</p>
                  <p className="font-display text-xl font-bold text-card-foreground">0485 75 52 27</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Lun-Ven 8h-18h, Sam 9h-13h — Urgences 7j/7 24h/24
                  </p>
                </div>
              </a>

              <a
                href="mailto:contact@cuivre-electrique.com"
                className="flex items-center gap-4 p-5 rounded-2xl bg-card border border-border/50 shadow-lg hover:shadow-xl hover:border-primary/30 transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Écrivez-nous</p>
                  <p className="font-display text-base md:text-lg font-bold text-card-foreground break-all">
                    contact@cuivre-electrique.com
                  </p>
                </div>
              </a>

              <div className="p-5 rounded-2xl bg-card border border-primary/20 shadow-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-card-foreground mb-1">Réponse rapide garantie</p>
                    <p className="text-sm text-muted-foreground">
                      Nous répondons à toutes les demandes sous 24-48h ouvrées.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right column - Form (passe AVANT l'info en mobile) */}
          <motion.form
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            onSubmit={handleSubmit}
            className="lg:col-span-3 order-1 lg:order-2 p-6 md:p-8 rounded-3xl bg-card border border-border/50 shadow-xl space-y-8"
            noValidate
          >
            {/* SECTION 1 — Coordonnées (assoupli 2026-05-22 : tél OU email) */}
            <div className="space-y-5">
              <h3 className="font-display text-lg font-semibold text-card-foreground border-b border-border/50 pb-2">
                Vos coordonnées
              </h3>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-card-foreground mb-2">
                  Nom et prénom{requiredMark}
                </label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="Jean Dupont"
                  maxLength={100}
                  className={`h-11 ${errors.name ? "border-destructive" : ""}`}
                />
                {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-card-foreground mb-2">
                    Téléphone{requiredMark}
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    placeholder="0485 75 52 27"
                    maxLength={30}
                    className={`h-11 ${errors.phone ? "border-destructive" : ""}`}
                  />
                  {errors.phone && <p className="text-destructive text-xs mt-1">{errors.phone}</p>}
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-card-foreground mb-2">
                    Email{requiredMark}
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="jean@exemple.be"
                    maxLength={255}
                    className={`h-11 ${errors.email ? "border-destructive" : ""}`}
                  />
                  {errors.email && <p className="text-destructive text-xs mt-1">{errors.email}</p>}
                </div>
              </div>
              <p className="text-xs text-muted-foreground -mt-2">
                Téléphone ou email — au moins un des deux.
              </p>
            </div>

            {/* SECTION 2 — Adresse du chantier (à nouveau requise, business need 2026-05-23) */}
            <div className="space-y-5">
              <h3 className="font-display text-lg font-semibold text-card-foreground border-b border-border/50 pb-2">
                Adresse du chantier
              </h3>

              <div>
                <label htmlFor="rue" className="block text-sm font-medium text-card-foreground mb-2">
                  Rue{requiredMark}
                </label>
                <Input
                  id="rue"
                  value={form.rue}
                  onChange={(e) => update("rue", e.target.value)}
                  placeholder="Ex: Rue de la Station"
                  maxLength={150}
                  className={`h-11 ${errors.rue ? "border-destructive" : ""}`}
                  autoComplete="address-line1"
                />
                {errors.rue && <p className="text-destructive text-xs mt-1">{errors.rue}</p>}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label htmlFor="numero" className="block text-sm font-medium text-card-foreground mb-2">
                    Numéro{requiredMark}
                  </label>
                  <Input
                    id="numero"
                    value={form.numero}
                    onChange={(e) => update("numero", e.target.value)}
                    placeholder="12"
                    maxLength={20}
                    className={`h-11 ${errors.numero ? "border-destructive" : ""}`}
                  />
                  {errors.numero && <p className="text-destructive text-xs mt-1">{errors.numero}</p>}
                </div>
                <div className="col-span-2">
                  <label htmlFor="codePostal" className="block text-sm font-medium text-card-foreground mb-2">
                    Code postal{requiredMark}
                  </label>
                  <Input
                    id="codePostal"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{4}"
                    value={form.codePostal}
                    onChange={(e) => update("codePostal", e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="Ex: 1490"
                    maxLength={4}
                    className={`h-11 ${errors.codePostal ? "border-destructive" : ""}`}
                    autoComplete="postal-code"
                  />
                  {errors.codePostal && <p className="text-destructive text-xs mt-1">{errors.codePostal}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="commune" className="block text-sm font-medium text-card-foreground mb-2">
                  Commune{requiredMark}
                </label>
                <Input
                  id="commune"
                  value={form.commune}
                  onChange={(e) => update("commune", e.target.value)}
                  placeholder="Ex: Court-Saint-Étienne"
                  maxLength={100}
                  className={`h-11 ${errors.commune ? "border-destructive" : ""}`}
                  autoComplete="address-level2"
                />
                {errors.commune && <p className="text-destructive text-xs mt-1">{errors.commune}</p>}
              </div>
            </div>

            {/* SECTION 3 — Votre projet */}
            <div className="space-y-5">
              <h3 className="font-display text-lg font-semibold text-card-foreground border-b border-border/50 pb-2">
                Votre projet
              </h3>

              <div>
                <label className="block text-sm font-medium text-card-foreground mb-3">
                  Services qui vous intéressent{requiredMark}
                </label>
                <p className="text-xs text-muted-foreground mb-3">
                  Cochez un ou plusieurs services concernés par votre demande.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {SERVICES.map((service) => {
                    const checked = form.services.includes(service);
                    return (
                      <label
                        key={service}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          checked
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40 bg-background"
                        }`}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggleService(service)}
                          className="mt-0.5"
                        />
                        <span className="text-sm text-card-foreground leading-tight">{service}</span>
                      </label>
                    );
                  })}
                </div>
                {errors.services && <p className="text-destructive text-xs mt-2">{errors.services}</p>}
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-card-foreground mb-2">
                  Décrivez votre projet ou votre problème{requiredMark}
                </label>
                <Textarea
                  id="message"
                  value={form.message}
                  onChange={(e) => update("message", e.target.value)}
                  placeholder="Plus vous nous donnez de détails, plus notre devis sera précis…"
                  rows={5}
                  maxLength={5000}
                  className={errors.message ? "border-destructive" : ""}
                />
                {errors.message && <p className="text-destructive text-xs mt-1">{errors.message}</p>}
              </div>
            </div>

            {/* SECTION 4 — Plus de détails (optionnel, repliable) */}
            <Collapsible className="space-y-4">
              <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-xl bg-muted/40 border border-border/50 hover:bg-muted/60 transition-colors group">
                <div className="text-left">
                  <p className="font-display text-base font-semibold text-card-foreground">
                    Plus de détails (optionnel)
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Type de logement, année de construction, photos… Aide à préparer un devis plus précis.
                  </p>
                </div>
                <ChevronDown
                  className="w-5 h-5 text-muted-foreground shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180"
                  aria-hidden="true"
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-5 pt-2">
                <div>
                  <label htmlFor="clientType" className="block text-sm font-medium text-card-foreground mb-2">
                    Vous êtes
                  </label>
                  <Select value={form.clientType} onValueChange={(v) => update("clientType", v)}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Sélectionnez..." />
                    </SelectTrigger>
                    <SelectContent>
                      {CLIENT_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <fieldset>
                  <legend className="block text-sm font-medium text-card-foreground mb-3">
                    Habitation
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {HABITAT_OPTIONS.map((opt) => {
                      const selected = form.habitatType === opt;
                      return (
                        <label
                          key={opt}
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors text-sm ${
                            selected
                              ? "border-primary bg-primary/5 text-foreground font-medium"
                              : "border-border hover:border-primary/40 bg-background text-card-foreground"
                          }`}
                        >
                          <input
                            type="radio"
                            name="habitatType"
                            value={opt}
                            checked={selected}
                            onChange={() => update("habitatType", opt)}
                            className="sr-only"
                          />
                          <span
                            aria-hidden="true"
                            className={`w-3 h-3 rounded-full border ${
                              selected ? "border-primary bg-primary" : "border-border"
                            }`}
                          />
                          {opt}
                        </label>
                      );
                    })}
                  </div>
                </fieldset>

                <div>
                  <label htmlFor="buildYear" className="block text-sm font-medium text-card-foreground mb-2">
                    Année de construction de la maison
                  </label>
                  <Input
                    id="buildYear"
                    type="text"
                    inputMode="numeric"
                    value={form.buildYear}
                    onChange={(e) => update("buildYear", e.target.value)}
                    placeholder="ex : 1985 (laissez vide si vous ne savez pas)"
                    maxLength={20}
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Pour estimation du taux de TVA applicable (6 % en rénovation au-delà de 10 ans).
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="timing" className="block text-sm font-medium text-card-foreground mb-2">
                      Quand souhaitez-vous intervenir ?
                    </label>
                    <Select value={form.timing} onValueChange={(v) => update("timing", v)}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Sélectionnez..." />
                      </SelectTrigger>
                      <SelectContent>
                        {TIMINGS.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label htmlFor="source" className="block text-sm font-medium text-card-foreground mb-2">
                      Comment nous avez-vous connus ?
                    </label>
                    <Select value={form.source} onValueChange={(v) => update("source", v)}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Sélectionnez..." />
                      </SelectTrigger>
                      <SelectContent>
                        {SOURCES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-2">
                    Photos du chantier ou du problème
                  </label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Les photos nous aident à préparer un devis plus précis. Max {MAX_PHOTOS} photos, {MAX_PHOTO_SIZE_MB} Mo chacune.
                  </p>

                  {photos.length < MAX_PHOTOS && (
                    <label
                      htmlFor="photos"
                      className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 cursor-pointer transition-colors"
                    >
                      <Upload className="w-6 h-6 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Cliquez pour ajouter {photos.length > 0 ? `(${photos.length}/${MAX_PHOTOS})` : "des photos"}
                      </span>
                      <input
                        ref={fileInputRef}
                        id="photos"
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                        multiple
                        onChange={(e) => handleFiles(e.target.files)}
                        className="hidden"
                      />
                    </label>
                  )}

                  {photos.length > 0 && (
                    <div className="grid grid-cols-3 gap-3 mt-3">
                      {photos.map((p, i) => (
                        <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                          <img src={p.previewUrl} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removePhoto(i)}
                            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-background/90 hover:bg-destructive hover:text-destructive-foreground flex items-center justify-center transition-colors"
                            aria-label="Retirer la photo"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* SECTION 4 - Consentement */}
            <div>
              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={form.gdprConsent}
                  onCheckedChange={(c) => update("gdprConsent", c === true)}
                  className="mt-0.5"
                />
                <span className="text-sm text-card-foreground leading-snug">
                  J'accepte que mes données soient utilisées pour me recontacter au sujet de ma demande.
                  {requiredMark}
                </span>
              </label>
              {errors.gdprConsent && <p className="text-destructive text-xs mt-1">{errors.gdprConsent}</p>}
            </div>

            {/* Upload progress */}
            {isSubmitting && photos.length > 0 && uploadProgress > 0 && uploadProgress < 100 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Envoi des photos… {uploadProgress}%</p>
                <Progress value={uploadProgress} />
              </div>
            )}

            {submitError && (
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">
                {submitError}
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              variant="copper"
              disabled={isSubmitting}
              data-analytics="form_submit"
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Envoi en cours…
                </>
              ) : (
                "Envoyer ma demande"
              )}
            </Button>
          </motion.form>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
