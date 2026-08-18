"use server";

import { revalidatePath } from "next/cache";

import { getSessionProfile } from "@/lib/auth";
import { isThemeId } from "@/lib/themes";
import { createClient } from "@/lib/supabase/server";

export type SettingsActionState = {
  error?: string;
  success?: boolean;
  message?: string;
};

export async function setActiveTheme(
  _prev: SettingsActionState | null,
  formData: FormData
): Promise<SettingsActionState> {
  const { profile } = await getSessionProfile();
  if (!profile || profile.role !== "owner") {
    return { error: "Only the owner can change the site theme." };
  }

  const themeId = String(formData.get("themeId") ?? "").trim();
  if (!isThemeId(themeId)) {
    return { error: "Invalid theme selection." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("app_config")
    .update({ value: themeId })
    .eq("key", "active_theme");

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");

  return {
    success: true,
    message: "Site theme updated for all visitors.",
  };
}
