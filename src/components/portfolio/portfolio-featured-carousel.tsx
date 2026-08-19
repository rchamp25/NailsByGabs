"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

type FeaturedImage = {
  src: string;
  title: string;
  focal: string;
};

type PortfolioFeaturedCarouselProps = {
  images: FeaturedImage[];
};

const SCROLL_SPEED_PX_PER_SEC = 84;
const CARD_GAP_PX = 16;

function CarouselCard({
  image,
  priority,
}: {
  image: FeaturedImage;
  priority?: boolean;
}) {
  return (
    <Link
      href="/book"
      data-carousel-card
      className="motion-card relative aspect-[4/5] w-[min(78vw,280px)] shrink-0 overflow-hidden rounded-2xl border border-border/60"
    >
      <Image
        src={image.src}
        alt={`Featured ${image.title}`}
        fill
        sizes="280px"
        priority={priority}
        className="object-cover transition-transform duration-500 ease-emphasis hover:scale-[1.03]"
        style={{ objectPosition: image.focal }}
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4">
        <p className="font-medium text-white">{image.title}</p>
        <p className="text-xs text-white/75">Tap to book</p>
      </div>
    </Link>
  );
}

export function PortfolioFeaturedCarousel({
  images,
}: PortfolioFeaturedCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const [offset, setOffset] = useState(0);
  const [setWidth, setSetWidth] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const loopImages =
    images.length > 0 ? [...images, ...images] : [];

  const measureSetWidth = useCallback(() => {
    const track = trackRef.current;
    if (!track || images.length === 0) return;
    setSetWidth(track.scrollWidth / 2);
  }, [images.length]);

  useEffect(() => {
    measureSetWidth();
    const track = trackRef.current;
    if (!track) return;

    const observer = new ResizeObserver(measureSetWidth);
    observer.observe(track);
    return () => observer.disconnect();
  }, [measureSetWidth]);

  useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) setIsPaused(true);

    function onChange(event: MediaQueryListEvent) {
      if (event.matches) setIsPaused(true);
    }

    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (images.length <= 1 || isPaused || setWidth <= 0) return;

    let rafId = 0;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const deltaSeconds = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      let next = offsetRef.current + SCROLL_SPEED_PX_PER_SEC * deltaSeconds;
      if (next >= setWidth) {
        next -= setWidth;
      }

      offsetRef.current = next;
      setOffset(next);
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [images.length, isPaused, setWidth]);

  const shift = useCallback(
    (direction: -1 | 1) => {
      const track = trackRef.current;
      const card = track?.querySelector<HTMLElement>("[data-carousel-card]");
      const step = card ? card.offsetWidth + CARD_GAP_PX : 296;

      let next = offsetRef.current + direction * step;
      if (setWidth > 0) {
        next = ((next % setWidth) + setWidth) % setWidth;
      }

      offsetRef.current = next;
      setOffset(next);
    },
    [setWidth]
  );

  if (images.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="section-kicker text-muted-foreground text-xs uppercase tracking-widest text-accent">
            Featured
          </p>
          <h3 className="font-serif mt-1 text-2xl text-primary md:text-3xl">
            Every set
          </h3>
        </div>
        <div className="hidden gap-2 sm:flex">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => shift(-1)}
            aria-label="Previous featured set"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => shift(1)}
            aria-label="Next featured set"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div
        className="overflow-hidden pb-2"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onFocusCapture={() => setIsPaused(true)}
        onBlurCapture={() => setIsPaused(false)}
      >
        <div
          ref={trackRef}
          className="flex w-max gap-4"
          style={{
            transform: `translate3d(-${offset}px, 0, 0)`,
            willChange: "transform",
          }}
        >
          {loopImages.map((image, index) => (
            <CarouselCard
              key={`${image.src}-${index}`}
              image={image}
              priority={index < 4}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
