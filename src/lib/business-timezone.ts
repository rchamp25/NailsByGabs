/** Salon operates in Rochester, NY (Eastern Time). */
export const BUSINESS_TIMEZONE = "America/New_York";

const DATE_TIME_LOCAL_RE =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/;

/** Offset in minutes: UTC + offset → wall clock in `timeZone`. */
function getOffsetMinutesFromUtc(utcMs: number, timeZone: string): number {
  const date = new Date(utcMs);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? "0");

  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second")
  );

  return (asUtc - utcMs) / 60_000;
}

/** Parse `datetime-local` value as wall time in the business timezone. */
export function parseBusinessDateTimeLocal(value: string): Date {
  const match = DATE_TIME_LOCAL_RE.exec(value.trim());
  if (!match) return new Date(NaN);

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6] ?? 0);

  let utcMs = Date.UTC(year, month - 1, day, hour, minute, second);
  for (let i = 0; i < 3; i += 1) {
    const offsetMin = getOffsetMinutesFromUtc(utcMs, BUSINESS_TIMEZONE);
    utcMs =
      Date.UTC(year, month - 1, day, hour, minute, second) - offsetMin * 60_000;
  }

  return new Date(utcMs);
}

/** `YYYY-MM-DD` calendar day for an instant in the business timezone. */
export function formatBusinessDayKey(isoOrDate: string | Date): string {
  const date =
    typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function getBusinessDateTimeFormatOptions(
  options: Intl.DateTimeFormatOptions
): Intl.DateTimeFormatOptions {
  return { ...options, timeZone: BUSINESS_TIMEZONE };
}

export function toGoogleCalendarDateTime(iso: string): {
  dateTime: string;
  timeZone: string;
} {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_TIMEZONE,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(iso));

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "00";

  return {
    dateTime: `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}`,
    timeZone: BUSINESS_TIMEZONE,
  };
}
