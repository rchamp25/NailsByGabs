export const APPOINTMENT_LOCATIONS = ["webster", "binghamton"] as const;

export type AppointmentLocation = (typeof APPOINTMENT_LOCATIONS)[number];

export type LocationFilter = "all" | AppointmentLocation;

export const LOCATION_FILTERS: LocationFilter[] = [
  "all",
  "webster",
  "binghamton",
];

export function isAppointmentLocation(
  value: string
): value is AppointmentLocation {
  return (APPOINTMENT_LOCATIONS as readonly string[]).includes(value);
}

export function getLocationLabel(location: AppointmentLocation): string {
  return location === "webster" ? "Webster" : "Binghamton";
}

export function getLocationShortLabel(location: AppointmentLocation): string {
  return location === "webster" ? "Webster, NY" : "SUNY Binghamton";
}

export function getLocationFilterLabel(filter: LocationFilter): string {
  if (filter === "all") return "All";
  return getLocationLabel(filter);
}

/** Theme-aware Webster tint + consistent pastel green for Binghamton. */
export function getSlotLocationClass(location: AppointmentLocation): string {
  return location === "binghamton"
    ? "slot-location-binghamton"
    : "slot-location-webster";
}

export function normalizeAppointmentLocation(
  value: string | null | undefined
): AppointmentLocation {
  return value && isAppointmentLocation(value) ? value : "webster";
}
