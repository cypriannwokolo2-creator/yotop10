export function CategoryFeedSkeleton() {
  return (
    <div className="animate-pulse" aria-label="Loading category feed">
      <div className="h-8 w-64 rounded bg-white/5 mb-2" />
      <div className="h-4 w-96 max-w-full rounded bg-white/5 mb-6" />
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
