import { Link } from "react-router-dom";
import { MapPin, ArrowRight, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchPublishedProjectsWithMeta } from "@/lib/chantiers/queries";
import { getChantierImageUrl } from "@/lib/chantiers/upload";

/**
 * Liste verticale des chantiers — un par bloc (brief 2026-05-01).
 * Alternance photo gauche / droite pour rythmer la lecture.
 *
 * Si la base est vide, affichage de placeholders pédagogiques
 * (chantiers types qu'Adrian peut remplacer une fois les photos prises).
 *
 * Pour les chantiers majeurs ayant à la fois une image kind="before" et
 * kind="after", on pourrait monter un BeforeAfterSlider — voir le composant
 * dédié `<BeforeAfterSlider />` (déjà câblé sur la page détail).
 */

const PLACEHOLDER_PROJECTS: Array<{
  id: string;
  type: string;
  location: string;
  date: string;
  body: string;
}> = [
  // TODO Adrian — remplacer ces blocs par de vrais chantiers via /admin/chantiers
  // dès que les photos seront prêtes. Le placeholder ci-dessous reste utile
  // pour montrer aux visiteurs le format attendu (type · lieu · date · contexte).
  {
    id: "ph-1",
    type: "Bornes de recharge VE",
    location: "Court-Saint-Étienne (1490)",
    date: "Avril 2026",
    body: "4 maisons mitoyennes équipées en bornes Hager Witty Pro 7,4 kW. Coordination avec l'inspecteur RGIE pour validation des tableaux et passage de câbles partagé.",
  },
  {
    id: "ph-2",
    type: "Photovoltaïque résidentiel",
    location: "Wavre (1300)",
    date: "Mars 2026",
    body: "Pose de 12 panneaux 410 Wc en autoconsommation, raccordement réseau et configuration de l'onduleur SolarEdge. Suivi de la prime régionale de bout en bout.",
  },
  {
    id: "ph-3",
    type: "Mise en conformité RGIE",
    location: "Ottignies-Louvain-la-Neuve (1340)",
    date: "Février 2026",
    body: "Tableau Schneider remplacé sur installation de 1978. Mise à la terre refaite, différentiels installés, contrôle Vinçotte passé sans réserve.",
  },
];

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-BE", {
    month: "long",
    year: "numeric",
  });

const ProjectVerticalList = () => {
  const { data: projects = [], isLoading, error } = useQuery({
    queryKey: ["public-chantiers-vertical"],
    queryFn: fetchPublishedProjectsWithMeta,
    staleTime: 60_000,
  });

  if (error) {
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

  // Si la base est vide, on affiche les chantiers types en placeholder
  // pour ne pas avoir une page vide.
  const showPlaceholders = projects.length === 0;

  return (
    <div className="space-y-12 md:space-y-16">
      {showPlaceholders &&
        PLACEHOLDER_PROJECTS.map((p, i) => (
          <article
            key={p.id}
            className={`grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10 items-start ${
              i % 2 === 1 ? "md:[&>:first-child]:md:col-start-7" : ""
            }`}
          >
            {/* Visuel (placeholder) */}
            <div className="md:col-span-6">
              <div className="aspect-[4/3] rounded-2xl bg-muted border border-dashed border-border flex flex-col items-center justify-center gap-2 px-6 text-center">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Photo à venir
                </span>
                <span className="text-xs text-muted-foreground/70">
                  Adrian charge les photos via /admin
                </span>
              </div>
            </div>

            {/* Texte */}
            <div className={`md:col-span-6 ${i % 2 === 1 ? "md:row-start-1" : ""}`}>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-3">
                {p.type}
              </p>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3 leading-tight">
                {p.body.split(".")[0]}.
              </h2>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground mb-4">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-primary" aria-hidden="true" />
                  {p.location}
                </span>
                <span className="text-border">·</span>
                <span className="capitalize">{p.date}</span>
              </div>
              <p className="text-base text-foreground/85 leading-relaxed">
                {p.body}
              </p>
            </div>
          </article>
        ))}

      {!showPlaceholders &&
        projects.map((p, i) => {
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
