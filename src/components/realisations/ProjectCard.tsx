import { Link } from "react-router-dom";
import { MapPin, ArrowUpRight } from "lucide-react";
import { getChantierImageUrl } from "@/lib/chantiers/upload";
import type { ProjectImage } from "@/lib/chantiers/types";

interface ProjectCardProps {
  slug: string;
  title: string;
  location: string;
  zone: string;
  completedAt: string;
  summary: string;
  cover: ProjectImage | null;
  fallbackImage: ProjectImage | null;
  tags: string[];
}

const ProjectCard = ({
  slug,
  title,
  location,
  completedAt,
  summary,
  cover,
  fallbackImage,
  tags,
}: ProjectCardProps) => {
  const image = cover ?? fallbackImage;
  const dateStr = new Date(completedAt).toLocaleDateString("fr-BE", {
    month: "long",
    year: "numeric",
  });

  return (
    <Link
      to={`/realisations/${slug}`}
      className="group relative block rounded-2xl overflow-hidden bg-anthracite border border-anthracite-light hover:border-copper/60 hover:shadow-copper transition-all duration-500 hover:-translate-y-1"
    >
      {/* Image en valeur, ratio 4:3 */}
      <div className="aspect-[4/3] bg-anthracite-light relative overflow-hidden">
        {image ? (
          <img
            src={getChantierImageUrl(image.storage_path)}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-cream-dark/50 text-sm">
            Aucune photo
          </div>
        )}
        {/* Gradient sombre pour lisibilité des tags overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-anthracite via-anthracite/30 to-transparent opacity-90 pointer-events-none" />

        {/* Tags overlay bas-gauche */}
        {tags.length > 0 && (
          <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5">
            {tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-full bg-copper/90 text-primary-foreground backdrop-blur-sm"
              >
                {tag}
              </span>
            ))}
            {tags.length > 2 && (
              <span className="text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-full bg-anthracite/80 text-cream backdrop-blur-sm border border-cream/20">
                +{tags.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Flèche d'indication clic en haut-droite */}
        <div className="absolute top-3 right-3 w-9 h-9 rounded-full bg-copper text-primary-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-2 transition-all duration-300 shadow-copper">
          <ArrowUpRight className="w-4 h-4" strokeWidth={2.5} />
        </div>
      </div>

      {/* Texte */}
      <div className="p-5 md:p-6 space-y-3">
        <div>
          <h3 className="font-display font-bold text-xl leading-tight line-clamp-2 text-cream group-hover:text-copper-light transition-colors">
            {title}
          </h3>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-xs text-cream-dark/70">
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3 h-3 text-copper" />
              {location}
            </span>
            <span className="text-cream-dark/40">·</span>
            <span className="capitalize">{dateStr}</span>
          </div>
        </div>

        <p className="text-sm text-cream-dark/80 line-clamp-2 leading-relaxed">
          {summary}
        </p>
      </div>
    </Link>
  );
};

export default ProjectCard;
