"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  getLocationFilterLabel,
  getLocationLabel,
  getSlotLocationClass,
  LOCATION_FILTERS,
  type LocationFilter,
} from "@/lib/appointment-locations";
import { formatBusinessDayKey } from "@/lib/business-timezone";
import { isMembersOnlyActive } from "@/lib/members-only";
import { cn } from "@/lib/utils";
import {
  formatDayHeader,
  formatMonthYear,
  formatTime,
  formatWeekRange,
  getMonthGridDays,
  getWeekDays,
  isSameDay,
  startOfWeek,
} from "@/lib/calendar-utils";
import type { SlotWithBooker } from "@/types/database";

export type CalendarViewMode = "week" | "month";

type CalendarTransition = "view" | "prev" | "next";

const transitionClass: Record<CalendarTransition, string> = {
  view: "animate-calendar-view-enter",
  prev: "animate-calendar-slide-prev",
  next: "animate-calendar-slide-next",
};

type AppointmentCalendarGridProps = {
  slots: SlotWithBooker[];
  userId: string;
  isOwner: boolean;
  /** Loyalty members can book members-only slots (others see them locked). */
  isMember: boolean;
  getLabel: (slot: SlotWithBooker) => string;
  onSelectSlot: (slot: SlotWithBooker) => void;
  selectedSlotId?: string | null;
};

