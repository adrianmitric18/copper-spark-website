import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import {
  Phone,
  Calendar as CalendarIcon,
  MessageSquare,
  CheckCircle2,
  Plus,
  ArrowLeft,
  User,
  MapPin,
  Mail,
  Send,
  Copy,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import AdminShell from "@/admin/layout/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import AdminLoading from "@/components/admin/AdminLoading";
import {
  createRdvRapide,
  TYPE_VISITES,
  DUREE_DEFAUT_PAR_TYPE,
  DELAI_APPEL_DEFAUT_PAR_TYPE,
  DELAI_APPEL_PRESETS,
  type TypeVisite,
} from "@/lib/admin/rdv-rapide";
import { buildGoogleCalendarUrl } from "@/lib/admin/google-calendar-link";
import {
  smsTemplateConfirmation,
  whatsappTemplateConfirmation,
  emailPlaintextConfirmation,
  emailHtmlConfirmation,
  emailSubjectConfirmation,
  buildSmsHref,
  buildWhatsappHref,
  buildMailtoHref,
} from "@/lib/admin/message-templates";

const formSchema = z.object({
  name: z.string().min(1, "Nom requis").max(100, "Nom trop long"),
  phone: z
    .string()
    .min(6, "Téléphone trop court")
    .max(30, "Téléphone trop long")
    .regex(
      /^[\d\s+().\-/]+$/,
      "Format invalide (chiffres, espaces, +, -, ., (, ) autorisés)",
    ),
  email: z
    .string()
    .email("Email invalide")
    .max(255)
    .optional()
    .or(z.literal("")),
  dateRdv: z.string().min(1, "Date requise"),
  heureRdv: z.string().min(1, "Heure requise"),
  typeVisite: z.enum(TYPE_VISITES),
  dureeMinutes: z.coerce.number().int().min(15).max(480),
  delaiAppelMinutes: z
    .union([
      z.literal(""),
      z.coerce.number().int().min(1, "Min 1 min").max(240, "Max 240 min"),
    ])
    .optional(),
  address: z.string().max(300).optional(),
  notes: z.string().max(1000).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface RdvSummary {
  name: string;
  phone: string;
  email?: string;
  dateRdv: string;
  heureRdv: string;
  typeVisite: TypeVisite;
  dureeMinutes: number;
  delaiAppelMinutes?: number | null;
  address?: string;
  leadId: string;
}

const RdvRapide = () => {
  const { user, ready } = useAdminGuard();
  const [success, setSuccess] = useState<RdvSummary | null>(null);

  useEffect(() => {
    document.title = "RDV rapide – Le Cuivre Admin";
  }, []);

  const todayIso = new Date().toISOString().slice(0, 10);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      dateRdv: todayIso,
      heureRdv: "10:00",
      typeVisite: "Devis",
      dureeMinutes: 60,
      delaiAppelMinutes: 30,
      address: "",
      notes: "",
    },
  });

  // Auto-suggère la durée selon le type sélectionné, tant que l'utilisateur
  // n'a pas modifié manuellement la durée.
  const [autoDuree, setAutoDuree] = useState(true);
  const [autoDelai, setAutoDelai] = useState(true);
  const typeVisiteWatch = form.watch("typeVisite");
  useEffect(() => {
    if (autoDuree && typeVisiteWatch) {
      form.setValue("dureeMinutes", DUREE_DEFAUT_PAR_TYPE[typeVisiteWatch]);
    }
    if (autoDelai && typeVisiteWatch) {
      form.setValue(
        "delaiAppelMinutes",
        DELAI_APPEL_DEFAUT_PAR_TYPE[typeVisiteWatch],
      );
    }
  }, [typeVisiteWatch, autoDuree, autoDelai, form]);

  const createMut = useMutation({
    mutationFn: createRdvRapide,
    onSuccess: (res, vars) => {
      setSuccess({
        name: vars.name,
        phone: vars.phone,
        email: vars.email,
        dateRdv: vars.dateRdv,
        heureRdv: vars.heureRdv,
        typeVisite: vars.typeVisite,
        dureeMinutes: vars.dureeMinutes,
        delaiAppelMinutes: vars.delaiAppelMinutes,
        address: vars.address,
        leadId: res.leadId,
      });
      toast.success("RDV créé", {
        description: `${vars.name} • ${vars.dateRdv} à ${vars.heureRdv}`,
      });
    },
    onError: (e: Error) => {
      toast.error("Échec de la création", { description: e.message });
    },
  });

  const onSubmit = (values: FormValues) => {
    const delai =
      values.delaiAppelMinutes === "" || values.delaiAppelMinutes === undefined
        ? null
        : values.delaiAppelMinutes;
    createMut.mutate({
      name: values.name,
      phone: values.phone,
      email: values.email || undefined,
      dateRdv: values.dateRdv,
      heureRdv: values.heureRdv,
      typeVisite: values.typeVisite,
      dureeMinutes: values.dureeMinutes,
      delaiAppelMinutes: delai,
      address: values.address,
      notes: values.notes,
    });
  };

  const resetForm = () => {
    setSuccess(null);
    form.reset({
      name: "",
      phone: "",
      email: "",
      dateRdv: todayIso,
      heureRdv: "10:00",
      typeVisite: "Devis",
      dureeMinutes: 60,
      delaiAppelMinutes: 30,
      address: "",
      notes: "",
    });
    setAutoDuree(true);
    setAutoDelai(true);
  };

  if (!ready || !user) return <AdminLoading />;

  if (success) {
    return <SuccessScreen summary={success} onNew={resetForm} />;
  }

  return (
    <AdminShell mobileTitle="RDV rapide">
      <div className="p-4 md:p-6 max-w-xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Phone className="w-7 h-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">RDV rapide</h1>
            <p className="text-xs text-muted-foreground">
              Création lead + RDV en un clic, 30 secondes max
            </p>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Field
            label="Nom du client *"
            error={form.formState.errors.name?.message}
            icon={<User className="w-4 h-4" />}
          >
            <Input
              {...form.register("name")}
              placeholder="Ex: Jean Dupont"
              autoComplete="name"
              autoFocus
              className="h-12 text-base"
            />
          </Field>

          <Field
            label="Téléphone *"
            error={form.formState.errors.phone?.message}
            icon={<Phone className="w-4 h-4" />}
          >
            <Input
              {...form.register("phone")}
              type="tel"
              placeholder="Ex: 0485 12 34 56"
              autoComplete="tel"
              inputMode="tel"
              className="h-12 text-base"
            />
          </Field>

          <Field
            label="Email"
            hint="Optionnel — débloque le bouton Email sur l'écran de confirmation"
            error={form.formState.errors.email?.message}
            icon={<Mail className="w-4 h-4" />}
          >
            <Input
              {...form.register("email")}
              type="email"
              placeholder="jean.dupont@example.com"
              autoComplete="email"
              inputMode="email"
              className="h-12 text-base"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Date *"
              error={form.formState.errors.dateRdv?.message}
            >
              <Input
                type="date"
                min={todayIso}
                {...form.register("dateRdv")}
                className="h-12 text-base"
              />
            </Field>

            <Field
              label="Heure *"
              error={form.formState.errors.heureRdv?.message}
            >
              <Input
                type="time"
                step="900"
                {...form.register("heureRdv")}
                className="h-12 text-base"
              />
            </Field>
          </div>

          <Field
            label="Type de RDV *"
            error={form.formState.errors.typeVisite?.message}
          >
            <Controller
              control={form.control}
              name="typeVisite"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v) => {
                    field.onChange(v);
                    setAutoDuree(true);
                  }}
                >
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_VISITES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t} ({DUREE_DEFAUT_PAR_TYPE[t]} min)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <Field
            label="Durée (min)"
            error={form.formState.errors.dureeMinutes?.message}
            hint={autoDuree ? "Auto selon le type" : "Personnalisée"}
          >
            <Input
              type="number"
              min={15}
              max={480}
              step={15}
              {...form.register("dureeMinutes", {
                onChange: () => setAutoDuree(false),
              })}
              className="h-12 text-base"
            />
          </Field>

          <Field
            label="Délai d'appel avant arrivée"
            error={form.formState.errors.delaiAppelMinutes?.message as string | undefined}
            hint={
              autoDelai
                ? "Suggéré selon le type — vous pouvez choisir une autre valeur ou laisser vide"
                : "Personnalisé — laissez vide pour ne pas l'indiquer au client"
            }
            icon={<Phone className="w-4 h-4" />}
          >
            <Controller
              control={form.control}
              name="delaiAppelMinutes"
              render={({ field }) => {
                const current =
                  typeof field.value === "number" ? field.value : null;
                return (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {DELAI_APPEL_PRESETS.map((p) => {
                        const active = current === p;
                        return (
                          <button
                            type="button"
                            key={p}
                            onClick={() => {
                              field.onChange(p);
                              setAutoDelai(false);
                            }}
                            className={`h-10 px-4 rounded-md border text-sm font-medium transition ${
                              active
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background border-border hover:border-primary/40"
                            }`}
                          >
                            {p} min
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => {
                          field.onChange("");
                          setAutoDelai(false);
                        }}
                        className={`h-10 px-4 rounded-md border text-sm font-medium transition ${
                          current === null
                            ? "bg-muted text-muted-foreground border-muted-foreground/30"
                            : "bg-background border-border hover:border-primary/40"
                        }`}
                      >
                        Aucun
                      </button>
                    </div>
                    <Input
                      type="number"
                      min={1}
                      max={240}
                      step={5}
                      inputMode="numeric"
                      placeholder="Ou valeur libre (ex: 20, 25, 90...)"
                      value={current === null ? "" : current}
                      onChange={(e) => {
                        const v = e.target.value;
                        field.onChange(v === "" ? "" : Number(v));
                        setAutoDelai(false);
                      }}
                      className="h-11 text-base"
                    />
                  </div>
                );
              }}
            />
          </Field>

          <Field
            label="Adresse du chantier"
            hint="Optionnel"
            icon={<MapPin className="w-4 h-4" />}
          >
            <Input
              {...form.register("address")}
              placeholder="Ex: Rue de la Station 12, 1490 Court-Saint-Étienne"
              autoComplete="street-address"
              className="h-12 text-base"
            />
          </Field>

          <Field label="Notes courtes" hint="Optionnel">
            <Textarea
              {...form.register("notes")}
              placeholder="Ex: Client a une vieille installation, prévoir multimètre"
              rows={3}
              className="text-base"
            />
          </Field>

          <Button
            type="submit"
            size="lg"
            className="w-full h-14 text-base font-semibold"
            disabled={createMut.isPending}
          >
            {createMut.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Enregistrement…
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Confirmer le RDV
              </>
            )}
          </Button>
        </form>
      </div>
    </AdminShell>
  );
};

