#!/usr/bin/env node
/**
 * Resize and convert photos for the website.
 *
 *   npm run images:optimize -- <input-dir> [options]
 *
 * Reads every JPEG/PNG/WebP/AVIF/TIFF in <input-dir> (not recursive), applies
 * the EXIF rotation, scales the long edge down to --max pixels, strips all
 * metadata (camera info, GPS location), and writes WebP files to --out.
 * Originals are never modified, and --out must be a different folder.
 *
 * Options:
 *   --out <dir>       Output folder (default: public/portfolio)
 *   --max <px>        Longest edge in pixels (default: 2000)
 *   --quality <1-100> WebP quality (default: 80)
 *   --force           Rewrite outputs that already exist
 *   --dry-run         Show what would happen without writing anything
 *
 * Filenames are kept (only the extension changes). Originals belong in the
 * git-ignored image-originals/ folder, e.g.
 *   npm run images:optimize -- image-originals/portfolio --out public/portfolio
 * Then register each new photo in src/lib/portfolio.ts (names printed at the
 * end): camera names like IMG_1234 go in LABELED_SETS with explicit tags,
 * title and focal point; files named with tag words (e.g. "3DWFun" ->
 * "3D & Fun") can go in PORTFOLIO_FILE_NAMES instead. Avoid spaces.
 *
 * iPhone HEIC photos are not supported by sharp's prebuilt binaries: export
 * them as JPEG first (Photos > Export, or set Camera > Formats > Most Compatible).
 */
import fs from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";

import sharp from "sharp";

const INPUT_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".tif", ".tiff"]);

const { values: options, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    out: { type: "string", default: "public/portfolio" },
    max: { type: "string", default: "2000" },
    quality: { type: "string", default: "80" },
    force: { type: "boolean", default: false },
    "dry-run": { type: "boolean", default: false },
  },
});

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

async function isNewer(target, source) {
  try {
    const [targetStat, sourceStat] = await Promise.all([fs.stat(target), fs.stat(source)]);
    return targetStat.mtimeMs >= sourceStat.mtimeMs;
  } catch {
    return false;
  }
}

async function main() {
  const [inputArg] = positionals;
  if (!inputArg) {
    fail("Pass the folder of original photos, e.g. npm run images:optimize -- ~/Pictures/nails");
  }

  const inputDir = path.resolve(inputArg);
  const outputDir = path.resolve(options.out);
  const maxEdge = Number.parseInt(options.max, 10);
  const quality = Number.parseInt(options.quality, 10);
  const dryRun = options["dry-run"];

  if (inputDir === outputDir) {
    fail("--out must be a different folder from the input so originals are never overwritten.");
  }
  if (!Number.isFinite(maxEdge) || maxEdge < 200) {
    fail("--max must be a number of pixels (200 or more).");
  }
  if (!Number.isFinite(quality) || quality < 1 || quality > 100) {
    fail("--quality must be between 1 and 100.");
  }

  const entries = await fs.readdir(inputDir, { withFileTypes: true }).catch(() =>
    fail(`Cannot read input folder: ${inputDir}`)
  );
  const files = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => INPUT_EXTENSIONS.has(path.extname(name).toLowerCase()))
    .sort();

  const skippedHeic = entries.filter((entry) => /\.hei[cf]$/i.test(entry.name));
  if (skippedHeic.length > 0) {
    console.warn(
      `Skipping ${skippedHeic.length} HEIC file(s); export them as JPEG first: ${skippedHeic.map((e) => e.name).join(", ")}`
    );
  }
  if (files.length === 0) {
    fail(`No supported images found in ${inputDir}`);
  }

  if (!dryRun) {
    await fs.mkdir(outputDir, { recursive: true });
  }

  let totalBefore = 0;
  let totalAfter = 0;
  const written = [];

  for (const name of files) {
    const source = path.join(inputDir, name);
    const outputName = `${path.basename(name, path.extname(name))}.webp`;
    const target = path.join(outputDir, outputName);
    const { size: before } = await fs.stat(source);

    if (/\s/.test(outputName)) {
      console.warn(`  ! "${outputName}" contains spaces; rename it to tag words (see header of this script).`);
    }

    if (!options.force && (await isNewer(target, source))) {
      console.log(`  = ${outputName} (up to date, use --force to rewrite)`);
      continue;
    }

    const pipeline = sharp(source)
      .rotate()
      .resize({ width: maxEdge, height: maxEdge, fit: "inside", withoutEnlargement: true })
      .webp({ quality, effort: 5 });

    if (dryRun) {
      const meta = await sharp(source).metadata();
      console.log(`  ~ ${name} (${meta.width}x${meta.height}, ${formatBytes(before)}) -> ${outputName}`);
      continue;
    }

    const info = await pipeline.toFile(target);
    totalBefore += before;
    totalAfter += info.size;
    written.push(outputName);
    console.log(
      `  + ${name} (${formatBytes(before)}) -> ${outputName} ${info.width}x${info.height} (${formatBytes(info.size)})`
    );
  }

  if (dryRun) {
    console.log(`\nDry run: nothing written. Output folder would be ${outputDir}`);
    return;
  }

  if (written.length > 0) {
    const saved = totalBefore > 0 ? Math.round((1 - totalAfter / totalBefore) * 100) : 0;
    console.log(
      `\n${written.length} image(s): ${formatBytes(totalBefore)} -> ${formatBytes(totalAfter)} (${saved}% smaller)`
    );
    console.log("\nRegister these in src/lib/portfolio.ts (LABELED_SETS or PORTFOLIO_FILE_NAMES):");
    for (const outputName of written) {
      console.log(`  "${outputName}",`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
