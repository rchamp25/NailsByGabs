import "server-only";

import type { AppointmentLocation } from "@/lib/appointment-locations";
import type {
  AnalyticsSnapshot,
  AnalyticsTimeframe,
  BookingEventType,
  BookingSource,
} from "@/lib/analytics-format";
import { buildTrendPoints } from "@/lib/analytics-trend";
import {
  getTimeframeLabel,
  getTimeframeStart,
  parseAnalyticsTimeframe,
} from "@/lib/analytics-timeframe";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export type {
  AnalyticsSnapshot,
  AnalyticsTimeframe,
  BookingEventType,
  BookingSource,
  LocationStats,
  MonthlyPoint,
  SourceStats,
  TopClientRow,
} from "@/lib/analytics-format";

export { parseAnalyticsTimeframe } from "@/lib/analytics-timeframe";

type BookingEventRow = {
  event_type: BookingEventType;
  booking_source: BookingSource | null;
  location: AppointmentLocation | null;
  client_id: string | null;
  occurred_at: string;
};

function readConfigInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function getAnalyticsSnapshot(
  timeframe: AnalyticsTimeframe = "all"
): Promise<{
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

  const timeframeStart = getTimeframeStart(timeframe);
  let eventsQuery = admin
    .from("booking_events")
    .select("event_type, booking_source, location, client_id, occurred_at")
    .order("occurred_at", { ascending: true });

  if (timeframeStart) {
    eventsQuery = eventsQuery.gte("occurred_at", timeframeStart.toISOString());
  }

  const [{ data: configRows }, { data: events, error: eventsError }, { data: profiles }] =
    await Promise.all([
      admin.from("app_config").select("key, value").in("key", [
        "analytics_tracking_started_at",
        "default_appointment_value_cents",
      ]),
      eventsQuery,
      admin
        .from("profiles")
        .select("id, full_name")
        .eq("role", "client"),
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

  const locationStats = (location: AppointmentLocation) => {
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

  const clientCounts = new Map<
    string,
    { booked: number; completed: number }
  >();
  for (const row of rows) {
    if (!row.client_id) continue;
    const current = clientCounts.get(row.client_id) ?? {
      booked: 0,
      completed: 0,
    };
    if (row.event_type === "booked") current.booked += 1;
    if (row.event_type === "completed") current.completed += 1;
    clientCounts.set(row.client_id, current);
  }

  const profileNames = new Map(
    (profiles ?? []).map((p) => [p.id, p.full_name.trim() || "Client"])
  );

  const topClients = [...clientCounts.entries()]
    .map(([id, counts]) => ({
      id,
      fullName: profileNames.get(id) ?? "Client",
      appointmentsBooked: counts.booked,
      appointmentsCompleted: counts.completed,
    }))
    .filter(
      (client) =>
        client.appointmentsBooked > 0 || client.appointmentsCompleted > 0
    )
    .sort((a, b) => {
      if (b.appointmentsCompleted !== a.appointmentsCompleted) {
        return b.appointmentsCompleted - a.appointmentsCompleted;
      }
      return b.appointmentsBooked - a.appointmentsBooked;
    })
    .slice(0, 8);

  return {
    snapshot: {
      timeframe,
      timeframeLabel: getTimeframeLabel(timeframe),
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
      monthlyCompleted: buildTrendPoints(
        rows,
        timeframe,
        timeframeStart
      ),
      topClients,
    },
  };
}
