import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_THEME_ID,
  isThemeId,
  type ThemeId,
} from "@/lib/themes";

export type ThemeState = {
  activeThemeId: ThemeId;
  /** ISO timestamp of the scheduled automatic switch back, if any. */
  revertAt: string | null;
  revertTo: ThemeId | null;
};

const DEFAULT_STATE: ThemeState = {
  activeThemeId: DEFAULT_THEME_ID,
  revertAt: null,
  revertTo: null,
};

/**
 * Active site theme plus its switch-back schedule (migration 014). When the
 * scheduled time has passed, the first request applies the switch back via
 * apply_due_theme_revert(), so no cron job is needed.
 */
export const getThemeState = cache(async (): Promise<ThemeState> => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("app_config")
      .select("key, value")
      .in("key", ["active_theme", "theme_revert_at", "theme_revert_to"]);

    if (error) {
      console.error("[theme] Failed to read active_theme:", error.message);
      return DEFAULT_STATE;
    }

    const values = new Map((data ?? []).map((row) => [row.key, row.value?.trim() ?? ""]));
    const active = values.get("active_theme") ?? "";
    const revertAt = values.get("theme_revert_at") || null;
    const revertToRaw = values.get("theme_revert_to") ?? "";
    const revertTo = isThemeId(revertToRaw) ? revertToRaw : null;

    const activeThemeId = isThemeId(active) ? active : DEFAULT_THEME_ID;

    if (revertAt && revertTo && Date.parse(revertAt) <= Date.now()) {
      // Returns null when a concurrent request already applied it; either way
      // the scheduled theme is now active.
      const { error: revertError } = await supabase.rpc("apply_due_theme_revert");
      if (revertError) {
        console.error("[theme] apply_due_theme_revert failed:", revertError.message);
        return { ...DEFAULT_STATE, activeThemeId };
      }
      return { activeThemeId: revertTo, revertAt: null, revertTo: null };
    }

    return {
      activeThemeId,
      revertAt: revertAt && revertTo ? revertAt : null,
      revertTo: revertAt ? revertTo : null,
    };
  } catch {
    // Fall back to default when Supabase is unavailable
    return DEFAULT_STATE;
  }
});

export async function getActiveThemeId(): Promise<ThemeId> {
  return (await getThemeState()).activeThemeId;
}
