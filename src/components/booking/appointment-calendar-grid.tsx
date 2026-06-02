"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatBusinessDayKey } from "@/lib/business-timezone";
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
  getLabel: (slot: SlotWithBooker) => string;
  onSelectSlot: (slot: SlotWithBooker) => void;
  selectedSlotId?: string | null;
};

export function AppointmentCalendarGrid({
  slots,
  userId,
  isOwner,
  getLabel,
  onSelectSlot,
  selectedSlotId,
}: AppointmentCalendarGridProps) {
  const [view, setView] = useState<CalendarViewMode>("week");
  const [anchor, setAnchor] = useState(() => new Date());
  const [transition, setTransition] = useState<CalendarTransition>("view");

  const periodKey =
    view === "week"
      ? formatBusinessDayKey(startOfWeek(anchor))
      : `${anchor.getFullYear()}-${anchor.getMonth()}`;

  const slotsByDay = useMemo(() => {
    const map = new Map<string, SlotWithBooker[]>();
    for (const slot of slots) {
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
  }, [slots]);

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
    if (slot.status === "open") {
      return "border-gold/50 bg-pastel-pink/50 hover:bg-pastel-pink-deep/40";
    }
    if (slot.booked_by === userId) {
      return "border-rose-red/40 bg-rose-red/10 hover:bg-rose-red/15";
    }
    if (isOwner) {
      return "border-rose-red-deep/30 bg-card hover:bg-pastel-pink/30";
    }
    return "border-border bg-muted/40 text-muted-foreground";
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
          selectedSlotId === slot.id && "ring-2 ring-gold shadow-sm"
        )}
      >
        <span className="block font-medium">
          {formatTime(slot.start_at)} – {formatTime(slot.end_at)}
        </span>
        <span className="block truncate opacity-90">{getLabel(slot)}</span>
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-4">
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
            "font-serif text-lg text-rose-red",
            transitionClass[transition]
          )}
        >
          {view === "week" ? formatWeekRange(anchor) : formatMonthYear(anchor)}
        </p>

        <div className="flex rounded-lg border border-gold/30 p-1 transition-shadow duration-350 ease-luxury">
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
        key={`${view}-${periodKey}`}
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
                  isToday ? "border-gold/50" : "border-border/70"
                )}
              >
                <p
                  className={cn(
                    "mb-2 text-sm font-medium",
                    isToday ? "text-rose-red" : "text-foreground"
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
                    isToday ? "border-gold/50" : "border-border/50"
                  )}
                >
                  <p
                    className={cn(
                      "mb-1 text-xs font-medium",
                      isToday ? "text-rose-red" : "text-muted-foreground"
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
                          selectedSlotId === slot.id && "ring-1 ring-gold"
                        )}
                      >
                        {formatTime(slot.start_at)} {getLabel(slot)}
                      </button>
                    ))}
                    {daySlots.length > 3 && (
                      <button
                        type="button"
                        className="text-left text-[10px] text-rose-red hover:underline"
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
