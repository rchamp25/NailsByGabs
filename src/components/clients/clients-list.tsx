"use client";

import { useActionState } from "react";

import {
  sendClientPasswordReset,
  type ClientsActionState,
} from "@/app/clients/actions";
import { Button } from "@/components/ui/button";
import type { OwnerClientRow } from "@/lib/clients";
import { cn } from "@/lib/utils";

function ClientRow({ client }: { client: OwnerClientRow }) {
  const [state, formAction, pending] = useActionState<
    ClientsActionState | null,
    FormData
  >(sendClientPasswordReset, null);

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

        <form action={formAction} className="shrink-0 sm:pt-0.5">
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
      </div>

      {state?.error && (
        <p className="text-destructive mt-3 text-sm" role="alert">
          {state.error}
        </p>
      )}
      {state?.success && state.message && (
        <p className="mt-3 text-sm text-emerald-800 dark:text-emerald-300" role="status">
          {state.message}
        </p>
      )}
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
