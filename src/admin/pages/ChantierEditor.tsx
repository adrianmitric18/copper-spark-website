import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import AdminLoading from "@/components/admin/AdminLoading";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  Save,
  Eye,
  EyeOff,
  Trash2,
  Plus,
  X,
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import TagInput from "@/admin/components/chantiers/TagInput";
import ImageUploader from "@/admin/components/chantiers/ImageUploader";
import ImageGalleryEditor from "@/admin/components/chantiers/ImageGalleryEditor";
import {
  fetchProjectByIdAdmin,
  fetchTakenSlugs,
  createProject,
  updateProject,
  unpublishProject,
  setProjectTags,
  addProjectImage,
  softDeleteProject,
  type ProjectInput,
} from "@/lib/chantiers/queries";
import { CHANTIER_ZONES, type ProjectFaqItem } from "@/lib/chantiers/types";
import { slugify, uniqueSlug } from "@/lib/chantiers/slug";

const projectSchema = z.object({
  title: z
    .string()
    .min(3, "Titre trop court (min 3 caractères)")
    .max(200, "Titre trop long (max 200)"),
  slug: z
    .string()
    .regex(
      /^[a-z0-9]+(-[a-z0-9]+)*$/,
      "Slug invalide (a-z, 0-9, tirets uniquement)",
    )
    .min(3, "Slug trop court")
    .max(100, "Slug trop long"),
  location: z.string().min(1, "Lieu requis"),
  zone: z.string().min(1, "Zone requise"),
  completed_at: z.string().min(1, "Date requise"),
  summary: z
    .string()
    .min(1, "Résumé requis")
    .max(500, "Résumé trop long (500 caractères max)"),
  story: z.string().optional(),
  duration_days: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
    z.number().int().positive().optional(),
  ),
  budget_range: z.string().optional(),
  meta_title: z.string().max(120).optional(),
  meta_description: z.string().max(300).optional(),
  faq: z
    .array(
      z.object({
        question: z.string().min(1, "Question requise"),
        answer: z.string().min(1, "Réponse requise"),
      }),
    )
    .optional(),
});

type FormValues = z.infer<typeof projectSchema>;

