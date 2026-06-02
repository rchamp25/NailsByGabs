import Image from "next/image";

import { SiteHeader } from "@/components/site-header";
import { cn } from "@/lib/utils";

const aspectClasses = [
  "row-span-2",
  "col-span-2",
  "",
  "row-span-2",
  "",
  "col-span-2",
  "row-span-2",
  "",
  "col-span-2",
  "",
  "row-span-2",
  "",
] as const;

const portfolioImages = [
  "/portfolio/IMG_5264.jpeg",
  "/portfolio/IMG_5268.jpeg",
  "/portfolio/IMG_5397.jpeg",
  "/portfolio/IMG_5443.jpeg",
  "/portfolio/IMG_5526.jpeg",
  "/portfolio/IMG_5654.jpeg",
  "/portfolio/IMG_5819.jpeg",
  "/portfolio/IMG_5851.jpeg",
  "/portfolio/IMG_5879.jpeg",
  "/portfolio/IMG_5890.jpeg",
  "/portfolio/IMG_5891.jpeg",
  "/portfolio/IMG_5894.jpeg",
] as const;

const imageAltText = [
  "NailsByGabs portfolio set 1",
  "NailsByGabs portfolio set 2",
  "NailsByGabs portfolio set 3",
  "NailsByGabs portfolio set 4",
  "NailsByGabs portfolio set 5",
  "NailsByGabs portfolio set 6",
  "NailsByGabs portfolio set 7",
  "NailsByGabs portfolio set 8",
  "NailsByGabs portfolio set 9",
  "NailsByGabs portfolio set 10",
  "NailsByGabs portfolio set 11",
  "NailsByGabs portfolio set 12",
] as const;

const overlayByIndex: Record<number, string> = {
  0: "from-rose-red/10 via-transparent to-transparent",
  1: "from-transparent via-transparent to-rose-red/10",
};

const overlayClass = (index: number): string =>
  overlayByIndex[index % 2] ?? "from-transparent via-transparent to-transparent";

export default function PortfolioPage() {
  return (
    <>
      <SiteHeader title="Portfolio" />
      <div className="flex flex-1 flex-col gap-8 p-4 md:p-8">
        <div className="max-w-2xl">
          <p className="text-muted-foreground text-sm uppercase tracking-widest text-gold">
            Nail Art Gallery
          </p>
          <h2 className="font-serif mt-1 text-3xl text-rose-red md:text-4xl">
            Sets crafted with love
          </h2>
          <p className="text-muted-foreground mt-3 text-sm leading-relaxed md:text-base">
            A curated look at recent work by NailsByGabs.
          </p>
        </div>

        <div className="grid auto-rows-[180px] grid-cols-2 gap-4 md:auto-rows-[200px] md:grid-cols-3 lg:gap-5">
          {portfolioImages.map((imageSrc, index) => (
            <figure
              key={imageSrc}
              className={cn(
                "gold-ring-hover animate-portfolio-item group relative overflow-hidden rounded-2xl border border-border/60",
                aspectClasses[index % aspectClasses.length]
              )}
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <Image
                src={imageSrc}
                alt={imageAltText[index]}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 400px"
                className="object-cover object-center transition-transform duration-500 ease-emphasis group-hover:scale-[1.03]"
                priority={index < 3}
              />
              <div
                className={cn(
                  "absolute inset-0 bg-gradient-to-b",
                  overlayClass(index)
                )}
                aria-hidden
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent p-3">
                <span className="text-sm font-medium text-white drop-shadow-sm">
                  NailsByGabs Set {index + 1}
                </span>
              </div>
              <figcaption className="sr-only">
                {imageAltText[index]}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </>
  );
}
