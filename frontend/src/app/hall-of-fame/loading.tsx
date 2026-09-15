export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-3 sm:px-5 py-5 animate-pulse" aria-label="Loading hall of fame">
      <div className="h-8 w-56 rounded bg-white/5 mb-6 mx-auto" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/5 bg-white/5 p-4">
            <div className="h-4 w-2/3 rounded bg-white/5 mb-2" />
            <div className="h-3 w-full rounded bg-white/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
