export default function Loading() {
  return (
    <div className="mx-auto min-h-screen max-w-2xl px-5 py-20 sm:px-6 animate-pulse" aria-label="Loading pending post">
      <div className="h-6 w-64 rounded bg-white/5 mb-4" />
      <div className="h-4 w-full rounded bg-white/5 mb-2" />
      <div className="h-4 w-5/6 rounded bg-white/5 mb-6" />
      <div className="h-64 rounded-3xl bg-white/5" />
    </div>
  );
}
