"use client";

import { useActionState } from "react";

import {
  sendClientPasswordReset,
  sendClientVerificationEmail,
  type ClientsActionState,
} from "@/app/clients/actions";
import { Button } from "@/components/ui/button";
import type { OwnerClientRow } from "@/lib/clients";
import { cn } from "@/lib/utils";

function ActionMessage({ state }: { state: ClientsActionState | null }) {
  if (state?.error) {
    return (
      <p className="text-destructive text-sm" role="alert">
        {state.error}
      </p>
    );
  }

  if (state?.success && state.message) {
    return (
      <p
        className="text-sm text-emerald-800 dark:text-emerald-300"
        role="status"
      >
        {state.message}
      </p>
    );
  }

  return null;
}

function ClientVerificationResendForm({ client }: { client: OwnerClientRow }) {
  const [state, formAction, pending] = useActionState<
    ClientsActionState | null,
    FormData
  >(sendClientVerificationEmail, null);

  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
      <form action={formAction}>
        <input type="hidden" name="clientId" value={client.id} />
        <input type="hidden" name="email" value={client.email ?? ""} />
        <Button
          type="submit"
          size="sm"
          disabled={pending || !client.email}
          className="min-h-11 w-full sm:min-h-9 sm:w-auto"
        >
          {pending ? "Sending…" : "Resend verification"}
        </Button>
      </form>
      <ActionMessage state={state} />
    </div>
  );
}

function ClientPasswordResetForm({ client }: { client: OwnerClientRow }) {
  const [state, formAction, pending] = useActionState<
    ClientsActionState | null,
    FormData
  >(sendClientPasswordReset, null);

  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
      <form action={formAction}>
        <input type="hidden" name="clientId" value={client.id} />
        <input type="hidden" name="email" value={client.email ?? ""} />
        <Button
          type="submit"
          variant="outline"
          size="sm"
          disabled={pending || !client.email}
          className="min-h-11 w-full sm:min-h-9 sm:w-auto"
        >
          {pending ? "Sending…" : "Send reset email"}
        </Button>
      </form>
      <ActionMessage state={state} />
    </div>
  );
}

function ClientRow({ client }: { client: OwnerClientRow }) {
  return (
    <li className="border-border/60 rounded-xl border bg-background/70 p-4 shadow-xs">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <p className="font-medium text-foreground">{client.fullName}</p>
          <p className="text-muted-foreground break-all text-sm">
            {client.email ?? "No email on file"}
          </p>
          <span
            className={cn(
              "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
              client.emailVerified
                ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
                : "bg-amber-500/15 text-amber-900 dark:text-amber-200"
            )}
          >
            {client.emailVerified ? "Email verified" : "Not verified"}
          </span>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          {!client.emailVerified && (
            <ClientVerificationResendForm client={client} />
          )}
          <ClientPasswordResetForm client={client} />
        </div>
      </div>
    </li>
  );
}

type ClientsListProps = {
  clients: OwnerClientRow[];
};

export function ClientsList({ clients }: ClientsListProps) {
  if (clients.length === 0) {
    return (
      <p className="text-muted-foreground rounded-xl border border-dashed p-8 text-center text-sm">
        No client accounts yet. They appear here after someone signs up.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {clients.map((client) => (
        <ClientRow key={client.id} client={client} />
      ))}
    </ul>
  );
}
