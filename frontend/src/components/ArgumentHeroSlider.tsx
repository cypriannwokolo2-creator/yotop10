'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Icon } from './icons/Icon';
import { cleanTitle } from '@/lib/dates';
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

function SlideCard({ d, onOpen }: {
  d: ArgumentPost;
  onOpen: () => void;
}) {
  // Same live-first rule as the list cards: real side votes win over the
  // comment-fire proxy so the panels paint the true split immediately.
  const heroVoteTotal = (d.votes_a ?? 0) + (d.votes_b ?? 0);
  const supportPct = heroVoteTotal > 0 ? Math.round(((d.votes_a ?? 0) / heroVoteTotal) * 100) : (d.support_pct ?? 0);
  const contradictPct = heroVoteTotal > 0 ? Math.round(((d.votes_b ?? 0) / heroVoteTotal) * 100) : (d.contradict_pct ?? 0);
  const hasVotes = supportPct + contradictPct > 0;

  // Hero names the actual contenders (e.g. Ronaldo / Messi) while the buttons
  // keep the Support / Contradict labels. Fall back when items are missing.
  const nameA = d.item_a_title || 'Support';
  const nameB = d.item_b_title || 'Contradict';

  if (d.post_type === 'counter_list') {
    const rebuttal = d.top_comments?.[0];
    return (
      <div className="px-4 pb-4 cursor-pointer" onClick={onOpen}>
        {/* Creator Row */}
        <div className="flex items-center gap-2 mt-3 mb-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-teal-500/10 text-2xs font-mono text-teal-400 shrink-0 ring-1 ring-teal-500/20">
            {(d.author_display_name || d.author_username || 'A')[0].toUpperCase()}
          </span>
          <span className="text-xs text-zinc-400">{d.author_display_name || d.author_username || 'anonymous'}</span>
          <Icon name="BadgeCheck" size={12} className="text-blue-400/40" />
          <span className="ml-auto flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-400">
            <Icon name="Swords" size={10} />
            CTR
          </span>
        </div>

        {/* Counter Info */}
        <h3 className="text-base font-bold text-white leading-snug mb-1">{cleanTitle(d.title)}</h3>
        <p className="text-xs text-zinc-500 leading-relaxed mb-3">
          {rebuttal
            ? `Countering with "${rebuttal.item_title || 'a rebuttal'}" — open to read the challenge.`
            : 'A counter list challenging the ranking — open to read it.'}
        </p>

        {rebuttal && (
          <p className="mb-3 border-l-2 border-teal-500/30 pl-3 text-xs text-zinc-500 line-clamp-2 italic">
            {rebuttal.content.slice(0, 120)}
          </p>
        )}

        <span className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold border border-teal-500/20 bg-teal-500/5 text-teal-300">
          <Icon name="ArrowRight" size={15} />
          Read counter
        </span>
      </div>
    );
  }

  return (
    <div className="px-4 pb-4 cursor-pointer" onClick={onOpen}>
      {/* Creator Row */}
      <div className="flex items-center gap-2 mt-3 mb-2">
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-500/10 text-2xs font-mono text-orange-400 shrink-0 ring-1 ring-orange-500/20">
          {(d.author_display_name || d.author_username || 'A')[0].toUpperCase()}
        </span>
        <span className="text-xs text-zinc-400">{d.author_display_name || d.author_username || 'anonymous'}</span>
        <Icon name="BadgeCheck" size={12} className="text-blue-400/40" />
      </div>

      {/* Debate Info */}
      <div className="block mb-3">
        <h3 className="text-base font-bold text-white leading-snug mb-1">{cleanTitle(d.title)}</h3>
        <p className="text-xs text-zinc-500 leading-relaxed">
          {d.top_comments?.[0]?.item_title
            ? `Top debate on "${d.top_comments[0].item_title}" — which side are you on?`
            : 'Open to pick a side and join the discussion.'}
        </p>
      </div>

      {/* Stacked Options */}
      <div className="space-y-3 mb-3">
        {/* Option A */}
        <div className="rounded-xl border border-red-500/15 bg-red-500/[0.04] px-3 py-2.5">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-sm font-medium text-zinc-200 line-clamp-1">{nameA}</span>
            <span className="text-sm font-bold font-mono text-red-400 tabular-nums shrink-0">{hasVotes ? `${supportPct}%` : '--'}</span>
          </div>
          <div className="h-2 rounded-full bg-zinc-800 overflow-hidden mb-2">
            <div
              className="h-full rounded-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-700 ease-out"
              style={{
                width: `${hasVotes ? supportPct : 0}%`,
              }}
            />
          </div>
          <span className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold bg-white/5 border border-white/10 text-zinc-300">
            <Icon name="ThumbsUp" size={15} />
            Support
          </span>
        </div>

        {/* Option B */}
        <div className="rounded-xl border border-blue-500/15 bg-blue-500/[0.04] px-3 py-2.5">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-sm font-medium text-zinc-200 line-clamp-1">{nameB}</span>
            <span className="text-sm font-bold font-mono text-blue-400 tabular-nums shrink-0">{hasVotes ? `${contradictPct}%` : '--'}</span>
          </div>
          <div className="h-2 rounded-full bg-zinc-800 overflow-hidden mb-2">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-700 ease-out"
              style={{
                width: `${hasVotes ? contradictPct : 0}%`,
              }}
            />
          </div>
          <span className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold bg-white/5 border border-white/10 text-zinc-300">
            <Icon name="ThumbsDown" size={15} />
            Contradict
          </span>
        </div>
      </div>
    </div>
  );
}

