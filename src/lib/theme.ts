import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_THEME_ID,
  isThemeId,
  type ThemeId,
} from "@/lib/themes";

export const getActiveThemeId = cache(async (): Promise<ThemeId> => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("app_config")
      .select("value")
      .eq("key", "active_theme")
      .maybeSingle();

    if (error) {
      console.error("[theme] Failed to read active_theme:", error.message);
      return DEFAULT_THEME_ID;
    }

    const value = data?.value?.trim();
    if (value && isThemeId(value)) {
      return value;
    }
  } catch {
    // Fall back to default when Supabase is unavailable
  }

  return DEFAULT_THEME_ID;
});
