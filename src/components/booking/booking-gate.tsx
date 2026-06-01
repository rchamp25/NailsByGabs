import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function BookingGate() {
  return (
    <Card className="border-gold/30 mx-auto max-w-lg">
      <CardHeader>
        <CardTitle className="text-rose-red">Sign in to book</CardTitle>
        <CardDescription>
          Create a free account to view the calendar and reserve open appointment
          slots. No payment is processed on this site.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/auth/login">Sign in</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/auth/signup">Create account</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
