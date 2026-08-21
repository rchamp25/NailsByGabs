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
  month: string;
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
