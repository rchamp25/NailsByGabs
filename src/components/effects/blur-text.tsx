"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

type BlurTextProps = {
  text: string;
  className?: string;
  delayMs?: number;
};

export function BlurText({ text, className, delayMs = 0 }: BlurTextProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), delayMs);
    return () => window.clearTimeout(timer);
  }, [delayMs]);

  return (
    <span
      className={cn(
        "inline-block transition-all duration-700 ease-emphasis",
        visible ? "blur-0 opacity-100 translate-y-0" : "blur-md opacity-0 translate-y-2",
        className
      )}
    >
      {text}
    </span>
  );
}
