import "server-only";

import { cache } from "react";

import {
  autoTitle,
  isStyleTag,
  PORTFOLIO_PHOTO_DEFAULTS,
  type PortfolioImage,
  type StyleTag,
} from "@/lib/portfolio";
import { createClient } from "@/lib/supabase/server";

/** A gallery photo with the owner's edits applied, as shown on /photos. */
export type ManagedPhoto = PortfolioImage & {
  customTitle: string | null;
  featured: boolean;
  needsReview: boolean;
};

type PhotoRow = {
  file: string;
  title: string | null;
  tags: string[] | null;
  featured: boolean;
  sort_order: number | null;
  needs_review: boolean;
};

/**
 * All gallery photos in display order: defaults from src/lib/portfolio.ts,
 * overridden by portfolio_photos rows (migration 015). Photos without a saved
 * position come first in default order (so newly added photos lead), then the
 * owner-ordered ones. If the table is missing, returns the defaults with
 * tableReady=false.
 */
export const getManagedPhotos = cache(
  async (): Promise<{ photos: ManagedPhoto[]; tableReady: boolean }> => {
    let rows: PhotoRow[] = [];
    let tableReady = true;

    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("portfolio_photos")
        .select("file, title, tags, featured, sort_order, needs_review");
      if (error) {
        tableReady = false;
        if (error.code !== "PGRST205" && error.code !== "42P01") {
          console.error("[portfolio] Failed to read portfolio_photos:", error.message);
        }
      } else {
        rows = (data ?? []) as PhotoRow[];
      }
    } catch {
      tableReady = false;
    }

    const byFile = new Map(rows.map((row) => [row.file, row]));

    const photos = PORTFOLIO_PHOTO_DEFAULTS.map((defaults, index) => {
      const row = byFile.get(defaults.fileName);
      const tags: StyleTag[] = row ? (row.tags ?? []).filter(isStyleTag) : defaults.tags;
      const customTitle = row ? row.title?.trim() || null : defaults.customTitle;
      return {
        photo: {
          src: defaults.src,
          fileName: defaults.fileName,
          focal: defaults.focal,
          tags,
          customTitle,
          title: customTitle ?? autoTitle(tags),
          featured: row ? row.featured : true,
          needsReview: row ? row.needs_review : defaults.needsReview,
        } satisfies ManagedPhoto,
        sortOrder: row?.sort_order ?? null,
        defaultIndex: index,
      };
    });

    photos.sort((a, b) => {
      if (a.sortOrder === null && b.sortOrder === null) return a.defaultIndex - b.defaultIndex;
      if (a.sortOrder === null) return -1;
      if (b.sortOrder === null) return 1;
      return a.sortOrder - b.sortOrder || a.defaultIndex - b.defaultIndex;
    });

    return { photos: photos.map((entry) => entry.photo), tableReady };
  }
);

/** Public view: the whole gallery, plus the photos picked for the carousel. */
export async function getPortfolioView(): Promise<{
  gallery: PortfolioImage[];
  featured: PortfolioImage[];
}> {
  const { photos } = await getManagedPhotos();
  const toImage = ({ src, title, fileName, focal, tags }: ManagedPhoto): PortfolioImage => ({
    src,
    title,
    fileName,
    focal,
    tags,
  });
  const gallery = photos.map(toImage);
  const featured = photos.filter((photo) => photo.featured).map(toImage);
  return { gallery, featured: featured.length > 0 ? featured : gallery };
}
