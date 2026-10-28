"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, CheckCircle2, Crown, Lock, Pencil, Sparkles, Trash2, Undo2 } from "lucide-react";

import {
  bookSlot,
  cancelMyBooking,
  createSlot,
  deleteSlot,
  releaseSlot,
  updateSlot,
} from "@/app/book/actions";
import { AddToCalendarButtons } from "@/components/booking/add-to-calendar-buttons";
import { AppointmentCalendarGrid } from "@/components/booking/appointment-calendar-grid";
import { BookingAcknowledgementsDialog } from "@/components/booking/booking-acknowledgements-dialog";
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
import {
  createEmptyAcknowledgementState,
  hasBookingAcknowledgements,
  type BookingAcknowledgementId,
} from "@/lib/booking-acknowledgements";
import { getLocationShortLabel } from "@/lib/appointment-locations";
import { formatSlotRange, toLocalDatetimeInputValue } from "@/lib/dates";
import { formatMembersOnlyOpensAt, isMembersOnlyActive } from "@/lib/members-only";
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
  const isMember = profile.loyalty_member === true;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selectedSlot, setSelectedSlot] = useState<SlotWithBooker | null>(null);
  const [bookTarget, setBookTarget] = useState<SlotWithBooker | null>(null);
  const [bookingStep, setBookingStep] = useState<"notes" | "acknowledgements" | null>(
    null
  );
  const [acknowledgements, setAcknowledgements] = useState(
    createEmptyAcknowledgementState
  );
  const [justBookedSlot, setJustBookedSlot] = useState<SlotWithBooker | null>(null);
  const [preBooked, setPreBooked] = useState(false);
  const [membersOnly, setMembersOnly] = useState(false);
  const [slotStartAt, setSlotStartAt] = useState("");
  const [slotEndAt, setSlotEndAt] = useState("");
  const [slotLocation, setSlotLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [bookError, setBookError] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<SlotWithBooker | null>(null);
  const [editStartAt, setEditStartAt] = useState("");
  const [editEndAt, setEditEndAt] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editBookedName, setEditBookedName] = useState("");
  const [dropTarget, setDropTarget] = useState<{
    slot: SlotWithBooker;
    mode: "release" | "delete";
  } | null>(null);
  const [dropMessage, setDropMessage] = useState("");

  /** Upcoming bookings made through the site; Gabs's changes email these clients. */
  function emailsClient(slot: SlotWithBooker): boolean {
    return (
      slot.status === "booked" &&
      !!slot.booked_by &&
      new Date(slot.end_at).getTime() > Date.now()
    );
  }

  /** Members-only slot this (non-member) client can see but not book yet. */
  function isLockedForMe(slot: SlotWithBooker): boolean {
    return !isOwner && !isMember && isMembersOnlyActive(slot);
  }

  function clientFirstName(slot: SlotWithBooker): string {
    return slot.booker?.full_name?.trim().split(/\s+/)[0] || "the client";
  }

  function requestDrop(slot: SlotWithBooker, mode: "release" | "delete") {
    if (!emailsClient(slot)) {
      runAction(() => (mode === "release" ? releaseSlot(slot.id) : deleteSlot(slot.id)));
      return;
    }
    setDropMessage("");
    setDropTarget({ slot, mode });
  }

  function confirmDrop() {
    if (!dropTarget) return;
    const { slot, mode } = dropTarget;
    const message = dropMessage;
    setDropTarget(null);
    runAction(() =>
      mode === "release" ? releaseSlot(slot.id, message) : deleteSlot(slot.id, message)
    );
  }

  function formatDateTimeLocal(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  function addOneHourFromStart(startValue: string): string {
    const start = new Date(startValue);
    if (Number.isNaN(start.getTime())) return startValue;
    return formatDateTimeLocal(new Date(start.getTime() + 60 * 60 * 1000));
  }

  function handleSlotStartChange(startValue: string) {
    setSlotStartAt(startValue);
    if (startValue) {
      setSlotEndAt(addOneHourFromStart(startValue));
    }
  }

  const myBookings = slots.filter(
    (s) => s.status === "booked" && s.booked_by === userId
  );

  const [createState, createAction, createPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      const result = await createSlot(formData);
      if (result?.error) return { error: result.error };
      setSlotStartAt("");
      setSlotEndAt("");
      setSlotLocation("");
      setPreBooked(false);
      setMembersOnly(false);
      router.refresh();
      return null;
    },
    null
  );

  function openEditDialog(slot: SlotWithBooker) {
    setEditTarget(slot);
    setEditStartAt(toLocalDatetimeInputValue(slot.start_at));
    setEditEndAt(toLocalDatetimeInputValue(slot.end_at));
    setEditLocation(slot.location);
    setEditBookedName(
      slot.booked_name?.trim() ||
        slot.booker?.full_name?.trim() ||
        ""
    );
  }

  function closeEditDialog() {
    setEditTarget(null);
    setEditStartAt("");
    setEditEndAt("");
    setEditLocation("");
    setEditBookedName("");
  }

  function handleEditStartChange(startValue: string) {
    setEditStartAt(startValue);
    if (startValue) {
      setEditEndAt(addOneHourFromStart(startValue));
    }
  }

  const [updateState, updateAction, updatePending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) => {
      const result = await updateSlot(_prev, formData);
      if (result?.error) return { error: result.error };
      closeEditDialog();
      setSelectedSlot(null);
      router.refresh();
      return { success: true };
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
    closeBookingFlow();
    setSelectedSlot(null);
    router.refresh();
  }

  function openBookingFlow(slot: SlotWithBooker) {
    setBookTarget(slot);
    setBookingStep("notes");
    setNotes("");
    setBookError(null);
    setAcknowledgements(createEmptyAcknowledgementState());
  }

  function closeBookingFlow() {
    setBookTarget(null);
    setBookingStep(null);
    setNotes("");
    setBookError(null);
    setAcknowledgements(createEmptyAcknowledgementState());
  }

  function proceedFromNotes() {
    if (!bookTarget) return;
    setBookError(null);
    if (hasBookingAcknowledgements(bookTarget.location)) {
      setBookingStep("acknowledgements");
      return;
    }
    startTransition(handleBook);
  }

  function handleAcknowledgementChange(
    id: BookingAcknowledgementId,
    value: boolean
  ) {
    setAcknowledgements((current) => ({ ...current, [id]: value }));
  }

  function handleAcknowledgementsOpenChange(open: boolean) {
    if (!open) {
      if (bookingStep === "acknowledgements") {
        setBookingStep("notes");
        setBookError(null);
        setAcknowledgements(createEmptyAcknowledgementState());
        return;
      }
      closeBookingFlow();
    }
  }

  function runAction(fn: () => Promise<{ error?: string } | { success?: boolean }>) {
    startTransition(async () => {
      await fn();
      setSelectedSlot(null);
      router.refresh();
    });
  }

  function getClientLabel(slot: SlotWithBooker): string {
    if (slot.status !== "booked") return isMembersOnlyActive(slot) ? "Members only" : "Open";
    if (slot.booked_by === userId) return "Your appointment";
    return "Taken";
  }

  function getOwnerLabel(slot: SlotWithBooker): string {
    if (slot.status === "open") {
      return isMembersOnlyActive(slot) ? "Open · members only" : "Open slot";
    }
    if (slot.booked_name) return formatOwnerSlotLabel(slot.booked_name);
    const name = slot.booker?.full_name ?? "Client";
    return formatOwnerSlotLabel(name);
  }

  function getLabel(slot: SlotWithBooker) {
    return isOwner ? getOwnerLabel(slot) : getClientLabel(slot);
  }

  function handleSelectSlot(slot: SlotWithBooker) {
    setSelectedSlot(slot);
    if (!isOwner && slot.status === "open" && !isLockedForMe(slot)) {
      openBookingFlow(slot);
    }
  }

  const activeSlot = selectedSlot;
  const isMine = activeSlot?.booked_by === userId;
  const isOpen = activeSlot?.status === "open";
  const nextOpenSlot =
    !isOwner && !bookTarget
      ? slots.find((slot) => slot.status === "open" && !isLockedForMe(slot)) ?? null
      : null;

  return (
    <div className="flex flex-col gap-8">
      {isOwner && (
        <>
          <GoogleCalendarConnect
            connected={googleConnected}
            configured={googleConfigured}
          />
          <Card className="border-accent/30">
            <CardHeader>
              <CardTitle className="text-primary">Add open slot</CardTitle>
              <CardDescription>
                Choose a start time — end time defaults to one hour later (you can
                change it). Syncs to Google Calendar when connected.
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
                    value={slotStartAt}
                    onChange={(event) => handleSlotStartChange(event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endAt">Ends</Label>
                  <Input
                    id="endAt"
                    name="endAt"
                    type="datetime-local"
                    value={slotEndAt}
                    onChange={(event) => setSlotEndAt(event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="location">Location</Label>
                  <select
                    id="location"
                    name="location"
                    required
                    value={slotLocation}
                    onChange={(event) => setSlotLocation(event.target.value)}
                    className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                  >
                    <option value="" disabled>
                      Select location
                    </option>
                    <option value="webster">Webster, NY (Rochester area)</option>
                    <option value="binghamton">SUNY Binghamton (school year)</option>
                  </select>
                </div>
                <div className="sm:col-span-2 flex items-center gap-2">
                  <input
                    id="preBooked"
                    name="preBooked"
                    type="checkbox"
                    checked={preBooked}
                    onChange={(event) => setPreBooked(event.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary focus-visible:ring-2 focus-visible:ring-sidebar-ring/50"
                  />
                  <Label htmlFor="preBooked" className="font-normal">
                    Create as already taken
                  </Label>
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <div className="flex items-center gap-2">
                    <input
                      id="membersOnly"
                      name="membersOnly"
                      type="checkbox"
                      checked={membersOnly && !preBooked}
                      disabled={preBooked}
                      onChange={(event) => setMembersOnly(event.target.checked)}
                      className="h-4 w-4 rounded border-border text-primary focus-visible:ring-2 focus-visible:ring-sidebar-ring/50 disabled:opacity-50"
                    />
                    <Label htmlFor="membersOnly" className="font-normal">
                      Loyalty members only
                    </Label>
                  </div>
                  <p className="text-muted-foreground pl-6 text-xs">
                    Only members can book it until 24 hours before; then it opens to everyone.
                    Non-members see it as locked.
                  </p>
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
                  <p className="text-sm text-primary sm:col-span-2" role="alert">
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
                      : membersOnly
                        ? "Add members-only slot"
                        : "Add open slot"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </>
      )}

      {!isOwner && myBookings.length > 0 && (
        <Card className="border-accent/25 bg-card/80">
          <CardHeader>
            <CardTitle className="text-lg text-primary">Your appointments</CardTitle>
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
                  <p className="text-muted-foreground mt-1 text-sm">
                    {getLocationShortLabel(slot.location)}
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
        <Card className="border-accent/45 bg-card/90 micro-pop">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <CheckCircle2 className="size-5 text-accent" />
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
            <p className="text-muted-foreground text-sm">
              {getLocationShortLabel(justBookedSlot.location)}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <AddToCalendarButtons slot={justBookedSlot} />
              <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                <Sparkles className="size-3 text-accent" />
                Google Calendar is the fastest option.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <div className="mb-4 flex items-center gap-2">
          <CalendarDays className="size-5 text-accent" />
          <h3 className="font-serif text-xl text-primary">Calendar</h3>
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
            isMember={isMember}
            getLabel={getLabel}
            onSelectSlot={handleSelectSlot}
            selectedSlotId={selectedSlot?.id}
          />
        )}
      </div>

      {activeSlot && (
        <Card className="border-accent/30">
          <CardHeader>
            <CardTitle className="text-lg text-primary">Selected slot</CardTitle>
            <CardDescription>
              {formatSlotRange(activeSlot.start_at, activeSlot.end_at)} ·{" "}
              {getLocationShortLabel(activeSlot.location)}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p
              className={
                isOwner && activeSlot.status === "booked"
                  ? "font-serif text-xl text-primary"
                  : "text-muted-foreground"
              }
            >
              {getLabel(activeSlot)}
            </p>
            {isMembersOnlyActive(activeSlot) && (
              <p className="flex items-start gap-2 text-sm text-primary">
                {isLockedForMe(activeSlot) ? (
                  <Lock className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
                ) : (
                  <Crown className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
                )}
                <span>
                  {isOwner
                    ? `Members only until ${formatMembersOnlyOpensAt(activeSlot.start_at)}, then open to everyone.`
                    : isMember
                      ? "Reserved for loyalty members, so this one's yours to grab."
                      : `Reserved for loyalty members. It opens to everyone ${formatMembersOnlyOpensAt(activeSlot.start_at)}.`}
                </span>
              </p>
            )}
            {activeSlot.notes && (isOwner || isMine) && (
              <p className="text-muted-foreground text-sm">
                Notes: {activeSlot.notes}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              {isOwner && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openEditDialog(activeSlot)}
                >
                  <Pencil className="size-4" />
                  Edit
                </Button>
              )}
              {!isOwner && isOpen && !isLockedForMe(activeSlot) && (
                <Button size="sm" onClick={() => openBookingFlow(activeSlot)}>
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
                    onClick={() => requestDrop(activeSlot, "release")}
                  >
                    <Undo2 className="size-4" />
                    Release
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pending}
                    onClick={() => requestDrop(activeSlot, "delete")}
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
        open={!!bookTarget && bookingStep === "notes"}
        onOpenChange={(open) => {
          if (!open) closeBookingFlow();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reserve this slot</DialogTitle>
            <DialogDescription>
              {bookTarget && (
                <>
                  {formatSlotRange(bookTarget.start_at, bookTarget.end_at)}
                  <br />
                  {getLocationShortLabel(bookTarget.location)}
                </>
              )}
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
              <p className="text-sm text-primary" role="alert">
                {bookError}
              </p>
            )}
            <Button
              className="w-full"
              disabled={pending}
              onClick={proceedFromNotes}
            >
              {pending
                ? "Booking…"
                : bookTarget && hasBookingAcknowledgements(bookTarget.location)
                  ? "Continue"
                  : "Confirm reservation"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BookingAcknowledgementsDialog
        open={!!bookTarget && bookingStep === "acknowledgements"}
        slot={bookTarget}
        checked={acknowledgements}
        onCheckedChange={handleAcknowledgementChange}
        onOpenChange={handleAcknowledgementsOpenChange}
        onConfirm={() => startTransition(handleBook)}
        pending={pending}
        error={bookError}
      />

      <Dialog
        open={!!editTarget}
        onOpenChange={(open) => {
          if (!open) closeEditDialog();
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit appointment</DialogTitle>
            <DialogDescription>
              Update the time, location
              {editTarget?.status === "booked" ? ", and client name" : ""} without
              deleting and recreating the slot.
            </DialogDescription>
          </DialogHeader>
          {editTarget && (
            <form action={updateAction} className="grid gap-4 sm:grid-cols-2">
              <input type="hidden" name="slotId" value={editTarget.id} />
              <div className="space-y-2">
                <Label htmlFor="editStartAt">Starts</Label>
                <Input
                  id="editStartAt"
                  name="startAt"
                  type="datetime-local"
                  value={editStartAt}
                  onChange={(event) => handleEditStartChange(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editEndAt">Ends</Label>
                <Input
                  id="editEndAt"
                  name="endAt"
                  type="datetime-local"
                  value={editEndAt}
                  onChange={(event) => setEditEndAt(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="editLocation">Location</Label>
                <select
                  id="editLocation"
                  name="location"
                  required
                  value={editLocation}
                  onChange={(event) => setEditLocation(event.target.value)}
                  className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                >
                  <option value="webster">Webster, NY (Rochester area)</option>
                  <option value="binghamton">SUNY Binghamton (school year)</option>
                </select>
              </div>
              {editTarget.status === "open" && (
                <div className="sm:col-span-2 space-y-1">
                  <div className="flex items-center gap-2">
                    <input
                      id="editMembersOnly"
                      name="membersOnly"
                      type="checkbox"
                      defaultChecked={editTarget.members_only === true}
                      className="h-4 w-4 rounded border-border text-primary focus-visible:ring-2 focus-visible:ring-sidebar-ring/50"
                    />
                    <Label htmlFor="editMembersOnly" className="font-normal">
                      Loyalty members only
                    </Label>
                  </div>
                  <p className="text-muted-foreground pl-6 text-xs">
                    Opens to everyone 24 hours before the appointment.
                  </p>
                </div>
              )}
              {editTarget.status === "booked" && (
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="editBookedName">Client name</Label>
                  <Input
                    id="editBookedName"
                    name="bookedName"
                    value={editBookedName}
                    onChange={(event) => setEditBookedName(event.target.value)}
                    placeholder="e.g. Maddy Brown"
                    required
                  />
                  {editTarget.booked_by && (
                    <p className="text-muted-foreground text-xs">
                      This updates how the booking appears on your calendar. The
                      client&apos;s account name stays the same.
                    </p>
                  )}
                </div>
              )}
              {emailsClient(editTarget) && (
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="editClientMessage">
                    Message to {clientFirstName(editTarget)} (optional)
                  </Label>
                  <Textarea
                    id="editClientMessage"
                    name="clientMessage"
                    rows={3}
                    maxLength={500}
                    placeholder="e.g. Running behind that day, so I moved you 30 minutes later!"
                  />
                  <p className="text-muted-foreground text-xs">
                    If you change the time or location, {clientFirstName(editTarget)} gets a
                    &ldquo;Gabs updated your appointment&rdquo; email with the new details
                    and this note.
                  </p>
                </div>
              )}
              {updateState?.error && (
                <p className="text-destructive text-sm sm:col-span-2" role="alert">
                  {updateState.error}
                </p>
              )}
              <div className="flex flex-wrap gap-2 sm:col-span-2">
                <Button type="submit" disabled={updatePending}>
                  {updatePending ? "Saving…" : "Save changes"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={updatePending}
                  onClick={closeEditDialog}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!dropTarget}
        onOpenChange={(open) => {
          if (!open) setDropTarget(null);
        }}
      >
        <DialogContent>
          {dropTarget && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {dropTarget.mode === "release" ? "Release" : "Delete"} this appointment?
                </DialogTitle>
                <DialogDescription>
                  {formatSlotRange(dropTarget.slot.start_at, dropTarget.slot.end_at)} ·{" "}
                  {getLocationShortLabel(dropTarget.slot.location)}
                  <br />
                  {dropTarget.mode === "release"
                    ? "The time reopens for other clients."
                    : "The slot is removed from your calendar."}{" "}
                  {clientFirstName(dropTarget.slot)} will get a &ldquo;Gabs dropped your
                  appointment&rdquo; email.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label htmlFor="dropMessage">
                  Message to {clientFirstName(dropTarget.slot)} (optional)
                </Label>
                <Textarea
                  id="dropMessage"
                  rows={3}
                  maxLength={500}
                  value={dropMessage}
                  onChange={(event) => setDropMessage(event.target.value)}
                  placeholder="e.g. So sorry, something came up! Please grab another time."
                />
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDropTarget(null)}>
                  Keep appointment
                </Button>
                <Button type="button" disabled={pending} onClick={confirmDrop}>
                  {dropTarget.mode === "release" ? "Release" : "Delete"} &amp; email client
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {!isOwner && nextOpenSlot && (
        <div className="fixed inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom,0px))] z-40 px-4 md:hidden">
          <Button
            className="w-full rounded-full shadow-lg shadow-primary/15"
            onClick={() => {
              setSelectedSlot(nextOpenSlot);
              openBookingFlow(nextOpenSlot);
            }}
          >
            Book next available spot
          </Button>
        </div>
      )}
    </div>
  );
}
