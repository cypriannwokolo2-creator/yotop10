'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/icons/Icon';
import { relativeTime } from '@/lib/dates';
import type { ExplorePost } from '@/lib/api/types';
import { API } from '@/lib/api';

const PER_PAGE = 20;

type TabValue = 'all' | 'list' | 'vs' | 'article';

const TABS: { value: TabValue; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'list', label: 'Top Lists' },
  { value: 'vs', label: 'VS Battles' },
  { value: 'article', label: 'Articles' },
];

const POST_TYPE_MAP: Record<TabValue, string | null> = {
  all: null,
  list: 'list',
  vs: 'vs',
  article: 'article',
};

const TYPE_BADGES: Record<string, { label: string; cls: string }> = {
  list: { label: 'LIST', cls: 'bg-emerald-500/10 text-emerald-400' },
  vs: { label: 'VS', cls: 'bg-orange-500/10 text-orange-400' },
  article: { label: 'ART', cls: 'bg-sky-500/10 text-sky-400' },
};

interface ExploreClientProps {
  initialPosts: ExplorePost[];
  initialHasMore: boolean;
}

export default function ExploreClient({ initialPosts, initialHasMore }: ExploreClientProps) {
  const [allPosts, setAllPosts] = useState<ExplorePost[]>(initialPosts);
  const [tab, setTab] = useState<TabValue>('all');
  const [fetchingMore, setFetchingMore] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const hasMoreRef = useRef(initialHasMore);
  const fetchingRef = useRef(false);
  const pageRef = useRef(1);

  const filteredPosts = tab === 'all'
    ? allPosts
    : allPosts.filter((p) => p.post_type === POST_TYPE_MAP[tab]);

  const featured = filteredPosts.slice(0, 3);
  const rest = filteredPosts.slice(3);

  const fetchExplorePage = useCallback(async (pageNum: number) => {
    return API.getExplore(pageNum, PER_PAGE);
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      async (entries) => {
        if (!entries[0]?.isIntersecting) return;
        if (!hasMoreRef.current || fetchingRef.current) return;

        const nextPage = pageRef.current + 1;
        fetchingRef.current = true;
        setFetchingMore(true);
        setFetchError(null);
        try {
          const data = await fetchExplorePage(nextPage);
          setAllPosts((prev) => [...prev, ...(data.posts || [])]);
          pageRef.current = nextPage;
          hasMoreRef.current = nextPage < (data.pagination?.totalPages || 1);
        } catch {
          hasMoreRef.current = false;
          setFetchError('Failed to load more. Please try again.');
        } finally {
          fetchingRef.current = false;
          setFetchingMore(false);
        }
      },
      { rootMargin: '400px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchExplorePage]);

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="max-w-5xl mx-auto px-5 py-10 sm:px-8 sm:py-14">
        {/* Pill Tabs */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          {TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTab(t.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                tab === t.value
                  ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
                  : 'bg-white/[0.03] text-zinc-500 border border-transparent hover:text-zinc-300 hover:bg-white/[0.06]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {filteredPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/[0.03] border border-white/[0.08]">
              <Icon name="Compass" size={32} className="text-zinc-600" />
            </div>
            <p className="text-zinc-500 text-lg max-w-sm">No trending content yet.</p>
          </div>
        ) : (
          <>
            {/* Featured: top 3 as large cards */}
            {featured.length > 0 && (
              <div className="space-y-4 mb-6">
                {featured.map((post, i) => {
                  const badge = TYPE_BADGES[post.post_type] || { label: post.post_type?.toUpperCase(), cls: 'bg-white/5 text-zinc-400' };
                  return (
                    <Link key={post.id} href={`/${post.slug}`} className="block group">
                      <div className="relative rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all overflow-hidden">
                        {/* Score watermark */}
                        <div className="absolute top-3 right-4 sm:top-4 sm:right-6 text-5xl sm:text-6xl font-black font-mono text-white/[0.03] tabular-nums leading-none select-none pointer-events-none">
                          {post.explore_score ?? 0}
                        </div>

                        <div className="relative p-5 sm:p-6">
                          {/* Rank + badge row */}
                          <div className="flex items-center gap-2.5 mb-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-orange-500/10 text-sm font-bold font-mono text-orange-400 tabular-nums">
                              {i + 1}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.cls}`}>
                              {badge.label}
                            </span>
                            <span className="text-xs font-mono text-orange-400 tabular-nums ml-auto">
                              Score: {post.explore_score ?? 0}
                            </span>
                          </div>

                          {/* Title */}
                          <h2 className="text-lg sm:text-xl font-bold text-white leading-snug mb-3 group-hover:text-orange-400 transition-colors line-clamp-2">
                            {post.title}
                          </h2>

                          {/* Top items as ranked list */}
                          {post.topItems && post.topItems.length > 0 && (
                            <div className="mb-4 space-y-1">
                              {post.topItems.slice(0, 3).map((item) => (
                                <div key={item.rank} className="flex items-center gap-2.5">
                                  <span className="text-xs font-mono text-zinc-600 w-5 text-right tabular-nums">
                                    {item.rank}.
                                  </span>
                                  <span className="text-sm text-zinc-400 truncate">
                                    {item.title}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Meta row */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="flex items-center justify-center rounded-full bg-white/10 text-[10px] font-mono text-zinc-400 w-5 h-5 shrink-0">
                                {(post.author_display_name || post.author_username || '?')[0].toUpperCase()}
                              </span>
                              <span className="text-[11px] text-zinc-600">
                                {post.author_display_name || post.author_username}
                              </span>
                              <span className="text-[11px] text-zinc-700" suppressHydrationWarning>
                                {relativeTime(post.created_at)}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-zinc-600 font-mono tabular-nums">
                              <span className="flex items-center gap-1">
                                <Icon name="Eye" size={11} />
                                {post.view_count ?? 0}
                              </span>
                              <span className="flex items-center gap-1">
                                <Icon name="MessageCircle" size={11} />
                                {post.comment_count ?? 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Rest: compact rows */}
            {rest.length > 0 && (
              <div className="space-y-2 pb-20">
                {rest.map((post) => {
                  const badge = TYPE_BADGES[post.post_type] || { label: post.post_type?.toUpperCase(), cls: 'bg-white/5 text-zinc-400' };
                  return (
                    <Link key={post.id} href={`/${post.slug}`} className="block group">
                      <div className="flex items-stretch rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all">
                        {/* Score column */}
                        <div className="flex items-center justify-center w-16 sm:w-20 shrink-0 border-r border-white/[0.06]">
                          <span className="text-lg sm:text-xl font-black font-mono text-white/[0.06] tabular-nums leading-none">
                            {post.explore_score ?? 0}
                          </span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 px-4 py-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${badge.cls}`}>
                              {badge.label}
                            </span>
                            {post.category_slug && (
                              <span className="text-[10px] text-zinc-600 font-mono uppercase">
                                {post.category_name || post.category_slug}
                              </span>
                            )}
                          </div>
                          <h3 className="text-sm font-semibold text-white leading-snug line-clamp-1 group-hover:text-orange-400 transition-colors mb-1">
                            {post.title}
                          </h3>
                          <div className="flex items-center gap-2 text-[11px] text-zinc-600">
                            <span className="font-mono">
                              {post.author_display_name || post.author_username}
                            </span>
                            <span suppressHydrationWarning>{relativeTime(post.created_at)}</span>
                            <span className="ml-auto flex items-center gap-3 font-mono tabular-nums">
                              <span className="flex items-center gap-1">
                                <Icon name="Eye" size={10} />
                                {post.view_count ?? 0}
                              </span>
                              <span className="flex items-center gap-1">
                                <Icon name="MessageCircle" size={10} />
                                {post.comment_count ?? 0}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            <div ref={sentinelRef} className="h-px" />
            {fetchingMore && (
              <div className="py-6 text-center">
                <div className="inline-flex items-center gap-2 text-sm text-zinc-500">
                  <Icon name="Loader" size={16} className="animate-spin" />
                  Loading more...
                </div>
              </div>
            )}
            {fetchError && (
              <div className="py-4 text-center">
                <p className="text-sm text-red-400">{fetchError}</p>
                <button
                  onClick={() => { setFetchError(null); }}
                  className="mt-2 text-xs text-orange-400 hover:text-orange-300 transition"
                >
                  Dismiss
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
