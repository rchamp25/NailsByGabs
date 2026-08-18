"use client";

import Image from "next/image";
import { useRef } from "react";

import { cn } from "@/lib/utils";

type ProfileCardProps = {
  name: string;
  subtitle: string;
  imageSrc: string;
  imageAlt: string;
  className?: string;
};

export function ProfileCard({
  name,
  subtitle,
  imageSrc,
  imageAlt,
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
    card.style.setProperty("--glare-x", `${(x + 0.5) * 100}%`);
    card.style.setProperty("--glare-y", `${(y + 0.5) * 100}%`);
  }

  function resetTilt() {
    const card = cardRef.current;
    if (!card) return;
    card.style.setProperty("--tilt-x", "0deg");
    card.style.setProperty("--tilt-y", "0deg");
    card.style.setProperty("--glare-x", "50%");
    card.style.setProperty("--glare-y", "35%");
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
        sizes="(max-width: 1024px) 100vw, 480px"
        className="object-cover object-center"
        priority
      />
      <div className="profile-card-glare pointer-events-none absolute inset-0" />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-5">
        <p className="font-serif text-2xl text-white">{name}</p>
        <p className="text-sm text-white/80">{subtitle}</p>
      </div>
    </div>
  );
}
