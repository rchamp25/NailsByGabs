export default function RootLoading() {
  return (
    <div className="main-floral-accent flex min-h-[60vh] flex-1 flex-col gap-6 p-6 md:p-10">
      <div className="animate-pulse space-y-3">
        <div className="h-3 w-28 rounded-full bg-gold/35" />
        <div className="h-10 w-72 rounded-lg bg-pastel-pink-deep/30" />
        <div className="h-4 w-96 max-w-full rounded bg-muted/70" />
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            className="relative aspect-square overflow-hidden rounded-2xl border border-border/60 bg-card/80"
          >
            <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-pastel-pink/70 via-card to-pastel-pink/50" />
          </div>
        ))}
      </div>
    </div>
  );
}
