import { SiteHeader } from "@/components/site-header";
import { ServicesMenu } from "@/components/services/services-menu";
import { getSessionProfile } from "@/lib/auth";
import { getServiceMenu } from "@/lib/services";

export default async function ServicesPage() {
  const [{ profile }, categories] = await Promise.all([
    getSessionProfile(),
    getServiceMenu(),
  ]);

  const isOwner = profile?.role === "owner";

  return (
    <>
      <SiteHeader title="Services & Pricing" />
      <div className="page-gradient flex flex-1 flex-col gap-8 p-4 md:p-8">
        <div className="max-w-3xl">
          <p className="section-kicker text-muted-foreground text-sm uppercase tracking-widest text-accent">
            Menu
          </p>
          <h2 className="font-serif mt-1 text-3xl text-primary md:text-5xl">
            Services & pricing
          </h2>
          <p className="text-muted-foreground rhythm-copy mt-3 text-sm leading-relaxed md:text-base">
            {isOwner
              ? "Update prices anytime — changes appear instantly for all visitors."
              : "Transparent pricing for every service. Custom art may vary — ask at booking for a quote."}
          </p>
        </div>

        <ServicesMenu categories={categories} isOwner={isOwner} />
      </div>
    </>
  );
}
