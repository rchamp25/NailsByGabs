import { redirect } from "next/navigation";

import { ThemePicker } from "@/components/settings/theme-picker";
import { SiteHeader } from "@/components/site-header";
import { getSessionProfile } from "@/lib/auth";
import { getActiveThemeId } from "@/lib/theme";

export default async function SettingsPage() {
  const { profile } = await getSessionProfile();

  if (!profile || profile.role !== "owner") {
    redirect("/");
  }

  const activeThemeId = await getActiveThemeId();

  return (
    <>
      <SiteHeader title="Appearance" />
      <div className="page-gradient flex flex-1 flex-col gap-8 p-4 md:p-8">
        <div className="max-w-3xl">
          <p className="section-kicker text-muted-foreground text-sm uppercase tracking-widest text-accent">
            Site theme
          </p>
          <h2 className="font-serif mt-1 text-3xl text-primary md:text-5xl">
            Appearance
          </h2>
          <p className="text-muted-foreground rhythm-copy mt-3 text-sm leading-relaxed md:text-base">
            Choose a color preset for the whole site. Changes apply instantly
            for every visitor on their next page load.
          </p>
        </div>

        <ThemePicker activeThemeId={activeThemeId} />
      </div>
    </>
  );
}
