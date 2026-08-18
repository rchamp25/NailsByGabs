import Link from "next/link";

import { BlurText } from "@/components/effects/blur-text";
import { RotatingText } from "@/components/effects/rotating-text";
import { SilkBackground } from "@/components/effects/silk-background";
import { StarBorder } from "@/components/effects/star-border";
import { Button } from "@/components/ui/button";

export function PortfolioHero() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/70 p-6 shadow-sm backdrop-blur-sm md:p-8">
      <SilkBackground />
      <div className="relative z-10 flex flex-col gap-5 md:gap-6">
        <div>
          <p className="section-kicker text-muted-foreground text-xs uppercase tracking-widest text-accent md:text-sm">
            NailsByGabs
          </p>
          <h2 className="font-serif mt-2 text-3xl text-primary md:text-5xl">
            <BlurText text="Sets crafted with love" />
          </h2>
          <p className="text-muted-foreground mt-3 max-w-xl text-sm leading-relaxed md:text-base">
            GelX nails in Rochester & Binghamton — book open slots, browse the
            gallery, and find your next{" "}
            <RotatingText
              words={["Aura", "Chrome", "French", "3D", "Ombre"]}
              className="font-medium"
            />{" "}
            set.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <StarBorder>
            <Button asChild size="lg" className="rounded-full px-6">
              <Link href="/book">Book appointment</Link>
            </Button>
          </StarBorder>
          <Button asChild variant="outline" size="lg" className="rounded-full">
            <Link href="/services">View pricing</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
