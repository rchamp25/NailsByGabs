"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

import { PortfolioLightbox } from "@/components/portfolio/portfolio-lightbox";
import { Button } from "@/components/ui/button";
import type { PortfolioImage } from "@/lib/portfolio";

type PortfolioFeaturedCarouselProps = {
  images: PortfolioImage[];
};

const SCROLL_SPEED_PX_PER_SEC = 84;
const CARD_GAP_PX = 16;
const DRAG_CLICK_THRESHOLD_PX = 8;
const AXIS_COMMIT_PX = 8;
const AXIS_LOCK_RATIO = 1.15;
/**
 * Cards repeated after the real set so the loop is seamless: enough to cover
 * the widest viewport (8 x 296px). Far cheaper than a full second copy.
 */
const LOOP_CLONES = 8;

type DragIntent = "none" | "pending" | "horizontal" | "vertical";

function normalizeOffset(value: number, setWidth: number): number {
  if (setWidth <= 0) return value;
  return ((value % setWidth) + setWidth) % setWidth;
}

/** Memoized: carousel state changes (e.g. opening the preview) never re-render the cards. */
const CarouselCard = memo(function CarouselCard({
  image,
  index,
  priority,
  onOpen,
}: {
  image: PortfolioImage;
  /** Index into the real (un-cloned) images list. */
  index: number;
  priority?: boolean;
  onOpen: (index: number) => void;
}) {
  return (
    <button
      type="button"
      data-carousel-card
      data-carousel-index={index}
      draggable={false}
      aria-label={`View ${image.title} full screen`}
      className="motion-card relative aspect-[4/5] w-[min(78vw,280px)] shrink-0 overflow-hidden rounded-2xl border border-border/60 text-left"
      onClick={() => onOpen(index)}
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
      </div>
    </button>
  );
});

/**
 * Auto-scrolling, draggable, infinite carousel.
 *
 * Performance rules (each one fixed a real problem):
 * - The scroll offset, drag state and pause state live in refs and the DOM,
 *   never in React state. State updates here re-rendered every card: per
 *   frame it starved navigations; per touch it froze the start of each drag.
 * - One requestAnimationFrame loop runs for the component's lifetime and
 *   simply skips advancing while paused.
 * - Only LOOP_CLONES cards are duplicated for the seamless wrap.
 */
