export type BookingAcknowledgementId =
  | "binghamton-university"
  | "acknowledgement-2";

export type BookingAcknowledgement = {
  id: BookingAcknowledgementId;
  label: string;
  /** When false, hidden until enabled for a future requirement. */
  enabled: boolean;
};

export const BOOKING_ACKNOWLEDGEMENTS: BookingAcknowledgement[] = [
  {
    id: "binghamton-university",
    label: "I attend Binghamton University",
    enabled: true,
  },
  {
    id: "acknowledgement-2",
    label: "",
    enabled: false,
  },
];

export function getActiveBookingAcknowledgements(): BookingAcknowledgement[] {
  return BOOKING_ACKNOWLEDGEMENTS.filter((acknowledgement) => acknowledgement.enabled);
}

export function allAcknowledgementsChecked(
  checked: Partial<Record<BookingAcknowledgementId, boolean>>
): boolean {
  return getActiveBookingAcknowledgements().every(
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
