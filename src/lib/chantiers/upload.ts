/**
 * Upload de photos chantiers vers Supabase Storage (bucket `chantiers`).
 * Compresse l'image côté client avant envoi pour limiter le poids
 * (max 0.5 Mo / 1920px) puis enregistre les dimensions afin que
 * project_images.width/height soient renseignés (limite CLS côté front).
 */

import imageCompression from "browser-image-compression";
import { supabase } from "@/integrations/supabase/client";

const BUCKET = "chantiers";

const COMPRESSION_OPTIONS = {
  maxSizeMB: 0.5,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: "image/jpeg" as const,
};

export interface UploadedChantierImage {
  storagePath: string;
  width: number;
  height: number;
  sizeKb: number;
}

function slugifyFilename(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "photo"
  );
}

function readDimensions(blob: Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = (event) => {
      URL.revokeObjectURL(url);
      reject(event instanceof Event ? new Error("Lecture image impossible") : event);
    };
    img.src = url;
  });
}

/**
 * Compresse une image puis l'upload dans le bucket `chantiers`.
 * Le fichier est rangé sous `{projectId}/{timestamp}-{slug}.jpg`.
 */
export async function uploadChantierImage(
  projectId: string,
  file: File,
): Promise<UploadedChantierImage> {
  const compressed = await imageCompression(file, COMPRESSION_OPTIONS);
  const { width, height } = await readDimensions(compressed);

  const baseName = slugifyFilename(file.name.replace(/\.[^.]+$/, ""));
  const storagePath = `${projectId}/${Date.now()}-${baseName}.jpg`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, compressed, {
      contentType: "image/jpeg",
      cacheControl: "31536000",
      upsert: false,
    });

  if (error) throw error;

  return {
    storagePath,
    width,
    height,
    sizeKb: Math.round(compressed.size / 1024),
  };
}

/** Construit l'URL publique d'une image stockée dans le bucket `chantiers`. */
export function getChantierImageUrl(storagePath: string): string {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

/** Supprime une photo du bucket `chantiers`. */
export async function deleteChantierImage(storagePath: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).remove([storagePath]);
  if (error) throw error;
}
