import Link from "next/link";
import { CalendarHeart } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Always-visible Book button. Place it as the last child of a page's content
 * column. It uses position: sticky rather than fixed: on mobile the page
 * scrolls inside .app-scroll-region (not the window) and PageMotion leaves a
 * transform on an ancestor, both of which break position: fixed, especially
 * in Instagram's in-app browser. Sticky follows the nearest scroll container,
 * so it rests just above the bottom nav on mobile and the viewport bottom on
 * desktop. Do not wrap it in ScrollReveal (overflow: hidden breaks sticky).
 */
export function BookCtaBar() {
  return (
    <div className="pointer-events-none sticky bottom-3 z-30 mt-auto flex justify-center md:bottom-6 md:justify-end">
      <Button
        asChild
        size="lg"
        className="book-cta-glow pointer-events-auto rounded-full px-6"
      >
        <Link href="/book">
          <CalendarHeart aria-hidden />
          Book appointment
        </Link>
      </Button>
    </div>
  );
}
