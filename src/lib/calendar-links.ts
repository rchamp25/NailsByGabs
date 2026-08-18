/** Build Google Calendar "Add event" URL and ICS content for personal calendars. */

function toCalendarUtc(iso: string): string {
  return `${new Date(iso).toISOString().replace(/[-:]/g, "").split(".")[0]}Z`;
}

export function buildGoogleCalendarUrl(options: {
  title: string;
  startAt: string;
  endAt: string;
  details?: string;
  location?: string;
}): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: options.title,
    dates: `${toCalendarUtc(options.startAt)}/${toCalendarUtc(options.endAt)}`,
  });

  if (options.details) params.set("details", options.details);
  if (options.location) params.set("location", options.location);

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildIcsFile(options: {
  title: string;
  startAt: string;
  endAt: string;
  details?: string;
  location?: string;
  uid?: string;
}): string {
  const uid = options.uid ?? `nailsbygabs-${Date.now()}@nailsbygabs.com`;
  const stamp = toCalendarUtc(new Date().toISOString());
  const start = toCalendarUtc(options.startAt);
  const end = toCalendarUtc(options.endAt);
  const description = (options.details ?? "").replace(/\n/g, "\\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//NailsByGabs//Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${options.title}`,
    `DESCRIPTION:${description}`,
    options.location ? `LOCATION:${options.location.replace(/,/g, "\\,")}` : null,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");
}

export function downloadIcs(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

import { getLocationShortLabel, normalizeAppointmentLocation } from "@/lib/appointment-locations";

export function getPersonalCalendarLinks(slot: {
  id: string;
  start_at: string;
  end_at: string;
  location?: string | null;
  notes?: string | null;
}) {
  const title = "NailsByGabs Appointment";
  const location = getLocationShortLabel(
    normalizeAppointmentLocation(slot.location)
  );
  const details = [
    "Your nail appointment with Gabs at NailsByGabs.",
    `Location: ${location}`,
    slot.notes ? `Notes: ${slot.notes}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    google: buildGoogleCalendarUrl({
      title,
      startAt: slot.start_at,
      endAt: slot.end_at,
      details,
      location,
    }),
    ics: buildIcsFile({
      title,
      startAt: slot.start_at,
      endAt: slot.end_at,
      details,
      location,
      uid: `${slot.id}@nailsbygabs.com`,
    }),
  };
}
