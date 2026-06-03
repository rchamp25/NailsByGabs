"use client";

import { useActionState } from "react";
import Link from "next/link";

import { updatePassword, type AuthActionState } from "@/app/auth/actions";
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

type UpdatePasswordFormProps = {
  hasSession: boolean;
};

export function UpdatePasswordForm({ hasSession }: UpdatePasswordFormProps) {
  const [state, formAction, pending] = useActionState<
    AuthActionState | null,
    FormData
  >(updatePassword, null);

  if (!hasSession) {
    return (
      <Card className="border-gold/30 w-full shadow-sm">
        <CardHeader>
          <CardTitle className="text-rose-red">Link expired</CardTitle>
          <CardDescription>
            This password reset link is invalid or has already been used.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button asChild className="min-h-11 w-full">
            <Link href="/auth/forgot-password">Request a new link</Link>
          </Button>
          <Button asChild variant="outline" className="min-h-11 w-full">
            <Link href="/auth/login">Back to sign in</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gold/30 w-full shadow-sm">
      <CardHeader>
        <CardTitle className="text-rose-red">Choose a new password</CardTitle>
        <CardDescription>
          Enter a new password for your account, then sign in to book.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              className="min-h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              className="min-h-11"
            />
          </div>
          {state?.error && (
            <p className="text-sm text-rose-red" role="alert">
              {state.error}
            </p>
          )}
          <Button type="submit" disabled={pending} className="min-h-11 w-full">
            {pending ? "Saving…" : "Update password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
