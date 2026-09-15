export function SearchSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-3 sm:px-5 py-5 animate-pulse" aria-label="Loading search results">
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/5 bg-white/5 p-4">
            <div className="h-4 w-3/4 rounded bg-white/5 mb-2" />
            <div className="h-3 w-full rounded bg-white/5 mb-2" />
            <div className="h-3 w-1/2 rounded bg-white/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
