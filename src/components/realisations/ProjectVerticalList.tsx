import { Link } from "react-router-dom";
import { MapPin, ArrowRight, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchPublishedProjectsWithMeta } from "@/lib/chantiers/queries";
import { getChantierImageUrl } from "@/lib/chantiers/upload";
import { SNAPSHOT_UPDATED_AT, snapshotProjectsWithMeta } from "@/lib/chantiers/snapshot";

/**
 * Liste verticale des chantiers — un par bloc (brief 2026-05-01).
 * Alternance photo gauche / droite pour rythmer la lecture.
 *
 * Données initiales = snapshot du build (virtual:realisations) : la liste est
 * complète dans le HTML pré-rendu et le visiteur ne voit pas de spinner ;
 * React Query rafraîchit ensuite depuis Supabase. Aucun chantier fictif n'est
 * affiché : si la base est vide, un simple message le dit.
 */

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-BE", {
    month: "long",
    year: "numeric",
  });

const ProjectVerticalList = () => {
  const initial = snapshotProjectsWithMeta();
  const { data: projects = [], isLoading, error } = useQuery({
    queryKey: ["public-chantiers-vertical"],
    queryFn: fetchPublishedProjectsWithMeta,
    staleTime: 60_000,
    initialData: initial,
    initialDataUpdatedAt: initial ? SNAPSHOT_UPDATED_AT : undefined,
  });

  // Une erreur réseau n'efface pas une liste déjà affichée depuis le snapshot.
  if (error && projects.length === 0) {
    return (
      <p className="text-center text-destructive py-12">
        Une erreur est survenue lors du chargement des réalisations. Réessayez
        plus tard.
      </p>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" aria-hidden="true" />
        <span className="sr-only">Chargement des réalisations…</span>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-12">
        Les prochaines réalisations seront publiées ici.
      </p>
    );
  }

  return (
    <div className="space-y-12 md:space-y-16">
      {projects.map((p, i) => {
          const cover = p.cover ?? p.fallbackImage;
          return (
            <article
              key={p.id}
              className={`grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10 items-start ${
                i % 2 === 1 ? "md:[&>:first-child]:md:col-start-7" : ""
              }`}
            >
              {/* Visuel */}
              <div className="md:col-span-6">
                <Link
                  to={`/realisations/${p.slug}`}
                  className="group block aspect-[4/3] rounded-2xl bg-muted border border-border overflow-hidden hover:border-primary/40 hover:shadow-md transition-all duration-300"
                  aria-label={`Voir le chantier : ${p.title}`}
                >
                  {cover ? (
                    <img
                      src={getChantierImageUrl(cover.storage_path)}
                      alt={cover.caption ?? p.title}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                      loading={i < 2 ? "eager" : "lazy"}
                      width={cover.width ?? undefined}
                      height={cover.height ?? undefined}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                      Aucune photo
                    </div>
                  )}
                </Link>
              </div>

              {/* Texte */}
              <div className={`md:col-span-6 ${i % 2 === 1 ? "md:row-start-1" : ""}`}>
                {p.tags.length > 0 && (
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-3">
                    {p.tags[0]}
                  </p>
                )}
                <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3 leading-tight">
                  <Link
                    to={`/realisations/${p.slug}`}
                    className="hover:text-primary transition-colors"
                  >
                    {p.title}
                  </Link>
                </h2>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground mb-4">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-primary" aria-hidden="true" />
                    {p.location}
                  </span>
                  <span className="text-border">·</span>
                  <span className="capitalize">{formatDate(p.completed_at)}</span>
                </div>
                <p className="text-base text-foreground/85 leading-relaxed mb-5 line-clamp-4">
                  {p.summary}
                </p>
                <Link
                  to={`/realisations/${p.slug}`}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                >
                  Voir le chantier en détail
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </div>
            </article>
          );
        })}
    </div>
  );
};

export default ProjectVerticalList;