const ChantierEditor = () => {
  const { user, ready } = useAdminGuard();
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    document.title = isNew
      ? "Nouveau chantier – Le Cuivre Admin"
      : "Modifier chantier – Le Cuivre Admin";
  }, [isNew]);

  const { data: existing, isLoading } = useQuery({
    queryKey: ["chantier", id],
    queryFn: () => (id ? fetchProjectByIdAdmin(id) : Promise.resolve(null)),
    enabled: !isNew && ready,
  });

  const { data: takenSlugs } = useQuery({
    queryKey: ["chantiers", "slugs"],
    queryFn: fetchTakenSlugs,
    enabled: ready,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: "",
      slug: "",
      location: "",
      zone: "Brabant wallon",
      completed_at: new Date().toISOString().slice(0, 10),
      summary: "",
      story: "",
      duration_days: undefined,
      budget_range: "",
      meta_title: "",
      meta_description: "",
      faq: [],
    },
  });

  const [tags, setTags] = useState<string[]>([]);
  const [autoSlug, setAutoSlug] = useState(true);

  const {
    fields: faqFields,
    append: faqAppend,
    remove: faqRemove,
  } = useFieldArray({
    control: form.control,
    name: "faq",
  });

  // Hydrate le formulaire en édition
  useEffect(() => {
    if (existing) {
      form.reset({
        title: existing.project.title,
        slug: existing.project.slug,
        location: existing.project.location,
        zone: existing.project.zone,
        completed_at: existing.project.completed_at,
        summary: existing.project.summary,
        story: existing.project.story ?? "",
        duration_days: existing.project.duration_days ?? undefined,
        budget_range: existing.project.budget_range ?? "",
        meta_title: existing.project.meta_title ?? "",
        meta_description: existing.project.meta_description ?? "",
        faq: existing.project.faq ?? [],
      });
      setTags(existing.tags);
      setAutoSlug(false);
    }
  }, [existing, form]);

  // Auto-slug : régénère le slug à chaque changement de titre tant que
  // l'utilisateur n'a pas modifié le slug manuellement.
  const titleValue = form.watch("title");
  useEffect(() => {
    if (!autoSlug || !titleValue) return;
    const base = slugify(titleValue);
    if (!base) return;
    if (takenSlugs) {
      const taken = new Set(takenSlugs);
      if (existing) taken.delete(existing.project.slug);
      form.setValue("slug", uniqueSlug(base, taken));
    } else {
      form.setValue("slug", base);
    }
  }, [titleValue, autoSlug, takenSlugs, existing, form]);

  const buildInput = (values: FormValues, publish: boolean): ProjectInput => ({
    title: values.title,
    slug: values.slug,
    location: values.location,
    zone: values.zone,
    completed_at: values.completed_at,
    summary: values.summary,
    story: values.story?.trim() || null,
    duration_days: values.duration_days ?? null,
    budget_range: values.budget_range?.trim() || null,
    meta_title: values.meta_title?.trim() || null,
    meta_description: values.meta_description?.trim() || null,
    faq:
      values.faq && values.faq.length > 0
        ? (values.faq as ProjectFaqItem[])
        : null,
    status: publish
      ? "published"
      : (existing?.project.status ?? "draft"),
  });

  const saveMut = useMutation({
    mutationFn: async ({
      values,
      publish,
    }: {
      values: FormValues;
      publish: boolean;
    }) => {
      const input = buildInput(values, publish);
      if (isNew) {
        const created = await createProject(input);
        await setProjectTags(created.id, tags);
        return { project: created, justCreated: true };
      }
      const updated = await updateProject(id!, input);
      await setProjectTags(id!, tags);
      return { project: updated, justCreated: false };
    },
    onSuccess: ({ project, justCreated }) => {
      qc.invalidateQueries({ queryKey: ["chantiers"] });
      qc.invalidateQueries({ queryKey: ["chantier", project.id] });
      qc.invalidateQueries({ queryKey: ["chantiers", "slugs"] });
      toast.success(
        justCreated ? "Chantier créé" : "Modifications enregistrées",
      );
      if (justCreated) navigate(`/admin/chantiers/${project.id}`);
    },
    onError: (e: Error) =>
      toast.error("Échec sauvegarde", { description: e.message }),
  });

  const deleteMut = useMutation({
    mutationFn: () => softDeleteProject(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chantiers"] });
      toast.success("Chantier mis à la corbeille");
      navigate("/admin/chantiers");
    },
    onError: (e: Error) =>
      toast.error("Échec suppression", { description: e.message }),
  });

  const unpublishMut = useMutation({
    mutationFn: () => unpublishProject(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chantiers"] });
      qc.invalidateQueries({ queryKey: ["chantier", id] });
      toast.success("Chantier dépublié");
    },
    onError: (e: Error) =>
      toast.error("Échec dépublication", { description: e.message }),
  });

  const uploadMut = useMutation({
    mutationFn: async (params: {
      project_id: string;
      storage_path: string;
      width: number;
      height: number;
    }) => {
      const isFirstImage =
        !existing?.images || existing.images.length === 0;
      return addProjectImage({
        ...params,
        sort_order: existing?.images.length ?? 0,
        is_cover: isFirstImage,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chantier", id] });
    },
    onError: (e: Error) =>
      toast.error("Erreur enregistrement image", { description: e.message }),
  });

  const onSaveDraft = form.handleSubmit((values) =>
    saveMut.mutate({ values, publish: false }),
  );
  const onSaveAndPublish = form.handleSubmit((values) =>
    saveMut.mutate({ values, publish: true }),
  );

  if (!ready || !user) return <AdminLoading />;

  if (isLoading && !isNew) {
    return (
      <AdminShell mobileTitle="Chantier">
        <div className="p-6 text-muted-foreground">Chargement…</div>
      </AdminShell>
    );
  }

  if (!isNew && !existing) {
    return (
      <AdminShell mobileTitle="Chantier">
        <div className="p-6">
          <p className="text-destructive mb-3">Chantier introuvable.</p>
          <Button variant="outline" asChild>
            <Link to="/admin/chantiers">Retour à la liste</Link>
          </Button>
        </div>
      </AdminShell>
    );
  }

  const isPublished = existing?.project.status === "published";
  const inTrash = !!existing?.project.deleted_at;

  return (
    <AdminShell
      mobileTitle={isNew ? "Nouveau chantier" : existing!.project.title}
    >
      <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6 pb-32">
        <div className="flex items-center justify-between gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/chantiers">
              <ArrowLeft className="w-4 h-4" /> Retour
            </Link>
          </Button>
          {!isNew && existing && !inTrash && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (window.confirm("Mettre ce chantier à la corbeille ?")) {
                  deleteMut.mutate();
                }
              }}
              className="text-destructive"
            >
              <Trash2 className="w-4 h-4" />
              Corbeille
            </Button>
          )}
        </div>

        <div>
          <h1 className="text-2xl font-bold">
            {isNew ? "Nouveau chantier" : existing!.project.title}
          </h1>
          {!isNew && existing && (
            <p className="text-sm text-muted-foreground">
              Statut :{" "}
              {inTrash
                ? "Corbeille"
                : isPublished
                  ? "Publié"
                  : "Brouillon"}{" "}
              • Modifié le{" "}
              {new Date(existing.project.updated_at).toLocaleDateString(
                "fr-BE",
              )}
            </p>
          )}
        </div>

        <form onSubmit={onSaveDraft} className="space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <FormField
              label="Titre du chantier *"
              error={form.formState.errors.title?.message}
            >
              <Input
                {...form.register("title")}
                placeholder="Ex: 4 bornes Hager Witty Pro"
              />
            </FormField>
            <FormField
              label="Slug URL *"
              error={form.formState.errors.slug?.message}
              hint={
                autoSlug
                  ? "Généré automatiquement depuis le titre"
                  : "Personnalisé"
              }
            >
              <div className="flex gap-2">
                <Input
                  {...form.register("slug", {
                    onChange: () => setAutoSlug(false),
                  })}
                  className="font-mono text-sm"
                />
                {!autoSlug && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAutoSlug(true)}
                    title="Régénérer automatiquement"
                  >
                    Auto
                  </Button>
                )}
              </div>
            </FormField>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <FormField
              label="Lieu *"
              error={form.formState.errors.location?.message}
            >
              <Input
                {...form.register("location")}
                placeholder="Ex: Court-Saint-Étienne"
              />
            </FormField>
            <FormField
              label="Zone *"
              error={form.formState.errors.zone?.message}
            >
              <Controller
                control={form.control}
                name="zone"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CHANTIER_ZONES.map((z) => (
                        <SelectItem key={z} value={z}>
                          {z}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
            <FormField
              label="Date du chantier *"
              error={form.formState.errors.completed_at?.message}
            >
              <Input type="date" {...form.register("completed_at")} />
            </FormField>
          </div>

          <FormField
            label="Résumé court (1-2 lignes) *"
            error={form.formState.errors.summary?.message}
            hint="Visible sur la grille publique des chantiers"
          >
            <Textarea
              {...form.register("summary")}
              placeholder="Ce que tu as fait en quelques mots…"
              rows={2}
            />
          </FormField>

          <FormField
            label="Tags"
            hint="Tape pour suggérer ou Entrée pour créer un nouveau tag"
          >
            <TagInput value={tags} onChange={setTags} />
          </FormField>

          {!isNew && existing && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                Photos du chantier
              </Label>
              <ImageUploader
                projectId={existing.project.id}
                onUploaded={(img) =>
                  uploadMut.mutate({
                    project_id: existing.project.id,
                    storage_path: img.storagePath,
                    width: img.width,
                    height: img.height,
                  })
                }
              />
              <ImageGalleryEditor
                projectId={existing.project.id}
                images={existing.images}
                onChange={() =>
                  qc.invalidateQueries({ queryKey: ["chantier", id] })
                }
              />
            </div>
          )}

          {isNew && (
            <p className="text-xs text-muted-foreground italic">
              Les photos pourront être ajoutées après la première sauvegarde du
              chantier.
            </p>
          )}

          <Accordion
            type="single"
            collapsible
            className="border border-border rounded-lg px-4"
          >
            <AccordionItem value="details" className="border-none">
              <AccordionTrigger className="text-sm font-medium">
                Détails du chantier (optionnel) — récit, FAQ, durée, budget,
                SEO
              </AccordionTrigger>
              <AccordionContent className="space-y-5 pb-4">
                <FormField
                  label="Récit (Markdown supporté)"
                  hint="Le rendu Markdown sera disponible côté front public en Phase 2"
                >
                  <Textarea
                    {...form.register("story")}
                    rows={10}
                    className="font-mono text-sm"
                    placeholder="Décris le chantier en détail…"
                  />
                </FormField>

                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    label="Durée (jours)"
                    error={form.formState.errors.duration_days?.message}
                  >
                    <Input
                      type="number"
                      min="1"
                      {...form.register("duration_days")}
                    />
                  </FormField>
                  <FormField label="Budget" hint="Ex: 2-5k€">
                    <Input {...form.register("budget_range")} />
                  </FormField>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>FAQ</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => faqAppend({ question: "", answer: "" })}
                    >
                      <Plus className="w-4 h-4" />
                      Ajouter une question
                    </Button>
                  </div>
                  {faqFields.map((field, idx) => (
                    <div
                      key={field.id}
                      className="border border-border rounded p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Q{idx + 1}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => faqRemove(idx)}
                          aria-label="Retirer cette question"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <Input
                        {...form.register(`faq.${idx}.question`)}
                        placeholder="Question"
                      />
                      <Textarea
                        {...form.register(`faq.${idx}.answer`)}
                        placeholder="Réponse"
                        rows={3}
                      />
                    </div>
                  ))}
                </div>

                <FormField
                  label="Meta titre (SEO)"
                  hint="Override du titre dans Google. Vide = on garde le titre."
                  error={form.formState.errors.meta_title?.message}
                >
                  <Input {...form.register("meta_title")} maxLength={120} />
                </FormField>
                <FormField
                  label="Meta description (SEO)"
                  hint="160 caractères recommandés"
                  error={form.formState.errors.meta_description?.message}
                >
                  <Textarea
                    {...form.register("meta_description")}
                    rows={2}
                    maxLength={300}
                  />
                </FormField>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Barre d'actions sticky */}
          <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-background/95 backdrop-blur border-t border-border px-4 md:px-6 py-3 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end z-20">
            <Button
              type="submit"
              variant="outline"
              disabled={saveMut.isPending}
            >
              <Save className="w-4 h-4" />
              {isNew ? "Créer le brouillon" : "Enregistrer"}
            </Button>
            {!isNew &&
              (isPublished ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => unpublishMut.mutate()}
                  disabled={unpublishMut.isPending}
                >
                  <EyeOff className="w-4 h-4" />
                  Dépublier
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={onSaveAndPublish}
                  disabled={saveMut.isPending}
                >
                  <Eye className="w-4 h-4" />
                  Enregistrer et publier
                </Button>
              ))}
            {isNew && (
              <Button
                type="button"
                onClick={onSaveAndPublish}
                disabled={saveMut.isPending}
              >
                <Eye className="w-4 h-4" />
                Créer et publier
              </Button>
            )}
          </div>
        </form>
      </div>
    </AdminShell>
  );
};

interface FormFieldProps {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}

const FormField = ({ label, error, hint, children }: FormFieldProps) => (
  <div className="space-y-1.5">
    <Label>{label}</Label>
    {children}
    {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
    {error && <p className="text-xs text-destructive">{error}</p>}
  </div>
);

export default ChantierEditor;
