"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { ArrowDown, ArrowUp, ArrowUpToLine } from "lucide-react";

import { reorderPhotos, savePhoto, type PhotoActionState } from "@/app/photos/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { autoTitle, STYLE_TAGS, type StyleTag } from "@/lib/portfolio";
import type { ManagedPhoto } from "@/lib/portfolio-photos";
import { cn } from "@/lib/utils";

type Filter = "review" | "all" | "carousel";

type PhotoManagerProps = {
  photos: ManagedPhoto[];
  /** False until migration 015 is applied; editing is disabled. */
  tableReady: boolean;
};

function sameTags(a: StyleTag[], b: StyleTag[]): boolean {
  return a.length === b.length && a.every((tag) => b.includes(tag));
}

/** Owner gallery editor: review tags, set titles, pick carousel photos, reorder. */
export function PhotoManager({ photos, tableReady }: PhotoManagerProps) {
  const [order, setOrder] = useState(() => photos.map((photo) => photo.fileName));
  const [filter, setFilter] = useState<Filter>(() =>
    photos.some((photo) => photo.needsReview) ? "review" : "all"
  );
  const [orderPending, startOrderTransition] = useTransition();
  const [orderError, setOrderError] = useState<string | null>(null);

  const byFile = useMemo(() => new Map(photos.map((photo) => [photo.fileName, photo])), [photos]);
  const ordered = useMemo(() => {
    const known = order.filter((file) => byFile.has(file));
    const added = photos.filter((photo) => !known.includes(photo.fileName)).map((p) => p.fileName);
    return [...added, ...known].map((file) => byFile.get(file)!);
  }, [order, byFile, photos]);

  const counts = {
    review: photos.filter((photo) => photo.needsReview).length,
    all: photos.length,
    carousel: photos.filter((photo) => photo.featured).length,
  };
  const visible = ordered.filter((photo) =>
    filter === "all" ? true : filter === "review" ? photo.needsReview : photo.featured
  );

  function move(file: string, to: "up" | "down" | "top") {
    const next = ordered.map((photo) => photo.fileName);
    const index = next.indexOf(file);
    if (index < 0) return;
    next.splice(index, 1);
    const target = to === "top" ? 0 : to === "up" ? Math.max(0, index - 1) : Math.min(next.length, index + 1);
    next.splice(target, 0, file);
    setOrder(next);
    setOrderError(null);
    startOrderTransition(async () => {
      const result = await reorderPhotos(next);
      if (result.error) setOrderError(result.error);
    });
  }

  const filters: { id: Filter; label: string }[] = [
    { id: "review", label: `Needs review (${counts.review})` },
    { id: "all", label: `All photos (${counts.all})` },
    { id: "carousel", label: `In carousel (${counts.carousel})` },
  ];

  return (
    <div className="flex flex-col gap-6">
      {!tableReady && (
        <p className="border-warning/40 text-warning rounded-xl border p-4 text-sm" role="alert">
          Editing is turned off until the database update for photos (migration 015)
          is applied. The gallery keeps showing the current tags in the meantime.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {filters.map(({ id, label }) => (
          <Button
            key={id}
            type="button"
            size="sm"
            variant={filter === id ? "default" : "outline"}
            className="rounded-full"
            aria-pressed={filter === id}
            onClick={() => setFilter(id)}
          >
            {label}
          </Button>
        ))}
      </div>

      {filter === "all" && (
        <p className="text-muted-foreground text-sm">
          Use the arrows to change the order photos appear in on the Portfolio page.
          {orderPending && " Saving order…"}
        </p>
      )}
      {orderError && (
        <p className="text-destructive text-sm" role="alert">
          {orderError}
        </p>
      )}

      {visible.length === 0 ? (
        <p className="text-muted-foreground rounded-xl border border-dashed border-border p-8 text-center text-sm">
          {filter === "review"
            ? "All caught up! Every photo has been checked."
            : "No photos here yet."}
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((photo) => (
            <PhotoCard
              key={photo.fileName}
              photo={photo}
              position={ordered.indexOf(photo) + 1}
              total={ordered.length}
              canReorder={filter === "all"}
              disabled={!tableReady}
              orderPending={orderPending}
              onMove={(to) => move(photo.fileName, to)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PhotoCard({
  photo,
  position,
  total,
  canReorder,
  disabled,
  orderPending,
  onMove,
}: {
  photo: ManagedPhoto;
  position: number;
  total: number;
  canReorder: boolean;
  disabled: boolean;
  orderPending: boolean;
  onMove: (to: "up" | "down" | "top") => void;
}) {
  const [state, formAction, pending] = useActionState<PhotoActionState | null, FormData>(
    savePhoto,
    null
  );
  const [tags, setTags] = useState<StyleTag[]>(photo.tags);
  const [title, setTitle] = useState(photo.customTitle ?? "");
  const [featured, setFeatured] = useState(photo.featured);

  const dirty =
    !sameTags(tags, photo.tags) ||
    title.trim() !== (photo.customTitle ?? "") ||
    featured !== photo.featured;

  function toggleTag(tag: StyleTag) {
    setTags((current) =>
      current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag]
    );
  }

  return (
    <form
      action={formAction}
      className="bg-card text-card-foreground flex flex-col overflow-hidden rounded-2xl border border-border/70"
    >
      <fieldset disabled={disabled} className="contents">
        <input type="hidden" name="file" value={photo.fileName} />
        {tags.map((tag) => (
          <input key={tag} type="hidden" name="tags" value={tag} />
        ))}

        <div className="relative aspect-square w-full sm:aspect-[4/5]">
          <Image
            src={photo.src}
            alt={`NailsByGabs ${photo.title}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
            className="object-cover"
            style={{ objectPosition: photo.focal }}
            priority={position <= 4}
          />
          <span
            className={cn(
              "absolute top-3 left-3 rounded-full px-2.5 py-1 text-xs font-semibold",
              photo.needsReview
                ? "bg-amber-500/90 text-amber-950"
                : "bg-emerald-500/90 text-emerald-950"
            )}
          >
            {photo.needsReview ? "Needs review" : "Confirmed ✓"}
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-4 p-4">
          <p className="text-muted-foreground text-xs">
            #{position} of {total} · {photo.fileName.replace(/\.webp$/, "")}
          </p>

          <div className="space-y-1.5">
            <Label htmlFor={`title-${photo.fileName}`}>Title</Label>
            <Input
              id={`title-${photo.fileName}`}
              name="title"
              value={title}
              maxLength={60}
              placeholder={autoTitle(tags)}
              onChange={(event) => setTitle(event.target.value)}
            />
            <p className="text-muted-foreground text-xs">Leave blank to use the tags.</p>
          </div>

          <div className="space-y-1.5">
            <p className="text-sm font-medium">Style tags</p>
            <div className="flex flex-wrap gap-1.5">
              {STYLE_TAGS.map((tag) => {
                const selected = tags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      selected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="featured"
              checked={featured}
              onChange={(event) => setFeatured(event.target.checked)}
              className="size-4 accent-[var(--primary)]"
            />
            Show in the moving carousel
          </label>

          {canReorder && (
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground mr-1 text-xs">Order</span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Move to top"
                disabled={orderPending || position === 1}
                onClick={() => onMove("top")}
              >
                <ArrowUpToLine className="size-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Move up"
                disabled={orderPending || position === 1}
                onClick={() => onMove("up")}
              >
                <ArrowUp className="size-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Move down"
                disabled={orderPending || position === total}
                onClick={() => onMove("down")}
              >
                <ArrowDown className="size-4" />
              </Button>
            </div>
          )}

          {state?.error && (
            <p className="text-destructive text-sm" role="alert">
              {state.error}
            </p>
          )}

          <Button
            type="submit"
            className="mt-auto"
            disabled={pending || (!dirty && !photo.needsReview)}
          >
            {pending
              ? "Saving…"
              : dirty
                ? "Save changes"
                : photo.needsReview
                  ? "Looks right ✓"
                  : "Confirmed ✓"}
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
