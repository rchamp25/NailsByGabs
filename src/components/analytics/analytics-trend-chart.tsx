"use client";

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
  label: string;
};

const CHART_WIDTH = 640;
const CHART_HEIGHT = 220;
const PADDING = { top: 18, right: 12, bottom: 36, left: 12 };

function buildPlotPoints(points: MonthlyPoint[]): PlotPoint[] {
  const maxValue = Math.max(...points.map((point) => point.completed), 1);
  const innerWidth = CHART_WIDTH - PADDING.left - PADDING.right;
  const innerHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;
  const step = points.length <= 1 ? 0 : innerWidth / (points.length - 1);

  return points.map((point, index) => {
    const x = PADDING.left + step * index;
    const ratio = point.completed / maxValue;
    const y = PADDING.top + innerHeight - ratio * innerHeight;
    return { x, y, value: point.completed, label: point.label };
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

function buildAreaPath(linePath: string, plotPoints: PlotPoint[]): string {
  if (plotPoints.length === 0) return "";
  const baseline = CHART_HEIGHT - PADDING.bottom;
  const first = plotPoints[0]!;
  const last = plotPoints[plotPoints.length - 1]!;
  return `${linePath} L ${last.x} ${baseline} L ${first.x} ${baseline} Z`;
}

function labelStride(length: number, timeframe: AnalyticsTimeframe): number {
  if (timeframe === "1m") {
    if (length <= 10) return 1;
    if (length <= 20) return 2;
    return Math.ceil(length / 8);
  }
  return 1;
}

export function AnalyticsTrendChart({
  points,
  timeframe,
  className,
}: AnalyticsTrendChartProps) {
  const maxValue = Math.max(...points.map((point) => point.completed), 1);
  const stride = labelStride(points.length, timeframe);

  if (timeframe === "1m") {
    const plotPoints = buildPlotPoints(points);
    const linePath = buildSmoothLinePath(plotPoints);
    const areaPath = buildAreaPath(linePath, plotPoints);
    const baseline = CHART_HEIGHT - PADDING.bottom;

    return (
      <div className={cn("mt-6", className)}>
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="h-52 w-full overflow-visible"
          role="img"
          aria-label="Daily completed appointments trend line"
        >
          <defs>
            <linearGradient id="analytics-line-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          <line
            x1={PADDING.left}
            x2={CHART_WIDTH - PADDING.right}
            y1={baseline}
            y2={baseline}
            className="stroke-border/80"
            strokeWidth="1"
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

          {plotPoints.map((point, index) => (
            <g key={`${point.label}-${index}`}>
              <circle
                cx={point.x}
                cy={point.y}
                r={point.value > 0 ? 3.5 : 2.5}
                className={
                  point.value > 0 ? "fill-accent stroke-background" : "fill-muted"
                }
                strokeWidth="1.5"
              />
              {index % stride === 0 || index === plotPoints.length - 1 ? (
                <text
                  x={point.x}
                  y={CHART_HEIGHT - 10}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[10px]"
                >
                  {points[index]?.label.split(" ").slice(1).join(" ") ||
                    points[index]?.label}
                </text>
              ) : null}
            </g>
          ))}
        </svg>
      </div>
    );
  }

  return (
    <ul className={cn("mt-6 flex items-end gap-2 sm:gap-3", className)}>
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
                "font-serif text-sm",
                point.completed > 0 ? "text-primary" : "text-muted-foreground"
              )}
            >
              {point.completed}
            </span>
            <div className="flex h-36 w-full items-end">
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
            <span className="text-muted-foreground text-center text-[10px] leading-tight">
              {point.label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
