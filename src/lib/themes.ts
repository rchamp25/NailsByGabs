export const THEME_IDS = ["cherry-studio", "pearl", "night-chrome"] as const;

export type ThemeId = (typeof THEME_IDS)[number];

export const DEFAULT_THEME_ID: ThemeId = "cherry-studio";

export function isThemeId(value: string): value is ThemeId {
  return (THEME_IDS as readonly string[]).includes(value);
}

export type ThemeMeta = {
  id: ThemeId;
  label: string;
  description: string;
  swatches: string[];
};

export const THEME_CATALOG: ThemeMeta[] = [
  {
    id: "cherry-studio",
    label: "Cherry Studio",
    description: "Warm cream, deep cherry, and champagne gold.",
    swatches: ["#fff8f5", "#9f1239", "#c9a227"],
  },
  {
    id: "pearl",
    label: "Pearl",
    description: "Soft pearl, icy blue, and lavender chrome.",
    swatches: ["#f4f7ff", "#6366f1", "#c4b5fd"],
  },
  {
    id: "night-chrome",
    label: "Night Chrome",
    description: "Pastel pink and green — a lighter and bolder shade of each.",
    swatches: ["#fff0f5", "#e889a8", "#e8f7eb", "#7bc88a"],
  },
];

export function getThemeMeta(id: ThemeId): ThemeMeta {
  return THEME_CATALOG.find((theme) => theme.id === id) ?? THEME_CATALOG[0];
}
