import Link from "next/link";

import { BookCtaBar } from "@/components/book-cta-bar";
import { SiteHeader } from "@/components/site-header";
import { SocialLinks } from "@/components/social-links";
import { ScrollReveal } from "@/components/effects/scroll-reveal";
import { PortfolioFeaturedCarousel } from "@/components/portfolio/portfolio-featured-carousel";
import { PortfolioShowcase } from "@/components/portfolio/portfolio-showcase";
import { Button } from "@/components/ui/button";
import { getPortfolioView } from "@/lib/portfolio-photos";

export default async function PortfolioPage() {
  const { gallery, featured } = await getPortfolioView();

  return (
    <>
      <SiteHeader title="Portfolio" actions={<SocialLinks />} />
      <div className="page-gradient flex flex-1 flex-col gap-8 p-4 md:p-8">
        <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <h2 className="seasonal-title font-serif text-3xl text-primary md:text-5xl">
              GelX sets by Gabs
            </h2>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed md:text-base">
              Webster, NY year-round and SUNY Binghamton during the semester.
              Find a set you love, then grab an open time.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-full px-6">
              <Link href="/book">Book an appointment</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full">
              <Link href="/services">See prices</Link>
            </Button>
          </div>
        </section>
        <ScrollReveal>
          <PortfolioFeaturedCarousel images={featured} />
        </ScrollReveal>
        <ScrollReveal>
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
        </ScrollReveal>
        <PortfolioShowcase images={gallery} />
        <BookCtaBar />
      </div>
    </>
  );
}
