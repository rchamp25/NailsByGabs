"use client";

import { useActionState, useEffect, useState } from "react";
import { CalendarClock } from "lucide-react";

import {
  cancelThemeRevert,
  setActiveTheme,
  type SettingsActionState,
} from "@/app/settings/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getThemeMeta, THEME_CATALOG, type ThemeId } from "@/lib/themes";
import { cn } from "@/lib/utils";

type ThemePickerProps = {
  activeThemeId: ThemeId;
  /** Scheduled automatic switch back, already formatted in Eastern time. */
  schedule: { label: string; when: string } | null;
  /** Suggested switch-back time per seasonal theme (datetime-local, Eastern). */
  defaultRevertAt: Partial<Record<ThemeId, string>>;
  defaultRevertTo: ThemeId;
};

const everydayThemes = THEME_CATALOG.filter((theme) => !theme.seasonal);

function ActionFeedback({ state }: { state: SettingsActionState | null }) {
  if (state?.error) {
    return (
      <p className="text-destructive text-sm" role="alert">
        {state.error}
      </p>
    );
  }
  if (state?.success && state.message) {
    return (
      <p className="text-sm text-primary" role="status">
        {state.message}
      </p>
    );
  }
  return null;
}

export function ThemePicker({
  activeThemeId,
  schedule,
  defaultRevertAt,
  defaultRevertTo,
}: ThemePickerProps) {
  const [state, formAction, pending] = useActionState<
    SettingsActionState | null,
    FormData
  >(setActiveTheme, null);
  const [cancelState, cancelAction, cancelPending] = useActionState<
    SettingsActionState | null,
    FormData
  >(cancelThemeRevert, null);
  const [seasonalThemeId, setSeasonalThemeId] = useState<ThemeId | null>(null);
  const [autoRevert, setAutoRevert] = useState(true);

  useEffect(() => {
    if (state?.success) setSeasonalThemeId(null);
  }, [state]);

  const seasonalTheme = seasonalThemeId ? getThemeMeta(seasonalThemeId) : null;

  return (
    <div className="max-w-5xl space-y-4">
      {schedule && (
        <div className="border-accent/40 bg-card flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2 text-sm">
            <CalendarClock className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
            <span>
              Switches back to <strong>{schedule.label}</strong> on{" "}
              <strong>{schedule.when}</strong> (Eastern).
            </span>
          </p>
          <form action={cancelAction}>
            <Button type="submit" variant="outline" size="sm" disabled={cancelPending}>
              {cancelPending ? "Cancelling…" : "Keep this theme"}
            </Button>
          </form>
        </div>
      )}
      <ActionFeedback state={cancelState} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {THEME_CATALOG.map((theme) => {
          const isActive = theme.id === activeThemeId;
          const cardClassName = cn(
            "theme-preview-card group bg-background text-foreground w-full rounded-2xl border p-4 text-left transition-all duration-350 ease-luxury",
            isActive
              ? "border-accent ring-2 ring-accent/40"
              : "border-border/70 hover:border-accent/50 hover:shadow-md"
          );
          const cardBody = (
            <>
              <div className="mb-4 flex items-center gap-2">
                {theme.swatches.map((color) => (
                  <span
                    key={color}
                    className="size-8 rounded-full border border-border/50 shadow-sm"
                    style={{ backgroundColor: color }}
                  />
                ))}
                {theme.seasonal && (
                  <span className="ml-auto rounded-full border border-accent/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
                    Seasonal
                  </span>
                )}
              </div>
              <p className="font-serif text-xl text-primary">{theme.label}</p>
              <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                {theme.description}
              </p>
              <p className="mt-4 text-xs font-medium uppercase tracking-wider text-accent">
                {isActive ? "Active" : pending ? "Applying…" : "Use this theme"}
              </p>
            </>
          );

          if (theme.seasonal) {
            return (
              <button
                key={theme.id}
                type="button"
                disabled={pending || isActive}
                data-theme={theme.id}
                className={cardClassName}
                onClick={() => {
                  setAutoRevert(true);
                  setSeasonalThemeId(theme.id);
                }}
              >
                {cardBody}
              </button>
            );
          }

          return (
            <form key={theme.id} action={formAction}>
              <input type="hidden" name="themeId" value={theme.id} />
              <button
                type="submit"
                disabled={pending || isActive}
                data-theme={theme.id}
                className={cardClassName}
              >
                {cardBody}
              </button>
            </form>
          );
        })}
      </div>

      <ActionFeedback state={state} />

      <p className="text-muted-foreground text-xs leading-relaxed">
        Booking, auth, and client tools stay readable in every theme. Heavy
        animation effects are toned down on mobile for performance.
      </p>

      <Dialog
        open={seasonalTheme !== null}
        onOpenChange={(open) => !open && setSeasonalThemeId(null)}
      >
        <DialogContent className="sm:max-w-md">
          {seasonalTheme && (
            <form action={formAction} className="space-y-5">
              <DialogHeader>
                <DialogTitle>Turn on {seasonalTheme.label}?</DialogTitle>
                <DialogDescription>
                  Every visitor sees it on their next page load. Choose when the
                  site should switch back on its own.
                </DialogDescription>
              </DialogHeader>

              <input type="hidden" name="themeId" value={seasonalTheme.id} />

              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  name="autoRevert"
                  checked={autoRevert}
                  onChange={(event) => setAutoRevert(event.target.checked)}
                  className="size-4 accent-[var(--primary)]"
                />
                Switch back automatically
              </label>

              <div
                className={cn("space-y-4", !autoRevert && "pointer-events-none opacity-50")}
                aria-disabled={!autoRevert}
              >
                <div className="space-y-2">
                  <Label htmlFor="revertAt">Switch back on (Eastern time)</Label>
                  <Input
                    id="revertAt"
                    name="revertAt"
                    type="datetime-local"
                    defaultValue={defaultRevertAt[seasonalTheme.id]}
                    required={autoRevert}
                    disabled={!autoRevert}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="revertTo">Switch back to</Label>
                  <select
                    id="revertTo"
                    name="revertTo"
                    defaultValue={defaultRevertTo}
                    disabled={!autoRevert}
                    className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                  >
                    {everydayThemes.map((theme) => (
                      <option key={theme.id} value={theme.id}>
                        {theme.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {!autoRevert && (
                <p className="text-muted-foreground text-xs">
                  {seasonalTheme.label} stays on until you pick another theme here.
                </p>
              )}

              {state?.error && (
                <p className="text-destructive text-sm" role="alert">
                  {state.error}
                </p>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSeasonalThemeId(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending ? "Turning on…" : `Turn on ${seasonalTheme.label}`}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
