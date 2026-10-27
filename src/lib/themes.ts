/** Keep in sync with public.is_site_theme() (migration 014). */
export const THEME_IDS = ["cherry-studio", "pearl", "flower", "halloween"] as const;

export type ThemeId = (typeof THEME_IDS)[number];

export const DEFAULT_THEME_ID: ThemeId = "cherry-studio";

export function isThemeId(value: string): value is ThemeId {
  return (THEME_IDS as readonly string[]).includes(value);
}

/** Hex values for HTML emails, which cannot read CSS variables. Keep in sync with globals.css. */
export type EmailPalette = {
  background: string;
  text: string;
  muted: string;
  primary: string;
  primaryText: string;
  accent: string;
};

export type ThemeMeta = {
  id: ThemeId;
  label: string;
  description: string;
  swatches: string[];
  email: EmailPalette;
  /**
   * Holiday themes. Selecting one asks the owner when to switch back;
   * the date is the suggested switch-back day (midnight Eastern).
   */
  seasonal?: { defaultRevertMonth: number; defaultRevertDay: number };
};

export const THEME_CATALOG: ThemeMeta[] = [
  {
    id: "cherry-studio",
    label: "Cherry Studio",
    description: "Warm cream, deep cherry, and champagne gold.",
    swatches: ["#fff8f5", "#9f1239", "#c9a227"],
    email: {
      background: "#fff8f5",
      text: "#2d1219",
      muted: "#7a4a58",
      primary: "#9f1239",
      primaryText: "#fff8f5",
      accent: "#c9a227",
    },
  },
  {
    id: "pearl",
    label: "Pearl",
    description: "Soft pearl, icy blue, and lavender chrome.",
    swatches: ["#f4f7ff", "#6366f1", "#c4b5fd"],
    email: {
      background: "#f4f7ff",
      text: "#1e1b4b",
      muted: "#5b5f8a",
      primary: "#6366f1",
      primaryText: "#f8faff",
      accent: "#a78bfa",
    },
  },
  {
    id: "flower",
    label: "Flower",
    description: "Pastel pink and green — a lighter and bolder shade of each.",
    swatches: ["#fff0f5", "#d96f93", "#e8f7eb", "#7bc88a"],
    email: {
      background: "#fff8fb",
      text: "#3d2a32",
      muted: "#6b3d52",
      primary: "#d96f93",
      primaryText: "#fff8fb",
      accent: "#7bc88a",
    },
  },
  {
    id: "halloween",
    label: "Halloween",
    description: "Midnight purple, pumpkin orange, and slime green, with drifting pumpkins and fog.",
    swatches: ["#0f0a14", "#ef8a45", "#a3e635", "#f3e9dc"],
    email: {
      background: "#0f0a14",
      text: "#f3e9dc",
      muted: "#b9a7c9",
      primary: "#ef8a45",
      primaryText: "#1a0d05",
      accent: "#a3e635",
    },
    seasonal: { defaultRevertMonth: 11, defaultRevertDay: 1 },
  },
];

export function getThemeMeta(id: ThemeId): ThemeMeta {
  return THEME_CATALOG.find((theme) => theme.id === id) ?? THEME_CATALOG[0];
}

export function isSeasonalTheme(id: ThemeId): boolean {
  return !!getThemeMeta(id).seasonal;
}