export function ArgumentHeroSlider({ arguments: args }: ArgumentHeroSliderProps) {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef<number | null>(null);
  const top = args.slice(0, 5);

  const goTo = useCallback((idx: number) => {
    setCurrent(idx);
  }, []);

  const next = useCallback(() => {
    setCurrent(c => (c + 1) % top.length);
  }, [top.length]);

  useEffect(() => {
    if (paused || top.length <= 1) return;
    const id = setInterval(next, 4500);
    return () => clearInterval(id);
  }, [paused, next, top.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    // Don't intercept touches on buttons/links
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) {
      touchStart.current = null;
      return;
    }
    touchStart.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        setCurrent(c => (c + 1) % top.length);
      } else {
        setCurrent(c => (c - 1 + top.length) % top.length);
      }
    }
    touchStart.current = null;
  };

  if (top.length === 0) return null;

  const d = top[current];

  return (
    <div
      className="mb-8"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <article className="relative rounded-2xl border border-orange-500/20 bg-white/5 overflow-hidden transition-all duration-500 hover:border-orange-500/40 hover:shadow-[0_0_30px_rgba(249,115,22,0.12)]">
        {/* Glow line at top */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/60 to-transparent z-10" />

        {/* Hero Image - slides */}
        <div className="relative h-28 sm:h-36 lg:h-44 w-full overflow-hidden bg-zinc-900">
          <div
            className="absolute inset-0 flex transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
            style={{ transform: `translateX(-${current * 100}%)` }}
          >
            {top.map((item, i) => {
              const g = GRADIENTS[i % GRADIENTS.length];
              return (
                <div key={item.id} className="relative w-full h-full shrink-0">
                  {item.hero_image_url ? (
                    <Image src={item.hero_image_url} alt="" fill className="object-cover" unoptimized={i !== current} />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${g} flex items-center justify-center`}>
                      <Icon name="MessageCircle" size={36} className="text-white/20" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Overlays on top of all slides */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-orange-500/10 to-transparent pointer-events-none" />

          <span className="absolute top-3 left-3 rounded-md bg-orange-500/20 backdrop-blur-md border border-orange-500/30 px-2.5 py-1 text-2xs font-bold text-orange-400 tracking-wider flex items-center gap-1.5 shadow-[0_0_12px_rgba(249,115,22,0.3)] z-10">
            <Icon name="Flame" size={11} className="text-orange-400" />
            TRENDING
          </span>
        </div>

        {/* Content - also slides */}
        <div className="relative overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
            style={{ transform: `translateX(-${current * 100}%)` }}
          >
            {top.map((item, _i) => (
              <div key={item.id} className="w-full shrink-0">
                <SlideCard
                  d={item}
                  onOpen={() => { if (item.slug) router.push(`/${item.slug}`); }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Engagement Footer + Dots */}
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between pt-3 border-t border-white/5">
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
                    onClick={() => goTo(i)}
                    className={`rounded-full transition-all duration-300 ${
                      i === current
                        ? 'w-5 h-1.5 bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.5)]'
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
