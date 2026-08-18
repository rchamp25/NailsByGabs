"use client";

import { ExternalLink, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { downloadIcs, getPersonalCalendarLinks } from "@/lib/calendar-links";

type AddToCalendarButtonsProps = {
  slot: {
    id: string;
    start_at: string;
    end_at: string;
    location?: string | null;
    notes?: string | null;
  };
};

export function AddToCalendarButtons({ slot }: AddToCalendarButtonsProps) {
  const links = getPersonalCalendarLinks(slot);

  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild variant="outline" size="sm">
        <a href={links.google} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="size-4" />
          Google Calendar
        </a>
      </Button>
      <Button
        variant="outline"
        size="sm"
        type="button"
        onClick={() =>
          downloadIcs(`nailsbygabs-${slot.id}.ics`, links.ics)
        }
      >
        <Download className="size-4" />
        Download .ics
      </Button>
    </div>
  );
}
