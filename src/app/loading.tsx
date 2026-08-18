export default function Loading() {
  return (
    <div className="page-gradient flex min-h-[60vh] flex-1 flex-col gap-6 p-6 md:p-10">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
      <div className="h-4 w-full max-w-md animate-pulse rounded bg-muted" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="aspect-[4/5] animate-pulse rounded-2xl bg-muted" />
        <div className="space-y-3">
          <div className="h-6 w-2/3 animate-pulse rounded bg-muted" />
          <div className="h-4 w-full animate-pulse rounded bg-muted" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}
