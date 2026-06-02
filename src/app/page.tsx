import { SiteHeader } from "@/components/site-header";
import { portfolioItems } from "@/lib/data";
import { cn } from "@/lib/utils";

const aspectClasses = {
  tall: "row-span-2",
  wide: "col-span-2",
  square: "",
};

export default function PortfolioPage() {
  return (
    <>
      <SiteHeader title="Portfolio" />
      <div className="flex flex-1 flex-col gap-8 p-4 md:p-8">
        <div className="max-w-2xl">
          <p className="text-muted-foreground text-sm uppercase tracking-widest text-gold">
            Nail Art Gallery
          </p>
          <h2 className="font-serif mt-1 text-3xl text-rose-red md:text-4xl">
            Sets crafted with love
          </h2>
          <p className="text-muted-foreground mt-3 text-sm leading-relaxed md:text-base">
            A curated look at recent work. Replace placeholders with your own
            high-resolution photos.
          </p>
        </div>

        <div className="grid auto-rows-[180px] grid-cols-2 gap-4 md:auto-rows-[200px] md:grid-cols-3 lg:gap-5">
          {portfolioItems.map((item, index) => (
            <figure
              key={item.id}
              className={cn(
                "gold-ring-hover animate-portfolio-item group relative overflow-hidden rounded-2xl border border-border/60",
                aspectClasses[item.aspect]
              )}
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <div
                className="absolute inset-0 bg-gradient-to-br from-pastel-pink via-pastel-pink-deep/80 to-rose-red/20"
                aria-hidden
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
                <span className="font-serif text-lg text-rose-red-deep md:text-xl">
                  {item.title}
                </span>
                <span className="text-muted-foreground text-xs">
                  Image placeholder
                </span>
              </div>
              <figcaption className="sr-only">{item.title}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </>
  );
}
