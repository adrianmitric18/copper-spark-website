import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Loader2,
  Package,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import AdminShell from "@/admin/layout/AdminShell";
import { Button } from "@/components/ui/button";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import AdminLoading from "@/components/admin/AdminLoading";
import { categories } from "@/data/galleryData";
import {
  createProject,
  setProjectTags,
  addProjectImage,
  publishProject,
} from "@/lib/chantiers/queries";
import { uploadChantierImage } from "@/lib/chantiers/upload";

interface ArchivePlan {
  categoryId: string;
  archiveSlug: string;
  title: string;
  summary: string;
  tag: string;
  publishAfter: boolean;
}

const ARCHIVE_PLANS: ArchivePlan[] = [
  {
    categoryId: "tableaux",
    archiveSlug: "archives-tableaux-et-prises",
    title: "Archives — Tableaux et prises",
    summary:
      "Sélection de tableaux électriques RGIE et prises design réalisés en Brabant wallon et Bruxelles.",
    tag: "Rénovation tableau électrique",
    publishAfter: true,
  },
  {
    categoryId: "eclairage",
    archiveSlug: "archives-ambiances-lumineuses",
    title: "Archives — Ambiances lumineuses",
    summary:
      "Installations LED sur mesure, faux-plafonds et éclairages indirect pour particuliers et professionnels.",
    tag: "Éclairage LED",
    publishAfter: false,
  },
  {
    categoryId: "reseaux",
    archiveSlug: "archives-installation-reseaux",
    title: "Archives — Installation réseaux",
    summary:
      "Baies de brassage, câblage VDI et systèmes de visiophonie.",
    tag: "Réseau / VDI",
    publishAfter: false,
  },
  {
    categoryId: "noel",
    archiveSlug: "archives-decoration-de-noel",
    title: "Archives — Décoration de Noël",
    summary:
      "Illuminations de fêtes pour façades, centres commerciaux et espaces publics.",
    tag: "Décoration de Noël",
    publishAfter: false,
  },
  {
    categoryId: "bornes-de-recharge",
    archiveSlug: "archives-bornes-de-recharge",
    title: "Archives — Bornes de recharge VE",
    summary:
      "Installations de bornes Hager Witty Pro et sous-tableaux dédiés pour véhicules électriques en Brabant wallon.",
    tag: "Bornes de recharge VE",
    publishAfter: true,
  },
];

