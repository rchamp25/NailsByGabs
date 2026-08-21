export type AnalyticsTimeframe = "1m" | "6m" | "1y" | "all";

export const ANALYTICS_TIMEFRAME_OPTIONS: {
  id: AnalyticsTimeframe;
  label: string;
}[] = [
  { id: "1m", label: "1 month" },
  { id: "6m", label: "6 months" },
  { id: "1y", label: "1 year" },
  { id: "all", label: "Entirety" },
];

export type BookingEventType =
  | "booked"
  | "cancelled"
  | "released"
  | "completed"
  | "deleted";

export type BookingSource = "platform" | "manual";

export type LocationStats = {
  booked: number;
  completed: number;
  estimatedRevenueCents: number;
};

export type SourceStats = {
  booked: number;
  completed: number;
};

export type MonthlyPoint = {
  key: string;
  label: string;
  completed: number;
};

export type TopClientRow = {
  id: string;
  fullName: string;
  appointmentsBooked: number;
  appointmentsCompleted: number;
};

export type AnalyticsSnapshot = {
  timeframe: AnalyticsTimeframe;
  timeframeLabel: string;
  trackingStartedAt: string | null;
  defaultAppointmentValueCents: number;
  totals: {
    booked: number;
    completed: number;
    cancelled: number;
    released: number;
    deleted: number;
    uniqueClients: number;
    estimatedRevenueCents: number;
    cancellationRate: number;
  };
  byLocation: {
    webster: LocationStats;
    binghamton: LocationStats;
  };
  bySource: {
    platform: SourceStats;
    manual: SourceStats;
  };
  monthlyCompleted: MonthlyPoint[];
  topClients: TopClientRow[];
};

export function formatUsdFromCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value);
}
