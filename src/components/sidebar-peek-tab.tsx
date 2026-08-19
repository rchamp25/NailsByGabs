"use client";

import { PanelLeftOpen } from "lucide-react";

import { useSidebar } from "@/components/ui/sidebar";

export function SidebarPeekTab() {
  const { open, setOpen, isMobile } = useSidebar();

  if (isMobile || open) {
    return null;
  }

  return (
    <button
      type="button"
      className="sidebar-peek-tab fixed left-0 top-[5.25rem] z-[55] hidden md:inline-flex"
      onMouseEnter={() => setOpen(true)}
      onFocus={() => setOpen(true)}
      onClick={() => setOpen(true)}
      aria-label="Open navigation"
    >
      <PanelLeftOpen className="size-4 text-muted-foreground" aria-hidden />
    </button>
  );
}
