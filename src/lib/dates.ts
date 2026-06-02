import {
  BUSINESS_TIMEZONE,
  formatBusinessDayKey,
  getBusinessDateTimeFormatOptions,
} from "@/lib/business-timezone";

export function formatSlotRange(startAt: string, endAt: string): string {
  const start = new Date(startAt);
  const end = new Date(endAt);
  const dateFmt = new Intl.DateTimeFormat(
    "en-US",
    getBusinessDateTimeFormatOptions({
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  );
  const timeFmt = new Intl.DateTimeFormat(
    "en-US",
    getBusinessDateTimeFormatOptions({
      hour: "numeric",
      minute: "2-digit",
    })
  );
  const sameDay = formatBusinessDayKey(startAt) === formatBusinessDayKey(endAt);
  if (sameDay) {
    return `${dateFmt.format(start)} · ${timeFmt.format(start)} – ${timeFmt.format(end)}`;
  }
  return `${dateFmt.format(start)} ${timeFmt.format(start)} – ${dateFmt.format(end)} ${timeFmt.format(end)}`;
}

export function toLocalDatetimeInputValue(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_TIMEZONE,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date(iso));

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "00";

  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
