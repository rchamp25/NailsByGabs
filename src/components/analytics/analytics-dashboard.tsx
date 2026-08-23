"use client";

import { ScrollReveal } from "@/components/effects/scroll-reveal";
import { AnalyticsTrendChart } from "@/components/analytics/analytics-trend-chart";
import { SplitBarChart } from "@/components/analytics/split-bar-chart";
import { StatCard } from "@/components/analytics/stat-card";
import type { AnalyticsSnapshot } from "@/lib/analytics-format";
import {
  formatPercent,
  formatUsdFromCents,
} from "@/lib/analytics-format";

type AnalyticsDashboardProps = {
  snapshot: AnalyticsSnapshot;
};

function formatTrackingDate(iso: string | null): string {
  if (!iso) return "Not configured";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Not configured";
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function AnalyticsDashboard({ snapshot }: AnalyticsDashboardProps) {
  const { totals, byLocation, bySource, monthlyCompleted, topClients } =
    snapshot;
  const perAppointment = formatUsdFromCents(
    snapshot.defaultAppointmentValueCents
  );
  const trendTitle =
    snapshot.timeframe === "1m" ? "Completed by day" : "Completed by month";
  const trendDescription =
    snapshot.timeframe === "1m"
      ? `Daily completions for ${snapshot.timeframeLabel.toLowerCase()}.`
      : snapshot.timeframe === "all"
        ? "All completed months on record."
        : `Monthly completions for ${snapshot.timeframeLabel.toLowerCase()}.`;

  return (
    <div className="flex flex-col gap-8 pb-8">
      <ScrollReveal>
        <p className="text-muted-foreground rounded-xl border border-accent/15 bg-background/60 px-4 py-3 text-sm leading-relaxed">
          Showing{" "}
          <span className="text-foreground font-medium">
            {snapshot.timeframeLabel.toLowerCase()}
          </span>
          {snapshot.trackingStartedAt ? (
            <>
              {" "}
              · earliest event{" "}
              <span className="text-foreground font-medium">
                {formatTrackingDate(snapshot.trackingStartedAt)}
              </span>
            </>
          ) : null}
          . Estimated revenue uses{" "}
          <span className="text-foreground font-medium">{perAppointment}</span>{" "}
          per completed appointment.
        </p>
      </ScrollReveal>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ScrollReveal>
          <StatCard
            label="Appointments booked"
            value={String(totals.booked)}
            hint={`Bookings in ${snapshot.timeframeLabel.toLowerCase()}`}
          />
        </ScrollReveal>
        <ScrollReveal>
          <StatCard
            label="Completed"
            value={String(totals.completed)}
            hint="Finished 24h after end with no changes"
            accent="accent"
          />
        </ScrollReveal>
        <ScrollReveal>
          <StatCard
            label="Site clients"
            value={String(totals.uniqueClients)}
            hint={`In ${snapshot.timeframeLabel.toLowerCase()}`}
          />
        </ScrollReveal>
        <ScrollReveal>
          <StatCard
            label="Est. revenue"
            value={formatUsdFromCents(totals.estimatedRevenueCents)}
            hint={`${totals.completed} completed × ${perAppointment}`}
            accent="accent"
          />
        </ScrollReveal>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ScrollReveal>
          <SplitBarChart
            title="By location"
            description="Completed appointments and estimated revenue split."
            items={[
              {
                id: "webster-completed",
                label: "Webster",
                sublabel: "Completed",
                value: byLocation.webster.completed,
                tone: "primary",
              },
              {
                id: "binghamton-completed",
                label: "Binghamton",
                sublabel: "Completed",
                value: byLocation.binghamton.completed,
                tone: "accent",
              },
            ]}
          />
        </ScrollReveal>

        <ScrollReveal>
          <SplitBarChart
            title="Booking source"
            description="Site account bookings vs. owner-marked taken slots."
            items={[
              {
                id: "platform-completed",
                label: "Booked by site user",
                sublabel: "Completed",
                value: bySource.platform.completed,
                tone: "primary",
              },
              {
                id: "manual-completed",
                label: "Created as taken",
                sublabel: "Completed",
                value: bySource.manual.completed,
                tone: "accent",
              },
            ]}
          />
        </ScrollReveal>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ScrollReveal className="lg:col-span-2">
          <section className="rounded-xl border border-accent/20 bg-background/75 p-5 shadow-sm backdrop-blur-sm">
            <h3 className="font-serif text-xl text-primary md:text-2xl">
              {trendTitle}
            </h3>
            <p className="text-muted-foreground mt-1 text-sm">
              {trendDescription}
            </p>

            {monthlyCompleted.length === 0 ? (
              <p className="text-muted-foreground mt-8 text-sm">
                No completed appointments yet — stats will appear here after
                appointments finish their 24-hour completion window.
              </p>
            ) : null}

            {monthlyCompleted.length > 0 ? (
              <AnalyticsTrendChart
                points={monthlyCompleted}
                timeframe={snapshot.timeframe}
              />
            ) : null}
          </section>
        </ScrollReveal>

        <ScrollReveal>
          <section className="rounded-xl border border-accent/20 bg-background/75 p-5 shadow-sm backdrop-blur-sm">
            <h3 className="font-serif text-xl text-primary md:text-2xl">
              Outcomes
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-center justify-between gap-3 border-b border-border/60 pb-3">
                <span className="text-muted-foreground">Cancelled</span>
                <span className="font-medium text-foreground">
                  {totals.cancelled}
                </span>
              </li>
              <li className="flex items-center justify-between gap-3 border-b border-border/60 pb-3">
                <span className="text-muted-foreground">Released by owner</span>
                <span className="font-medium text-foreground">
                  {totals.released}
                </span>
              </li>
              <li className="flex items-center justify-between gap-3 border-b border-border/60 pb-3">
                <span className="text-muted-foreground">Removed by owner</span>
                <span className="font-medium text-foreground">
                  {totals.deleted}
                </span>
              </li>
              <li className="flex items-center justify-between gap-3 pt-1">
                <span className="text-muted-foreground">Cancellation rate</span>
                <span className="font-serif text-lg text-accent">
                  {formatPercent(totals.cancellationRate)}
                </span>
              </li>
            </ul>
          </section>
        </ScrollReveal>
      </div>

      <ScrollReveal>
        <section className="rounded-xl border border-accent/20 bg-background/75 p-5 shadow-sm backdrop-blur-sm">
          <h3 className="font-serif text-xl text-primary md:text-2xl">
            Top site clients
          </h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Top site clients in {snapshot.timeframeLabel.toLowerCase()}.
          </p>

          {topClients.length === 0 ? (
            <p className="text-muted-foreground mt-6 text-sm">
              No client booking activity yet.
            </p>
          ) : (
            <ul className="mt-5 divide-y divide-border/70">
              {topClients.map((client) => (
                <li
                  key={client.id}
                  className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <p className="font-medium text-foreground">{client.fullName}</p>
                  <div className="text-muted-foreground flex gap-4 text-sm">
                    <span>
                      <span className="text-foreground font-medium">
                        {client.appointmentsBooked}
                      </span>{" "}
                      booked
                    </span>
                    <span>
                      <span className="text-accent font-medium">
                        {client.appointmentsCompleted}
                      </span>{" "}
                      completed
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </ScrollReveal>

      <ScrollReveal>
        <SplitBarChart
          title="Location revenue estimate"
          description="Approximate completed revenue by studio location."
          valueFormatter={(value) => formatUsdFromCents(value)}
          items={[
            {
              id: "webster-revenue",
              label: "Webster",
              value: byLocation.webster.estimatedRevenueCents,
              tone: "primary",
            },
            {
              id: "binghamton-revenue",
              label: "Binghamton",
              value: byLocation.binghamton.estimatedRevenueCents,
              tone: "accent",
            },
          ]}
        />
      </ScrollReveal>
    </div>
  );
}
