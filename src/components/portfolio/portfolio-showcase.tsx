"use client";

import { useMemo, useState } from "react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/effects/scroll-reveal";
import { PortfolioLightbox } from "@/components/portfolio/portfolio-lightbox";
import {
  PORTFOLIO_TAGS,
  type PortfolioImage,
  type PortfolioTag,
} from "@/lib/portfolio";
import { cn } from "@/lib/utils";

export function PortfolioShowcase({ images }: { images: PortfolioImage[] }) {
  const [activeTag, setActiveTag] = useState<PortfolioTag>("All");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const filtered = useMemo(
    () =>
      activeTag === "All"
        ? images
        : images.filter((item) => item.tags.includes(activeTag)),
    [activeTag, images]
  );

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
              aria-pressed={activeTag === tag}
              onClick={() => {
                // Clicking the active filter again clears it; "All" is a no-op.
                if (tag === "All" && activeTag === "All") return;
                setActiveTag(tag === activeTag ? "All" : tag);
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
              onOpen={() => setActiveIndex(index)}
            />
          </ScrollReveal>
        ))}
      </div>

      <PortfolioLightbox images={filtered} index={activeIndex} onIndexChange={setActiveIndex} />
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
