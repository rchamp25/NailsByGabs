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

  const now = new Date();

  if (timeframe === "1m") {
    return new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 30)
    );
  }

  if (timeframe === "6m") {
    return new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 6, now.getUTCDate())
    );
  }

  if (timeframe === "1y") {
    return new Date(
      Date.UTC(now.getUTCFullYear() - 1, now.getUTCMonth(), now.getUTCDate())
    );
  }

  return null;
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
