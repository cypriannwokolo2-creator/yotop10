export function PostDetailSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-3 sm:px-5 py-5 animate-pulse" aria-label="Loading post">
      <div className="h-8 w-3/4 rounded bg-white/5 mb-3" />
      <div className="flex items-center gap-3 mb-6">
        <div className="h-9 w-9 rounded-full bg-white/5" />
        <div className="space-y-1.5">
          <div className="h-3 w-28 rounded bg-white/5" />
          <div className="h-2 w-20 rounded bg-white/5" />
        </div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/5 bg-white/5 p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-8 rounded-full bg-white/5" />
              <div className="h-4 w-2/3 rounded bg-white/5" />
            </div>
            <div className="h-3 w-full rounded bg-white/5 mb-2" />
            <div className="h-3 w-4/5 rounded bg-white/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
