"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";

import { Button } from "@/components/ui/button";

type FeaturedImage = {
  src: string;
  title: string;
  focal: string;
};

type PortfolioFeaturedCarouselProps = {
  images: FeaturedImage[];
};

export function PortfolioFeaturedCarousel({
  images,
}: PortfolioFeaturedCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  function scrollByCard(direction: -1 | 1) {
    const node = scrollerRef.current;
    if (!node) return;
    const card = node.querySelector<HTMLElement>("[data-carousel-card]");
    const amount = card ? card.offsetWidth + 16 : node.clientWidth * 0.85;
    node.scrollBy({ left: direction * amount, behavior: "smooth" });
  }

  if (images.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="section-kicker text-muted-foreground text-xs uppercase tracking-widest text-accent">
            Featured
          </p>
          <h3 className="font-serif mt-1 text-2xl text-primary md:text-3xl">
            This week&apos;s favorites
          </h3>
        </div>
        <div className="hidden gap-2 sm:flex">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => scrollByCard(-1)}
            aria-label="Previous featured set"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => scrollByCard(1)}
            aria-label="Next featured set"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {images.map((image) => (
          <Link
            key={image.src}
            href="/book"
            data-carousel-card
            className="motion-card relative aspect-[4/5] w-[min(78vw,280px)] shrink-0 snap-center overflow-hidden rounded-2xl border border-border/60"
          >
            <Image
              src={image.src}
              alt={`Featured ${image.title}`}
              fill
              sizes="280px"
              className="object-cover transition-transform duration-500 ease-emphasis hover:scale-[1.03]"
              style={{ objectPosition: image.focal }}
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4">
              <p className="font-medium text-white">{image.title}</p>
              <p className="text-xs text-white/75">Tap to book</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
