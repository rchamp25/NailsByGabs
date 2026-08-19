"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

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
const DRAG_CLICK_THRESHOLD_PX = 8;

function normalizeOffset(value: number, setWidth: number): number {
  if (setWidth <= 0) return value;
  return ((value % setWidth) + setWidth) % setWidth;
}

function CarouselCard({
  image,
  priority,
  onNavigate,
}: {
  image: FeaturedImage;
  priority?: boolean;
  onNavigate: (event: { preventDefault: () => void }) => void;
}) {
  return (
    <Link
      href="/book"
      data-carousel-card
      draggable={false}
      className="motion-card relative aspect-[4/5] w-[min(78vw,280px)] shrink-0 overflow-hidden rounded-2xl border border-border/60"
      onClick={(event) => {
        onNavigate(event);
      }}
    >
      <Image
        src={image.src}
        alt={`Featured ${image.title}`}
        fill
        sizes="280px"
        priority={priority}
        draggable={false}
        className="pointer-events-none object-cover transition-transform duration-500 ease-emphasis hover:scale-[1.03]"
        style={{ objectPosition: image.focal }}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4">
        <p className="font-medium text-white">{image.title}</p>
        <p className="text-xs text-white/75">Tap to book</p>
      </div>
    </Link>
  );
}

export function PortfolioFeaturedCarousel({
  images,
}: PortfolioFeaturedCarouselProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const setWidthRef = useRef(0);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartOffsetRef = useRef(0);
  const didDragRef = useRef(false);
  const isHoveringRef = useRef(false);
  const [offset, setOffset] = useState(0);
  const [setWidth, setSetWidth] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const loopImages =
    images.length > 0 ? [...images, ...images] : [];

  const measureSetWidth = useCallback(() => {
    const track = trackRef.current;
    if (!track || images.length === 0) return;
    const nextSetWidth = track.scrollWidth / 2;
    setWidthRef.current = nextSetWidth;
    setSetWidth(nextSetWidth);
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
    setWidthRef.current = setWidth;
  }, [setWidth]);

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
    if (images.length <= 1 || isPaused || isDragging || setWidth <= 0) return;

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
  }, [images.length, isPaused, isDragging, setWidth]);

  const shift = useCallback((direction: -1 | 1) => {
    const track = trackRef.current;
    const card = track?.querySelector<HTMLElement>("[data-carousel-card]");
    const step = card ? card.offsetWidth + CARD_GAP_PX : 296;
    const width = setWidthRef.current;

    let next = offsetRef.current + direction * step;
    if (width > 0) {
      next = normalizeOffset(next, width);
    }

    offsetRef.current = next;
    setOffset(next);
  }, []);

  const finishDrag = useCallback(() => {
    if (!isDraggingRef.current) return;

    isDraggingRef.current = false;
    setIsDragging(false);

    const width = setWidthRef.current;
    const next = normalizeOffset(offsetRef.current, width);
    offsetRef.current = next;
    setOffset(next);

    if (!isHoveringRef.current) {
      setIsPaused(false);
    }
  }, []);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    isDraggingRef.current = true;
    didDragRef.current = false;
    dragStartXRef.current = event.clientX;
    dragStartOffsetRef.current = offsetRef.current;
    setIsDragging(true);
    setIsPaused(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;

    const delta = dragStartXRef.current - event.clientX;
    if (Math.abs(delta) > DRAG_CLICK_THRESHOLD_PX) {
      didDragRef.current = true;
    }

    let next = dragStartOffsetRef.current + delta;
    const width = setWidthRef.current;
    if (width > 0) {
      next = normalizeOffset(next, width);
    }

    offsetRef.current = next;
    setOffset(next);
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    finishDrag();
  };

  const handleNavigate = useCallback(
    (event: { preventDefault: () => void }) => {
      if (didDragRef.current) {
        event.preventDefault();
      }
    },
    []
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
        ref={viewportRef}
        className="carousel-drag-viewport overflow-hidden pb-2 select-none sm:select-auto"
        style={{ touchAction: "pan-y pinch-zoom" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onMouseEnter={() => {
          isHoveringRef.current = true;
          setIsPaused(true);
        }}
        onMouseLeave={() => {
          isHoveringRef.current = false;
          if (!isDraggingRef.current) {
            setIsPaused(false);
          }
        }}
        onFocusCapture={() => setIsPaused(true)}
        onBlurCapture={() => {
          if (!isDraggingRef.current) {
            setIsPaused(false);
          }
        }}
      >
        <div
          ref={trackRef}
          className="flex w-max gap-4"
          style={{
            transform: `translate3d(-${offset}px, 0, 0)`,
            willChange: "transform",
            cursor: isDragging ? "grabbing" : undefined,
          }}
        >
          {loopImages.map((image, index) => (
            <CarouselCard
              key={`${image.src}-${index}`}
              image={image}
              priority={index < 4}
              onNavigate={handleNavigate}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
