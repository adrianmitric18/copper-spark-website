import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Edit,
  Eye,
  EyeOff,
  Trash2,
  RotateCcw,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import AdminShell from "@/admin/layout/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  fetchAllProjectsWithMetaAdmin,
  publishProject,
  unpublishProject,
  softDeleteProject,
  restoreProject,
  type ProjectWithMeta,
} from "@/lib/chantiers/queries";
import { CHANTIER_TAGS, CHANTIER_ZONES } from "@/lib/chantiers/types";
import { getChantierImageUrl } from "@/lib/chantiers/upload";

type StatusFilter = "all" | "published" | "draft" | "trash";

const Chantiers = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [zoneFilter, setZoneFilter] = useState<string[]>([]);

  const {
    data: projects = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["chantiers"],
    queryFn: fetchAllProjectsWithMetaAdmin,
  });

  const counts = useMemo(() => {
    let pub = 0;
    let draft = 0;
    let trash = 0;
    for (const p of projects) {
      if (p.deleted_at) trash += 1;
      else if (p.status === "published") pub += 1;
      else draft += 1;
    }
    return { all: pub + draft, published: pub, draft, trash };
  }, [projects]);

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (statusFilter === "trash") {
        if (!p.deleted_at) return false;
      } else {
        if (p.deleted_at) return false;
        if (statusFilter === "published" && p.status !== "published") return false;
        if (statusFilter === "draft" && p.status !== "draft") return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !p.title.toLowerCase().includes(q) &&
          !p.location.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      if (tagFilter.length > 0 && !tagFilter.some((t) => p.tags.includes(t))) {
        return false;
      }
      if (zoneFilter.length > 0 && !zoneFilter.includes(p.zone)) {
        return false;
      }
      return true;
    });
  }, [projects, statusFilter, search, tagFilter, zoneFilter]);

  const publishMut = useMutation({
    mutationFn: publishProject,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chantiers"] });
      toast.success("Chantier publié");
    },
    onError: (e: Error) =>
      toast.error("Échec publication", { description: e.message }),
  });
  const unpublishMut = useMutation({
    mutationFn: unpublishProject,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chantiers"] });
      toast.success("Chantier dépublié");
    },
    onError: (e: Error) =>
      toast.error("Échec dépublication", { description: e.message }),
  });
  const deleteMut = useMutation({
    mutationFn: softDeleteProject,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chantiers"] });
      toast.success("Chantier mis à la corbeille");
    },
    onError: (e: Error) =>
      toast.error("Échec suppression", { description: e.message }),
  });
  const restoreMut = useMutation({
    mutationFn: restoreProject,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["chantiers"] });
      if (res.slugChanged) {
        toast.success("Chantier restauré", {
          description: `Slug renommé en "${res.slug}" pour éviter un conflit.`,
        });
      } else {
        toast.success("Chantier restauré");
      }
    },
    onError: (e: Error) =>
      toast.error("Échec restauration", { description: e.message }),
  });

  const toggleTag = (tag: string) => {
    setTagFilter((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };
  const toggleZone = (zone: string) => {
    setZoneFilter((prev) =>
      prev.includes(zone) ? prev.filter((z) => z !== zone) : [...prev, zone],
    );
  };

  return (
    <AdminShell mobileTitle="Réalisations">
      <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">Réalisations</h1>
            <p className="text-sm text-muted-foreground">
              {counts.all} chantiers actifs · {counts.trash} dans la corbeille
            </p>
          </div>
          <Button asChild>
            <Link to="/admin/chantiers/nouveau">
              <Plus className="w-4 h-4" />
              Nouveau chantier
            </Link>
          </Button>
        </div>

        {/* Filtres */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par titre ou lieu…"
              className="pl-9"
            />
          </div>

          <Tabs
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as StatusFilter)}
          >
            <TabsList>
              <TabsTrigger value="all">Tous · {counts.all}</TabsTrigger>
              <TabsTrigger value="published">
                Publiés · {counts.published}
              </TabsTrigger>
              <TabsTrigger value="draft">Brouillons · {counts.draft}</TabsTrigger>
              <TabsTrigger value="trash">Corbeille · {counts.trash}</TabsTrigger>
            </TabsList>
          </Tabs>

          <details className="group">
            <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground select-none">
              Filtres avancés (tags, zones)
            </summary>
            <div className="mt-3 space-y-3">
              <div>
                <p className="text-xs font-semibold mb-1.5 text-muted-foreground">
                  Tags
                </p>
                <div className="flex flex-wrap gap-2">
                  {CHANTIER_TAGS.map((tag) => {
                    const active = tagFilter.includes(tag);
                    return (
                      <Badge
                        key={tag}
                        variant={active ? "default" : "outline"}
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => toggleTag(tag)}
                      >
                        {tag}
                      </Badge>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold mb-1.5 text-muted-foreground">
                  Zones
                </p>
                <div className="flex flex-wrap gap-2">
                  {CHANTIER_ZONES.map((zone) => {
                    const active = zoneFilter.includes(zone);
                    return (
                      <Badge
                        key={zone}
                        variant={active ? "default" : "outline"}
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => toggleZone(zone)}
                      >
                        {zone}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </div>
          </details>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Cover</TableHead>
                <TableHead>Titre</TableHead>
                <TableHead className="hidden md:table-cell">Lieu</TableHead>
                <TableHead className="hidden md:table-cell">Zone</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="hidden lg:table-cell">Tags</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Chargement…
                  </TableCell>
                </TableRow>
              )}
              {error && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-destructive"
                  >
                    Erreur de chargement : {(error as Error).message}
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && !error && filtered.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Aucun chantier ne correspond aux filtres.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((p) => (
                <ChantierRow
                  key={p.id}
                  project={p}
                  onPublish={() => publishMut.mutate(p.id)}
                  onUnpublish={() => unpublishMut.mutate(p.id)}
                  onDelete={() => {
                    if (
                      window.confirm(`Mettre "${p.title}" à la corbeille ?`)
                    ) {
                      deleteMut.mutate(p.id);
                    }
                  }}
                  onRestore={() => restoreMut.mutate(p.id)}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminShell>
  );
};

interface ChantierRowProps {
  project: ProjectWithMeta;
  onPublish: () => void;
  onUnpublish: () => void;
  onDelete: () => void;
  onRestore: () => void;
}

const ChantierRow = ({
  project,
  onPublish,
  onUnpublish,
  onDelete,
  onRestore,
}: ChantierRowProps) => {
  const inTrash = !!project.deleted_at;
  const dateStr = new Date(project.completed_at).toLocaleDateString("fr-BE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  return (
    <TableRow className={inTrash ? "opacity-60" : undefined}>
      <TableCell>
        {project.cover ? (
          <img
            src={getChantierImageUrl(project.cover.storage_path)}
            alt=""
            className="w-14 h-14 object-cover rounded"
            loading="lazy"
          />
        ) : (
          <div className="w-14 h-14 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
            —
          </div>
        )}
      </TableCell>
      <TableCell className="font-medium">
        <Link
          to={`/admin/chantiers/${project.id}`}
          className="hover:underline"
        >
          {project.title}
        </Link>
      </TableCell>
      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
        {project.location}
      </TableCell>
      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
        {project.zone}
      </TableCell>
      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
        {dateStr}
      </TableCell>
      <TableCell>
        {inTrash ? (
          <Badge variant="destructive">Corbeille</Badge>
        ) : project.status === "published" ? (
          <Badge>Publié</Badge>
        ) : (
          <Badge variant="outline">Brouillon</Badge>
        )}
      </TableCell>
      <TableCell className="hidden lg:table-cell">
        <div className="flex flex-wrap gap-1">
          {project.tags.slice(0, 3).map((t) => (
            <Badge key={t} variant="secondary" className="text-[10px]">
              {t}
            </Badge>
          ))}
          {project.tags.length > 3 && (
            <Badge variant="secondary" className="text-[10px]">
              +{project.tags.length - 3}
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="inline-flex gap-1">
          {inTrash ? (
            <Button
              size="sm"
              variant="outline"
              onClick={onRestore}
              title="Restaurer"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          ) : (
            <>
              <Button size="sm" variant="outline" asChild title="Éditer">
                <Link to={`/admin/chantiers/${project.id}`}>
                  <Edit className="w-4 h-4" />
                </Link>
              </Button>
              {project.status === "published" ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onUnpublish}
                  title="Dépublier"
                >
                  <EyeOff className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onPublish}
                  title="Publier"
                >
                  <Eye className="w-4 h-4" />
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={onDelete}
                title="Mettre à la corbeille"
                className="text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};

export default Chantiers;