export function PortfolioFeaturedCarousel({
  images,
}: PortfolioFeaturedCarouselProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  /** Width of one pass through the real images (where the loop wraps). */
  const setWidthRef = useRef(0);
  const draggingRef = useRef(false);
  const reducedMotionRef = useRef(false);
  const lightboxOpenRef = useRef(false);
  const dragIntentRef = useRef<DragIntent>("none");
  const activePointerIdRef = useRef<number | null>(null);
  const dragStartXRef = useRef(0);
  const dragStartYRef = useRef(0);
  const dragStartOffsetRef = useRef(0);
  const didDragRef = useRef(false);
  const dragRafRef = useRef(0);
  /** Card under the pointer at pointerdown, so a mouse click (no drag) can open it. */
  const pressedIndexRef = useRef<number | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const loopImages =
    images.length > 1
      ? [...images, ...images.slice(0, Math.min(LOOP_CLONES, images.length))]
      : images;

  const applyOffset = useCallback((next: number) => {
    offsetRef.current = next;
    const track = trackRef.current;
    if (track) {
      track.style.transform = `translate3d(-${next}px, 0, 0)`;
    }
  }, []);

  const scheduleDragOffset = useCallback((next: number) => {
    // Wrap while dragging so content never runs out at either end.
    offsetRef.current = normalizeOffset(next, setWidthRef.current);
    if (dragRafRef.current) return;

    dragRafRef.current = window.requestAnimationFrame(() => {
      dragRafRef.current = 0;
      const track = trackRef.current;
      if (track) {
        track.style.transform = `translate3d(-${offsetRef.current}px, 0, 0)`;
      }
    });
  }, []);

  // Loop width = position of the first clone (the real set's full width incl. gaps).
  useEffect(() => {
    const track = trackRef.current;
    if (!track || images.length <= 1) return;

    const measure = () => {
      const firstClone = track.children[images.length] as HTMLElement | undefined;
      const first = track.children[0] as HTMLElement | undefined;
      if (!firstClone || !first) return;
      setWidthRef.current = firstClone.offsetLeft - first.offsetLeft;
      applyOffset(normalizeOffset(offsetRef.current, setWidthRef.current));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
  }, [images.length, applyOffset]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotionRef.current = media.matches;
    const onChange = (event: MediaQueryListEvent) => {
      reducedMotionRef.current = event.matches;
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    lightboxOpenRef.current = lightboxIndex !== null;
  }, [lightboxIndex]);

  // Single auto-scroll loop; it skips advancing while paused instead of restarting.
  useEffect(() => {
    if (images.length <= 1) return;

    let rafId = 0;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const deltaSeconds = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const width = setWidthRef.current;
      const paused =
        draggingRef.current || reducedMotionRef.current || lightboxOpenRef.current;

      if (!paused && width > 0) {
        let next = offsetRef.current + SCROLL_SPEED_PX_PER_SEC * deltaSeconds;
        if (next >= width) next -= width;
        applyOffset(next);
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
      if (dragRafRef.current) cancelAnimationFrame(dragRafRef.current);
    };
  }, [images.length, applyOffset]);

  const shift = useCallback(
    (direction: -1 | 1) => {
      const track = trackRef.current;
      const card = track?.querySelector<HTMLElement>("[data-carousel-card]");
      const step = card ? card.offsetWidth + CARD_GAP_PX : 296;
      applyOffset(normalizeOffset(offsetRef.current + direction * step, setWidthRef.current));
    },
    [applyOffset]
  );

  const setDragging = useCallback((dragging: boolean) => {
    draggingRef.current = dragging;
    if (trackRef.current) trackRef.current.style.cursor = dragging ? "grabbing" : "";
  }, []);

  const resetDrag = useCallback(() => {
    dragIntentRef.current = "none";
    activePointerIdRef.current = null;
    setDragging(false);
  }, [setDragging]);

  const commitHorizontalDrag = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      dragIntentRef.current = "horizontal";
      setDragging(true);
      activePointerIdRef.current = event.pointerId;
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [setDragging]
  );

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    dragIntentRef.current =
      event.pointerType === "touch" ? "pending" : "horizontal";
    activePointerIdRef.current = event.pointerId;
    dragStartXRef.current = event.clientX;
    dragStartYRef.current = event.clientY;
    dragStartOffsetRef.current = offsetRef.current;
    didDragRef.current = false;
    const pressed = (event.target as Element).closest("[data-carousel-index]");
    pressedIndexRef.current = pressed
      ? Number(pressed.getAttribute("data-carousel-index"))
      : null;

    if (event.pointerType === "mouse") {
      commitHorizontalDrag(event);
    }
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (
      activePointerIdRef.current !== null &&
      event.pointerId !== activePointerIdRef.current
    ) {
      return;
    }

    const deltaX = dragStartXRef.current - event.clientX;
    const deltaY = dragStartYRef.current - event.clientY;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (dragIntentRef.current === "pending") {
      if (absX < AXIS_COMMIT_PX && absY < AXIS_COMMIT_PX) return;

      if (absY > absX * AXIS_LOCK_RATIO) {
        // Vertical swipe: let the page scroll.
        dragIntentRef.current = "vertical";
        activePointerIdRef.current = null;
        return;
      }
      if (absX <= absY * AXIS_LOCK_RATIO) return;
      commitHorizontalDrag(event);
    }

    if (dragIntentRef.current !== "horizontal") return;

    if (absX > DRAG_CLICK_THRESHOLD_PX) {
      didDragRef.current = true;
    }
    scheduleDragOffset(dragStartOffsetRef.current + deltaX);
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (
      activePointerIdRef.current !== null &&
      event.pointerId !== activePointerIdRef.current
    ) {
      return;
    }

    if (
      dragIntentRef.current === "horizontal" &&
      event.currentTarget.hasPointerCapture(event.pointerId)
    ) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    // Mouse presses capture the pointer for dragging, so the card never gets
    // its click event; a press without movement opens the preview here.
    if (
      dragIntentRef.current === "horizontal" &&
      event.type === "pointerup" &&
      event.pointerType === "mouse" &&
      !didDragRef.current &&
      pressedIndexRef.current !== null
    ) {
      setLightboxIndex(pressedIndexRef.current);
    }

    resetDrag();
  };

  /** Touch taps and keyboard activation reach the card's own click handler. */
  const openFromCard = useCallback((index: number) => {
    if (!didDragRef.current) setLightboxIndex(index);
  }, []);

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
        className="carousel-drag-viewport overflow-hidden pb-2 sm:select-auto"
        style={{ touchAction: "pan-y pinch-zoom" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div ref={trackRef} className="flex w-max gap-4" style={{ willChange: "transform" }}>
          {loopImages.map((image, position) => (
            <CarouselCard
              key={`${image.src}-${position}`}
              image={image}
              index={position % images.length}
              priority={position < 4}
              onOpen={openFromCard}
            />
          ))}
        </div>
      </div>

      <PortfolioLightbox images={images} index={lightboxIndex} onIndexChange={setLightboxIndex} />
    </section>
  );
}
