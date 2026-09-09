'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Icon } from './icons/Icon';
import { ArgumentBar } from './ArgumentBar';
import { relativeTime, cleanTitle } from '@/lib/dates';
import { toPublicSlug } from '@/lib/username';
import { apiFetch } from '@/lib/api/client';
import type { ArgumentPost } from '@/lib/api/types';

const POST_TYPE_CONFIG: Record<string, { label: string; bgClass: string; textClass: string }> = {
  this_vs_that: { label: 'VS', bgClass: 'bg-orange-500/10', textClass: 'text-orange-400' },
  counter_list: { label: 'CTR', bgClass: 'bg-teal-500/10', textClass: 'text-teal-400' },
};

interface ArgumentCardProps {
  argument: ArgumentPost;
}

export function ArgumentCard({ argument }: ArgumentCardProps) {
  const [supportPct, setSupportPct] = useState(argument.support_pct);
  const [contradictPct, setContradictPct] = useState(argument.contradict_pct);
  const [voted, setVoted] = useState<'A' | 'B' | null>(null);
  const [isPending, startTransition] = useTransition();

  const config = POST_TYPE_CONFIG[argument.post_type] ?? {
    label: argument.post_type.toUpperCase().slice(0, 3),
    bgClass: 'bg-white/5',
    textClass: 'text-zinc-400',
  };

  const topComment = argument.top_comments?.[0];
  const isVotable = argument.post_type === 'this_vs_that';

  const handleVote = (side: 'A' | 'B') => {
    if (!isVotable) return;
    const pid = argument.id;
    if (!pid) return;

    // Optimistic update — instant UI change
    const prevVoted = voted;
    const prevSupport = supportPct;
    const prevContradict = contradictPct;

    startTransition(() => {
      if (prevVoted === side) {
        // Toggle off
        setVoted(null);
        const total = (supportPct + contradictPct) || 1;
        if (side === 'A') {
          setSupportPct(Math.max(0, Math.round(((supportPct * total / 100) - 1) / ((total - 1) || 1) * 100)));
        } else {
          setContradictPct(Math.max(0, Math.round(((contradictPct * total / 100) - 1) / ((total - 1) || 1) * 100)));
        }
      } else {
        // Vote for side
        setVoted(side);
        const total = (supportPct + contradictPct) + 1;
        if (side === 'A') {
          setSupportPct(Math.round(((supportPct * (total - 1) / 100) + 1) / total * 100));
        } else {
          setContradictPct(Math.round(((contradictPct * (total - 1) / 100) + 1) / total * 100));
        }
      }
    });

    // Server call in background
    apiFetch<{ votes_a: number; votes_b: number; voted: string | null }>(`/posts/${pid}/vote`, {
      method: 'POST',
      body: JSON.stringify({ side }),
    }).then((res) => {
      setVoted(res.voted as 'A' | 'B' | null);
      const total = res.votes_a + res.votes_b;
      if (total > 0) {
        setSupportPct(Math.round((res.votes_a / total) * 100));
        setContradictPct(Math.round((res.votes_b / total) * 100));
      }
    }).catch(() => {
      // Revert on error
      setVoted(prevVoted);
      setSupportPct(prevSupport);
      setContradictPct(prevContradict);
    });
  };

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-200">
      <div className="flex items-stretch">
        <div className="flex items-center justify-center w-14 shrink-0 border-r border-white/[0.06]">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${config.bgClass} ${config.textClass}`}>
            {config.label}
          </span>
        </div>

        <div className="flex-1 min-w-0 px-5 py-4">
          <div className="flex items-start justify-between gap-4 mb-2">
            <Link href={`/${argument.slug}`} className="text-base font-semibold text-white hover:text-orange-400 transition-colors leading-snug line-clamp-2">
              {cleanTitle(argument.title)}
            </Link>
            {argument.velocity > 0 && (
              <span className="text-xs font-mono text-orange-400 tabular-nums shrink-0">
                {argument.velocity}/hr
              </span>
            )}
          </div>

          {topComment && (
            <p className="text-xs text-zinc-500 line-clamp-1 mb-3">
              <span className="font-mono text-zinc-600">#{topComment.rank}</span> {topComment.content.slice(0, 80)}
            </p>
          )}

          <ArgumentBar supportPct={supportPct} contradictPct={contradictPct} className="mb-3" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isVotable ? (
                <>
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleVote('A'); }}
                    className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold cursor-pointer transition-all ${
                      voted === 'A'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                        : 'bg-white/5 border border-white/10 text-zinc-400 hover:bg-emerald-500/10 hover:border-emerald-500/40 hover:text-emerald-400'
                    }`}
                  >
                    <Icon name="ThumbsUp" size={13} />
                    {voted === 'A' ? 'Voted' : 'Support'}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleVote('B'); }}
                    className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold cursor-pointer transition-all ${
                      voted === 'B'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/50 shadow-[0_0_12px_rgba(239,68,68,0.15)]'
                        : 'bg-white/5 border border-white/10 text-zinc-400 hover:bg-red-500/10 hover:border-red-500/40 hover:text-red-400'
                    }`}
                  >
                    <Icon name="ThumbsDown" size={13} />
                    {voted === 'B' ? 'Voted' : 'Contradict'}
                  </button>
                </>
              ) : (
                <Link
                  href={`/${argument.slug}`}
                  className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold border border-white/10 bg-white/5 text-zinc-400 hover:border-white/20 hover:text-white transition-all cursor-pointer"
                >
                  <Icon name="ArrowRight" size={13} />
                  View
                </Link>
              )}
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
    </div>
  );
}
