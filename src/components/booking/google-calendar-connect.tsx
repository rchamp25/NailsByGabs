import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type GoogleCalendarConnectProps = {
  connected: boolean;
  configured: boolean;
};

export function GoogleCalendarConnect({
  connected,
  configured,
}: GoogleCalendarConnectProps) {
  if (!configured) {
    return (
      <Card className="border-gold/25 bg-card/80">
        <CardHeader>
          <CardTitle className="text-lg text-rose-red">
            Google Calendar sync
          </CardTitle>
          <CardDescription>
            Add <code className="text-xs">GOOGLE_CLIENT_ID</code> and{" "}
            <code className="text-xs">GOOGLE_CLIENT_SECRET</code> in Vercel to
            enable automatic sync to Gabs&apos;s Google Calendar when slots are
            added or booked.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-gold/25 bg-card/80">
      <CardHeader>
        <CardTitle className="text-lg text-rose-red">
          Google Calendar sync
        </CardTitle>
        <CardDescription>
          {connected
            ? "Appointments sync when you add, book, or update slots. If sync stopped after a domain change, disconnect and reconnect once."
            : "Connect once to automatically add appointments to your Google Calendar."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {connected ? (
          <>
            <p className="text-muted-foreground text-sm">
              Connected — new and updated slots sync to your calendar.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/api/google/connect">Reconnect</Link>
              </Button>
              <form action="/api/google/disconnect" method="post">
                <Button type="submit" variant="outline" size="sm">
                  Disconnect
                </Button>
              </form>
            </div>
          </>
        ) : (
          <Button asChild variant="outline">
            <Link href="/api/google/connect">Connect Google Calendar</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
