"use server";

import { revalidatePath } from "next/cache";

import { getOwnerSession } from "@/lib/auth";
import { isStyleTag, PORTFOLIO_PHOTO_DEFAULTS } from "@/lib/portfolio";
import { getManagedPhotos } from "@/lib/portfolio-photos";
import { createClient } from "@/lib/supabase/server";

export type PhotoActionState = {
  error?: string;
  success?: boolean;
  message?: string;
};

const TITLE_MAX_LENGTH = 60;
const KNOWN_FILES = new Set(PORTFOLIO_PHOTO_DEFAULTS.map((photo) => photo.fileName));

function tableMissingMessage(code?: string): string | null {
  return code === "PGRST205" || code === "42P01"
    ? "The photo editor needs database migration 015 (supabase/migrations/015_portfolio_photos.sql) applied first."
    : null;
}

function refreshGallery() {
  revalidatePath("/");
  revalidatePath("/photos");
}

/**
 * Save one photo's tags, title and carousel setting, and mark it reviewed.
 * Used by both "Looks right" (unchanged values) and "Save changes".
 */
export async function savePhoto(
  _prev: PhotoActionState | null,
  formData: FormData
): Promise<PhotoActionState> {
  if (!(await getOwnerSession())) {
    return { error: "Only the owner can edit photos." };
  }

  const file = String(formData.get("file") ?? "");
  if (!KNOWN_FILES.has(file)) {
    return { error: "Unknown photo." };
  }

  const tags = [...new Set(formData.getAll("tags").map(String))].filter(isStyleTag);
  const title = String(formData.get("title") ?? "").trim();
  if (title.length > TITLE_MAX_LENGTH) {
    return { error: `Keep the title under ${TITLE_MAX_LENGTH} characters.` };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("portfolio_photos").upsert(
    {
      file,
      title: title || null,
      tags,
      featured: formData.get("featured") === "on",
      needs_review: false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "file" }
  );

  if (error) {
    return { error: tableMissingMessage(error.code) ?? error.message };
  }

  refreshGallery();
  return { success: true, message: "Saved" };
}

/**
 * Save the full gallery order. Rows that don't exist yet are created with the
 * photo's current values so ordering never resets tags or review status.
 */
export async function reorderPhotos(files: string[]): Promise<PhotoActionState> {
  if (!(await getOwnerSession())) {
    return { error: "Only the owner can reorder photos." };
  }

  const { photos } = await getManagedPhotos();
  const current = new Map(photos.map((photo) => [photo.fileName, photo]));
  const ordered = files.filter((file) => current.has(file));
  if (ordered.length !== current.size || new Set(ordered).size !== ordered.length) {
    return { error: "The photo list changed. Refresh the page and try again." };
  }

  const now = new Date().toISOString();
  const supabase = await createClient();
  const { error } = await supabase.from("portfolio_photos").upsert(
    ordered.map((file, index) => {
      const photo = current.get(file)!;
      return {
        file,
        title: photo.customTitle,
        tags: photo.tags,
        featured: photo.featured,
        needs_review: photo.needsReview,
        sort_order: index,
        updated_at: now,
      };
    }),
    { onConflict: "file" }
  );

  if (error) {
    return { error: tableMissingMessage(error.code) ?? error.message };
  }

  refreshGallery();
  return { success: true };
}
