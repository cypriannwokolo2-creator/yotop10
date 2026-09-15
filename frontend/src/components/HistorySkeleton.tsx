export function HistorySkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-3 sm:px-5 py-5 animate-pulse" aria-label="Loading history">
      <div className="h-6 w-48 rounded bg-white/5 mb-5" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/5 bg-white/5 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 rounded bg-white/5" />
              <div className="h-3 w-16 rounded bg-white/5" />
            </div>
            <div className="h-4 w-full rounded bg-white/5" />
            <div className="h-3 w-2/3 rounded bg-white/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
