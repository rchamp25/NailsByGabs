"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

type RotatingTextProps = {
  words: string[];
  intervalMs?: number;
  className?: string;
};

export function RotatingText({
  words,
  intervalMs = 2800,
  className,
}: RotatingTextProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (words.length <= 1) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % words.length);
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs, words.length]);

  return (
    <span
      className={cn(
        "inline-flex min-h-[1.2em] items-center overflow-hidden",
        className
      )}
      aria-live="polite"
    >
      <span
        key={words[index]}
        className="animate-rotate-word inline-block bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent"
      >
        {words[index]}
      </span>
    </span>
  );
}
