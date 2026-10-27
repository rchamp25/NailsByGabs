import { ThemePicker } from "@/components/settings/theme-picker";
import { SiteHeader } from "@/components/site-header";
import { requireOwner } from "@/lib/auth";
import {
  formatBusinessDayKey,
  getBusinessDateTimeFormatOptions,
  parseBusinessDateTimeLocal,
} from "@/lib/business-timezone";
import { getThemeState } from "@/lib/theme";
import {
  DEFAULT_THEME_ID,
  getThemeMeta,
  isSeasonalTheme,
  THEME_CATALOG,
  type ThemeId,
} from "@/lib/themes";

/** Next occurrence of each seasonal theme's suggested switch-back day, as a datetime-local value (Eastern). */
function getDefaultRevertAt(): Partial<Record<ThemeId, string>> {
  const now = new Date();
  const year = Number(formatBusinessDayKey(now).slice(0, 4));
  const pad = (n: number) => String(n).padStart(2, "0");
  const defaults: Partial<Record<ThemeId, string>> = {};

  for (const theme of THEME_CATALOG) {
    if (!theme.seasonal) continue;
    const { defaultRevertMonth: m, defaultRevertDay: d } = theme.seasonal;
    let value = `${year}-${pad(m)}-${pad(d)}T00:00`;
    if (parseBusinessDateTimeLocal(value) <= now) {
      value = `${year + 1}-${pad(m)}-${pad(d)}T00:00`;
    }
    defaults[theme.id] = value;
  }
  return defaults;
}

export default async function SettingsPage() {
  await requireOwner();

  const { activeThemeId, revertAt, revertTo } = await getThemeState();
  const defaultRevertTo: ThemeId = isSeasonalTheme(activeThemeId)
    ? (revertTo ?? DEFAULT_THEME_ID)
    : activeThemeId;

  const schedule =
    revertAt && revertTo
      ? {
          label: getThemeMeta(revertTo).label,
          when: new Intl.DateTimeFormat(
            "en-US",
            getBusinessDateTimeFormatOptions({
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })
          ).format(new Date(revertAt)),
        }
      : null;

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
            for every visitor on their next page load. Seasonal themes can
            switch back to your usual theme automatically.
          </p>
        </div>

        <ThemePicker
          activeThemeId={activeThemeId}
          schedule={schedule}
          defaultRevertAt={getDefaultRevertAt()}
          defaultRevertTo={defaultRevertTo}
        />
      </div>
    </>
  );
}
