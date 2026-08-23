import type { AnalyticsTimeframe } from "@/lib/analytics-format";

const MONTH_LABEL = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const DAY_LABEL = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

export type TrendEventRow = {
  event_type: string;
  occurred_at: string;
};

export type TrendPoint = {
  key: string;
  label: string;
  completed: number;
};

function utcMonthKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function utcDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addUtcMonths(date: Date, months: number): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1)
  );
}

function addUtcDays(date: Date, days: number): Date {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate() + days
    )
  );
}

function startOfUtcMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
}

export function getMonthBucketKeys(count: number, now = new Date()): string[] {
  const end = startOfUtcMonth(now);
  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    keys.push(utcMonthKey(addUtcMonths(end, -i)));
  }
  return keys;
}

export function getDayBucketKeys(start: Date, end: Date): string[] {
  const keys: string[] = [];
  let cursor = startOfUtcDay(start);
  const last = startOfUtcDay(end);

  while (cursor.getTime() <= last.getTime()) {
    keys.push(utcDayKey(cursor));
    cursor = addUtcDays(cursor, 1);
  }

  return keys;
}

function formatBucketLabel(key: string, timeframe: AnalyticsTimeframe): string {
  if (timeframe === "1m") {
    return DAY_LABEL.format(new Date(`${key}T12:00:00Z`));
  }
  return MONTH_LABEL.format(new Date(`${key}-01T12:00:00Z`));
}

function getBucketKeys(
  timeframe: AnalyticsTimeframe,
  rows: TrendEventRow[],
  now: Date,
  timeframeStart: Date | null
): string[] {
  if (timeframe === "1m") {
    const start = timeframeStart ?? addUtcDays(now, -30);
    return getDayBucketKeys(start, now);
  }

  if (timeframe === "6m") {
    return getMonthBucketKeys(6, now);
  }

  if (timeframe === "1y") {
    return getMonthBucketKeys(12, now);
  }

  const completedMonths = rows
    .filter((row) => row.event_type === "completed")
    .map((row) => row.occurred_at.slice(0, 7));

  if (completedMonths.length === 0) {
    return [utcMonthKey(startOfUtcMonth(now))];
  }

  const earliest = completedMonths.sort()[0]!;
  const keys: string[] = [];
  let cursor = new Date(`${earliest}-01T12:00:00Z`);
  const end = startOfUtcMonth(now);

  while (cursor.getTime() <= end.getTime()) {
    keys.push(utcMonthKey(cursor));
    cursor = addUtcMonths(cursor, 1);
  }

  return keys;
}

export function buildTrendPoints(
  rows: TrendEventRow[],
  timeframe: AnalyticsTimeframe,
  timeframeStart: Date | null,
  now = new Date()
): TrendPoint[] {
  const bucketKeys = getBucketKeys(timeframe, rows, now, timeframeStart);
  const isDaily = timeframe === "1m";

  const countMap = new Map<string, number>();
  for (const row of rows) {
    if (row.event_type !== "completed") continue;
    const key = isDaily
      ? row.occurred_at.slice(0, 10)
      : row.occurred_at.slice(0, 7);
    countMap.set(key, (countMap.get(key) ?? 0) + 1);
  }

  return bucketKeys.map((key) => ({
    key,
    label: formatBucketLabel(key, timeframe),
    completed: countMap.get(key) ?? 0,
  }));
}
