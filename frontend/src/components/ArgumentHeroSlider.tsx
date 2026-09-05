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

  const debate = top[current];
  const supportPct = debate.support_pct ?? 0;
  const contradictPct = debate.contradict_pct ?? 0;
  const hasVotes = supportPct + contradictPct > 0;
  const gradient = GRADIENTS[current % GRADIENTS.length];

  return (
    <div
      className="relative rounded-2xl overflow-hidden mb-8"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Background */}
      <div className="relative h-52 sm:h-64 lg:h-72 w-full">
        {debate.hero_image_url ? (
          <Image src={debate.hero_image_url} alt="" fill className="object-cover" unoptimized priority />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradient}`} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Content overlay */}
        <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-6">
          {/* Type badge + velocity */}
          <div className="flex items-center gap-2 mb-3">
            <span className="rounded-md bg-orange-500/20 backdrop-blur-sm px-2.5 py-1 text-xs font-bold text-orange-400 tracking-wider flex items-center gap-1.5">
              <Icon name="Flame" size={12} />
              {debate.post_type === 'this_vs_that' ? 'VS BATTLE' : 'COUNTER'}
            </span>
            {debate.velocity > 0 && (
              <span className="rounded-md bg-white/10 backdrop-blur-sm px-2 py-1 text-xs font-mono text-zinc-300">
                {debate.velocity}/hr
              </span>
            )}
          </div>

          {/* Title */}
          <Link href={`/${debate.slug}`} className="block mb-3">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-tight line-clamp-2">
              {debate.title}
            </h2>
          </Link>

          {/* Support vs Contradict bar */}
          <div className="mb-3">
            <div className="h-2.5 rounded-full overflow-hidden bg-white/10 flex">
              <div
                className="h-full bg-emerald-500 transition-all duration-700 ease-out"
                style={{ width: hasVotes ? `${supportPct}%` : '50%' }}
              />
              <div
                className="h-full bg-red-500 transition-all duration-700 ease-out"
                style={{ width: hasVotes ? `${contradictPct}%` : '50%' }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-xs font-mono text-emerald-400 tabular-nums">
                {hasVotes ? `${supportPct}% support` : 'No votes yet'}
              </span>
              <span className="text-xs font-mono text-red-400 tabular-nums">
                {hasVotes && `${contradictPct}% contradict`}
              </span>
            </div>
          </div>

          {/* Author + stats */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center rounded-full bg-white/10 text-xs font-mono text-zinc-300 w-6 h-6">
                {(debate.author_display_name || debate.author_username || '?')[0].toUpperCase()}
              </span>
              <span className="text-xs text-zinc-400">
                @{debate.author_username}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-zinc-500 font-mono tabular-nums">
              <span className="flex items-center gap-1">
                <Icon name="MessageCircle" size={12} />
                {debate.comment_count}
              </span>
              <span className="flex items-center gap-1">
                <Icon name="Eye" size={12} />
                {debate.view_count}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Dot indicators */}
      {top.length > 1 && (
        <div className="absolute bottom-3 right-5 sm:right-6 flex items-center gap-1.5">
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
  );
}
