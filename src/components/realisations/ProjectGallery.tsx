import { useState, useCallback, useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { getChantierImageUrl } from "@/lib/chantiers/upload";
import type { ProjectImage } from "@/lib/chantiers/types";

interface ProjectGalleryProps {
  images: ProjectImage[];
}

/**
 * Grille de photos avec lightbox au clic. Navigation clavier (← →, Esc).
 * Filtre les paires before/after qui sont rendues séparément par
 * BeforeAfterSlider (on n'affiche dans la galerie que kind="photo").
 */
const ProjectGallery = ({ images }: ProjectGalleryProps) => {
  const photos = images.filter((i) => i.kind === "photo");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const close = useCallback(() => setOpenIndex(null), []);
  const next = useCallback(
    () => setOpenIndex((i) => (i === null ? null : (i + 1) % photos.length)),
    [photos.length],
  );
  const prev = useCallback(
    () =>
      setOpenIndex((i) =>
        i === null ? null : (i - 1 + photos.length) % photos.length,
      ),
    [photos.length],
  );

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openIndex, close, next, prev]);

  if (photos.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {photos.map((img, idx) => (
          <button
            key={img.id}
            type="button"
            onClick={() => setOpenIndex(idx)}
            className="aspect-square rounded-lg overflow-hidden bg-muted group focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <img
              src={getChantierImageUrl(img.storage_path)}
              alt={img.caption ?? ""}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </button>
        ))}
      </div>

      {openIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={close}
        >
          <button
            type="button"
            onClick={close}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20"
            aria-label="Fermer"
          >
            <X className="w-6 h-6" />
          </button>

          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20"
                aria-label="Précédente"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20"
                aria-label="Suivante"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          <figure
            onClick={(e) => e.stopPropagation()}
            className="max-w-6xl max-h-full flex flex-col items-center"
          >
            <img
              src={getChantierImageUrl(photos[openIndex].storage_path)}
              alt={photos[openIndex].caption ?? ""}
              className="max-h-[85vh] max-w-full object-contain rounded-lg"
            />
            {photos[openIndex].caption && (
              <figcaption className="text-white/80 text-sm mt-3 text-center max-w-2xl">
                {photos[openIndex].caption}
              </figcaption>
            )}
          </figure>
        </div>
      )}
    </>
  );
};

export default ProjectGallery;
