"use client";

import Image from "next/image";
import { X } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PortfolioImage } from "@/lib/portfolio";

type PortfolioLightboxProps = {
  images: PortfolioImage[];
  /** Index into `images` of the open photo, or null when closed. */
  index: number | null;
  onIndexChange: (index: number | null) => void;
};

/**
 * Full-screen preview of one photo, shared by the gallery grid and the
 * carousel. Previous/next arrows were removed on request: fast clicks showed
 * the new caption before the large photo had loaded.
 */
export function PortfolioLightbox({ images, index, onIndexChange }: PortfolioLightboxProps) {
  const activeImage = index === null ? null : images[index];

  return (
    <Dialog open={activeImage != null} onOpenChange={(open) => !open && onIndexChange(null)}>
      <DialogContent className="max-w-4xl border-border/80 bg-card/95 p-0 backdrop-blur-md">
        <DialogTitle className="sr-only">
          {activeImage ? `Portfolio ${activeImage.title}` : "Portfolio image"}
        </DialogTitle>
        <DialogDescription className="sr-only">
          View and navigate NailsByGabs portfolio images.
        </DialogDescription>
        {activeImage && (
          <div className="relative flex flex-col">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-t-xl md:aspect-[16/10]">
              <Image
                src={activeImage.src}
                alt={`NailsByGabs ${activeImage.title}`}
                fill
                sizes="90vw"
                className="object-cover"
                style={{ objectPosition: activeImage.focal }}
              />
              <button
                type="button"
                onClick={() => onIndexChange(null)}
                className="absolute top-3 right-3 rounded-full bg-black/45 p-2 text-white transition hover:bg-black/60"
                aria-label="Close preview"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="p-4">
              <p className="font-serif text-xl text-primary">{activeImage.title}</p>
              <p className="text-muted-foreground text-sm">
                {activeImage.tags.length > 0
                  ? activeImage.tags.join(" • ")
                  : "NailsByGabs set"}
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
