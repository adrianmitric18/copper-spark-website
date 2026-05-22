#!/usr/bin/env node
/**
 * Compresse en place les images de src/assets/gallery/ :
 *   - Backup des originaux dans src/assets/gallery/_originals/<rel-path>
 *     (gitignored, pour pouvoir revenir en arrière)
 *   - Réencodage JPG qualité 80, mozjpeg, max 1600px côté le plus long
 *   - Le nom et le chemin restent identiques (aucune modif d'import requise)
 *
 * Lance avec : node scripts/optimize-gallery.mjs
 *
 * Idempotent : si une image est déjà dans _originals/, on la skip pour ne
 * pas écraser le backup d'origine par une version déjà compressée.
 */

import { promises as fs } from "node:fs";
import { existsSync } from "node:fs";
import { resolve, dirname, relative, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const GALLERY_DIR = resolve(ROOT, "src/assets/gallery");
const ORIGINALS_DIR = resolve(GALLERY_DIR, "_originals");
const MAX_DIMENSION = 1600;
const QUALITY = 80;
const MIN_SIZE_BYTES = 200 * 1024; // ne touche pas aux fichiers déjà < 200 KB

const IMG_EXTS = new Set([".jpg", ".jpeg", ".png"]);

/** Récolte récursivement les fichiers image sous GALLERY_DIR (exclut _originals/). */
async function collectImages(dir) {
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      if (full === ORIGINALS_DIR) continue;
      out.push(...(await collectImages(full)));
    } else if (e.isFile()) {
      const lower = e.name.toLowerCase();
      const ext = lower.slice(lower.lastIndexOf("."));
      if (IMG_EXTS.has(ext)) out.push(full);
    }
  }
  return out;
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function processOne(absPath) {
  const stat = await fs.stat(absPath);
  if (stat.size < MIN_SIZE_BYTES) {
    return { path: absPath, skipped: "already_small", bytesBefore: stat.size };
  }

  const rel = relative(GALLERY_DIR, absPath);
  const backupPath = join(ORIGINALS_DIR, rel);

  if (!existsSync(backupPath)) {
    await ensureDir(dirname(backupPath));
    await fs.copyFile(absPath, backupPath);
  }

  const input = await fs.readFile(backupPath);
  const meta = await sharp(input).metadata();
  const needResize =
    (meta.width ?? 0) > MAX_DIMENSION || (meta.height ?? 0) > MAX_DIMENSION;

  const pipeline = sharp(input)
    .rotate() // honore l'EXIF orientation
    .jpeg({ quality: QUALITY, mozjpeg: true, progressive: true });

  if (needResize) {
    pipeline.resize({
      width: MAX_DIMENSION,
      height: MAX_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  const output = await pipeline.toBuffer();
  await fs.writeFile(absPath, output);

  return {
    path: absPath,
    bytesBefore: stat.size,
    bytesAfter: output.length,
    resized: needResize,
    dimensions: { w: meta.width, h: meta.height },
  };
}

async function main() {
  if (!existsSync(GALLERY_DIR)) {
    console.error(`Gallery dir not found: ${GALLERY_DIR}`);
    process.exit(1);
  }
  await ensureDir(ORIGINALS_DIR);

  const files = await collectImages(GALLERY_DIR);
  console.log(`Found ${files.length} image(s) under src/assets/gallery/`);

  let totalBefore = 0;
  let totalAfter = 0;
  let processed = 0;
  let skipped = 0;

  for (const f of files) {
    try {
      const r = await processOne(f);
      if (r.skipped) {
        skipped += 1;
        continue;
      }
      processed += 1;
      totalBefore += r.bytesBefore;
      totalAfter += r.bytesAfter;
      const rel = relative(ROOT, f);
      const beforeKB = (r.bytesBefore / 1024).toFixed(0);
      const afterKB = (r.bytesAfter / 1024).toFixed(0);
      const pct = ((1 - r.bytesAfter / r.bytesBefore) * 100).toFixed(0);
      console.log(`  ${rel}  ${beforeKB} → ${afterKB} KB  (-${pct}%)`);
    } catch (err) {
      console.error(`  ✗ ${f}: ${err.message}`);
    }
  }

  const mbBefore = (totalBefore / 1024 / 1024).toFixed(1);
  const mbAfter = (totalAfter / 1024 / 1024).toFixed(1);
  const saved = (totalBefore - totalAfter) / 1024 / 1024;
  console.log(
    `\nDone — ${processed} processed, ${skipped} skipped (already < ${(MIN_SIZE_BYTES / 1024).toFixed(0)} KB).`,
  );
  console.log(
    `Total: ${mbBefore} MB → ${mbAfter} MB  (saved ${saved.toFixed(1)} MB)`,
  );
  console.log(`Originals backed up to: ${relative(ROOT, ORIGINALS_DIR)}/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
