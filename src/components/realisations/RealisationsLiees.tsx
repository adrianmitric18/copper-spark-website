import { Link } from "react-router-dom";
import { ArrowRight, MapPin } from "lucide-react";
import { coverOf, snapshotImageUrl } from "@/lib/chantiers/snapshot";
import type { SnapshotProject } from "@/lib/chantiers/types";

/**
 * Vignettes de réalisations liées, affichées sur les pages services et zones.
 *
 * Les données viennent du snapshot du build (pas de requête) : le bloc est
 * présent dans le HTML pré-rendu, donc lisible par Google et les IA sans
 * JavaScript. Rien n'est rendu s'il n'y a aucune réalisation liée.
 */
interface RealisationsLieesProps {
  items: SnapshotProject[];
  titre: string;
  intro?: string;
  /** Nombre maximal de vignettes (défaut 3). */
  max?: number;
}

const formatMoisAnnee = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-BE", { month: "long", year: "numeric" });

const RealisationsLiees = ({ items, titre, intro, max = 3 }: RealisationsLieesProps) => {
  if (items.length === 0) return null;
  const visibles = items.slice(0, max);

  return (
    <section className="py-12 md:py-16" aria-labelledby="realisations-liees-titre">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h2
            id="realisations-liees-titre"
            className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3"
          >
            {titre}
          </h2>
          {intro && <p className="text-muted-foreground leading-relaxed mb-8">{intro}</p>}

          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 list-none p-0 m-0">
            {visibles.map((p) => {
              const cover = coverOf(p);
              const href = `/realisations/${p.slug}`;
              return (
                <li key={p.id} className="flex">
                  <article className="flex flex-col w-full rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/40 hover:shadow-md transition-all duration-300">
                    <Link
                      to={href}
                      className="block aspect-[4/3] bg-muted overflow-hidden"
                      aria-label={`Voir le chantier : ${p.title}`}
                    >
                      {cover ? (
                        <img
                          src={snapshotImageUrl(cover.storage_path)}
                          alt={cover.caption ?? p.title}
                          width={cover.width ?? undefined}
                          height={cover.height ?? undefined}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
                          Photo à venir
                        </div>
                      )}
                    </Link>
                    <div className="flex flex-col flex-1 p-5">
                      {p.tags[0] && (
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-2">
                          {p.tags[0]}
                        </p>
                      )}
                      <h3 className="font-display text-lg font-bold text-foreground leading-snug mb-2">
                        <Link to={href} className="hover:text-primary transition-colors">
                          {p.title}
                        </Link>
                      </h3>
                      <p className="flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground mb-3">
                        <MapPin className="w-4 h-4 text-primary" aria-hidden="true" />
                        <span>{p.location}</span>
                        <span aria-hidden="true">·</span>
                        <span className="capitalize">{formatMoisAnnee(p.completed_at)}</span>
                      </p>
                      <p className="text-sm text-foreground/85 leading-relaxed line-clamp-3 mb-4">
                        {p.summary}
                      </p>
                      <Link
                        to={href}
                        className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                      >
                        Voir le chantier
                        <ArrowRight className="w-4 h-4" aria-hidden="true" />
                      </Link>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>

          <p className="mt-8">
            <Link
              to="/realisations"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              Toutes nos réalisations
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
};

export default RealisationsLiees;
