export function NotificationDetailSkeleton() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-8 animate-pulse" aria-label="Loading notification">
      <div className="h-4 w-24 rounded bg-white/5 mb-6" />
      <div className="rounded-2xl border border-white/5 bg-white/5 p-5 space-y-3">
        <div className="h-5 w-2/3 rounded bg-white/5" />
        <div className="h-3 w-full rounded bg-white/5" />
        <div className="h-3 w-5/6 rounded bg-white/5" />
        <div className="h-3 w-1/3 rounded bg-white/5" />
      </div>
      <div className="mt-6 h-10 w-40 rounded-xl bg-white/5" />
    </div>
  );
}
