"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import {
  ANALYTICS_TIMEFRAME_OPTIONS,
  type AnalyticsTimeframe,
} from "@/lib/analytics-format";
import { cn } from "@/lib/utils";

type AnalyticsTimeframeBarProps = {
  active: AnalyticsTimeframe;
};

export function AnalyticsTimeframeBar({ active }: AnalyticsTimeframeBarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <div className="rounded-xl border border-accent/20 bg-background/75 p-1.5 shadow-sm backdrop-blur-sm">
      <div
        className="relative grid gap-1"
        style={{
          gridTemplateColumns: `repeat(${ANALYTICS_TIMEFRAME_OPTIONS.length}, minmax(0, 1fr))`,
        }}
      >
        <div
          className="pill-nav-indicator pointer-events-none absolute inset-y-0 rounded-lg transition-transform duration-350 ease-emphasis"
          style={{
            width: `calc((100% - ${(ANALYTICS_TIMEFRAME_OPTIONS.length - 1) * 4}px) / ${ANALYTICS_TIMEFRAME_OPTIONS.length})`,
            transform: `translateX(calc(${Math.max(
              ANALYTICS_TIMEFRAME_OPTIONS.findIndex((o) => o.id === active),
              0
            )} * (100% + 4px)))`,
          }}
        />
        {ANALYTICS_TIMEFRAME_OPTIONS.map((option) => {
          const params = new URLSearchParams(searchParams.toString());
          if (option.id === "all") {
            params.delete("range");
          } else {
            params.set("range", option.id);
          }
          const href = params.size > 0 ? `${pathname}?${params}` : pathname;
          const isActive = active === option.id;

          return (
            <Link
              key={option.id}
              href={href}
              scroll={false}
              className={cn(
                "relative z-10 rounded-lg px-2 py-2.5 text-center text-xs font-medium transition-colors duration-300 ease-luxury sm:px-3 sm:text-sm",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {option.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
