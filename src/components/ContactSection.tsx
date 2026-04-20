import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, Mail, CheckCircle, Upload, X, Loader2 } from "lucide-react";
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
    if (!emailRegex.test(form.email.trim())) e.email = "Email invalide";
    if (!phoneRegex.test(form.phone.trim().replace(/\s/g, ""))) e.phone = "Numéro belge invalide (ex : 0485 75 52 27)";
    if (!form.rue.trim()) e.rue = "Rue requise";
    if (!form.numero.trim()) e.numero = "Numéro requis";
    if (!/^\d{4}$/.test(form.codePostal.trim())) e.codePostal = "Code postal belge (4 chiffres)";
    if (!form.commune.trim()) e.commune = "Commune requise";
    if (!form.clientType) e.clientType = "Veuillez sélectionner";
    if (form.services.length === 0) e.services = "Cochez au moins un service";
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
      const fullAddress = `${rue} ${numero}, ${codePostal} ${commune}`;
      try {
        const { error } = await supabase.from("leads").insert({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          address: fullAddress,
          rue,
          numero,
          code_postal: codePostal,
          commune,
          client_type: form.clientType,
          services: form.services,
          message: form.message.trim(),
          timing: form.timing || null,
          source: form.source || null,
          photo_urls: photoUrls.length > 0 ? photoUrls : null,
          gdpr_consent: form.gdprConsent,
          status: "nouveau",
        } as any);
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

      const addressHtml = `${rue} ${numero}<br>${codePostal} ${commune}`;
      const addressPlain = `${rue} ${numero}\n${codePostal} ${commune}`;

      const adrianParams = {
        from_name: form.name.trim(),
        from_email: form.email.trim(),
        phone: form.phone.trim(),
        address: addressHtml,
        rue,
        numero,
        code_postal: codePostal,
        commune,
        client_type: form.clientType,
        services: servicesStr,
        message: form.message.trim(),
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

      // 5. Redirect
      navigate("/merci");
    } catch (err: any) {
      console.error("Submit error:", err);
      setSubmitError("Une erreur inattendue est survenue. Réessayez ou appelez le 0485 75 52 27.");
      setIsSubmitting(false);
    }
  };

  const requiredMark = <span className="text-destructive ml-0.5">*</span>;

  return (
    <section id="contact" ref={sectionRef} className="py-24 md:py-32 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-16">
          {/* Left column - Info */}
          <div className="lg:col-span-2">
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
                href="mailto:cuivre.electrique@gmail.com"
                className="flex items-center gap-4 p-5 rounded-2xl bg-card border border-border/50 shadow-lg hover:shadow-xl hover:border-primary/30 transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Écrivez-nous</p>
                  <p className="font-display text-base md:text-lg font-bold text-card-foreground break-all">
                    cuivre.electrique@gmail.com
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

          {/* Right column - Form */}
          <motion.form
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            onSubmit={handleSubmit}
            className="lg:col-span-3 p-6 md:p-8 rounded-3xl bg-card border border-border/50 shadow-xl space-y-8"
            noValidate
          >
            {/* SECTION 1 - Coordonnées */}
            <div className="space-y-5">
              <h3 className="font-display text-lg font-semibold text-card-foreground border-b border-border/50 pb-2">
                Vos coordonnées
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <label htmlFor="address" className="block text-sm font-medium text-card-foreground mb-2">
                    Adresse du chantier{requiredMark}
                  </label>
                  <Input
                    id="address"
                    value={form.address}
                    onChange={(e) => update("address", e.target.value)}
                    placeholder="Rue, n°, code postal, commune"
                    maxLength={300}
                    className={`h-11 ${errors.address ? "border-destructive" : ""}`}
                  />
                  {errors.address && <p className="text-destructive text-xs mt-1">{errors.address}</p>}
                </div>
              </div>
            </div>

            {/* SECTION 2 - Projet */}
            <div className="space-y-5">
              <h3 className="font-display text-lg font-semibold text-card-foreground border-b border-border/50 pb-2">
                Votre projet
              </h3>

              <div>
                <label htmlFor="clientType" className="block text-sm font-medium text-card-foreground mb-2">
                  Vous êtes{requiredMark}
                </label>
                <Select value={form.clientType} onValueChange={(v) => update("clientType", v)}>
                  <SelectTrigger className={`h-11 ${errors.clientType ? "border-destructive" : ""}`}>
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
                {errors.clientType && <p className="text-destructive text-xs mt-1">{errors.clientType}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-card-foreground mb-3">
                  Quel(s) service(s) vous intéresse(nt) ?{requiredMark}
                </label>
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

              {/* Photos */}
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-2">
                  Photos du chantier ou du problème (optionnel)
                </label>
                <p className="text-xs text-muted-foreground mb-3">
                  Les photos nous aident à préparer un devis plus précis. Max {MAX_PHOTOS} photos, {MAX_PHOTO_SIZE_MB} Mo
                  chacune.
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
            </div>

            {/* SECTION 3 - Détails */}
            <div className="space-y-5">
              <h3 className="font-display text-lg font-semibold text-card-foreground border-b border-border/50 pb-2">
                Quelques détails (optionnel)
              </h3>

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
            </div>

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
