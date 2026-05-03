import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getChantierImageUrl } from "@/lib/chantiers/upload";
import type { ProjectWithMeta } from "@/lib/chantiers/queries";

interface Props {
  project: ProjectWithMeta;
}

/**
 * Card draggable d'un chantier dans le mode "Réorganiser" de
 * /admin/chantiers. Le drag handle (GripVertical) est le SEUL élément qui
 * porte les listeners @dnd-kit, pour ne pas hijacker les futurs clics sur
 * le reste de la card. touch-none sur le handle est nécessaire pour que
 * le drag fonctionne sur mobile (sinon le navigateur scrolle).
 */
const SortableChantierCard = ({ project }: Props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 bg-card border border-border rounded-lg ${
        isDragging ? "shadow-lg" : "shadow-sm"
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="touch-none cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-1 -ml-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Réordonner ${project.title}`}
      >
        <GripVertical className="w-5 h-5" aria-hidden="true" />
      </button>

      {project.cover ? (
        <img
          src={getChantierImageUrl(project.cover.storage_path)}
          alt=""
          className="w-12 h-12 object-cover rounded shrink-0"
          loading="lazy"
        />
      ) : (
        <div className="w-12 h-12 bg-muted rounded shrink-0 flex items-center justify-center text-xs text-muted-foreground">
          —
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{project.title}</p>
        <p className="text-sm text-muted-foreground truncate">
          {project.location}
        </p>
      </div>

      {project.status === "published" ? (
        <Badge>Publié</Badge>
      ) : (
        <Badge variant="outline">Brouillon</Badge>
      )}
    </div>
  );
};

export default SortableChantierCard;
