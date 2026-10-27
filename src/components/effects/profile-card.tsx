"use client";

import Image from "next/image";
import { useRef } from "react";

import { cn } from "@/lib/utils";

type ProfileCardProps = {
  name: string;
  subtitle: string;
  imageSrc: string;
  imageAlt: string;
  /** CSS object-position for the crop, e.g. to keep a face in frame. */
  imagePosition?: string;
  /**
   * next/image `sizes`. With object-cover the photo must also cover the card's
   * height, so for a landscape photo in a taller card this is wider than the
   * card itself (otherwise the browser downloads too small a file and it blurs).
   */
  sizes?: string;
  /** next/image quality (1-100); the default 75 is fine for thumbnails. */
  quality?: number;
  /** Extra classes; an aspect-* class here replaces the default 4:5 card shape. */
  className?: string;
};

export function ProfileCard({
  name,
  subtitle,
  imageSrc,
  imageAlt,
  imagePosition = "50% 50%",
  sizes = "(max-width: 1024px) 100vw, 480px",
  quality,
  className,
}: ProfileCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  function handleMove(event: React.PointerEvent<HTMLDivElement>) {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    card.style.setProperty("--tilt-x", `${y * -10}deg`);
    card.style.setProperty("--tilt-y", `${x * 10}deg`);
  }

  function resetTilt() {
    const card = cardRef.current;
    if (!card) return;
    card.style.setProperty("--tilt-x", "0deg");
    card.style.setProperty("--tilt-y", "0deg");
  }

  return (
    <div
      ref={cardRef}
      onPointerMove={handleMove}
      onPointerLeave={resetTilt}
      className={cn("profile-card relative aspect-[4/5] overflow-hidden rounded-3xl", className)}
    >
      <Image
        src={imageSrc}
        alt={imageAlt}
        fill
        sizes={sizes}
        quality={quality}
        className="object-cover"
        style={{ objectPosition: imagePosition }}
        priority
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-5">
        <p className="font-serif text-2xl text-white">{name}</p>
        <p className="text-sm text-white/80">{subtitle}</p>
      </div>
    </div>
  );
}
