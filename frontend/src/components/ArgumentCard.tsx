'use client';

import { memo } from 'react';
import Link from 'next/link';
import { Icon } from './icons/Icon';
import { ArgumentBar } from './ArgumentBar';
import { relativeTime } from '@/lib/dates';
import { toPublicSlug } from '@/lib/username';
import type { ArgumentPost } from '@/lib/api/types';

const POST_TYPE_CONFIG: Record<string, { label: string; bgClass: string; textClass: string }> = {
  this_vs_that: { label: 'THIS VS THAT', bgClass: 'bg-orange-500/10', textClass: 'text-orange-400' },
  counter_list: { label: 'COUNTER LIST', bgClass: 'bg-teal-500/10', textClass: 'text-teal-400' },
};

interface ArgumentCardProps {
  argument: ArgumentPost;
}

export const ArgumentCard = memo(function ArgumentCard({ argument }: ArgumentCardProps) {
  const config = POST_TYPE_CONFIG[argument.post_type] ?? {
    label: argument.post_type.toUpperCase(),
    bgClass: 'bg-white/5',
    textClass: 'text-zinc-400',
  };

  const topComment = argument.top_comments?.[0];
  const contentPreview = topComment
    ? topComment.content.length > 120
      ? topComment.content.slice(0, 120) + '...'
      : topComment.content
    : null;

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 sm:p-8 transition hover:border-white/[0.12]">
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${config.bgClass} ${config.textClass}`}>
          {config.label}
        </span>

        <span className="text-xs font-mono text-zinc-600 uppercase tracking-wider">
          {argument.category_name || argument.category_slug}
        </span>

        {argument.velocity > 0 && (
          <span className="text-xs font-mono text-orange-400">
            {argument.velocity} replies/hour
          </span>
        )}
      </div>

      <Link href={`/${argument.slug}`} className="block group mb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-white group-hover:text-orange-400 transition-colors leading-tight">
          {argument.title}
        </h2>
      </Link>

      {topComment && (
        <div className="mb-5 rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-orange-500/20 text-xs font-mono text-orange-400 tabular-nums">
              {topComment.rank}
            </span>
            <span className="text-sm text-zinc-400">
              On item #{topComment.rank}: {topComment.item_title}
            </span>
          </div>
          <p className="text-sm text-zinc-500 leading-relaxed mb-3">
            {contentPreview}
          </p>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-zinc-500">
              @{toPublicSlug(topComment.author_username)}
            </span>
            <span className="flex items-center gap-1 text-xs text-zinc-600">
              <Icon name="Flame" size={12} />
              <span className="font-mono tabular-nums">{topComment.fire_count}</span>
            </span>
          </div>
        </div>
      )}

      <div className="mb-5">
        <ArgumentBar supportPct={argument.support_pct} contradictPct={argument.contradict_pct} />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center rounded-full bg-white/10 text-sm font-mono text-zinc-400 w-8 h-8 shrink-0">
            {(argument.author_display_name || argument.author_username || '?')[0].toUpperCase()}
          </span>
          <span className="text-sm text-zinc-500">
            @{toPublicSlug(argument.author_username)}
          </span>
        </div>
        <div className="flex items-center gap-4 font-mono tabular-nums text-xs text-zinc-600">
          <span className="text-xs text-zinc-600" suppressHydrationWarning>
            {relativeTime(argument.last_active)}
          </span>
          <span className="flex items-center gap-1.5">
            <Icon name="Eye" size={12} />
            {argument.view_count}
          </span>
          <span className="flex items-center gap-1.5">
            <Icon name="MessageCircle" size={12} />
            {argument.comment_count}
          </span>
        </div>
      </div>
    </div>
  );
});
