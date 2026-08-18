"use client";

import { useActionState } from "react";
import Link from "next/link";

import {
  requestPasswordReset,
  type AuthActionState,
} from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState<
    AuthActionState | null,
    FormData
  >(requestPasswordReset, null);

  return (
    <Card className="border-accent/30 w-full shadow-sm">
      <CardHeader>
        <CardTitle className="text-primary">Forgot password?</CardTitle>
        <CardDescription>
          Enter the email you used to sign up. We&apos;ll send a link to choose a
          new password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              className="min-h-11"
            />
          </div>
          {state?.error && (
            <p className="text-sm text-primary" role="alert">
              {state.error}
            </p>
          )}
          {state?.message && (
            <p
              className="rounded-xl border border-accent/40 bg-secondary/60 px-3 py-3 text-sm leading-relaxed text-primary"
              role="status"
            >
              {state.message}
            </p>
          )}
          <Button type="submit" disabled={pending} className="min-h-11 w-full">
            {pending ? "Sending…" : "Send reset link"}
          </Button>
        </form>
        <p className="text-muted-foreground mt-4 text-center text-sm">
          Remember your password?{" "}
          <Link href="/auth/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
