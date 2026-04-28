import { useState, useRef, useCallback } from "react";
import { Upload, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  uploadChantierImage,
  type UploadedChantierImage,
} from "@/lib/chantiers/upload";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  projectId: string;
  onUploaded: (image: UploadedChantierImage & { fileName: string }) => void;
  disabled?: boolean;
}

const ImageUploader = ({
  projectId,
  onUploaded,
  disabled,
}: ImageUploaderProps) => {
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      setError(null);
      const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (list.length === 0) {
        setError("Aucune image valide trouvée.");
        return;
      }

      setProgress({ current: 0, total: list.length });

      for (let i = 0; i < list.length; i++) {
        try {
          const result = await uploadChantierImage(projectId, list[i]);
          onUploaded({ ...result, fileName: list[i].name });
          setProgress({ current: i + 1, total: list.length });
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Upload échoué";
          setError(`Erreur sur "${list[i].name}" : ${msg}`);
          // On poursuit les autres fichiers
        }
      }

      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    },
    [projectId, onUploaded],
  );

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!disabled && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
          }
        }}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
          dragOver ? "border-primary bg-primary/5" : "border-border",
          disabled && "opacity-50 pointer-events-none",
        )}
      >
        {progress ? (
          <div className="flex flex-col items-center gap-2 py-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Upload {progress.current} / {progress.total}…
            </p>
          </div>
        ) : (
          <>
            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium">Glissez vos photos ici</p>
            <p className="text-xs text-muted-foreground mt-1">
              ou cliquez pour sélectionner • compression auto avant envoi
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => inputRef.current?.click()}
              disabled={disabled}
            >
              Choisir des fichiers
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) handleFiles(e.target.files);
              }}
            />
          </>
        )}
      </div>

      {error && (
        <p className="text-xs text-destructive flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5" />
          {error}
        </p>
      )}
    </div>
  );
};

export default ImageUploader;
