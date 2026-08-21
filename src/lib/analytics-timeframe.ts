import type { AnalyticsTimeframe } from "@/lib/analytics-format";

export function parseAnalyticsTimeframe(
  value: string | undefined
): AnalyticsTimeframe {
  if (value === "1m" || value === "6m" || value === "1y" || value === "all") {
    return value;
  }
  return "all";
}

export function getTimeframeStart(timeframe: AnalyticsTimeframe): Date | null {
  if (timeframe === "all") return null;

  const start = new Date();
  if (timeframe === "1m") {
    start.setMonth(start.getMonth() - 1);
  } else if (timeframe === "6m") {
    start.setMonth(start.getMonth() - 6);
  } else if (timeframe === "1y") {
    start.setFullYear(start.getFullYear() - 1);
  }
  return start;
}

export function getTimeframeLabel(timeframe: AnalyticsTimeframe): string {
  switch (timeframe) {
    case "1m":
      return "Last month";
    case "6m":
      return "Last 6 months";
    case "1y":
      return "Last year";
    case "all":
      return "All time";
  }
}

export function isWithinTimeframe(
  occurredAt: string,
  timeframe: AnalyticsTimeframe
): boolean {
  const start = getTimeframeStart(timeframe);
  if (!start) return true;
  return new Date(occurredAt).getTime() >= start.getTime();
}
