import { useState } from "react";
import { Star, Trash2, ChevronUp, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  getChantierImageUrl,
  deleteChantierImage,
} from "@/lib/chantiers/upload";
import {
  removeProjectImage,
  reorderProjectImages,
  setProjectCover,
  setImageKind,
  setImageCaption,
} from "@/lib/chantiers/queries";
import type { ImageKind, ProjectImage } from "@/lib/chantiers/types";

interface ImageGalleryEditorProps {
  projectId: string;
  images: ProjectImage[];
  onChange: () => void;
}

const ImageGalleryEditor = ({
  projectId,
  images,
  onChange,
}: ImageGalleryEditorProps) => {
  const [busy, setBusy] = useState<string | null>(null);

  const withBusy = async (id: string, fn: () => Promise<void>) => {
    setBusy(id);
    try {
      await fn();
      onChange();
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = (img: ProjectImage) =>
    withBusy(img.id, async () => {
      await removeProjectImage(img.id);
      // Storage : best-effort (la DB est la source de vérité)
      await deleteChantierImage(img.storage_path).catch(() => null);
    });

  const handleSetCover = (img: ProjectImage) =>
    withBusy(img.id, () => setProjectCover(projectId, img.id));

  const handleMove = (img: ProjectImage, direction: "up" | "down") => {
    const idx = images.findIndex((i) => i.id === img.id);
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= images.length) return Promise.resolve();
    const reordered = [...images];
    [reordered[idx], reordered[targetIdx]] = [
      reordered[targetIdx],
      reordered[idx],
    ];
    return withBusy(img.id, () =>
      reorderProjectImages(
        reordered.map((i, n) => ({ id: i.id, sort_order: n })),
      ),
    );
  };

  const handleKindChange = (img: ProjectImage, kind: ImageKind) =>
    withBusy(img.id, () => setImageKind(img.id, kind));

  const handleCaptionBlur = (img: ProjectImage, caption: string) => {
    if ((caption.trim() || null) === img.caption) return;
    return withBusy(img.id, () =>
      setImageCaption(img.id, caption.trim() || null),
    );
  };

  if (images.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4 border border-dashed border-border rounded-lg">
        Aucune photo pour l'instant. Utilise la zone ci-dessus pour en ajouter.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {images.map((img, idx) => {
        const url = getChantierImageUrl(img.storage_path);
        const isBusy = busy === img.id;
        return (
          <div
            key={img.id}
            className="border border-border rounded-lg overflow-hidden bg-card"
          >
            <div className="relative aspect-video bg-muted">
              <img
                src={url}
                alt={img.caption ?? ""}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {img.is_cover && (
                <span className="absolute top-2 left-2 inline-flex items-center gap-1 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                  <Star className="w-3 h-3 fill-current" />
                  Cover
                </span>
              )}
              {isBusy && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-white" />
                </div>
              )}
            </div>

            <div className="p-3 space-y-2">
              <Input
                defaultValue={img.caption ?? ""}
                placeholder="Légende (optionnel)"
                className="h-9"
                onBlur={(e) => handleCaptionBlur(img, e.target.value)}
                disabled={isBusy}
              />

              <div className="flex gap-2">
                <Select
                  value={img.kind}
                  onValueChange={(v) => handleKindChange(img, v as ImageKind)}
                  disabled={isBusy}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="photo">Photo</SelectItem>
                    <SelectItem value="before">Avant</SelectItem>
                    <SelectItem value="after">Après</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleSetCover(img)}
                  disabled={isBusy || img.is_cover}
                  title="Définir comme cover"
                  className="shrink-0 h-9"
                >
                  <Star
                    className={cn(
                      "w-4 h-4",
                      img.is_cover && "fill-current text-primary",
                    )}
                  />
                </Button>
              </div>

              <div className="flex gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleMove(img, "up")}
                  disabled={isBusy || idx === 0}
                  className="flex-1 h-9"
                  aria-label="Monter"
                >
                  <ChevronUp className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleMove(img, "down")}
                  disabled={isBusy || idx === images.length - 1}
                  className="flex-1 h-9"
                  aria-label="Descendre"
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(img)}
                  disabled={isBusy}
                  className="text-destructive hover:bg-destructive/10 h-9"
                  aria-label="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ImageGalleryEditor;
