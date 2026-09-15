export function ArgumentsSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]" aria-label="Loading debates">
      <div className="max-w-5xl mx-auto px-5 py-10 sm:px-8 sm:py-14 animate-pulse">
        <div className="h-8 w-56 rounded bg-white/5 mb-3" />
        <div className="h-4 w-96 max-w-full rounded bg-white/5 mb-8" />
        <div className="flex flex-wrap gap-2 mb-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-9 w-24 rounded-full bg-white/5" />
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-white/5 bg-white/5 p-5">
              <div className="h-5 w-3/4 rounded bg-white/5 mb-3" />
              <div className="h-10 rounded bg-white/5 mb-3" />
              <div className="flex gap-3">
                <div className="h-8 flex-1 rounded-xl bg-white/5" />
                <div className="h-8 flex-1 rounded-xl bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
