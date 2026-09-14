'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Icon } from '@/components/icons/Icon';

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  top_list: { label: 'Top List', color: 'text-orange-400 border-orange-500/30 bg-orange-500/10' },
  best_of: { label: 'Best Of', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
  worst_of: { label: 'Worst Of', color: 'text-red-400 border-red-500/30 bg-red-500/10' },
  counter_list: { label: 'Counter List', color: 'text-purple-400 border-purple-500/30 bg-purple-500/10' },
  this_vs_that: { label: 'Debate', color: 'text-purple-400 border-purple-500/30 bg-purple-500/10' },
  fact_drop: { label: 'Fact Drop', color: 'text-pink-400 border-pink-500/30 bg-pink-500/10' },
  article: { label: 'Article', color: 'text-sky-400 border-sky-500/30 bg-sky-500/10' },
};

function PendingContent() {
  const searchParams = useSearchParams();
  const title = searchParams?.get('title') || '';
  const type = searchParams?.get('type') || 'top_list';
  const typeInfo = TYPE_LABELS[type] || TYPE_LABELS.top_list;

  return (
    <div className="relative mx-auto flex min-h-[calc(100vh-56px)] max-w-2xl flex-col items-center justify-center px-4 py-12 sm:px-6">
      {/* ambient glow — unique to this page */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-10 h-64 w-64 -translate-x-1/2 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute bottom-10 left-10 h-40 w-40 rounded-full bg-pink-500/10 blur-3xl" />
        <div className="absolute bottom-20 right-10 h-40 w-40 rounded-full bg-purple-500/10 blur-3xl" />
      </div>

      <div className="relative w-full rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-center backdrop-blur-xl sm:p-10">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500/20 to-pink-500/20 ring-1 ring-orange-500/30">
          <Icon name="Hourglass" size={28} className="text-orange-400" />
        </div>

        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-orange-400">
          Post received
        </p>
        <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
          Pending review
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-zinc-400">
          Your post was made and is now waiting for moderation. It will go live
          as soon as it is approved.
        </p>

        {(title || type) && (
          <div className="mx-auto mt-6 max-w-md rounded-2xl border border-white/5 bg-black/20 p-4 text-left">
            {title && (
              <p className="truncate text-sm font-semibold text-white" title={title}>
                &ldquo;{title}&rdquo;
              </p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${typeInfo.color}`}>
                {typeInfo.label}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-300">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
                In queue
              </span>
            </div>
          </div>
        )}

        {/* timeline — unique to this page */}
        <div className="mx-auto mt-6 flex max-w-md items-center justify-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <Icon name="Check" size={14} /> Submitted
          </span>
          <span className="h-px w-8 bg-white/10" />
          <span className="flex items-center gap-1.5 font-semibold text-amber-300">
            <Icon name="Clock" size={14} /> Under review
          </span>
          <span className="h-px w-8 bg-white/10" />
          <span className="flex items-center gap-1.5 text-zinc-600">
            <Icon name="Rocket" size={14} /> Live
          </span>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition hover:shadow-xl active:scale-[0.98]"
          >
            <Icon name="House" size={16} />
            Go to home page
          </Link>
          <Link
            href="/explore"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-zinc-200 backdrop-blur-sm transition hover:border-white/20 hover:bg-white/10"
          >
            <Icon name="Compass" size={16} />
            Explore
          </Link>
          <Link
            href="/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-transparent px-6 py-3 text-sm font-semibold text-zinc-400 transition hover:text-white"
          >
            <Icon name="Plus" size={16} />
            New post
          </Link>
        </div>

        <p className="mt-6 text-xs leading-relaxed text-zinc-600">
          Usually reviewed within a day. You can check status from your profile.
        </p>
      </div>
    </div>
  );
}

export default function PendingClient() {
  return (
    <Suspense fallback={<div className="mx-auto min-h-[60vh] max-w-2xl animate-pulse px-4 py-12"><div className="h-64 rounded-3xl bg-white/5" /></div>}>
      <PendingContent />
    </Suspense>
  );
}
