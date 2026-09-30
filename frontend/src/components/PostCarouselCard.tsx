'use client';

import { memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Icon, type LucideIconName } from './icons/Icon';
import { formatDate, cleanTitle } from '@/lib/dates';
import { toPublicSlug } from '@/lib/username';
import type { Post } from '@/lib/api/types';

const CATEGORY_ICONS: Record<string, string> = {
  movies: 'Film', music: 'Music', food: 'UtensilsCrossed', gaming: 'Gamepad2',
  books: 'BookOpen', technology: 'Cpu', sports: 'Trophy', television: 'Tv',
  business: 'Briefcase', lifestyle: 'Heart',
};

function getCategoryIcon(slug: string): string {
  for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
    if (slug.startsWith(key)) return icon;
  }
  return 'Folder';
}

/**
 * Landscape card with fixed heights (h-44 mobile / h-72 desktop) so width
 * always exceeds height — matches the HomeSkeleton's wide blocks exactly
 * and keeps every card in a row equal-height. Content is clamped to fit.
 */
export const PostCarouselCard = memo(function PostCarouselCard({ post }: { post: Post }) {
  const topItems = post.topItems || [];
  const displayName = toPublicSlug(post.author_display_name || post.author_username);

  const media = post.hero_image_url ? (
    <Image
      src={post.hero_image_url}
      alt=""
      width={600}
      height={338}
      className="w-full h-full object-cover"
      unoptimized
    />
  ) : (
    <div className="w-full h-full bg-gradient-to-br from-orange-600/30 via-purple-700/20 to-red-700/30 flex items-center justify-center">
      <div className="flex flex-col items-center gap-1.5">
        <Icon name={getCategoryIcon(post.category_slug) as LucideIconName} size={36} className="text-white/25" />
        <span className="text-2xs lg:text-xs font-mono uppercase tracking-widest text-white/40 text-center px-2 line-clamp-1">
          {post.category_name || post.category_slug}
        </span>
      </div>
    </div>
  );

  return (
    <Link
      href={`/${post.slug}`}
      className="card card-hover h-44 lg:h-80 w-full rounded-2xl overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 flex flex-col"
    >
      {/* Main area: text column left + media column right */}
      <div className="flex flex-row flex-1 min-h-0">
        {/* Section A+B: Title, intro (desktop), ranked items */}
        <div className="flex-1 min-w-0 px-4 lg:px-5 py-2 lg:py-4 flex flex-col justify-center">
          <h3 className="text-base lg:text-2xl font-bold text-white leading-snug lg:leading-tight tracking-[-0.01em] line-clamp-2">
            {cleanTitle(post.title)}
          </h3>
          {post.intro && (
            <div className="hidden lg:block">
              <p className="mt-1.5 text-sm text-zinc-500 leading-relaxed line-clamp-2">{post.intro}</p>
            </div>
          )}

          {topItems.length > 0 && (
            <div className="mt-2 lg:mt-3 space-y-1.5 lg:space-y-2">
              {topItems.slice(0, 3).map((item) => (
                <div key={item.rank} className="flex items-center gap-2 lg:gap-3">
                  <span className="flex items-center justify-center w-5 lg:w-6 h-5 lg:h-6 rounded-full bg-gradient-to-r from-orange-500 to-red-600 ring-1 ring-inset ring-black/10 text-3xs lg:text-2xs font-bold font-mono text-white shrink-0" style={{ color: '#fff' }}>
                    #{item.rank}
                  </span>
                  <span className="text-xs lg:text-sm leading-snug text-zinc-300 truncate">{item.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section C: Media — image or gradient fallback */}
        <div className="shrink-0 w-[38%] lg:w-[40%] max-w-[300px] overflow-hidden m-2 lg:m-3 rounded-xl bg-white/5">
          {media}
        </div>
      </div>

      {/* Section D+E: Footer — byline + engagement across the bottom */}
      <div className="shrink-0 flex items-center justify-between px-4 lg:px-5 py-2 lg:py-3 border-t border-white/5 gap-2">
        <span className="flex items-center gap-1.5 text-2xs lg:text-sm text-zinc-500 truncate min-w-0">
          <span className="hidden sm:inline">By </span>
          <span className="font-mono text-zinc-400 truncate">@{displayName}</span>
          <span className="text-zinc-700">&middot;</span>
          <span suppressHydrationWarning>{formatDate(post.published_at || post.created_at)}</span>
        </span>
        <span className="flex items-center gap-3 lg:gap-4 shrink-0 text-3xs lg:text-xs text-zinc-500">
          <span className="flex items-center gap-1.5">
            <Icon name="MessageCircle" size={13} className="lg:hidden" />
            <span className="hidden lg:inline">{post.comment_count} comments</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Icon name="Eye" size={13} className="lg:hidden" />
            <span className="hidden lg:inline">{post.view_count} views</span>
          </span>
        </span>
      </div>
    </Link>
  );
});
