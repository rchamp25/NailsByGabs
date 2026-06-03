import Link from "next/link";

import { SiteHeader } from "@/components/site-header";
import { PortfolioShowcase } from "@/components/portfolio/portfolio-showcase";

export default function PortfolioPage() {
  return (
    <>
      <SiteHeader title="Portfolio" />
      <div className="page-gradient flex flex-1 flex-col gap-8 p-4 md:p-8">
        <div className="md:hidden">
          <Link
            href="/book"
            className="micro-pop flex items-center justify-between gap-3 rounded-2xl border border-gold/40 bg-card/90 px-4 py-3 shadow-sm backdrop-blur-sm"
          >
            <span className="text-sm font-medium text-rose-red-deep">
              Ready to book?
            </span>
            <span className="rounded-full bg-rose-red px-3 py-1 text-xs font-medium text-primary-foreground">
              View calendar
            </span>
          </Link>
        </div>
        <div className="max-w-3xl">
          <p className="section-kicker text-muted-foreground text-sm uppercase tracking-widest text-gold">
            Nail Art Gallery
          </p>
          <h2 className="font-serif mt-1 text-3xl text-rose-red md:text-5xl">
            Sets crafted with love
          </h2>
          <p className="text-muted-foreground rhythm-copy mt-3 text-sm leading-relaxed md:text-base">
            Explore a curated collection of recent sets. Use filters to find your
            vibe, then tap any image for a full-screen hero preview.
          </p>
        </div>
        <PortfolioShowcase />
      </div>
    </>
  );
}
