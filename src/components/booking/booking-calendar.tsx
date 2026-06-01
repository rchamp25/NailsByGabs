"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Trash2, Undo2 } from "lucide-react";

import {
  bookSlot,
  cancelMyBooking,
  createSlot,
  deleteSlot,
  releaseSlot,
} from "@/app/book/actions";
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
import { formatOwnerSlotLabel } from "@/lib/auth";
import { formatSlotRange } from "@/lib/dates";
import type { Profile, SlotWithBooker } from "@/types/database";

type BookingCalendarProps = {
  slots: SlotWithBooker[];
  profile: Profile;
  userId: string;
};

export function BookingCalendar({
  slots,
  profile,
  userId,
}: BookingCalendarProps) {
  const isOwner = profile.role === "owner";
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [bookTarget, setBookTarget] = useState<SlotWithBooker | null>(null);
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
    const result = await bookSlot(bookTarget.id, notes);
    if (result?.error) {
      setBookError(result.error);
      return;
    }
    setBookTarget(null);
    setNotes("");
    router.refresh();
  }

  function runAction(fn: () => Promise<{ error?: string } | { success?: boolean }>) {
    startTransition(async () => {
      await fn();
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
    const name = slot.booker?.full_name ?? "Client";
    return formatOwnerSlotLabel(name);
  }

  return (
    <div className="flex flex-col gap-8">
      {isOwner && (
        <Card className="border-gold/30">
          <CardHeader>
            <CardTitle className="text-rose-red">Add open slot</CardTitle>
            <CardDescription>
              Set the start and end time. Clients can reserve open slots only.
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
                {createPending ? "Adding…" : "Add slot"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {!isOwner && myBookings.length > 0 && (
        <Card className="border-gold/25 bg-card/80">
          <CardHeader>
            <CardTitle className="text-lg text-rose-red">Your appointments</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {myBookings.map((slot) => (
              <div
                key={slot.id}
                className="border-border/80 flex flex-col gap-2 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">{formatSlotRange(slot.start_at, slot.end_at)}</p>
                  {slot.notes && (
                    <p className="text-muted-foreground mt-1 text-sm">
                      Notes: {slot.notes}
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pending}
                  onClick={() => runAction(() => cancelMyBooking(slot.id))}
                >
                  Cancel booking
                </Button>
              </div>
            ))}
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
          <ul className="flex flex-col gap-3">
            {slots.map((slot) => {
              const isMine = slot.booked_by === userId;
              return (
                <li
                  key={slot.id}
                  className="border-border/80 flex flex-col gap-3 rounded-xl border bg-card/90 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {formatSlotRange(slot.start_at, slot.end_at)}
                    </p>
                    <p
                      className={
                        isOwner && slot.status === "booked"
                          ? "text-rose-red-deep mt-1 font-serif text-lg"
                          : "text-muted-foreground mt-1 text-sm"
                      }
                    >
                      {isOwner ? getOwnerLabel(slot) : getClientLabel(slot)}
                    </p>
                    {isOwner && slot.notes && (
                      <p className="text-muted-foreground mt-2 text-sm">
                        Client notes: {slot.notes}
                      </p>
                    )}
                    {!isOwner && isMine && slot.notes && (
                      <p className="text-muted-foreground mt-2 text-sm">
                        Your notes: {slot.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {!isOwner && isOpen && (
                      <Button size="sm" onClick={() => setBookTarget(slot)}>
                        Reserve
                      </Button>
                    )}
                    {isOwner && isOpen && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pending}
                        onClick={() => runAction(() => deleteSlot(slot.id))}
                      >
                        <Trash2 className="size-4" />
                        Delete
                      </Button>
                    )}
                    {isOwner && slot.status === "booked" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={pending}
                          onClick={() => runAction(() => releaseSlot(slot.id))}
                        >
                          <Undo2 className="size-4" />
                          Release
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={pending}
                          onClick={() => runAction(() => deleteSlot(slot.id))}
                        >
                          <Trash2 className="size-4" />
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

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
    </div>
  );
}
