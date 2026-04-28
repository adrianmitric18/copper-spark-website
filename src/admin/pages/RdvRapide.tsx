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
  type TypeVisite,
} from "@/lib/admin/rdv-rapide";
import { buildGoogleCalendarUrl } from "@/lib/admin/google-calendar-link";
import {
  smsTemplateConfirmationRdv,
  buildSmsHref,
} from "@/lib/admin/sms-templates";

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
  dateRdv: z.string().min(1, "Date requise"),
  heureRdv: z.string().min(1, "Heure requise"),
  typeVisite: z.enum(TYPE_VISITES),
  dureeMinutes: z.coerce.number().int().min(15).max(480),
  address: z.string().max(300).optional(),
  notes: z.string().max(1000).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface RdvSummary {
  name: string;
  phone: string;
  dateRdv: string;
  heureRdv: string;
  typeVisite: TypeVisite;
  dureeMinutes: number;
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
      dateRdv: todayIso,
      heureRdv: "10:00",
      typeVisite: "Devis",
      dureeMinutes: 60,
      address: "",
      notes: "",
    },
  });

  // Auto-suggère la durée selon le type sélectionné, tant que l'utilisateur
  // n'a pas modifié manuellement la durée.
  const [autoDuree, setAutoDuree] = useState(true);
  const typeVisiteWatch = form.watch("typeVisite");
  useEffect(() => {
    if (autoDuree && typeVisiteWatch) {
      form.setValue("dureeMinutes", DUREE_DEFAUT_PAR_TYPE[typeVisiteWatch]);
    }
  }, [typeVisiteWatch, autoDuree, form]);

  const createMut = useMutation({
    mutationFn: createRdvRapide,
    onSuccess: (res, vars) => {
      setSuccess({
        name: vars.name,
        phone: vars.phone,
        dateRdv: vars.dateRdv,
        heureRdv: vars.heureRdv,
        typeVisite: vars.typeVisite,
        dureeMinutes: vars.dureeMinutes,
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
    createMut.mutate({
      name: values.name,
      phone: values.phone,
      dateRdv: values.dateRdv,
      heureRdv: values.heureRdv,
      typeVisite: values.typeVisite,
      dureeMinutes: values.dureeMinutes,
      address: values.address,
      notes: values.notes,
    });
  };

  const resetForm = () => {
    setSuccess(null);
    form.reset({
      name: "",
      phone: "",
      dateRdv: todayIso,
      heureRdv: "10:00",
      typeVisite: "Devis",
      dureeMinutes: 60,
      address: "",
      notes: "",
    });
    setAutoDuree(true);
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

  const smsMessage = smsTemplateConfirmationRdv({
    clientName: summary.name,
    dateIso: summary.dateRdv,
    heure: summary.heureRdv,
    typeVisite: summary.typeVisite,
    address: summary.address,
  });
  const smsHref = buildSmsHref(summary.phone, smsMessage);

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
            <a
              href={calendarUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <CalendarIcon className="w-5 h-5" />
              Ajouter à Google Calendar
            </a>
          </Button>

          <Button
            asChild
            variant="outline"
            size="lg"
            className="w-full h-14 text-base font-semibold border-primary/40 text-primary hover:bg-primary/10"
          >
            <a href={smsHref}>
              <MessageSquare className="w-5 h-5" />
              Envoyer SMS au client
            </a>
          </Button>
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
