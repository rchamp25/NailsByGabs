import { SiteHeader } from "@/components/site-header";
import { serviceCategories } from "@/lib/data";

function ServiceRow({
  name,
  price,
  note,
}: {
  name: string;
  price: string;
  note?: string;
}) {
  return (
    <li className="flex items-baseline gap-3 py-3">
      <span className="shrink-0 font-medium text-foreground">{name}</span>
      <span
        className="gold-divider min-w-[2rem] flex-1 self-center"
        aria-hidden
      />
      <span className="shrink-0 font-serif text-lg text-rose-red">{price}</span>
      {note && (
        <span className="text-muted-foreground w-full text-xs sm:col-span-3 sm:pl-0">
          {note}
        </span>
      )}
    </li>
  );
}

export default function ServicesPage() {
  return (
    <>
      <SiteHeader title="Services & Pricing" />
      <div className="page-gradient flex flex-1 flex-col gap-8 p-4 md:p-8">
        <div className="max-w-2xl">
          <p className="text-muted-foreground text-sm uppercase tracking-widest text-gold">
            Menu
          </p>
          <h2 className="font-serif mt-1 text-3xl text-rose-red md:text-4xl">
            Services & pricing
          </h2>
          <p className="text-muted-foreground mt-3 text-sm leading-relaxed md:text-base">
            Transparent pricing for every service. Custom art may vary — ask at
            booking for a quote.
          </p>
        </div>

        <div className="grid max-w-3xl gap-8">
          {serviceCategories.map((category) => (
            <section
              key={category.title}
              className="rounded-2xl border border-gold/25 bg-card/90 p-6 shadow-sm backdrop-blur-sm"
            >
              <h3 className="font-serif border-b border-gold/30 pb-3 text-2xl text-rose-red-deep">
                {category.title}
              </h3>
              <ul className="mt-2 divide-y divide-border/60">
                {category.items.map((item) => (
                  <ServiceRow key={item.name} {...item} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
