"use client";

import { useActionState } from "react";

import { setActiveTheme, type SettingsActionState } from "@/app/settings/actions";
import { Button } from "@/components/ui/button";
import { THEME_CATALOG, type ThemeId } from "@/lib/themes";
import { cn } from "@/lib/utils";

type ThemePickerProps = {
  activeThemeId: ThemeId;
};

export function ThemePicker({ activeThemeId }: ThemePickerProps) {
  const [state, formAction, pending] = useActionState<
    SettingsActionState | null,
    FormData
  >(setActiveTheme, null);

  return (
    <div className="max-w-4xl space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        {THEME_CATALOG.map((theme) => {
          const isActive = theme.id === activeThemeId;

          return (
            <form key={theme.id} action={formAction}>
              <input type="hidden" name="themeId" value={theme.id} />
              <button
                type="submit"
                disabled={pending || isActive}
                data-theme={theme.id}
                className={cn(
                  "theme-preview-card group w-full rounded-2xl border p-4 text-left transition-all duration-350 ease-luxury",
                  isActive
                    ? "border-accent ring-2 ring-accent/40"
                    : "border-border/70 hover:border-accent/50 hover:shadow-md"
                )}
              >
                <div className="mb-4 flex gap-2">
                  {theme.swatches.map((color) => (
                    <span
                      key={color}
                      className="size-8 rounded-full border border-border/50 shadow-sm"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <p className="font-serif text-xl text-primary">{theme.label}</p>
                <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                  {theme.description}
                </p>
                <p className="mt-4 text-xs font-medium uppercase tracking-wider text-accent">
                  {isActive ? "Active" : pending ? "Applying…" : "Use this theme"}
                </p>
              </button>
            </form>
          );
        })}
      </div>

      {state?.error && (
        <p className="text-destructive text-sm" role="alert">
          {state.error}
        </p>
      )}
      {state?.success && state.message && (
        <p className="text-sm text-primary" role="status">
          {state.message}
        </p>
      )}

      <p className="text-muted-foreground text-xs leading-relaxed">
        Booking, auth, and client tools stay readable in every theme. Heavy
        animation effects are toned down on mobile for performance.
      </p>
    </div>
  );
}
