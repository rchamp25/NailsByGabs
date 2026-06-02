"use client";

import { useEffect, useState } from "react";

type Dot = {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
};

const MAX_DOTS = 12;

export function CursorFloralTrail() {
  const [dots, setDots] = useState<Dot[]>([]);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const canHover = window.matchMedia("(hover: hover)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setEnabled(canHover && !reduced);
    if (!canHover || reduced) return;

    let id = 0;
    const onMove = (event: MouseEvent) => {
      const nextDot: Dot = {
        id: id++,
        x: event.clientX,
        y: event.clientY,
        size: 4 + Math.random() * 6,
        opacity: 0.14 + Math.random() * 0.16,
      };
      setDots((current) => [nextDot, ...current].slice(0, MAX_DOTS));
    };

    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  if (!enabled) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[90] hidden md:block">
      {dots.map((dot, index) => (
        <span
          key={dot.id}
          className="absolute rounded-full bg-[var(--color-gold)] transition-transform duration-500 ease-out"
          style={{
            left: dot.x,
            top: dot.y,
            width: dot.size,
            height: dot.size,
            opacity: Math.max(0.04, dot.opacity - index * 0.015),
            transform: "translate(-50%, -50%)",
            filter: "blur(0.3px)",
          }}
        />
      ))}
    </div>
  );
}