interface FieldProps {
  label: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const Field = ({ label, error, hint, icon, children }: FieldProps) => (
  <div className="space-y-1.5">
    <Label className="flex items-center gap-1.5 text-sm font-medium">
      {icon && <span className="text-muted-foreground">{icon}</span>}
      {label}
    </Label>
    {children}
    {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
    {error && <p className="text-xs text-destructive">{error}</p>}
  </div>
);

interface SuccessScreenProps {
  summary: RdvSummary;
  onNew: () => void;
}

const SuccessScreen = ({ summary, onNew }: SuccessScreenProps) => {
  const dateFr = new Date(summary.dateRdv).toLocaleDateString("fr-BE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const calendarUrl = buildGoogleCalendarUrl({
    title: `${summary.typeVisite} – ${summary.name}`,
    date: summary.dateRdv,
    startTime: summary.heureRdv,
    durationMinutes: summary.dureeMinutes,
    description: `Client : ${summary.name}\nTéléphone : ${summary.phone}\nType : ${summary.typeVisite}${summary.address ? `\nAdresse : ${summary.address}` : ""}`,
    location: summary.address,
  });

  const messagePayload = {
    clientName: summary.name,
    dateIso: summary.dateRdv,
    heure: summary.heureRdv,
    typeVisite: summary.typeVisite,
    dureeMinutes: summary.dureeMinutes,
    address: summary.address,
    delaiAppelMinutes: summary.delaiAppelMinutes ?? null,
  };

  const smsHref = buildSmsHref(
    summary.phone,
    smsTemplateConfirmation(messagePayload),
  );
  const whatsappHref = buildWhatsappHref(
    summary.phone,
    whatsappTemplateConfirmation(messagePayload),
  );
  const mailtoHref = buildMailtoHref(
    summary.email,
    emailSubjectConfirmation(messagePayload),
    emailPlaintextConfirmation(messagePayload),
  );

  const copyEmailHtml = async () => {
    const html = emailHtmlConfirmation(messagePayload);
    try {
      // ClipboardItem permet de copier du HTML "vrai" dans le presse-papier
      // (Gmail/Outlook le collent stylé). Fallback texte si l'API n'existe pas.
      if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
        const blob = new Blob([html], { type: "text/html" });
        const text = new Blob([emailPlaintextConfirmation(messagePayload)], {
          type: "text/plain",
        });
        await navigator.clipboard.write([
          new ClipboardItem({ "text/html": blob, "text/plain": text }),
        ]);
      } else {
        await navigator.clipboard.writeText(html);
      }
      toast.success("Email HTML copié", {
        description: "Colle-le dans Gmail/Outlook (Ctrl+V) — il se collera stylé.",
      });
    } catch {
      toast.error("Copie impossible", {
        description: "Ton navigateur ne supporte pas la copie automatique.",
      });
    }
  };

