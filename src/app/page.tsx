import { SiteHeader } from "@/components/site-header";
import { PortfolioShowcase } from "@/components/portfolio/portfolio-showcase";

export default function PortfolioPage() {
  return (
    <>
      <SiteHeader title="Portfolio" />
      <div className="main-floral-accent flex flex-1 flex-col gap-8 p-4 md:p-8">
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
