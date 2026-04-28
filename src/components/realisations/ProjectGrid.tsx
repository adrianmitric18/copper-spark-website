import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import ProjectCard from "./ProjectCard";
import ProjectFilters from "./ProjectFilters";
import { fetchPublishedProjectsWithMeta } from "@/lib/chantiers/queries";

const ProjectGrid = () => {
  const [params, setParams] = useSearchParams();

  const search = params.get("q") ?? "";
  const selectedTags = params.getAll("tag");
  const selectedZones = params.getAll("zone");

  const updateParams = (next: URLSearchParams) => {
    setParams(next, { replace: false });
  };

  const onSearchChange = (v: string) => {
    const next = new URLSearchParams(params);
    if (v) next.set("q", v);
    else next.delete("q");
    updateParams(next);
  };

  const onToggleTag = (tag: string) => {
    const next = new URLSearchParams(params);
    const current = next.getAll("tag");
    next.delete("tag");
    if (current.includes(tag)) {
      current.filter((t) => t !== tag).forEach((t) => next.append("tag", t));
    } else {
      [...current, tag].forEach((t) => next.append("tag", t));
    }
    updateParams(next);
  };

  const onToggleZone = (zone: string) => {
    const next = new URLSearchParams(params);
    const current = next.getAll("zone");
    next.delete("zone");
    if (current.includes(zone)) {
      current.filter((z) => z !== zone).forEach((z) => next.append("zone", z));
    } else {
      [...current, zone].forEach((z) => next.append("zone", z));
    }
    updateParams(next);
  };

  const onClearAll = () => {
    setParams(new URLSearchParams(), { replace: false });
  };

  const { data: projects = [], isLoading, error } = useQuery({
    queryKey: ["public-chantiers"],
    queryFn: fetchPublishedProjectsWithMeta,
    staleTime: 60_000,
  });

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !p.title.toLowerCase().includes(q) &&
          !p.location.toLowerCase().includes(q) &&
          !p.summary.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      if (
        selectedTags.length > 0 &&
        !selectedTags.some((t) => p.tags.includes(t))
      ) {
        return false;
      }
      if (selectedZones.length > 0 && !selectedZones.includes(p.zone)) {
        return false;
      }
      return true;
    });
  }, [projects, search, selectedTags, selectedZones]);

  if (error) {
    return (
      <p className="text-center text-destructive py-12">
        Une erreur est survenue lors du chargement des réalisations. Réessaie
        plus tard.
      </p>
    );
  }

  return (
    <div>
      <ProjectFilters
        search={search}
        onSearchChange={onSearchChange}
        selectedTags={selectedTags}
        onToggleTag={onToggleTag}
        selectedZones={selectedZones}
        onToggleZone={onToggleZone}
        onClearAll={onClearAll}
        resultsCount={filtered.length}
        totalCount={projects.length}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-10 h-10 animate-spin text-copper" />
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 px-6 bg-cream/40 border border-dashed border-cream-dark/50 rounded-2xl max-w-2xl mx-auto">
          <p className="font-display text-2xl font-bold mb-2">
            Bientôt nos premiers chantiers
          </p>
          <p className="text-muted-foreground">
            Le portfolio est en cours de constitution. Vous pouvez nous
            contacter dès maintenant pour parler de votre projet.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 px-6 border border-dashed border-cream-dark/50 rounded-2xl">
          <p className="font-medium text-lg">
            Aucun chantier ne correspond à ces critères.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Retire un filtre ou contacte-nous pour discuter d'un projet
            similaire.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-7">
          {filtered.map((p) => (
            <ProjectCard
              key={p.id}
              slug={p.slug}
              title={p.title}
              location={p.location}
              zone={p.zone}
              completedAt={p.completed_at}
              summary={p.summary}
              cover={p.cover}
              fallbackImage={p.fallbackImage}
              tags={p.tags}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectGrid;
