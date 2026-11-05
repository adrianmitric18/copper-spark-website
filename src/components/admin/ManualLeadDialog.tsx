import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import emailjs from "@emailjs/browser";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { hasUsableEmail } from "@/lib/admin/envois";

const EMAILJS_SERVICE_ID = "service_ybjga5v";
const EMAILJS_TEMPLATE_ID_PROSPECT = "template_ej9kepa";
const EMAILJS_PUBLIC_KEY = "8rgPz2Ls3kaYeRHY_";

const SERVICES = [
  "Mise en conformité RGIE",
  "Panneaux photovoltaïques",
  "Borne de recharge voiture électrique",
  "Installation électrique complète",
  "Rénovation électrique",
  "Dépannage",
  "Éclairage intérieur/extérieur",
  "Autre",
];

const CLIENT_TYPES = ["Particulier", "Entreprise / Professionnel", "Syndic de copropriété", "Agence immobilière", "Architecte / Bureau d'étude", "Autre"];
const SOURCES = [
  { value: "telephone", label: "Appel téléphonique" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "facebook", label: "Facebook / Messenger" },
  { value: "recommandation", label: "Recommandation / Bouche-à-oreille" },
  { value: "chantier", label: "Rencontre chantier" },
  { value: "autre", label: "Autre" },
];

const phoneRegex = /^(?:\+32|0032|0)[1-9](?:[\s./-]?\d){7,8}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FormState = {
  name: string;
  email: string;
  phone: string;
  rue: string;
  numero: string;
  codePostal: string;
  commune: string;
  clientType: string;
  services: string[];
  otherService: string;
  message: string;
  source: string;
  otherSource: string;
  notesInternes: string;
  sendConfirmation: boolean;
};

const initialForm: FormState = {
  name: "",
  email: "",
  phone: "",
  rue: "",
  numero: "",
  codePostal: "",
  commune: "",
  clientType: "Particulier",
  services: [],
  otherService: "",
  message: "",
  source: "telephone",
  otherSource: "",
  notesInternes: "",
  sendConfirmation: false,
};

/**
 * Lead créé à la main. Règle du brief admin 2026-11-04 : rien n'est obligatoire
 * sauf nom + téléphone. L'email n'est validé que s'il est saisi ; l'email de
 * confirmation n'est proposé que s'il y a une adresse réelle. L'insertion passe
 * par la policy « Admin can insert leads » (is_admin()), plus par les règles du
 * formulaire public.
 */
