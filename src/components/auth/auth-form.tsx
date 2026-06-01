"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { signIn, signUp, type AuthActionState } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type AuthFormProps = {
  mode: "login" | "signup";
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const action = mode === "login" ? signIn : signUp;
  const [state, formAction, pending] = useActionState<AuthActionState | null>(
    action,
    null
  );

  useEffect(() => {
    if (state?.success && !state.message) {
      router.push("/book");
      router.refresh();
    }
  }, [state, router]);

  return (
    <Card className="border-gold/30 mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-rose-red">
          {mode === "login" ? "Welcome back" : "Create an account"}
        </CardTitle>
        <CardDescription>
          {mode === "login"
            ? "Sign in to view the calendar and book appointments."
            : "Anyone can register to reserve open time slots."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                name="fullName"
                placeholder="Maddy Brown"
                required
                autoComplete="name"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
            />
          </div>
          {state?.error && (
            <p className="text-sm text-rose-red" role="alert">
              {state.error}
            </p>
          )}
          {state?.message && (
            <p className="text-sm text-rose-red-deep" role="status">
              {state.message}
            </p>
          )}
          <Button type="submit" disabled={pending} className="w-full">
            {pending
              ? "Please wait…"
              : mode === "login"
                ? "Sign in"
                : "Sign up"}
          </Button>
        </form>
        <p className="text-muted-foreground mt-4 text-center text-sm">
          {mode === "login" ? (
            <>
              No account?{" "}
              <Link href="/auth/signup" className="text-rose-red hover:underline">
                Sign up
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link href="/auth/login" className="text-rose-red hover:underline">
                Sign in
              </Link>
            </>
          )}
        </p>
      </CardContent>
    </Card>
  );
}
