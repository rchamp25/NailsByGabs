import { ExternalLink } from "lucide-react";

import { ScrollReveal } from "@/components/effects/scroll-reveal";
import { Button } from "@/components/ui/button";
import type { CuticleOilPage } from "@/lib/cuticle-oil";
import { CUTICLE_OIL_SIZE } from "@/lib/cuticle-oil-limits";
import { cn } from "@/lib/utils";

const cardClass =
  "h-full rounded-2xl border border-accent/25 bg-card/90 p-5 shadow-sm backdrop-blur-sm md:p-6";
/** Lets the two cards in a row match heights (ScrollReveal wraps each in an inner div). */
const revealFill = "[&>.scroll-reveal-inner]:h-full";
const cardTitleClass = "font-serif border-b border-accent/30 pb-3 text-2xl text-primary";

/** "Order now" button, or "Ordering opens soon" until Gabs pastes the form link. */
export function CuticleOilOrderButton({ orderUrl }: { orderUrl: string }) {
  if (!orderUrl) {
    return (
      <p className="inline-flex rounded-full border border-accent/30 bg-secondary/60 px-5 py-2.5 text-sm font-medium text-primary">
        Ordering opens soon
      </p>
    );
  }

  return (
    <Button asChild size="lg" className="rounded-full">
      <a href={orderUrl} target="_blank" rel="noopener noreferrer">
        Order now
        <ExternalLink className="size-4" aria-hidden />
      </a>
    </Button>
  );
}

/** Visitor view of the cuticle oil page. */
export function CuticleOilMenu({ scents, price, orderUrl, ready }: CuticleOilPage) {
  if (!ready || scents.length === 0) {
    return (
      <p className="text-muted-foreground mx-auto w-full max-w-4xl rounded-xl border border-dashed p-8 text-center text-sm">
        Scents are coming soon. Check back shortly!
      </p>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-6 md:grid-cols-2">
      <ScrollReveal className={revealFill}>
        <section className={cardClass}>
          <h3 className={cardTitleClass}>Price</h3>
          {price ? (
            <p className="mt-4 font-serif text-5xl text-primary">{price}</p>
          ) : (
            <p className="text-muted-foreground mt-4 text-sm">Price coming soon.</p>
          )}
          <p className="mt-2 font-medium text-foreground">{CUTICLE_OIL_SIZE}</p>
          <p className="text-muted-foreground mt-1 text-xs">Same price for every scent.</p>
        </section>
      </ScrollReveal>

      <ScrollReveal className={revealFill}>
        <section className={cardClass}>
          <h3 className={cardTitleClass}>Scents</h3>
          {scents.length === 0 ? (
            <p className="text-muted-foreground mt-4 text-sm">Scents coming soon.</p>
          ) : (
            <ul className="mt-4 flex flex-wrap gap-2">
              {scents.map((scent) => (
                <li
                  key={scent.id}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-sm font-medium",
                    scent.soldOut
                      ? "border-border text-muted-foreground line-through decoration-1"
                      : "border-accent/40 bg-primary/10 text-primary"
                  )}
                >
                  {scent.name}
                  {scent.soldOut && <span className="sr-only"> (sold out)</span>}
                </li>
              ))}
            </ul>
          )}
          {scents.some((scent) => scent.soldOut) && (
            <p className="text-muted-foreground mt-3 text-xs">Crossed-out scents are sold out for now.</p>
          )}
        </section>
      </ScrollReveal>

      <ScrollReveal className="md:col-span-2">
        <section className={cn(cardClass, "flex flex-col items-start gap-4")}>
          <div>
            <h3 className="font-serif text-2xl text-primary">How to order</h3>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              Pick your scent on the order form, and Gabs will follow up to
              get it to you.
            </p>
          </div>
          <CuticleOilOrderButton orderUrl={orderUrl} />
        </section>
      </ScrollReveal>
    </div>
  );
}
