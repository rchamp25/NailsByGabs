"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { AnalyticsTimeframe, MonthlyPoint } from "@/lib/analytics-format";
import { cn } from "@/lib/utils";

type AnalyticsTrendChartProps = {
  points: MonthlyPoint[];
  timeframe: AnalyticsTimeframe;
  className?: string;
};

type PlotPoint = {
  x: number;
  y: number;
  value: number;
};

type AxisLabel = {
  index: number;
  label: string;
};

const MIN_CHART_WIDTH = 280;
const MIN_CHART_HEIGHT = 220;
const MAX_CHART_HEIGHT = 320;

function daysInUtcMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function parseDayKey(key: string): { year: number; month: number; day: number } {
  const [year, month, day] = key.split("-").map(Number);
  return { year: year!, month: month!, day: day! };
}

function formatMonthDay(year: number, month: number, day: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function getDailyXAxisLabels(points: MonthlyPoint[]): AxisLabel[] {
  const labels: AxisLabel[] = [];
  const labelsByIndex = new Map<number, string>();

  const setLabel = (index: number, label: string) => {
    labelsByIndex.set(index, label);
  };

  points.forEach((point, index) => {
    const { year, month, day } = parseDayKey(point.key);
    const monthLength = daysInUtcMonth(year, month);
    const midDay = Math.ceil(monthLength / 2);

    if (day === 1) {
      setLabel(index, formatMonthDay(year, month, 1));
    }

    if (day === midDay) {
      setLabel(index, formatMonthDay(year, month, midDay));
    }
  });

  if (points.length > 0) {
    const lastIndex = points.length - 1;
    const lastPoint = points[lastIndex]!;
    const { year, month, day } = parseDayKey(lastPoint.key);
    const todayLabel = formatMonthDay(year, month, day);
    const existing = labelsByIndex.get(lastIndex);

    if (existing) {
      if (!existing.endsWith("· Today")) {
        setLabel(lastIndex, `${existing} · Today`);
      }
    } else {
      setLabel(lastIndex, `${todayLabel} · Today`);
    }
  }

  for (const [index, label] of labelsByIndex.entries()) {
    labels.push({ index, label });
  }

  return labels.sort((a, b) => a.index - b.index);
}

function buildYTicks(maxValue: number): number[] {
  const ceiling = Math.max(maxValue, 1);
  return Array.from({ length: ceiling + 1 }, (_, tick) => tick);
}

function buildPlotPoints(
  points: MonthlyPoint[],
  chartWidth: number,
  chartHeight: number,
  padding: { top: number; right: number; bottom: number; left: number },
  yMax: number
): PlotPoint[] {
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;
  const step = points.length <= 1 ? 0 : innerWidth / (points.length - 1);

  return points.map((point, index) => {
    const x = padding.left + step * index;
    const ratio = point.completed / yMax;
    const y = padding.top + innerHeight - ratio * innerHeight;
    return { x, y, value: point.completed };
  });
}

function buildSmoothLinePath(plotPoints: PlotPoint[]): string {
  if (plotPoints.length === 0) return "";
  if (plotPoints.length === 1) {
    return `M ${plotPoints[0]!.x} ${plotPoints[0]!.y}`;
  }

  let path = `M ${plotPoints[0]!.x} ${plotPoints[0]!.y}`;

  for (let index = 0; index < plotPoints.length - 1; index += 1) {
    const p0 = plotPoints[index - 1] ?? plotPoints[index]!;
    const p1 = plotPoints[index]!;
    const p2 = plotPoints[index + 1]!;
    const p3 = plotPoints[index + 2] ?? p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  return path;
}

function buildAreaPath(
  linePath: string,
  plotPoints: PlotPoint[],
  baseline: number
): string {
  if (plotPoints.length === 0) return "";
  const first = plotPoints[0]!;
  const last = plotPoints[plotPoints.length - 1]!;
  return `${linePath} L ${last.x} ${baseline} L ${first.x} ${baseline} Z`;
}

function DailyLineChart({
  points,
  className,
}: {
  points: MonthlyPoint[];
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(MIN_CHART_WIDTH);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const updateWidth = () => {
      setChartWidth(Math.max(node.clientWidth, MIN_CHART_WIDTH));
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const maxValue = Math.max(...points.map((point) => point.completed), 0);
  const yMax = Math.max(maxValue, 1);
  const yTicks = buildYTicks(yMax);
  const xLabels = useMemo(() => getDailyXAxisLabels(points), [points]);

  const chartHeight = Math.min(
    MAX_CHART_HEIGHT,
    Math.max(MIN_CHART_HEIGHT, chartWidth * 0.42)
  );
  const leftPadding = Math.max(28, String(yMax).length * 10 + 14);
  const padding = {
    top: 16,
    right: 12,
    bottom: 44,
    left: leftPadding,
  };

  const plotPoints = buildPlotPoints(
    points,
    chartWidth,
    chartHeight,
    padding,
    yMax
  );
  const baseline = chartHeight - padding.bottom;
  const innerHeight = chartHeight - padding.top - padding.bottom;
  const linePath = buildSmoothLinePath(plotPoints);
  const areaPath = buildAreaPath(linePath, plotPoints, baseline);
  const innerLeft = padding.left;
  const innerRight = chartWidth - padding.right;

  return (
    <div ref={containerRef} className={cn("mt-6 w-full", className)}>
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        width="100%"
        height={chartHeight}
        className="block overflow-visible"
        role="img"
        aria-label="Daily completed appointments trend line"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="analytics-line-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {yTicks.map((tick) => {
          const y =
            padding.top + innerHeight - (tick / yMax) * innerHeight;
          return (
            <g key={`y-${tick}`}>
              <line
                x1={innerLeft}
                x2={innerRight}
                y1={y}
                y2={y}
                className="stroke-border/70"
                strokeWidth="1"
                strokeDasharray={tick === 0 ? undefined : "4 4"}
              />
              <text
                x={padding.left - 8}
                y={y + 4}
                textAnchor="end"
                className="fill-muted-foreground text-[11px]"
              >
                {tick}
              </text>
            </g>
          );
        })}

        <line
          x1={innerLeft}
          x2={innerRight}
          y1={baseline}
          y2={baseline}
          className="stroke-border"
          strokeWidth="1.25"
        />

        {areaPath ? (
          <path d={areaPath} fill="url(#analytics-line-fill)" />
        ) : null}

        {linePath ? (
          <path
            d={linePath}
            fill="none"
            className="stroke-primary"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}

        {xLabels.map(({ index, label }) => {
          const x = plotPoints[index]?.x ?? innerLeft;
          return (
            <g key={`${label}-${index}`}>
              <line
                x1={x}
                x2={x}
                y1={baseline}
                y2={baseline + 5}
                className="stroke-muted-foreground/70"
                strokeWidth="1"
              />
              <text
                x={x}
                y={chartHeight - 14}
                textAnchor="middle"
                className="fill-muted-foreground text-[11px]"
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function AnalyticsTrendChart({
  points,
  timeframe,
  className,
}: AnalyticsTrendChartProps) {
  const maxValue = Math.max(...points.map((point) => point.completed), 1);

  if (timeframe === "1m") {
    return <DailyLineChart points={points} className={className} />;
  }

  return (
    <ul className={cn("mt-6 flex w-full items-end gap-1.5 sm:gap-3", className)}>
      {points.map((point) => {
        const height = `${Math.max(
          (point.completed / maxValue) * 100,
          point.completed > 0 ? 10 : 2
        )}%`;

        return (
          <li
            key={point.key}
            className="flex min-w-0 flex-1 flex-col items-center gap-2"
          >
            <span
              className={cn(
                "font-serif text-xs sm:text-sm",
                point.completed > 0 ? "text-primary" : "text-muted-foreground"
              )}
            >
              {point.completed}
            </span>
            <div className="flex h-32 w-full items-end sm:h-36">
              <div
                className={cn(
                  "w-full rounded-t-md transition-[height] duration-700 ease-emphasis",
                  point.completed > 0
                    ? "bg-gradient-to-t from-primary/85 to-accent/70"
                    : "bg-muted/50"
                )}
                style={{ height }}
              />
            </div>
            <span className="text-muted-foreground text-center text-[9px] leading-tight sm:text-[10px]">
              {point.label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
