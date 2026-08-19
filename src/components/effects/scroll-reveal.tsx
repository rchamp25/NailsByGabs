"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type ScrollPhase = "above" | "visible" | "below";
type ScrollDirection = "down" | "up";

type ScrollRevealProps = {
  children: React.ReactNode;
  className?: string;
};

export function ScrollReveal({ children, className }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<ScrollPhase>("below");
  const [direction, setDirection] = useState<ScrollDirection>("down");
  const lastScrollY = useRef(0);

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    function onScroll() {
      const nextY = window.scrollY;
      if (Math.abs(nextY - lastScrollY.current) < 2) return;

      setDirection(nextY > lastScrollY.current ? "down" : "up");
      lastScrollY.current = nextY;
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPhase("visible");
          return;
        }

        setPhase(entry.boundingClientRect.top > 0 ? "below" : "above");
      },
      {
        threshold: [0, 0.12, 0.35],
        rootMargin: "-6% 0px -6% 0px",
      }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-phase={phase}
      data-direction={direction}
      className={cn("scroll-reveal", className)}
    >
      <div className="scroll-reveal-inner">{children}</div>
    </div>
  );
}
