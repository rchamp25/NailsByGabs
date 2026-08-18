"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type StarBorderProps = {
  children: ReactNode;
  className?: string;
};

export function StarBorder({ children, className }: StarBorderProps) {
  return (
    <span className={cn("star-border inline-flex rounded-full", className)}>
      <span className="star-border-inner inline-flex rounded-full">{children}</span>
    </span>
  );
}
