"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { getLocationShortLabel } from "@/lib/appointment-locations";
import {
  allAcknowledgementsChecked,
  getActiveBookingAcknowledgements,
  type BookingAcknowledgementId,
} from "@/lib/booking-acknowledgements";
import { normalizeAppointmentLocation } from "@/lib/appointment-locations";
import { formatSlotRange } from "@/lib/dates";
import type { SlotWithBooker } from "@/types/database";

type BookingAcknowledgementsDialogProps = {
  open: boolean;
  slot: SlotWithBooker | null;
  checked: Record<BookingAcknowledgementId, boolean>;
  onCheckedChange: (id: BookingAcknowledgementId, value: boolean) => void;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  pending: boolean;
  error: string | null;
};

export function BookingAcknowledgementsDialog({
  open,
  slot,
  checked,
  onCheckedChange,
  onOpenChange,
  onConfirm,
  pending,
  error,
}: BookingAcknowledgementsDialogProps) {
  const location = slot
    ? normalizeAppointmentLocation(slot.location)
    : "webster";
  const activeAcknowledgements = getActiveBookingAcknowledgements(location);
  const canConfirm = allAcknowledgementsChecked(location, checked);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Before you book</DialogTitle>
          <DialogDescription>
            {slot && (
              <>
                {formatSlotRange(slot.start_at, slot.end_at)}
                <br />
                {getLocationShortLabel(slot.location)}
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">Please confirm</legend>
            {activeAcknowledgements.map((acknowledgement) => (
              <div
                key={acknowledgement.id}
                className="flex items-start gap-3 rounded-lg border border-border/80 p-3"
              >
                <input
                  id={`ack-${acknowledgement.id}`}
                  type="checkbox"
                  checked={checked[acknowledgement.id]}
                  onChange={(event) =>
                    onCheckedChange(acknowledgement.id, event.target.checked)
                  }
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-primary focus-visible:ring-2 focus-visible:ring-sidebar-ring/50"
                />
                <Label
                  htmlFor={`ack-${acknowledgement.id}`}
                  className="font-normal leading-snug"
                >
                  {acknowledgement.label}
                </Label>
              </div>
            ))}
          </fieldset>
          {error && (
            <p className="text-sm text-primary" role="alert">
              {error}
            </p>
          )}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="sm:flex-1"
              disabled={pending}
              onClick={() => onOpenChange(false)}
            >
              Back
            </Button>
            <Button
              type="button"
              className="sm:flex-1"
              disabled={pending || !canConfirm}
              onClick={onConfirm}
            >
              {pending ? "Booking…" : "Confirm reservation"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
