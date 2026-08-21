import "server-only";

import type { AppointmentLocation } from "@/lib/appointment-locations";
import type {
  AnalyticsSnapshot,
  BookingEventType,
  BookingSource,
} from "@/lib/analytics-format";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export type {
  AnalyticsSnapshot,
  BookingEventType,
  BookingSource,
  LocationStats,
  MonthlyPoint,
  SourceStats,
  TopClientRow,
} from "@/lib/analytics-format";

type BookingEventRow = {
  event_type: BookingEventType;
  booking_source: BookingSource | null;
  location: AppointmentLocation | null;
  client_id: string | null;
  occurred_at: string;
};

const MONTH_LABEL = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
});

function readConfigInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function getAnalyticsSnapshot(): Promise<{
  snapshot: AnalyticsSnapshot | null;
  error?: string;
}> {
  const admin = createServiceRoleClient();
  if (!admin) {
    return {
      snapshot: null,
      error:
        "Analytics unavailable — SUPABASE_SERVICE_ROLE_KEY is not configured.",
    };
  }

  const [{ data: configRows }, { data: events, error: eventsError }, { data: profiles }] =
    await Promise.all([
      admin.from("app_config").select("key, value").in("key", [
        "analytics_tracking_started_at",
        "default_appointment_value_cents",
      ]),
      admin
        .from("booking_events")
        .select("event_type, booking_source, location, client_id, occurred_at")
        .order("occurred_at", { ascending: true }),
      admin
        .from("profiles")
        .select("id, full_name, appointments_booked, appointments_completed")
        .eq("role", "client")
        .order("appointments_completed", { ascending: false })
        .limit(8),
    ]);

  if (eventsError) {
    return { snapshot: null, error: eventsError.message };
  }

  const config = new Map(
    (configRows ?? []).map((row) => [row.key, row.value as string])
  );
  const trackingStartedAt = config.get("analytics_tracking_started_at") ?? null;
  const defaultAppointmentValueCents = readConfigInt(
    config.get("default_appointment_value_cents"),
    3900
  );

  const rows = (events ?? []) as BookingEventRow[];

  const countBy = (
    predicate: (row: BookingEventRow) => boolean
  ): number => rows.filter(predicate).length;

  const booked = countBy((r) => r.event_type === "booked");
  const completed = countBy((r) => r.event_type === "completed");
  const cancelled = countBy((r) => r.event_type === "cancelled");
  const released = countBy((r) => r.event_type === "released");
  const deleted = countBy((r) => r.event_type === "deleted");

  const uniqueClients = new Set(
    rows
      .filter((r) => r.event_type === "booked" && r.client_id)
      .map((r) => r.client_id as string)
  ).size;

  const cancellationRate =
    booked > 0 ? (cancelled + released) / booked : 0;

  const locationStats = (
    location: AppointmentLocation
  ) => {
    const locBooked = countBy(
      (r) => r.event_type === "booked" && r.location === location
    );
    const locCompleted = countBy(
      (r) => r.event_type === "completed" && r.location === location
    );
    return {
      booked: locBooked,
      completed: locCompleted,
      estimatedRevenueCents: locCompleted * defaultAppointmentValueCents,
    };
  };

  const sourceStats = (source: BookingSource) => ({
    booked: countBy(
      (r) => r.event_type === "booked" && r.booking_source === source
    ),
    completed: countBy(
      (r) => r.event_type === "completed" && r.booking_source === source
    ),
  });

  const monthlyMap = new Map<string, number>();
  for (const row of rows) {
    if (row.event_type !== "completed") continue;
    const month = row.occurred_at.slice(0, 7);
    monthlyMap.set(month, (monthlyMap.get(month) ?? 0) + 1);
  }

  const monthlyCompleted = [...monthlyMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, count]) => ({
      month,
      label: MONTH_LABEL.format(new Date(`${month}-01T12:00:00`)),
      completed: count,
    }));

  const topClients = (profiles ?? [])
    .filter(
      (p) => p.appointments_booked > 0 || p.appointments_completed > 0
    )
    .map((p) => ({
      id: p.id,
      fullName: p.full_name.trim() || "Client",
      appointmentsBooked: p.appointments_booked,
      appointmentsCompleted: p.appointments_completed,
    }));

  return {
    snapshot: {
      trackingStartedAt,
      defaultAppointmentValueCents,
      totals: {
        booked,
        completed,
        cancelled,
        released,
        deleted,
        uniqueClients,
        estimatedRevenueCents: completed * defaultAppointmentValueCents,
        cancellationRate,
      },
      byLocation: {
        webster: locationStats("webster"),
        binghamton: locationStats("binghamton"),
      },
      bySource: {
        platform: sourceStats("platform"),
        manual: sourceStats("manual"),
      },
      monthlyCompleted,
      topClients,
    },
  };
}
