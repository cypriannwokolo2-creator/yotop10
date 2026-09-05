'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Icon } from '@/components/icons/Icon';
import { relativeTime, cleanTitle } from '@/lib/dates';
import type { ExplorePost } from '@/lib/api/types';
import { API } from '@/lib/api';

type TabValue = 'all' | 'list' | 'vs' | 'article' | 'fact';

const TABS: { value: TabValue; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'list', label: 'Lists' },
  { value: 'vs', label: 'Debates' },
  { value: 'article', label: 'Articles' },
  { value: 'fact', label: 'Facts' },
];

const POST_TYPE_MAP: Record<TabValue, string | null> = {
  all: null,
  list: 'list',
  vs: 'vs',
  article: 'article',
  fact: 'fact_drop',
};

interface ExploreClientProps {
  initialPosts: ExplorePost[];
  initialHasMore: boolean;
}

function ListCard({ post }: { post: ExplorePost }) {
  return (
    <Link href={`/${post.slug}`} className="block group">
      <div className="relative rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all overflow-hidden">
        {post.hero_image_url && (
          <div className="relative h-40 sm:h-48 w-full overflow-hidden">
            <Image src={post.hero_image_url} alt="" fill className="object-cover" unoptimized />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          </div>
        )}

        <div className="p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
              {post.post_type === 'best_of' ? 'BEST OF' : post.post_type === 'worst_of' ? 'WORST OF' : 'TOP LIST'}
            </span>
            <span className="text-[10px] font-mono text-zinc-600 uppercase">
              {post.category_name || post.category_slug}
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-white leading-snug mb-3 group-hover:text-orange-400 transition-colors line-clamp-2">
            {cleanTitle(post.title)}
          </h2>

          {post.topItems && post.topItems.length > 0 && (
            <div className="mb-4 space-y-1">
              {post.topItems.map((item) => (
                <div key={item.rank} className="flex items-center gap-2.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded bg-emerald-500/10 text-[10px] font-mono font-bold text-emerald-400 tabular-nums shrink-0">
                    {item.rank}
                  </span>
                  <span className="text-sm text-zinc-400 truncate">{item.title}</span>
                </div>
              ))}
              {post.totalItems && post.totalItems > 3 && (
                <span className="text-[10px] text-zinc-600 font-mono ml-[30px]">
                  +{post.totalItems - 3} more items
                </span>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center rounded-full bg-white/10 text-[10px] font-mono text-zinc-400 w-5 h-5 shrink-0">
                {(post.author_display_name || post.author_username || '?')[0].toUpperCase()}
              </span>
              <span className="text-[11px] text-zinc-600">{post.author_display_name || post.author_username}</span>
              <span className="text-[11px] text-zinc-700" suppressHydrationWarning>{relativeTime(post.created_at)}</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-zinc-600 font-mono tabular-nums">
              <span className="flex items-center gap-1"><Icon name="Eye" size={11} />{post.view_count ?? 0}</span>
              <span className="flex items-center gap-1"><Icon name="MessageCircle" size={11} />{post.comment_count ?? 0}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function DebateCard({ post }: { post: ExplorePost }) {
  const items = post.topItems || [];
  const sideA = items[0];
  const sideB = items[1];

  return (
    <Link href={`/${post.slug}`} className="block group">
      <div className="relative rounded-2xl border border-purple-500/15 bg-purple-500/[0.03] hover:bg-purple-500/[0.06] hover:border-purple-500/30 transition-all overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />

        <div className="p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400">
              THIS VS THAT
            </span>
            <span className="text-[10px] font-mono text-zinc-600 uppercase">
              {post.category_name || post.category_slug}
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-white leading-snug mb-4 group-hover:text-purple-400 transition-colors line-clamp-2">
            {cleanTitle(post.title)}
          </h2>

          {sideA && sideB && (
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 rounded-xl border border-red-500/15 bg-red-500/[0.05] px-3 py-2.5 text-center">
                <span className="text-xs sm:text-sm font-semibold text-red-300 line-clamp-1">{sideA.title}</span>
              </div>
              <span className="text-xs font-bold text-zinc-600 shrink-0">VS</span>
              <div className="flex-1 rounded-xl border border-blue-500/15 bg-blue-500/[0.05] px-3 py-2.5 text-center">
                <span className="text-xs sm:text-sm font-semibold text-blue-300 line-clamp-1">{sideB.title}</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center rounded-full bg-white/10 text-[10px] font-mono text-zinc-400 w-5 h-5 shrink-0">
                {(post.author_display_name || post.author_username || '?')[0].toUpperCase()}
              </span>
              <span className="text-[11px] text-zinc-600">{post.author_display_name || post.author_username}</span>
              <span className="text-[11px] text-zinc-700" suppressHydrationWarning>{relativeTime(post.created_at)}</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-zinc-600 font-mono tabular-nums">
              <span className="flex items-center gap-1"><Icon name="MessageCircle" size={11} />{post.comment_count ?? 0}</span>
              <span className="flex items-center gap-1"><Icon name="Eye" size={11} />{post.view_count ?? 0}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function ArticleCard({ post }: { post: ExplorePost }) {
  return (
    <Link href={`/articles/${post.slug}`} className="block group">
      <div className="relative rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-sky-500/20 transition-all overflow-hidden">
        {post.hero_image_url ? (
          <div className="relative h-40 sm:h-52 w-full overflow-hidden">
            <Image src={post.hero_image_url} alt="" fill className="object-cover" unoptimized />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          </div>
        ) : (
          <div className="h-40 sm:h-52 w-full bg-gradient-to-br from-sky-600/20 to-blue-700/20 flex items-center justify-center">
            <Icon name="FileText" size={32} className="text-sky-500/30" />
          </div>
        )}

        <div className="p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400">ARTICLE</span>
            <span className="text-[10px] font-mono text-zinc-600 uppercase">{post.category_name || post.category_slug}</span>
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-white leading-snug mb-2 group-hover:text-sky-400 transition-colors line-clamp-2">
            {cleanTitle(post.title)}
          </h2>

          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center rounded-full bg-white/10 text-[10px] font-mono text-zinc-400 w-5 h-5 shrink-0">
                {(post.author_display_name || post.author_username || '?')[0].toUpperCase()}
              </span>
              <span className="text-[11px] text-zinc-600">{post.author_display_name || post.author_username}</span>
              <span className="text-[11px] text-zinc-700" suppressHydrationWarning>{relativeTime(post.created_at)}</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-zinc-600 font-mono tabular-nums">
              <span className="flex items-center gap-1"><Icon name="Eye" size={11} />{post.view_count ?? 0}</span>
              <span className="flex items-center gap-1"><Icon name="MessageCircle" size={11} />{post.comment_count ?? 0}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function FactCard({ post }: { post: ExplorePost }) {
  return (
    <Link href={`/${post.slug}`} className="block group">
      <div className="relative rounded-2xl border border-pink-500/15 bg-pink-500/[0.03] hover:bg-pink-500/[0.06] hover:border-pink-500/30 transition-all overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-pink-500/40 to-transparent" />

        <div className="p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-400">DID YOU KNOW</span>
            <span className="text-[10px] font-mono text-zinc-600 uppercase">{post.category_name || post.category_slug}</span>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-pink-500/10 shrink-0 mt-0.5">
              <Icon name="Lightbulb" size={18} className="text-pink-400" />
            </div>
            <h2 className="text-base sm:text-lg font-semibold text-white leading-snug group-hover:text-pink-400 transition-colors line-clamp-3">
              {cleanTitle(post.title)}
            </h2>
          </div>

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center rounded-full bg-white/10 text-[10px] font-mono text-zinc-400 w-5 h-5 shrink-0">
                {(post.author_display_name || post.author_username || '?')[0].toUpperCase()}
              </span>
              <span className="text-[11px] text-zinc-600">{post.author_display_name || post.author_username}</span>
              <span className="text-[11px] text-zinc-700" suppressHydrationWarning>{relativeTime(post.created_at)}</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-zinc-600 font-mono tabular-nums">
              <span className="flex items-center gap-1"><Icon name="Eye" size={11} />{post.view_count ?? 0}</span>
              <span className="flex items-center gap-1"><Icon name="MessageCircle" size={11} />{post.comment_count ?? 0}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function CounterCard({ post }: { post: ExplorePost }) {
  return (
    <Link href={`/${post.slug}`} className="block group">
      <div className="relative rounded-2xl border border-amber-500/15 bg-amber-500/[0.03] hover:bg-amber-500/[0.06] hover:border-amber-500/30 transition-all overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

        <div className="p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400">COUNTER LIST</span>
            <span className="text-[10px] font-mono text-zinc-600 uppercase">{post.category_name || post.category_slug}</span>
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-white leading-snug mb-3 group-hover:text-amber-400 transition-colors line-clamp-2">
            {cleanTitle(post.title)}
          </h2>

          {post.topItems && post.topItems.length > 0 && (
            <div className="mb-4 space-y-1">
              {post.topItems.map((item) => (
                <div key={item.rank} className="flex items-center gap-2.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded bg-amber-500/10 text-[10px] font-mono font-bold text-amber-400 tabular-nums shrink-0">
                    {item.rank}
                  </span>
                  <span className="text-sm text-zinc-400 truncate">{item.title}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center rounded-full bg-white/10 text-[10px] font-mono text-zinc-400 w-5 h-5 shrink-0">
                {(post.author_display_name || post.author_username || '?')[0].toUpperCase()}
              </span>
              <span className="text-[11px] text-zinc-600">{post.author_display_name || post.author_username}</span>
              <span className="text-[11px] text-zinc-700" suppressHydrationWarning>{relativeTime(post.created_at)}</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-zinc-600 font-mono tabular-nums">
              <span className="flex items-center gap-1"><Icon name="MessageCircle" size={11} />{post.comment_count ?? 0}</span>
              <span className="flex items-center gap-1"><Icon name="Eye" size={11} />{post.view_count ?? 0}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

const CARD_BY_TYPE: Record<string, React.ComponentType<{ post: ExplorePost }>> = {
  top_list: ListCard,
  best_of: ListCard,
  worst_of: ListCard,
  this_vs_that: DebateCard,
  vs: DebateCard,
  article: ArticleCard,
  fact_drop: FactCard,
  counter_list: CounterCard,
};

function PostCard({ post }: { post: ExplorePost }) {
  const Card = CARD_BY_TYPE[post.post_type] || ListCard;
  return <Card post={post} />;
}

export default function ExploreClient({ initialPosts, initialHasMore }: ExploreClientProps) {
  const [posts, setPosts] = useState<ExplorePost[]>(initialPosts);
  const [tab, setTab] = useState<TabValue>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialHasMore ? 2 : 1);
  const [loading, setLoading] = useState(false);

  const filteredPosts = tab === 'all'
    ? posts
    : posts.filter((p) => {
        if (tab === 'list') return ['top_list', 'best_of', 'worst_of'].includes(p.post_type);
        if (tab === 'vs') return ['this_vs_that', 'counter_list'].includes(p.post_type);
        return p.post_type === POST_TYPE_MAP[tab];
      });

  const fetchPage = useCallback(async (pageNum: number) => {
    setLoading(true);
    try {
      const data = await API.getExplore(pageNum, 10);
      setPosts(data.posts || []);
      setPage(pageNum);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages || loading) return;
    fetchPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const pageNumbers = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let i = start; i <= end; i++) pageNumbers.push(i);

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="max-w-5xl mx-auto px-5 py-10 sm:px-8 sm:py-14">
        {/* Pill Tabs */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          {TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => { setTab(t.value); goToPage(1); }}
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

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Icon name="Loader" size={24} className="animate-spin text-zinc-600 mb-3" />
            <p className="text-sm text-zinc-500">Loading...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/[0.03] border border-white/[0.08]">
              <Icon name="Compass" size={32} className="text-zinc-600" />
            </div>
            <p className="text-zinc-500 text-lg max-w-sm">No trending content yet.</p>
          </div>
        ) : (
          <>
            <div className="space-y-5 pb-12">
              {filteredPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pb-12">
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1 || loading}
                  className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-400 hover:text-white hover:border-white/20 transition disabled:opacity-30 disabled:pointer-events-none"
                >
                  <Icon name="ChevronLeft" size={14} />
                  Prev
                </button>

                {start > 1 && (
                  <>
                    <button onClick={() => goToPage(1)} className="w-9 h-9 rounded-lg text-sm font-mono text-zinc-500 hover:bg-white/5 transition">1</button>
                    {start > 2 && <span className="text-zinc-600 text-xs">...</span>}
                  </>
                )}

                {pageNumbers.map((p) => (
                  <button
                    key={p}
                    onClick={() => goToPage(p)}
                    className={`w-9 h-9 rounded-lg text-sm font-mono transition ${
                      p === page
                        ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
                        : 'text-zinc-500 hover:bg-white/5'
                    }`}
                  >
                    {p}
                  </button>
                ))}

                {end < totalPages && (
                  <>
                    {end < totalPages - 1 && <span className="text-zinc-600 text-xs">...</span>}
                    <button onClick={() => goToPage(totalPages)} className="w-9 h-9 rounded-lg text-sm font-mono text-zinc-500 hover:bg-white/5 transition">{totalPages}</button>
                  </>
                )}

                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= totalPages || loading}
                  className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-400 hover:text-white hover:border-white/20 transition disabled:opacity-30 disabled:pointer-events-none"
                >
                  Next
                  <Icon name="ChevronRight" size={14} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