  return (
    <AdminShell mobileTitle="RDV créé">
      <div className="p-4 md:p-6 max-w-xl mx-auto">
        <div className="flex items-center justify-center mb-6 mt-4">
          <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center">
            <CheckCircle2 className="w-9 h-9 text-primary" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center mb-2">RDV enregistré</h1>
        <p className="text-center text-muted-foreground mb-6">
          Lead créé et lié au RDV. Continue avec les actions ci-dessous.
        </p>

        <div className="bg-card border border-border rounded-xl p-4 mb-6 space-y-2">
          <div className="flex justify-between items-baseline">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              Client
            </span>
            <span className="font-semibold">{summary.name}</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              Téléphone
            </span>
            <a
              href={`tel:${summary.phone.replace(/\s/g, "")}`}
              className="font-mono text-sm text-primary hover:underline"
            >
              {summary.phone}
            </a>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              Quand
            </span>
            <span className="capitalize">
              {dateFr} à {summary.heureRdv}
            </span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              Type
            </span>
            <span>
              {summary.typeVisite} ({summary.dureeMinutes} min)
            </span>
          </div>
          {summary.email && (
            <div className="flex justify-between items-baseline gap-3">
              <span className="text-xs uppercase tracking-wider text-muted-foreground shrink-0">
                Email
              </span>
              <a
                href={`mailto:${summary.email}`}
                className="text-right text-sm text-primary hover:underline truncate"
              >
                {summary.email}
              </a>
            </div>
          )}
          {summary.address && (
            <div className="flex justify-between items-baseline gap-3">
              <span className="text-xs uppercase tracking-wider text-muted-foreground shrink-0">
                Adresse
              </span>
              <span className="text-right text-sm">{summary.address}</span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <Button
            asChild
            size="lg"
            className="w-full h-14 text-base font-semibold"
          >
            <a href={calendarUrl} target="_blank" rel="noopener noreferrer">
              <CalendarIcon className="w-5 h-5" />
              Ajouter à Google Calendar
            </a>
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-14 text-sm font-semibold border-primary/40 text-primary hover:bg-primary/10"
            >
              <a href={smsHref}>
                <MessageSquare className="w-5 h-5" />
                SMS
              </a>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-14 text-sm font-semibold border-primary/40 text-primary hover:bg-primary/10"
            >
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                <Send className="w-5 h-5" />
                WhatsApp
              </a>
            </Button>
          </div>

          {summary.email ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-14 text-sm font-semibold border-primary/40 text-primary hover:bg-primary/10"
                >
                  <a href={mailtoHref}>
                    <Mail className="w-5 h-5" />
                    Ouvrir email (texte)
                  </a>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={copyEmailHtml}
                  className="h-14 text-sm font-semibold border-primary/40 text-primary hover:bg-primary/10"
                >
                  <Copy className="w-5 h-5" />
                  Copier HTML stylé
                </Button>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed px-1">
                <strong>Ouvrir email</strong> ouvre l'app mail avec un texte
                propre (rapide).
                <br />
                <strong>Copier HTML</strong> copie la version stylée — colle-la
                dans Gmail/Outlook (Ctrl+V) pour un email pro avec mise en forme.
              </p>
            </div>
          ) : (
            <p className="text-xs text-center text-muted-foreground italic">
              Saisis l'email du client pour activer les boutons "Ouvrir email"
              et "Copier HTML" lors du prochain RDV.
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 mt-6">
          <Button variant="ghost" onClick={onNew}>
            <Plus className="w-4 h-4" />
            Nouveau RDV
          </Button>
          <Button variant="ghost" asChild>
            <Link to={`/admin/lead/${summary.leadId}`}>
              <ArrowLeft className="w-4 h-4" />
              Voir la fiche lead
            </Link>
          </Button>
        </div>
      </div>
    </AdminShell>
  );
};

export default RdvRapide;