const ManualLeadDialog = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  const selectedSourceLabel = useMemo(() => SOURCES.find((s) => s.value === form.source)?.label || "", [form.source]);
  const emailSaisi = hasUsableEmail(form.email) && emailRegex.test(form.email.trim());

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const toggleService = (service: string) => {
    setForm((prev) => ({
      ...prev,
      services: prev.services.includes(service) ? prev.services.filter((s) => s !== service) : [...prev.services, service],
    }));
    if (errors.services) setErrors((prev) => ({ ...prev, services: undefined }));
  };

  const validate = () => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (form.name.trim().length < 2) next.name = "Nom requis";
    if (!phoneRegex.test(form.phone.trim().replace(/\s/g, ""))) next.phone = "Numéro belge invalide";
    // Facultatifs : validés seulement s'ils sont remplis.
    if (form.email.trim() && !emailRegex.test(form.email.trim())) next.email = "Email invalide";
    if (form.codePostal.trim() && !/^\d{4}$/.test(form.codePostal.trim())) next.codePostal = "Code postal belge à 4 chiffres";
    if (form.services.includes("Autre") && form.otherService.trim().length < 2) next.otherService = "Précise le service";
    if (form.source === "autre" && form.otherSource.trim().length < 2) next.otherSource = "Précise la source";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setSubmitting(true);
    const email = form.email.trim() || null;
    const rue = form.rue.trim() || null;
    const numero = form.numero.trim() || null;
    const codePostal = form.codePostal.trim() || null;
    const commune = form.commune.trim() || null;
    const ligne1 = [rue, numero].filter(Boolean).join(" ");
    const ligne2 = [codePostal, commune].filter(Boolean).join(" ");
    const address = [ligne1, ligne2].filter(Boolean).join(", ") || null;
    const services = form.services.map((service) => (service === "Autre" ? `Autre: ${form.otherService.trim()}` : service));
    const sourceNote = form.source === "autre" ? `Source autre : ${form.otherSource.trim()}` : "";
    const notesInternes = [sourceNote, form.notesInternes.trim()].filter(Boolean).join("\n\n") || null;
    const message = form.message.trim() || null;

    try {
      const { data, error } = await supabase
        .from("leads")
        .insert({
          name: form.name.trim(),
          email,
          phone: form.phone.trim(),
          address,
          rue,
          numero,
          code_postal: codePostal,
          commune,
          client_type: form.clientType || null,
          services,
          message,
          timing: null,
          source: form.source || null,
          notes_internes: notesInternes,
          photo_urls: null,
          gdpr_consent: true,
          status: "nouveau",
        })
        .select("id")
        .single();

      if (error) throw error;

      // Le lead est enregistré : l'email est un bonus, son échec n'est qu'un avertissement.
      if (form.sendConfirmation && email && hasUsableEmail(email)) {
        try {
          await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID_PROSPECT, {
            from_name: form.name.trim(),
            from_email: email,
            to_email: email,
            phone: form.phone.trim(),
            address: [ligne1, ligne2].filter(Boolean).join("\n"),
            rue: rue ?? "",
            numero: numero ?? "",
            code_postal: codePostal ?? "",
            commune: commune ?? "",
            services: services.join(", "),
            timing: "Non précisé",
            message: message ?? "",
          }, { publicKey: EMAILJS_PUBLIC_KEY });
        } catch (mailErr) {
          const m = mailErr instanceof Error ? mailErr.message : "envoi impossible";
          toast.warning("Lead créé, mais l'email de confirmation n'est pas parti", { description: m });
        }
      }

      toast.success("Lead créé");
      setForm(initialForm);
      setOpen(false);
      const newLeadId = data.id;
      setTimeout(() => navigate(`/admin/lead/${newLeadId}`), 0);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "création impossible";
      toast.error("Erreur : " + msg);
    } finally {
      setSubmitting(false);
    }
  };

  const errorText = (key: keyof FormState) => errors[key] && <p className="mt-1 text-sm text-destructive">{errors[key]}</p>;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="copper" size="lg" className="w-full sm:w-auto min-h-[48px]">
          <Plus className="w-4 h-4" /> Nouveau lead
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-dvh h-dvh sm:h-auto sm:max-h-[90vh] w-full sm:max-w-3xl overflow-y-auto p-4 sm:p-6 sm:rounded-lg">
        <DialogHeader className="pr-8 text-left">
          <DialogTitle className="text-xl">Nouveau lead</DialogTitle>
          <DialogDescription>Nom et téléphone suffisent. Le reste se complète plus tard depuis la fiche.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pb-24 sm:pb-0">
          <section className="space-y-3">
            <h3 className="font-semibold text-base">Coordonnées</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <div><Label htmlFor="manual-name">Nom *</Label><Input id="manual-name" className="min-h-[44px] text-base" value={form.name} onChange={(e) => update("name", e.target.value)} autoCapitalize="words" />{errorText("name")}</div>
              <div><Label htmlFor="manual-phone">Téléphone *</Label><Input id="manual-phone" type="tel" className="min-h-[44px] text-base" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="0485 75 52 27" />{errorText("phone")}</div>
              <div><Label htmlFor="manual-email">Email</Label><Input id="manual-email" type="email" inputMode="email" className="min-h-[44px] text-base" value={form.email} onChange={(e) => update("email", e.target.value)} />{errorText("email")}</div>
              <div><Label>Type de client</Label><Select value={form.clientType} onValueChange={(value) => update("clientType", value)}><SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger><SelectContent>{CLIENT_TYPES.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select></div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="font-semibold text-base">Adresse</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="col-span-2"><Label htmlFor="manual-rue">Rue</Label><Input id="manual-rue" className="min-h-[44px] text-base" value={form.rue} onChange={(e) => update("rue", e.target.value)} /></div>
              <div><Label htmlFor="manual-numero">Numéro</Label><Input id="manual-numero" className="min-h-[44px] text-base" value={form.numero} onChange={(e) => update("numero", e.target.value)} /></div>
              <div><Label htmlFor="manual-cp">Code postal</Label><Input id="manual-cp" inputMode="numeric" className="min-h-[44px] text-base" value={form.codePostal} onChange={(e) => update("codePostal", e.target.value)} />{errorText("codePostal")}</div>
              <div className="col-span-2 sm:col-span-4"><Label htmlFor="manual-commune">Commune</Label><Input id="manual-commune" className="min-h-[44px] text-base" value={form.commune} onChange={(e) => update("commune", e.target.value)} autoCapitalize="words" /></div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="font-semibold text-base">Services demandés</h3>
            <div className="grid sm:grid-cols-2 gap-2">
              {SERVICES.map((service) => (
                <label key={service} className="flex min-h-[48px] items-center gap-3 rounded-md border p-3 text-base">
                  <Checkbox checked={form.services.includes(service)} onCheckedChange={() => toggleService(service)} className="h-6 w-6" />
                  <span>{service}</span>
                </label>
              ))}
            </div>
            {form.services.includes("Autre") && <div><Input className="min-h-[44px] text-base" value={form.otherService} onChange={(e) => update("otherService", e.target.value)} placeholder="Précise le service" />{errorText("otherService")}</div>}
          </section>

          <section className="space-y-3">
            <div><Label htmlFor="manual-message">Description du projet</Label><Textarea id="manual-message" rows={3} className="text-base" value={form.message} onChange={(e) => update("message", e.target.value)} /></div>
            <div><Label>Source du lead</Label><Select value={form.source} onValueChange={(value) => update("source", value)}><SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Sélectionner..." /></SelectTrigger><SelectContent>{SOURCES.map((source) => <SelectItem key={source.value} value={source.value}>{source.label}</SelectItem>)}</SelectContent></Select></div>
            {form.source === "autre" && <div><Input className="min-h-[44px] text-base" value={form.otherSource} onChange={(e) => update("otherSource", e.target.value)} placeholder="Source précise" />{errorText("otherSource")}</div>}
            <div><Label htmlFor="manual-notes">Notes internes</Label><Textarea id="manual-notes" rows={3} maxLength={1800} className="text-base" value={form.notesInternes} onChange={(e) => update("notesInternes", e.target.value)} placeholder="Appelé 2x, client pressé, détails privés..." /><p className="mt-1 text-xs text-muted-foreground">{selectedSourceLabel}{form.notesInternes ? ` · ${form.notesInternes.length}/1800` : ""}</p></div>
          </section>

          {emailSaisi && (
            <label className="flex min-h-[52px] items-start gap-3 rounded-md border p-3 text-base">
              <Checkbox checked={form.sendConfirmation} onCheckedChange={(checked) => update("sendConfirmation", checked === true)} className="mt-0.5 h-6 w-6" />
              <span>Envoyer un email de confirmation au client</span>
            </label>
          )}

          <div className="fixed inset-x-0 bottom-0 z-10 border-t bg-background p-4 sm:static sm:border-0 sm:p-0">
            <Button onClick={handleCreate} disabled={submitting} variant="copper" size="lg" className="w-full min-h-[48px]">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Créer le lead
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManualLeadDialog;