const ImportArchives = () => {
  const { user, ready } = useAdminGuard();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [logs, setLogs] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    document.title = "Import archives – Le Cuivre Admin";
  }, []);

  const log = (msg: string) => {
    setLogs((prev) => [...prev, msg]);
  };

  const totalPhotos = ARCHIVE_PLANS.reduce((acc, plan) => {
    const cat = categories.find((c) => c.id === plan.categoryId);
    return acc + (cat?.images.length ?? 0);
  }, 0);

  const importMut = useMutation({
    mutationFn: async () => {
      setLogs([]);

      for (const plan of ARCHIVE_PLANS) {
        const cat = categories.find((c) => c.id === plan.categoryId);
        if (!cat) {
          log(`⚠ Catégorie introuvable : ${plan.categoryId}`);
          continue;
        }

        log(`▸ ${plan.title} — ${cat.images.length} photo(s)`);

        const project = await createProject({
          slug: plan.archiveSlug,
          title: plan.title,
          location: "Brabant wallon",
          zone: "Brabant wallon",
          completed_at: new Date().toISOString().slice(0, 10),
          summary: plan.summary,
          status: "draft",
        });
        log(`  ✓ chantier créé`);

        await setProjectTags(project.id, [plan.tag]);
        log(`  ✓ tag : ${plan.tag}`);

        for (let i = 0; i < cat.images.length; i++) {
          const img = cat.images[i];
          try {
            const response = await fetch(img.image);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const blob = await response.blob();
            const file = new File(
              [blob],
              `${plan.categoryId}-${String(i + 1).padStart(2, "0")}.jpg`,
              { type: blob.type || "image/jpeg" },
            );

            const uploaded = await uploadChantierImage(project.id, file);
            await addProjectImage({
              project_id: project.id,
              storage_path: uploaded.storagePath,
              width: uploaded.width,
              height: uploaded.height,
              caption: img.title,
              kind: "photo",
              sort_order: i,
              is_cover: i === 0,
            });
          } catch (err) {
            const msg = err instanceof Error ? err.message : "erreur inconnue";
            log(`  ⚠ photo ${i + 1} ("${img.title}") : ${msg}`);
          }
        }
        log(`  ✓ ${cat.images.length} photo(s) uploadée(s)`);

        if (plan.publishAfter) {
          await publishProject(project.id);
          log(`  ★ publié comme vitrine`);
        }
      }

      log("");
      log("✓ Import terminé.");
    },
    onSuccess: () => {
      setDone(true);
      qc.invalidateQueries({ queryKey: ["chantiers"] });
      qc.invalidateQueries({ queryKey: ["public-chantiers"] });
      toast.success("Import archives terminé", {
        description: "5 chantiers créés, 2 publiés en vitrine.",
      });
    },
    onError: (e: Error) => {
      log(`✗ ERREUR : ${e.message}`);
      toast.error("Échec de l'import", { description: e.message });
    },
  });

  if (!ready || !user) return <AdminLoading />;

  return (
    <AdminShell mobileTitle="Import archives">
      <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
        <div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/chantiers">
              <ArrowLeft className="w-4 h-4" />
              Retour aux chantiers
            </Link>
          </Button>
        </div>

        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6 text-primary" />
            Import des archives
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Migre les {totalPhotos} photos historiques de{" "}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">
              src/assets/gallery
            </code>{" "}
            vers Supabase Storage en {ARCHIVE_PLANS.length} chantiers archives.
          </p>
        </div>

        <div className="border border-border rounded-lg p-5 bg-card space-y-3">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Plan d'import
          </h2>
          <ul className="space-y-2 text-sm">
            {ARCHIVE_PLANS.map((plan) => {
              const cat = categories.find((c) => c.id === plan.categoryId);
              return (
                <li
                  key={plan.archiveSlug}
                  className="flex items-start justify-between gap-3 py-2 border-b border-border last:border-0"
                >
                  <div className="flex-1">
                    <p className="font-medium">{plan.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {cat?.images.length ?? 0} photo(s) · tag :{" "}
                      <span className="text-foreground/80">{plan.tag}</span>
                    </p>
                  </div>
                  {plan.publishAfter ? (
                    <span className="shrink-0 inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full bg-primary text-primary-foreground">
                      <Sparkles className="w-3 h-3" />
                      Publié
                    </span>
                  ) : (
                    <span className="shrink-0 inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-medium px-2 py-1 rounded-full bg-muted text-muted-foreground">
                      Brouillon
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="border border-amber-500/30 bg-amber-500/5 rounded-lg p-4 text-sm">
          <p className="font-semibold flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Avant de cliquer
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-0.5 ml-1">
            <li>L'import prend ~3 à 5 minutes selon ta connexion.</li>
            <li>
              Si tu as déjà cliqué et que les chantiers existent (slugs{" "}
              <code className="text-xs">archives-…</code>), un re-clic
              échouera sur la contrainte d'unicité du slug — c'est normal.
            </li>
            <li>
              Tu peux fermer/ouvrir cette page sans problème, mais ne quitte
              pas pendant l'upload (sinon il s'arrête).
            </li>
          </ul>
        </div>

        {!done ? (
          <Button
            onClick={() => importMut.mutate()}
            disabled={importMut.isPending}
            size="lg"
            className="w-full"
          >
            {importMut.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Import en cours…
              </>
            ) : (
              <>
                <Package className="w-4 h-4" />
                Lancer l'import des {totalPhotos} photos
              </>
            )}
          </Button>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-green-600 font-semibold">
              <CheckCircle2 className="w-5 h-5" />
              Import terminé. Tu peux retourner sur les chantiers.
            </div>
            <Button onClick={() => navigate("/admin/chantiers")} size="lg">
              Voir les chantiers importés
            </Button>
          </div>
        )}

        {logs.length > 0 && (
          <div className="border border-border rounded-lg bg-muted/30">
            <div className="px-4 py-2 border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Journal
            </div>
            <pre className="p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap max-h-96 overflow-y-auto">
              {logs.join("\n")}
            </pre>
          </div>
        )}
      </div>
    </AdminShell>
  );
};

export default ImportArchives;
