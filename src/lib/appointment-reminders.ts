import "server-only";

import {
  notifyClientOfAppointmentReminder,
  type BookingNotificationDetails,
} from "@/lib/notifications";
import { getLocationShortLabel, normalizeAppointmentLocation } from "@/lib/appointment-locations";
import { formatOwnerSlotLabel } from "@/lib/booking-display";
import { formatSlotRange } from "@/lib/dates";
import { createServiceRoleClient } from "@/lib/supabase/admin";

/** Skip reminders when the appointment is less than this many hours away. */
export const REMINDER_MIN_HOURS_BEFORE = 24;

/** Start sending once the appointment is within this many hours (daily cron window). */
export const REMINDER_MAX_HOURS_BEFORE = 60;

type ReminderSlotRow = {
  id: string;
  start_at: string;
  end_at: string;
  location: string | null;
  notes: string | null;
  booked_by: string;
  booker: { full_name: string } | { full_name: string }[] | null;
};

export function getReminderWindowBounds(now = new Date()) {
  const hourMs = 60 * 60 * 1000;
  return {
    minStart: new Date(now.getTime() + REMINDER_MIN_HOURS_BEFORE * hourMs),
    maxStart: new Date(now.getTime() + REMINDER_MAX_HOURS_BEFORE * hourMs),
  };
}

function buildReminderDetails(slot: ReminderSlotRow): BookingNotificationDetails {
  const bookerRaw = slot.booker;
  const booker = Array.isArray(bookerRaw) ? bookerRaw[0] : bookerRaw;
  const bookerFullName = booker?.full_name?.trim() || "Client";

  return {
    clientName: formatOwnerSlotLabel(bookerFullName),
    bookerFullName,
    timeRange: formatSlotRange(slot.start_at, slot.end_at),
    locationLabel: getLocationShortLabel(
      normalizeAppointmentLocation(slot.location)
    ),
    notes: slot.notes,
  };
}

export async function sendDueAppointmentReminders(): Promise<{
  sent: number;
  skipped: number;
  failed: number;
}> {
  const admin = createServiceRoleClient();
  if (!admin) {
    console.error(
      "[reminders] Skipped: SUPABASE_SERVICE_ROLE_KEY is not configured"
    );
    return { sent: 0, skipped: 0, failed: 0 };
  }

  const { minStart, maxStart } = getReminderWindowBounds();
  const { data: slots, error } = await admin
    .from("appointment_slots")
    .select(
      `
      id,
      start_at,
      end_at,
      location,
      notes,
      booked_by,
      booker:profiles!booked_by ( full_name )
    `
    )
    .eq("status", "booked")
    .not("booked_by", "is", null)
    .is("reminder_48h_sent_at", null)
    .gt("start_at", minStart.toISOString())
    .lte("start_at", maxStart.toISOString());

  if (error) {
    console.error("[reminders] Query failed:", error.message);
    return { sent: 0, skipped: 0, failed: 0 };
  }

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const slot of (slots ?? []) as ReminderSlotRow[]) {
    const { data: current, error: currentError } = await admin
      .from("appointment_slots")
      .select("status, booked_by, reminder_48h_sent_at")
      .eq("id", slot.id)
      .maybeSingle();

    if (
      currentError ||
      !current ||
      current.status !== "booked" ||
      !current.booked_by ||
      current.reminder_48h_sent_at
    ) {
      skipped += 1;
      continue;
    }

    const { data: authUser, error: authError } =
      await admin.auth.admin.getUserById(slot.booked_by);

    if (authError || !authUser.user.email?.trim()) {
      console.error(
        "[reminders] Skipped slot",
        slot.id,
        authError?.message ?? "missing client email"
      );
      skipped += 1;
      continue;
    }

    const delivered = await notifyClientOfAppointmentReminder(
      buildReminderDetails(slot),
      authUser.user.email
    );

    if (!delivered) {
      failed += 1;
      continue;
    }

    const { error: updateError } = await admin
      .from("appointment_slots")
      .update({ reminder_48h_sent_at: new Date().toISOString() })
      .eq("id", slot.id)
      .eq("status", "booked")
      .not("booked_by", "is", null)
      .is("reminder_48h_sent_at", null);

    if (updateError) {
      console.error(
        "[reminders] Sent email but failed to mark slot",
        slot.id,
        updateError.message
      );
      failed += 1;
      continue;
    }

    sent += 1;
  }

  return { sent, skipped, failed };
}
