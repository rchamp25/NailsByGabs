"use client";

import { PanelLeftOpen } from "lucide-react";

import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export function SidebarPeekTab() {
  const { open, setOpen, isMobile } = useSidebar();

  if (isMobile) {
    return null;
  }

  return (
    <>
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-[45] hidden transition-[width] duration-350 ease-emphasis md:block",
          open ? "w-(--sidebar-width)" : "w-5"
        )}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        aria-hidden
      />
      {!open && (
        <button
          type="button"
          className="sidebar-peek-tab fixed left-0 top-[5.25rem] z-[60] hidden md:inline-flex"
          onMouseEnter={() => setOpen(true)}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          aria-label="Open navigation"
        >
          <PanelLeftOpen className="size-4 text-muted-foreground" aria-hidden />
        </button>
      )}
    </>
  );
}
