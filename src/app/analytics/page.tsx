import { Suspense } from "react";
import { redirect } from "next/navigation";

import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";
import { AnalyticsTimeframeBar } from "@/components/analytics/analytics-timeframe-bar";
import { SiteHeader } from "@/components/site-header";
import { getSessionProfile } from "@/lib/auth";
import { getAnalyticsSnapshot, parseAnalyticsTimeframe } from "@/lib/analytics";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { profile } = await getSessionProfile();

  if (!profile || profile.role !== "owner") {
    redirect("/");
  }

  const { range } = await searchParams;
  const timeframe = parseAnalyticsTimeframe(range);
  const { snapshot, error } = await getAnalyticsSnapshot(timeframe);

  return (
    <>
      <SiteHeader title="Analytics" />
      <div className="page-gradient flex flex-1 flex-col gap-8 p-4 md:p-8">
        <div className="max-w-5xl">
          <p className="section-kicker text-muted-foreground text-sm uppercase tracking-widest text-accent">
            Business insights
          </p>
          <h2 className="font-serif mt-1 text-3xl text-primary md:text-5xl">
            Analytics
          </h2>
          <p className="text-muted-foreground rhythm-copy mt-3 max-w-2xl text-sm leading-relaxed md:text-base">
            Track bookings, completions, location mix, and estimated revenue.
            Use the timeframe bar to focus on a specific period or view everything
            on record.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="h-12 rounded-xl border border-accent/20 bg-background/75" />
          }
        >
          <AnalyticsTimeframeBar active={timeframe} />
        </Suspense>

        {error ? (
          <p className="text-destructive rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
            {error}
          </p>
        ) : snapshot ? (
          <AnalyticsDashboard snapshot={snapshot} />
        ) : null}
      </div>
    </>
  );
}
