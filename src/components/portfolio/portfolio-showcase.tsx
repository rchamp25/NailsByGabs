"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/effects/scroll-reveal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  PORTFOLIO_TAGS,
  portfolioImages,
  type PortfolioImage,
  type PortfolioTag,
} from "@/lib/portfolio";
import { cn } from "@/lib/utils";

export function PortfolioShowcase() {
  const [activeTag, setActiveTag] = useState<PortfolioTag>("All");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const filtered = useMemo(
    () =>
      activeTag === "All"
        ? portfolioImages
        : portfolioImages.filter((item) => item.tags.includes(activeTag)),
    [activeTag]
  );

  const activeImage = activeIndex === null ? null : filtered[activeIndex];

  function openImage(index: number) {
    setActiveIndex(index);
  }

  function closeImage() {
    setActiveIndex(null);
  }

  function shiftImage(step: -1 | 1) {
    if (activeIndex === null) return;
    const total = filtered.length;
    if (total === 0) return;
    const next = (activeIndex + step + total) % total;
    setActiveIndex(next);
  }

  return (
    <div className="flex flex-col gap-6">
      <ScrollReveal>
        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {PORTFOLIO_TAGS.map((tag) => (
            <Button
              key={tag}
              type="button"
              variant={activeTag === tag ? "default" : "outline"}
              size="sm"
              className="shrink-0 rounded-full"
              onClick={() => {
                setActiveTag(tag);
                setActiveIndex(null);
              }}
            >
              {tag}
            </Button>
          ))}
        </div>
      </ScrollReveal>

      <div className="columns-2 gap-4 md:columns-3 lg:gap-5">
        {filtered.map((image, index) => (
          <ScrollReveal key={image.src} className="mb-4 block w-full break-inside-avoid">
            <PortfolioMasonryTile
              image={image}
              index={index}
              onOpen={() => openImage(index)}
            />
          </ScrollReveal>
        ))}
      </div>

      <Dialog open={activeIndex !== null} onOpenChange={(open) => !open && closeImage()}>
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
                  onClick={closeImage}
                  className="absolute top-3 right-3 rounded-full bg-black/45 p-2 text-white transition hover:bg-black/60"
                  aria-label="Close preview"
                >
                  <X className="size-4" />
                </button>
              </div>
              <div className="flex items-center justify-between p-4">
                <div>
                  <p className="font-serif text-xl text-primary">{activeImage.title}</p>
                  <p className="text-muted-foreground text-sm">
                    {activeImage.tags.length > 0
                      ? activeImage.tags.join(" • ")
                      : "NailsByGabs set"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => shiftImage(-1)}
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => shiftImage(1)}
                    aria-label="Next image"
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PortfolioMasonryTile({
  image,
  index,
  onOpen,
}: {
  image: PortfolioImage;
  index: number;
  onOpen: () => void;
}) {
  const tall = index % 5 === 0 || index % 7 === 0;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="motion-card group relative block w-full overflow-hidden rounded-2xl border border-border/60 text-left"
    >
      <div className={cn("relative w-full", tall ? "aspect-[4/5]" : "aspect-square")}>
        <Image
          src={image.src}
          alt={`NailsByGabs ${image.title}`}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 460px"
          className="object-cover transition-transform duration-500 ease-emphasis group-hover:scale-[1.03]"
          style={{ objectPosition: image.focal }}
          priority={index < 4}
        />
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/45 via-black/15 to-transparent p-3">
        <span className="text-sm font-medium text-white drop-shadow-sm">
          {image.title}
        </span>
      </div>
    </button>
  );
}
