import { Link } from "react-router-dom";
import { MapPin, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
      className="group block rounded-xl overflow-hidden border border-border bg-card hover:shadow-lg transition-all hover:-translate-y-0.5"
    >
      <div className="aspect-video bg-muted relative overflow-hidden">
        {image ? (
          <img
            src={getChantierImageUrl(image.storage_path)}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
            Aucune photo
          </div>
        )}
      </div>

      <div className="p-5 space-y-3">
        <div>
          <h3 className="font-display font-bold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {location}
            </span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {dateStr}
            </span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2">{summary}</p>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-[10px] font-normal"
              >
                {tag}
              </Badge>
            ))}
            {tags.length > 3 && (
              <Badge variant="secondary" className="text-[10px] font-normal">
                +{tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </div>
    </Link>
  );
};

export default ProjectCard;
