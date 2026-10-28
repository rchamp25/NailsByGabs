import { getBusinessDateTimeFormatOptions } from "@/lib/business-timezone";
import type { AppointmentSlot } from "@/types/database";

/** Members-only slots open to everyone this long before they start (matches migration 018). */
export const MEMBERS_ONLY_OPENS_HOURS_BEFORE = 24;

export function membersOnlyOpensAt(startAt: string): Date {
  return new Date(new Date(startAt).getTime() - MEMBERS_ONLY_OPENS_HOURS_BEFORE * 60 * 60 * 1000);
}

/**
 * True while an open slot is still reserved for loyalty members. The
 * book_appointment_slot RPC enforces the same rule with the server's clock.
 */
export function isMembersOnlyActive(
  slot: Pick<AppointmentSlot, "status" | "members_only" | "start_at">,
  now: number = Date.now()
): boolean {
  return (
    slot.status === "open" &&
    slot.members_only === true &&
    membersOnlyOpensAt(slot.start_at).getTime() > now
  );
}

/** When a members-only slot opens to everyone, e.g. "Tue, Oct 28 · 3:00 PM" (Eastern). */
export function formatMembersOnlyOpensAt(startAt: string): string {
  const opensAt = membersOnlyOpensAt(startAt);
  const date = new Intl.DateTimeFormat(
    "en-US",
    getBusinessDateTimeFormatOptions({ weekday: "short", month: "short", day: "numeric" })
  ).format(opensAt);
  const time = new Intl.DateTimeFormat(
    "en-US",
    getBusinessDateTimeFormatOptions({ hour: "numeric", minute: "2-digit" })
  ).format(opensAt);
  return `${date} · ${time}`;
}
