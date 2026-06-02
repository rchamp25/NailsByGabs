"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, CheckCircle2, Sparkles, Trash2, Undo2 } from "lucide-react";

import {
  bookSlot,
  cancelMyBooking,
  createSlot,
  deleteSlot,
  releaseSlot,
} from "@/app/book/actions";
import { AddToCalendarButtons } from "@/components/booking/add-to-calendar-buttons";
import { AppointmentCalendarGrid } from "@/components/booking/appointment-calendar-grid";
import { GoogleCalendarConnect } from "@/components/booking/google-calendar-connect";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatOwnerSlotLabel } from "@/lib/booking-display";
import { formatSlotRange } from "@/lib/dates";
import type { Profile, SlotWithBooker } from "@/types/database";

type BookingCalendarProps = {
  slots: SlotWithBooker[];
  profile: Profile;
  userId: string;
  googleConnected: boolean;
  googleConfigured: boolean;
};

export function BookingCalendar({
  slots,
  profile,
  userId,
  googleConnected,
  googleConfigured,
}: BookingCalendarProps) {
  const isOwner = profile.role === "owner";
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selectedSlot, setSelectedSlot] = useState<SlotWithBooker | null>(null);
  const [bookTarget, setBookTarget] = useState<SlotWithBooker | null>(null);
  const [justBookedSlot, setJustBookedSlot] = useState<SlotWithBooker | null>(null);
  const [preBooked, setPreBooked] = useState(false);
  const [notes, setNotes] = useState("");
  const [bookError, setBookError] = useState<string | null>(null);

  const myBookings = slots.filter(
    (s) => s.status === "booked" && s.booked_by === userId
  );

  const [createState, createAction, createPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      const result = await createSlot(formData);
      if (result?.error) return { error: result.error };
      router.refresh();
      return null;
    },
    null
  );

  async function handleBook() {
    if (!bookTarget) return;
    setBookError(null);
    const booked = bookTarget;
    const result = await bookSlot(bookTarget.id, notes);
    if (result?.error) {
      setBookError(result.error);
      return;
    }
    setJustBookedSlot(booked);
    setBookTarget(null);
    setNotes("");
    setSelectedSlot(null);
    router.refresh();
  }

  function runAction(fn: () => Promise<{ error?: string } | { success?: boolean }>) {
    startTransition(async () => {
      await fn();
      setSelectedSlot(null);
      router.refresh();
    });
  }

  function getClientLabel(slot: SlotWithBooker): string {
    if (slot.status !== "booked") return "Open";
    if (slot.booked_by === userId) return "Your appointment";
    return "Taken";
  }

  function getOwnerLabel(slot: SlotWithBooker): string {
    if (slot.status === "open") return "Open slot";
    if (slot.booked_name) return formatOwnerSlotLabel(slot.booked_name);
    const name = slot.booker?.full_name ?? "Client";
    return formatOwnerSlotLabel(name);
  }

  function getLabel(slot: SlotWithBooker) {
    return isOwner ? getOwnerLabel(slot) : getClientLabel(slot);
  }

  function handleSelectSlot(slot: SlotWithBooker) {
    setSelectedSlot(slot);
    if (!isOwner && slot.status === "open") {
      setBookTarget(slot);
    }
  }

  const activeSlot = selectedSlot;
  const isMine = activeSlot?.booked_by === userId;
  const isOpen = activeSlot?.status === "open";
  const nextOpenSlot =
    !isOwner && !bookTarget
      ? slots.find((slot) => slot.status === "open") ?? null
      : null;

  return (
    <div className="flex flex-col gap-8">
      {isOwner && (
        <>
          <GoogleCalendarConnect
            connected={googleConnected}
            configured={googleConfigured}
          />
          <Card className="border-gold/30">
            <CardHeader>
              <CardTitle className="text-rose-red">Add open slot</CardTitle>
              <CardDescription>
                Set the start and end time. Syncs to Google Calendar when connected.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={createAction} className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startAt">Starts</Label>
                  <Input
                    id="startAt"
                    name="startAt"
                    type="datetime-local"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endAt">Ends</Label>
                  <Input id="endAt" name="endAt" type="datetime-local" required />
                </div>
                <div className="sm:col-span-2 flex items-center gap-2">
                  <input
                    id="preBooked"
                    name="preBooked"
                    type="checkbox"
                    checked={preBooked}
                    onChange={(event) => setPreBooked(event.target.checked)}
                    className="h-4 w-4 rounded border-border text-rose-red focus-visible:ring-2 focus-visible:ring-sidebar-ring/50"
                  />
                  <Label htmlFor="preBooked" className="font-normal">
                    Create as already taken
                  </Label>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="bookedName">Client name (for taken slot)</Label>
                  <Input
                    id="bookedName"
                    name="bookedName"
                    placeholder="e.g. Maddy Brown"
                    disabled={!preBooked}
                    required={preBooked}
                  />
                </div>
                {createState?.error && (
                  <p className="text-sm text-rose-red sm:col-span-2" role="alert">
                    {createState.error}
                  </p>
                )}
                <Button
                  type="submit"
                  disabled={createPending}
                  className="sm:col-span-2 sm:w-fit"
                >
                  {createPending
                    ? "Adding…"
                    : preBooked
                      ? "Add taken appointment"
                      : "Add open slot"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </>
      )}

      {!isOwner && myBookings.length > 0 && (
        <Card className="border-gold/25 bg-card/80">
          <CardHeader>
            <CardTitle className="text-lg text-rose-red">Your appointments</CardTitle>
            <CardDescription>
              Add any booking to your personal Google Calendar or download an .ics file.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {myBookings.map((slot) => (
              <div
                key={slot.id}
                className="border-border/80 flex flex-col gap-3 rounded-lg border p-4"
              >
                <div>
                  <p className="font-medium">
                    {formatSlotRange(slot.start_at, slot.end_at)}
                  </p>
                  {slot.notes && (
                    <p className="text-muted-foreground mt-1 text-sm">
                      Notes: {slot.notes}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <AddToCalendarButtons slot={slot} />
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pending}
                    onClick={() => runAction(() => cancelMyBooking(slot.id))}
                  >
                    Cancel booking
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {!isOwner && justBookedSlot && (
        <Card className="border-gold/45 bg-card/90 micro-pop">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-rose-red">
              <CheckCircle2 className="size-5 text-gold" />
              You&apos;re booked!
            </CardTitle>
            <CardDescription>
              Next step: save this appointment in Google Calendar so you never miss it.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-foreground">
              {formatSlotRange(justBookedSlot.start_at, justBookedSlot.end_at)}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <AddToCalendarButtons slot={justBookedSlot} />
              <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                <Sparkles className="size-3 text-gold" />
                Google Calendar is the fastest option.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <div className="mb-4 flex items-center gap-2">
          <CalendarDays className="size-5 text-gold" />
          <h3 className="font-serif text-xl text-rose-red">Calendar</h3>
        </div>

        {slots.length === 0 ? (
          <p className="text-muted-foreground rounded-xl border border-dashed border-border p-8 text-center text-sm">
            {isOwner
              ? "No upcoming slots yet. Add your first open slot above."
              : "No open times right now. Check back soon!"}
          </p>
        ) : (
          <AppointmentCalendarGrid
            slots={slots}
            userId={userId}
            isOwner={isOwner}
            getLabel={getLabel}
            onSelectSlot={handleSelectSlot}
            selectedSlotId={selectedSlot?.id}
          />
        )}
      </div>

      {activeSlot && (
        <Card className="border-gold/30">
          <CardHeader>
            <CardTitle className="text-lg text-rose-red">Selected slot</CardTitle>
            <CardDescription>
              {formatSlotRange(activeSlot.start_at, activeSlot.end_at)}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p
              className={
                isOwner && activeSlot.status === "booked"
                  ? "font-serif text-xl text-rose-red-deep"
                  : "text-muted-foreground"
              }
            >
              {getLabel(activeSlot)}
            </p>
            {activeSlot.notes && (isOwner || isMine) && (
              <p className="text-muted-foreground text-sm">
                Notes: {activeSlot.notes}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              {!isOwner && isOpen && (
                <Button size="sm" onClick={() => setBookTarget(activeSlot)}>
                  Reserve
                </Button>
              )}
              {!isOwner && isMine && (
                <>
                  <AddToCalendarButtons slot={activeSlot} />
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pending}
                    onClick={() =>
                      runAction(() => cancelMyBooking(activeSlot.id))
                    }
                  >
                    Cancel booking
                  </Button>
                </>
              )}
              {isOwner && isOpen && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pending}
                  onClick={() => runAction(() => deleteSlot(activeSlot.id))}
                >
                  <Trash2 className="size-4" />
                  Delete
                </Button>
              )}
              {isOwner && activeSlot.status === "booked" && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pending}
                    onClick={() => runAction(() => releaseSlot(activeSlot.id))}
                  >
                    <Undo2 className="size-4" />
                    Release
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pending}
                    onClick={() => runAction(() => deleteSlot(activeSlot.id))}
                  >
                    <Trash2 className="size-4" />
                    Delete
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog
        open={!!bookTarget}
        onOpenChange={(open) => {
          if (!open) {
            setBookTarget(null);
            setNotes("");
            setBookError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reserve this slot</DialogTitle>
            <DialogDescription>
              {bookTarget &&
                formatSlotRange(bookTarget.start_at, bookTarget.end_at)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Design ideas, allergies, preferred shape…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </div>
            {bookError && (
              <p className="text-sm text-rose-red" role="alert">
                {bookError}
              </p>
            )}
            <Button
              className="w-full"
              disabled={pending}
              onClick={() => startTransition(handleBook)}
            >
              {pending ? "Booking…" : "Confirm reservation"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {!isOwner && nextOpenSlot && (
        <div className="fixed inset-x-0 bottom-3 z-40 px-4 md:hidden">
          <Button
            className="w-full rounded-full shadow-lg shadow-rose-red/15"
            onClick={() => {
              setSelectedSlot(nextOpenSlot);
              setBookTarget(nextOpenSlot);
            }}
          >
            Book next available spot
          </Button>
        </div>
      )}
    </div>
  );
}
