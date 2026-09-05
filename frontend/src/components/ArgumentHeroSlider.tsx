'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Icon } from './icons/Icon';
import type { ArgumentPost } from '@/lib/api/types';

const GRADIENTS = [
  'from-orange-600/40 to-red-700/40',
  'from-blue-600/40 to-purple-700/40',
  'from-emerald-600/40 to-teal-700/40',
  'from-pink-600/40 to-rose-700/40',
  'from-amber-600/40 to-orange-700/40',
];

interface ArgumentHeroSliderProps {
  arguments: ArgumentPost[];
}

export function ArgumentHeroSlider({ arguments: args }: ArgumentHeroSliderProps) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [votedMap, setVotedMap] = useState<Record<string, 'A' | 'B' | null>>({});
  const top = args.slice(0, 5);

  const next = useCallback(() => {
    setCurrent(c => (c + 1) % top.length);
  }, [top.length]);

  useEffect(() => {
    if (paused || top.length <= 1) return;
    const id = setInterval(next, 4500);
    return () => clearInterval(id);
  }, [paused, next, top.length]);

  if (top.length === 0) return null;

  const d = top[current];
  const supportPct = d.support_pct ?? 0;
  const contradictPct = d.contradict_pct ?? 0;
  const hasVotes = supportPct + contradictPct > 0;
  const voted = (d.id ? votedMap[d.id] : null) ?? null;
  const gradient = GRADIENTS[current % GRADIENTS.length];

  const handleVote = async (side: 'A' | 'B') => {
    const pid = d.id;
    if (!pid) return;
    try {
      const { apiFetch } = await import('@/lib/api/client');
      const res = await apiFetch<{ votes_a: number; votes_b: number; voted: string | null }>(`/posts/${pid}/vote`, {
        method: 'POST',
        body: JSON.stringify({ side }),
      });
      setVotedMap(prev => ({ ...prev, [pid]: res.voted as 'A' | 'B' | null }));
    } catch {
      // silently fail
    }
  };

  return (
    <div
      className="mb-8"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <article className="rounded-2xl border border-white/5 bg-white/5 overflow-hidden transition hover:border-orange-500/20 hover:bg-white/[0.07]">
        {/* Hero Image */}
        <Link href={`/${d.slug}`} className="block relative h-36 sm:h-44 w-full overflow-hidden bg-zinc-900">
          {d.hero_image_url ? (
            <Image src={d.hero_image_url} alt="" fill className="object-cover" unoptimized priority />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
              <Icon name="MessageCircle" size={36} className="text-white/20" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <span className="absolute top-2 left-2 rounded-md bg-black/60 backdrop-blur-sm px-2 py-0.5 text-2xs font-bold text-orange-400 tracking-wider flex items-center gap-1">
            <Icon name="Flame" size={11} />
            TRENDING
          </span>
        </Link>

        <div className="px-4 pb-4">
          {/* Creator Row */}
          <div className="flex items-center gap-2 mt-3 mb-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-2xs font-mono text-zinc-400 shrink-0">
              {(d.author_display_name || d.author_username || 'A')[0].toUpperCase()}
            </span>
            <span className="text-xs text-zinc-500">{d.author_display_name || d.author_username || 'anonymous'}</span>
            <Icon name="BadgeCheck" size={12} className="text-blue-400/30" />
          </div>

          {/* Debate Info */}
          <Link href={`/${d.slug}`} className="block mb-3">
            <h3 className="text-base font-bold text-white leading-snug mb-1">{d.title}</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              {d.top_comments?.[0]?.item_title
                ? `Top debate on "${d.top_comments[0].item_title}" — which side are you on?`
                : 'Cast your vote and join the discussion.'}
            </p>
          </Link>

          {/* Stacked Voting Options */}
          <div className="space-y-3 mb-3">
            {/* Option A (Support) */}
            <div className="rounded-xl border border-red-500/10 bg-red-500/[0.03] px-3 py-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-zinc-200">Support</span>
                <span className="text-sm font-bold font-mono text-red-400">{hasVotes ? `${supportPct}%` : '--'}</span>
              </div>
              <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden mb-1.5">
                <div
                  className={`h-full rounded-full bg-gradient-to-r from-red-500 to-orange-500 transition-all ${!hasVotes ? 'opacity-0' : ''}`}
                  style={{ width: `${hasVotes ? supportPct : 0}%` }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-2xs text-zinc-600 font-mono">{supportPct}% votes</span>
                <button
                  onClick={() => handleVote('A')}
                  className={`rounded-md px-2.5 py-1 text-2xs font-semibold transition ${
                    voted === 'A'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'border border-white/10 text-zinc-400 hover:border-red-500/30 hover:text-red-400'
                  }`}
                >
                  {voted === 'A' ? 'Voted' : 'Vote'}
                </button>
              </div>
            </div>

            {/* Option B (Contradict) */}
            <div className="rounded-xl border border-blue-500/10 bg-blue-500/[0.03] px-3 py-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-zinc-200">Contradict</span>
                <span className="text-sm font-bold font-mono text-blue-400">{hasVotes ? `${contradictPct}%` : '--'}</span>
              </div>
              <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden mb-1.5">
                <div
                  className={`h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all ${!hasVotes ? 'opacity-0' : ''}`}
                  style={{ width: `${hasVotes ? contradictPct : 0}%` }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-2xs text-zinc-600 font-mono">{contradictPct}% votes</span>
                <button
                  onClick={() => handleVote('B')}
                  className={`rounded-md px-2.5 py-1 text-2xs font-semibold transition ${
                    voted === 'B'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'border border-white/10 text-zinc-400 hover:border-blue-500/30 hover:text-blue-400'
                  }`}
                >
                  {voted === 'B' ? 'Voted' : 'Vote'}
                </button>
              </div>
            </div>
          </div>

          {/* Engagement Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-3xs text-zinc-600">
                <Icon name="MessageCircle" size={13} />
                {d.comment_count}
              </span>
              <span className="flex items-center gap-1.5 text-3xs text-zinc-600">
                <Icon name="Eye" size={13} />
                {(d.view_count ?? 0).toLocaleString()}
              </span>
            </div>
            {top.length > 1 && (
              <div className="flex items-center gap-1.5">
                {top.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    className={`rounded-full transition-all duration-300 ${
                      i === current
                        ? 'w-5 h-1.5 bg-orange-400'
                        : 'w-1.5 h-1.5 bg-white/30 hover:bg-white/50'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}
