import { SiteHeader } from "@/components/site-header";
import { PortfolioFeaturedCarousel } from "@/components/portfolio/portfolio-featured-carousel";
import { PortfolioHero } from "@/components/portfolio/portfolio-hero";
import { PortfolioShowcase } from "@/components/portfolio/portfolio-showcase";
import { getFeaturedPortfolioImages } from "@/lib/portfolio";

export default function PortfolioPage() {
  const featured = getFeaturedPortfolioImages(5);

  return (
    <>
      <SiteHeader title="Portfolio" />
      <div className="page-gradient flex flex-1 flex-col gap-8 p-4 md:p-8">
        <PortfolioHero />
        <PortfolioFeaturedCarousel images={featured} />
        <div className="max-w-3xl">
          <p className="section-kicker text-muted-foreground text-sm uppercase tracking-widest text-accent">
            Nail Art Gallery
          </p>
          <h2 className="font-serif mt-1 text-3xl text-primary md:text-4xl">
            Browse every set
          </h2>
          <p className="text-muted-foreground rhythm-copy mt-3 text-sm leading-relaxed md:text-base">
            Filter by style, tap any image for a full-screen preview, and book
            when you find your vibe.
          </p>
        </div>
        <PortfolioShowcase />
      </div>
    </>
  );
}
