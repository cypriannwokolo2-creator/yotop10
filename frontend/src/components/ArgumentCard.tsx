'use client';

import { memo } from 'react';
import Link from 'next/link';
import { Icon } from './icons/Icon';
import { ArgumentBar } from './ArgumentBar';
import { relativeTime } from '@/lib/dates';
import { toPublicSlug } from '@/lib/username';
import type { ArgumentPost } from '@/lib/api/types';

const POST_TYPE_CONFIG: Record<string, { label: string; bgClass: string; textClass: string; barColor: string }> = {
  this_vs_that: { label: 'VS', bgClass: 'bg-orange-500/10', textClass: 'text-orange-400', barColor: 'from-orange-500 to-red-500' },
  counter_list: { label: 'CTR', bgClass: 'bg-teal-500/10', textClass: 'text-teal-400', barColor: 'from-teal-500 to-cyan-500' },
};

interface ArgumentCardProps {
  argument: ArgumentPost;
}

export const ArgumentCard = memo(function ArgumentCard({ argument }: ArgumentCardProps) {
  const config = POST_TYPE_CONFIG[argument.post_type] ?? {
    label: argument.post_type.toUpperCase().slice(0, 3),
    bgClass: 'bg-white/5',
    textClass: 'text-zinc-400',
    barColor: 'from-zinc-500 to-zinc-400',
  };

  const topComment = argument.top_comments?.[0];

  return (
    <Link
      href={`/${argument.slug}`}
      className="block group rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-200"
    >
      <div className="flex items-stretch">
        <div className="flex items-center justify-center w-14 shrink-0 border-r border-white/[0.06]">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${config.bgClass} ${config.textClass}`}>
            {config.label}
          </span>
        </div>

        <div className="flex-1 min-w-0 px-5 py-4">
          <div className="flex items-start justify-between gap-4 mb-2">
            <h3 className="text-base font-semibold text-white group-hover:text-orange-400 transition-colors leading-snug line-clamp-2">
              {argument.title}
            </h3>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs font-mono text-zinc-600 tabular-nums">
                {argument.velocity > 0 && (
                  <span className="text-orange-400">{argument.velocity}/hr</span>
                )}
              </span>
            </div>
          </div>

          {topComment && (
            <p className="text-xs text-zinc-500 line-clamp-1 mb-3">
              <span className="font-mono text-zinc-600">#{topComment.rank}</span> {topComment.content.slice(0, 80)}
            </p>
          )}

          <ArgumentBar supportPct={argument.support_pct} contradictPct={argument.contradict_pct} className="mb-3" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center rounded-full bg-white/10 text-[10px] font-mono text-zinc-400 w-5 h-5 shrink-0">
                {(argument.author_display_name || argument.author_username || '?')[0].toUpperCase()}
              </span>
              <span className="text-[11px] text-zinc-600">
                @{toPublicSlug(argument.author_username)}
              </span>
              <span className="text-[11px] text-zinc-700" suppressHydrationWarning>
                {relativeTime(argument.last_active)}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-zinc-600 font-mono tabular-nums">
              <span className="flex items-center gap-1">
                <Icon name="Eye" size={11} />
                {argument.view_count}
              </span>
              <span className="flex items-center gap-1">
                <Icon name="MessageCircle" size={11} />
                {argument.comment_count}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
});
