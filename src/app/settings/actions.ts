"use server";

import { revalidatePath } from "next/cache";

import { getOwnerSession } from "@/lib/auth";
import { parseBusinessDateTimeLocal } from "@/lib/business-timezone";
import { getActiveThemeId } from "@/lib/theme";
import { isSeasonalTheme, isThemeId, type ThemeId } from "@/lib/themes";
import { createClient } from "@/lib/supabase/server";

export type SettingsActionState = {
  error?: string;
  success?: boolean;
  message?: string;
};

function themeErrorMessage(error: { code?: string; message: string }): string {
  if (error.code === "PGRST202") {
    return "Theme scheduling needs database migration 014 (supabase/migrations/014_seasonal_theme_schedule.sql) applied in Supabase first.";
  }
  return error.message;
}

async function saveTheme(
  themeId: ThemeId,
  revert: { at: Date; to: ThemeId } | null
): Promise<SettingsActionState | null> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_site_theme", {
    p_theme: themeId,
    p_revert_at: revert ? revert.at.toISOString() : null,
    p_revert_to: revert ? revert.to : null,
  });

  if (error) {
    return { error: themeErrorMessage(error) };
  }

  revalidatePath("/", "layout");
  return null;
}

/**
 * Switch the site theme. Seasonal themes may include an automatic switch back:
 * `autoRevert=on`, `revertAt` (datetime-local, Eastern) and `revertTo`.
 * Any switch replaces a previously scheduled switch back.
 */
export async function setActiveTheme(
  _prev: SettingsActionState | null,
  formData: FormData
): Promise<SettingsActionState> {
  if (!(await getOwnerSession())) {
    return { error: "Only the owner can change the site theme." };
  }

  const themeId = String(formData.get("themeId") ?? "").trim();
  if (!isThemeId(themeId)) {
    return { error: "Invalid theme selection." };
  }

  let revert: { at: Date; to: ThemeId } | null = null;
  if (isSeasonalTheme(themeId) && formData.get("autoRevert") === "on") {
    const at = parseBusinessDateTimeLocal(String(formData.get("revertAt") ?? ""));
    const to = String(formData.get("revertTo") ?? "").trim();

    if (Number.isNaN(at.getTime())) {
      return { error: "Pick a date and time to switch back." };
    }
    if (at.getTime() <= Date.now()) {
      return { error: "Pick a switch-back time in the future." };
    }
    if (!isThemeId(to) || to === themeId) {
      return { error: "Pick a different theme to switch back to." };
    }
    revert = { at, to };
  }

  const failure = await saveTheme(themeId, revert);
  if (failure) return failure;

  return {
    success: true,
    message: revert
      ? "Theme updated. It will switch back automatically at the time you chose."
      : "Site theme updated for all visitors.",
  };
}

/** Keep the current theme and drop the scheduled switch back. */
export async function cancelThemeRevert(
  _prev: SettingsActionState | null,
  _formData: FormData
): Promise<SettingsActionState> {
  if (!(await getOwnerSession())) {
    return { error: "Only the owner can change the site theme." };
  }

  const failure = await saveTheme(await getActiveThemeId(), null);
  if (failure) return failure;

  return { success: true, message: "Automatic switch back cancelled." };
}
