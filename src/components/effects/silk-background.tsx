"use client";

import { cn } from "@/lib/utils";

type SilkBackgroundProps = {
  className?: string;
  intensity?: "subtle" | "medium";
};

export function SilkBackground({
  className,
  intensity = "subtle",
}: SilkBackgroundProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "silk-background pointer-events-none absolute inset-0 overflow-hidden",
        intensity === "subtle" ? "opacity-70" : "opacity-100",
        className
      )}
    >
      <div className="silk-layer silk-layer-a" />
      <div className="silk-layer silk-layer-b" />
    </div>
  );
}
