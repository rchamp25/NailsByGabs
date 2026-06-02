"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

type PortfolioTag =
  | "All"
  | "Aura"
  | "Blooming"
  | "Fun"
  | "Fruit"
  | "Ombre"
  | "French"
  | "Chrome"
  | "Cat Eye";

type PortfolioImage = {
  src: string;
  title: string;
  fileName: string;
  focal: string;
};

const portfolioImages: PortfolioImage[] = [
  {
    src: "/portfolio/3DGelNails.jpeg",
    title: "3D Gel Nails",
    fileName: "3DGelNails.jpeg",
    focal: "50% 40%",
  },
  {
    src: "/portfolio/AuraNails1.jpeg",
    title: "Aura Nails 1",
    fileName: "AuraNails1.jpeg",
    focal: "50% 45%",
  },
  {
    src: "/portfolio/BloomingGel.jpeg",
    title: "Blooming Gel",
    fileName: "BloomingGel.jpeg",
    focal: "52% 42%",
  },
  {
    src: "/portfolio/FrenchWChrome.jpeg",
    title: "French with Chrome",
    fileName: "FrenchWChrome.jpeg",
    focal: "50% 42%",
  },
  {
    src: "/portfolio/FruitNails1.jpeg",
    title: "Fruit Nails 1",
    fileName: "FruitNails1.jpeg",
    focal: "50% 38%",
  },
  {
    src: "/portfolio/FunNails1.jpeg",
    title: "Fun Nails 1",
    fileName: "FunNails1.jpeg",
    focal: "50% 45%",
  },
  {
    src: "/portfolio/FunNails2.jpeg",
    title: "Fun Nails 2",
    fileName: "FunNails2.jpeg",
    focal: "50% 46%",
  },
  {
    src: "/portfolio/FunNails3.jpeg",
    title: "Fun Nails 3",
    fileName: "FunNails3.jpeg",
    focal: "50% 44%",
  },
  {
    src: "/portfolio/FunNails4.jpeg",
    title: "Fun Nails 4",
    fileName: "FunNails4.jpeg",
    focal: "50% 40%",
  },
  {
    src: "/portfolio/FunNails5.jpeg",
    title: "Fun Nails 5",
    fileName: "FunNails5.jpeg",
    focal: "50% 45%",
  },
  {
    src: "/portfolio/IsolatedChromeNails1.jpeg",
    title: "Isolated Chrome Nails 1",
    fileName: "IsolatedChromeNails1.jpeg",
    focal: "50% 42%",
  },
  {
    src: "/portfolio/Ombre1.jpeg",
    title: "Ombre 1",
    fileName: "Ombre1.jpeg",
    focal: "50% 43%",
  },
];

const tags: PortfolioTag[] = [
  "All",
  "Aura",
  "Blooming",
  "Fun",
  "Fruit",
  "Ombre",
  "French",
  "Chrome",
  "Cat Eye",
];

const fileNameMatchers: Record<Exclude<PortfolioTag, "All">, string[]> = {
  Aura: ["aura"],
  Blooming: ["blooming"],
  Fun: ["fun"],
  Fruit: ["fruit"],
  Ombre: ["ombre"],
  French: ["french"],
  Chrome: ["chrome"],
  "Cat Eye": ["cateye", "cat_eye", "cat-eye", "cat eye"],
};

function normalizeFileName(fileName: string): string {
  return fileName.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function imageMatchesTag(fileName: string, tag: Exclude<PortfolioTag, "All">): boolean {
  const normalized = normalizeFileName(fileName);
  const terms = fileNameMatchers[tag];
  return terms.some((term) => normalized.includes(normalizeFileName(term)));
}

export function PortfolioShowcase() {
  const [activeTag, setActiveTag] = useState<PortfolioTag>("All");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const filtered = useMemo(
    () =>
      activeTag === "All"
        ? portfolioImages
        : portfolioImages.filter((item) => imageMatchesTag(item.fileName, activeTag)),
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
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Button
            key={tag}
            type="button"
            variant={activeTag === tag ? "default" : "outline"}
            size="sm"
            className="rounded-full"
            onClick={() => {
              setActiveTag(tag);
              setActiveIndex(null);
            }}
          >
            {tag}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:gap-5">
        {filtered.map((image, index) => (
          <button
            key={image.src}
            type="button"
            onClick={() => openImage(index)}
            className="gold-ring-hover animate-portfolio-item group relative aspect-square overflow-hidden rounded-2xl border border-border/60 text-left"
            style={{ animationDelay: `${index * 55}ms` }}
          >
            <Image
              src={image.src}
              alt={`NailsByGabs ${image.title}`}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 460px"
              className="object-cover transition-transform duration-500 ease-emphasis group-hover:scale-[1.03]"
              style={{ objectPosition: image.focal }}
              priority={index < 4}
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/45 via-black/15 to-transparent p-3">
              <span className="text-sm font-medium text-white drop-shadow-sm">
                {image.title}
              </span>
            </div>
          </button>
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
                  <p className="font-serif text-xl text-rose-red">{activeImage.title}</p>
                  <p className="text-muted-foreground text-sm">{activeImage.fileName}</p>
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
