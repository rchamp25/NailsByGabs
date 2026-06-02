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
  | "Cat Eye"
  | "3D";

type PortfolioImage = {
  src: string;
  title: string;
  fileName: string;
  focal: string;
  tags: Exclude<PortfolioTag, "All">[];
};

const portfolioFileNames = [
  "3DGelNails.jpeg",
  "3DWFun.jpeg",
  "AuraNails1.jpeg",
  "Aura2.jpeg",
  "Aura3.jpeg",
  "BloomingGel.jpeg",
  "BloomWAura.jpeg",
  "CatEye1.jpeg",
  "FrenchWChrome.jpeg",
  "French2.jpeg",
  "FruitNails1.jpeg",
  "Fruit2.jpeg",
  "Fruit3.jpeg",
  "Fruit4.jpeg",
  "FunNails1.jpeg",
  "FunNails2.jpeg",
  "FunNails3.jpeg",
  "FunNails4.jpeg",
  "FunNails5.jpeg",
  "Fun6.jpeg",
  "Fun7.jpeg",
  "Fun8.jpeg",
  "Fun9.jpeg",
  "Fun10.jpeg",
  "Fun11W3D.jpeg",
  "FunW3D.jpeg",
  "IsolatedChromeNails1.jpeg",
  "Ombre1.jpeg",
  "Square1.jpeg",
] as const;

const focalByFileName: Record<string, string> = {
  "3DGelNails.jpeg": "50% 40%",
  "AuraNails1.jpeg": "50% 45%",
  "BloomingGel.jpeg": "52% 42%",
  "FrenchWChrome.jpeg": "50% 42%",
  "FruitNails1.jpeg": "50% 38%",
  "FunNails1.jpeg": "50% 45%",
  "FunNails2.jpeg": "50% 46%",
  "FunNails3.jpeg": "50% 44%",
  "FunNails4.jpeg": "50% 40%",
  "FunNails5.jpeg": "50% 45%",
  "IsolatedChromeNails1.jpeg": "50% 42%",
  "Ombre1.jpeg": "50% 43%",
};

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
  "3D",
];

const fileNameMatchers: Record<Exclude<PortfolioTag, "All">, string[]> = {
  Aura: ["aura"],
  Blooming: ["blooming", "bloom"],
  Fun: ["fun"],
  Fruit: ["fruit"],
  Ombre: ["ombre"],
  French: ["french"],
  Chrome: ["chrome"],
  "Cat Eye": ["cateye", "cat_eye", "cat-eye", "cat eye"],
  "3D": ["3d"],
};

function normalizeFileName(fileName: string): string {
  return fileName.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function imageMatchesTag(fileName: string, tag: Exclude<PortfolioTag, "All">): boolean {
  const normalized = normalizeFileName(fileName);
  const terms = fileNameMatchers[tag];
  return terms.some((term) => normalized.includes(normalizeFileName(term)));
}

function detectTags(fileName: string): Exclude<PortfolioTag, "All">[] {
  return (Object.keys(fileNameMatchers) as Exclude<PortfolioTag, "All">[]).filter(
    (tag) => imageMatchesTag(fileName, tag)
  );
}

function prettifyType(raw: string): string {
  const cleaned = raw.replace(/\d+/g, "");
  if (!cleaned) return "";
  const normalized = normalizeFileName(cleaned);
  const matchedTag = (Object.keys(fileNameMatchers) as Exclude<PortfolioTag, "All">[]).find(
    (tag) =>
      fileNameMatchers[tag].some((term) =>
        normalized.includes(normalizeFileName(term))
      )
  );
  if (matchedTag) return matchedTag;
  return cleaned.replace(/([a-z])([A-Z])/g, "$1 $2").trim();
}

function titleFromFileName(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, "");
  const parts = base.split("W").map(prettifyType).filter(Boolean);
  if (parts.length === 0) return base.replace(/\d+/g, "");
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} & ${parts[1]}`;
  return parts.join(", ");
}

const portfolioImages: PortfolioImage[] = portfolioFileNames.map((fileName) => ({
  src: `/portfolio/${fileName}`,
  title: titleFromFileName(fileName),
  fileName,
  focal: focalByFileName[fileName] ?? "50% 45%",
  tags: detectTags(fileName),
}));

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
