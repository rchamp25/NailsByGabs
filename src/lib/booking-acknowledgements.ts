import type { AppointmentLocation } from "@/lib/appointment-locations";

export type BookingAcknowledgementId =
  | "binghamton-university"
  | "acknowledgement-2";

export type BookingAcknowledgement = {
  id: BookingAcknowledgementId;
  label: string;
  /** When false, hidden until enabled for a future requirement. */
  enabled: boolean;
  /** When set, only required for appointments at these locations. */
  locations?: AppointmentLocation[];
};

export const BOOKING_ACKNOWLEDGEMENTS: BookingAcknowledgement[] = [
  {
    id: "binghamton-university",
    label: "I attend Binghamton University",
    enabled: true,
    locations: ["binghamton"],
  },
  {
    id: "acknowledgement-2",
    label: "",
    enabled: false,
  },
];

export function getActiveBookingAcknowledgements(
  location: AppointmentLocation
): BookingAcknowledgement[] {
  return BOOKING_ACKNOWLEDGEMENTS.filter(
    (acknowledgement) =>
      acknowledgement.enabled &&
      (!acknowledgement.locations ||
        acknowledgement.locations.includes(location))
  );
}

export function hasBookingAcknowledgements(
  location: AppointmentLocation
): boolean {
  return getActiveBookingAcknowledgements(location).length > 0;
}

export function allAcknowledgementsChecked(
  location: AppointmentLocation,
  checked: Partial<Record<BookingAcknowledgementId, boolean>>
): boolean {
  return getActiveBookingAcknowledgements(location).every(
    (acknowledgement) => checked[acknowledgement.id] === true
  );
}

export function createEmptyAcknowledgementState(): Record<
  BookingAcknowledgementId,
  boolean
> {
  return {
    "binghamton-university": false,
    "acknowledgement-2": false,
  };
}