export function AppointmentCalendarGrid({
  slots,
  userId,
  isOwner,
  isMember,
  getLabel,
  onSelectSlot,
  selectedSlotId,
}: AppointmentCalendarGridProps) {
  const [view, setView] = useState<CalendarViewMode>("week");
  const [locationFilter, setLocationFilter] = useState<LocationFilter>("all");
  const [anchor, setAnchor] = useState(() => new Date());
  const [transition, setTransition] = useState<CalendarTransition>("view");

  const filteredSlots = useMemo(
    () =>
      locationFilter === "all"
        ? slots
        : slots.filter((slot) => slot.location === locationFilter),
    [locationFilter, slots]
  );

  const periodKey =
    view === "week"
      ? formatBusinessDayKey(startOfWeek(anchor))
      : `${anchor.getFullYear()}-${anchor.getMonth()}`;

  const slotsByDay = useMemo(() => {
    const map = new Map<string, SlotWithBooker[]>();
    for (const slot of filteredSlots) {
      const key = formatBusinessDayKey(slot.start_at);
      const list = map.get(key) ?? [];
      list.push(slot);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort(
        (a, b) =>
          new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
      );
    }
    return map;
  }, [filteredSlots]);

  function shiftAnchor(direction: -1 | 1) {
    setTransition(direction === 1 ? "next" : "prev");
    setAnchor((current) => {
      const next = new Date(current);
      if (view === "week") {
        next.setDate(next.getDate() + direction * 7);
      } else {
        next.setMonth(next.getMonth() + direction);
      }
      return next;
    });
  }

  function goToToday() {
    setTransition("view");
    setAnchor(new Date());
  }

  function changeView(nextView: CalendarViewMode) {
    if (nextView === view) return;
    setTransition("view");
    setView(nextView);
  }

  function openWeekForDay(day: Date) {
    setTransition("view");
    setView("week");
    setAnchor(day);
  }

  function slotTone(slot: SlotWithBooker): string {
    const locationClass = getSlotLocationClass(slot.location);

    if (slot.status === "open") {
      if (isMembersOnlyActive(slot)) {
        // Dashed border marks members-only; non-members can't book it yet.
        return cn(
          locationClass,
          "border-dashed border-accent/70",
          !isOwner && !isMember ? "opacity-75" : "hover:brightness-[0.98]"
        );
      }
      return cn(locationClass, "hover:brightness-[0.98]");
    }
    if (slot.booked_by === userId) {
      return cn(locationClass, "ring-1 ring-primary/35");
    }
    if (isOwner) {
      return cn(locationClass, "hover:brightness-[0.98]");
    }
    return cn(locationClass, "opacity-75 text-muted-foreground");
  }

  function renderSlotChip(slot: SlotWithBooker) {
    return (
      <button
        key={slot.id}
        type="button"
        onClick={() => onSelectSlot(slot)}
        className={cn(
          "w-full rounded-md border px-2 py-1.5 text-left text-xs transition-[background-color,box-shadow,transform] duration-300 ease-luxury",
          slotTone(slot),
          selectedSlotId === slot.id && "ring-2 ring-accent shadow-sm"
        )}
      >
        <span className="block font-medium">
          {formatTime(slot.start_at)} – {formatTime(slot.end_at)}
        </span>
        <span className="block truncate opacity-90">{getLabel(slot)}</span>
        <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-wide opacity-80">
          {getLocationLabel(slot.location)}
        </span>
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {LOCATION_FILTERS.map((filter) => (
          <Button
            key={filter}
            type="button"
            size="sm"
            variant={locationFilter === filter ? "default" : "outline"}
            className="rounded-full"
            onClick={() => setLocationFilter(filter)}
          >
            {getLocationFilterLabel(filter)}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <span className="slot-location-webster size-3 rounded-full border" />
          Webster
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="slot-location-binghamton size-3 rounded-full border" />
          Binghamton
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => shiftAnchor(-1)}
            aria-label="Previous"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => shiftAnchor(1)}
            aria-label="Next"
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={goToToday}
          >
            Today
          </Button>
        </div>

        <p
          key={`${view}-${periodKey}`}
          className={cn(
            "font-serif text-lg text-primary",
            transitionClass[transition]
          )}
        >
          {view === "week" ? formatWeekRange(anchor) : formatMonthYear(anchor)}
        </p>

        <div className="flex rounded-lg border border-accent/30 p-1 transition-shadow duration-350 ease-luxury">
          <Button
            type="button"
            size="sm"
            variant={view === "week" ? "default" : "ghost"}
            onClick={() => changeView("week")}
          >
            Week
          </Button>
          <Button
            type="button"
            size="sm"
            variant={view === "month" ? "default" : "ghost"}
            onClick={() => changeView("month")}
          >
            Month
          </Button>
        </div>
      </div>

      <div
        key={`${view}-${periodKey}-${locationFilter}`}
        className={transitionClass[transition]}
      >
      {view === "week" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
          {getWeekDays(anchor).map((day) => {
            const key = formatBusinessDayKey(day);
            const daySlots = slotsByDay.get(key) ?? [];
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={key}
                className={cn(
                  "min-h-40 rounded-xl border bg-card/70 p-3",
                  isToday ? "border-accent/50" : "border-border/70"
                )}
              >
                <p
                  className={cn(
                    "mb-2 text-sm font-medium",
                    isToday ? "text-primary" : "text-foreground"
                  )}
                >
                  {formatDayHeader(day)}
                </p>
                <div className="flex flex-col gap-2">
                  {daySlots.length === 0 ? (
                    <p className="text-muted-foreground text-xs">No slots</p>
                  ) : (
                    daySlots.map(renderSlotChip)
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/70 bg-card/70 p-3">
          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {getMonthGridDays(anchor).map((day) => {
              const key = formatBusinessDayKey(day);
              const daySlots = slotsByDay.get(key) ?? [];
              const inMonth = day.getMonth() === anchor.getMonth();
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={key}
                  className={cn(
                    "min-h-24 rounded-lg border p-1.5",
                    inMonth ? "bg-background/80" : "bg-muted/20 opacity-60",
                    isToday ? "border-accent/50" : "border-border/50"
                  )}
                >
                  <p
                    className={cn(
                      "mb-1 text-xs font-medium",
                      isToday ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {day.getDate()}
                  </p>
                  <div className="flex flex-col gap-1">
                    {daySlots.slice(0, 3).map((slot) => (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => onSelectSlot(slot)}
                        className={cn(
                          "truncate rounded px-1 py-0.5 text-left text-[10px] transition-[background-color,box-shadow] duration-300 ease-luxury",
                          slotTone(slot),
                          selectedSlotId === slot.id && "ring-1 ring-accent"
                        )}
                      >
                        {formatTime(slot.start_at)} {getLabel(slot)} ·{" "}
                        {getLocationLabel(slot.location)}
                      </button>
                    ))}
                    {daySlots.length > 3 && (
                      <button
                        type="button"
                        className="text-left text-[10px] text-primary hover:underline"
                        onClick={() => openWeekForDay(day)}
                      >
                        +{daySlots.length - 3} more
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
