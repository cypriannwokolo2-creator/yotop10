'use client';

import Link from 'next/link';
import { Icon } from './icons/Icon';
import { cleanTitle } from '@/lib/dates';
import type { ArgumentPost } from '@/lib/api/types';

interface CounterCardProps {
  argument: ArgumentPost;
}

export function CounterCard({ argument }: CounterCardProps) {
  const topRebuttal = argument.top_comments?.[0];

  return (
    <div className="rounded-xl border border-teal-500/15 bg-teal-500/[0.03] hover:bg-teal-500/[0.05] hover:border-teal-500/25 transition-all duration-200 border-l-2 border-l-teal-500/60">
      <div className="px-5 py-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon name="Swords" size={13} className="text-teal-400 shrink-0" />
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-400">
            CTR
          </span>
          <span className="text-[11px] font-medium text-teal-400/70">
            Counter
          </span>
          {argument.velocity > 0 && (
            <span className="ml-auto text-xs font-mono text-teal-400 tabular-nums shrink-0">
              {argument.velocity}/hr
            </span>
          )}
        </div>

        <Link href={`/${argument.slug}`} className="text-base font-semibold text-white hover:text-teal-300 transition-colors leading-snug line-clamp-2">
          {cleanTitle(argument.title)}
        </Link>

        {topRebuttal && (
          <p className="mt-2 border-l-2 border-teal-500/30 pl-3 text-xs text-zinc-500 line-clamp-2 italic">
            {topRebuttal.content.slice(0, 120)}
          </p>
        )}

        <div className="mt-3 flex items-center justify-between">
          <Link
            href={`/${argument.slug}`}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold border border-teal-500/20 bg-teal-500/5 text-teal-300 hover:border-teal-500/40 hover:bg-teal-500/10 transition-all cursor-pointer"
          >
            <Icon name="ArrowRight" size={13} />
            Read counter
          </Link>

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
  );
}
