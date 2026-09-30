'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Icon } from './icons/Icon';
import { Logo } from './Logo';
import CtaButton from './CtaButton';
import { DesktopCta } from './DesktopCta';
import type { Post } from '@/lib/api/types';
import type { HofEntry } from './DesktopHallOfFame';

interface CategoryItem {
  name: string;
  slug: string;
  icon?: string;
  post_count: number;
}

interface DebateItem {
  id?: string;
  slug: string;
  title: string;
  comment_count: number;
  view_count?: number;
}

interface ArticleItem {
  slug: string;
  title: string;
  reading_time?: number;
  author_display_name?: string;
}

interface LandingViewProps {
  posts: Post[];
  categories: CategoryItem[];
  debates: DebateItem[];
  articles: ArticleItem[];
  trendingTerms: string[];
  hofEntries: HofEntry[];
}

/* Reference hero features, verbatim (ref-yotop10/index.html .hero-features) */
const HERO_FEATURES = [
  { icon: 'Rocket' as const, label: 'Fast facts' },
  { icon: 'Target' as const, label: 'No fluff' },
  { icon: 'Brain' as const, label: 'Maximum scroll addiction' },
];

function SectionHead({ icon, title, href }: { icon: 'Flame' | 'Folder' | 'Swords' | 'Crown' | 'FileText'; title: string; href: string }) {
  return (
    <div className="mb-5 flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
        <Icon name={icon} size={16} className="text-orange-400" />
        {title}
      </h2>
      <Link href={href} className="flex items-center gap-1 text-xs font-medium text-zinc-500 transition hover:text-orange-400">
        View all
        <Icon name="ChevronRight" size={13} />
      </Link>
    </div>
  );
}

/* Reference trending slider (.trending-slider): snap track, arrows, dots. */
function TrendingSlider({ posts }: { posts: Post[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const scrollTo = useCallback((i: number) => {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(posts.length - 1, i));
    track.scrollTo({ left: clamped * track.clientWidth, behavior: 'smooth' });
    setIndex(clamped);
  }, [posts.length]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let t: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      clearTimeout(t);
      t = setTimeout(() => {
        setIndex(Math.round(track.scrollLeft / Math.max(1, track.clientWidth)));
      }, 80);
    };
    track.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      track.removeEventListener('scroll', onScroll);
      clearTimeout(t);
    };
  }, []);

  if (posts.length === 0) return null;

  return (
    <div>
      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2"
      >
        {posts.map(p => (
          <Link
            key={p.id}
            href={`/${p.slug}`}
            className="relative h-56 w-full shrink-0 snap-start overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 sm:h-64"
          >
            {p.hero_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.hero_image_url} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/25 via-[#1a1a22] to-pink-500/20" aria-hidden />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" aria-hidden />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <h3 className="mb-1 line-clamp-2 text-base font-bold leading-snug text-white">{p.title}</h3>
              <p className="text-xs text-zinc-400">
                By {p.author_display_name || p.author_username}
              </p>
            </div>
          </Link>
        ))}
      </div>
      {posts.length > 1 && (
        <div className="mt-3 flex items-center justify-between">
          <div className="flex gap-1.5">
            {posts.map((p, i) => (
              <button
                key={p.id}
                type="button"
                onClick={() => scrollTo(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${i === index ? 'w-6 bg-orange-500' : 'w-1.5 bg-white/20 hover:bg-white/40'}`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => scrollTo(index - 1)}
              disabled={index === 0}
              aria-label="Previous slide"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-300 transition hover:border-white/25 hover:text-white disabled:opacity-30"
            >
              <Icon name="ChevronLeft" size={18} />
            </button>
            <button
              type="button"
              onClick={() => scrollTo(index + 1)}
              disabled={index === posts.length - 1}
              aria-label="Next slide"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-300 transition hover:border-white/25 hover:text-white disabled:opacity-30"
            >
              <Icon name="ChevronRight" size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function LandingView({ posts, categories, debates, articles, trendingTerms, hofEntries }: LandingViewProps) {
  const topPosts = posts.slice(0, 6);
  const topCats = categories.filter(c => c.post_count > 0).slice(0, 8);
  const topDebates = debates.slice(0, 4);
  const topArticles = articles.slice(0, 4);

  return (
    <div className="pb-12">
      {/* Hero — reference copy verbatim, app logo, no auth modals */}
      <section className="relative overflow-hidden px-4 pb-12 pt-10 text-center sm:px-6 sm:pt-14">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-orange-500/10" />
          <div className="absolute -right-20 top-40 h-72 w-72 rounded-full bg-pink-500/10" />
        </div>
        <div className="relative">
          <div className="mb-4 flex justify-center">
            <Logo textSize="text-3xl sm:text-4xl" />
          </div>
          <h1 className="mx-auto mb-4 max-w-3xl text-3xl font-bold leading-tight text-white sm:text-5xl">
            Yo! Welcome to YoTop10
          </h1>
          <p className="mx-auto mb-2 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base">
            Where the internet&rsquo;s <span className="font-semibold text-orange-400">wildest Arguments</span> come out to play.
          </p>
          <p className="mb-6 text-sm font-semibold text-zinc-300">We rank it all. We rate it raw.</p>
          <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
            {HERO_FEATURES.map(f => (
              <span key={f.label} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300">
                <Icon name={f.icon} size={15} className="text-orange-400" />
                {f.label}
              </span>
            ))}
          </div>
          <blockquote className="mx-auto mb-2 max-w-xl border-l-2 border-orange-500/60 pl-4 text-left text-sm italic leading-relaxed text-zinc-400 sm:text-center sm:border-l-0 sm:pl-0">
            So grab your curiosity, click something weird, and lose yourself in the best kind of rabbit hole.
          </blockquote>
          <p className="mb-6 text-sm text-zinc-500">Your next favorite list is just one click away.</p>
          <div className="flex flex-col items-center justify-center gap-2 sm:flex-row">
            <CtaButton href="#trending">
              <Icon name="ArrowRight" size={16} />
              Start Journey
            </CtaButton>
            <Link
              href="/docs/guides/overview"
              className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-zinc-300 backdrop-blur-sm transition hover:border-white/20 hover:bg-white/10"
            >
              How It Works
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Trending slider */}
        {topPosts.length > 0 && (
          <section id="trending" className="mb-10 scroll-mt-20">
            <SectionHead icon="Flame" title="Trending Now" href="/explore" />
            <TrendingSlider posts={topPosts} />
          </section>
        )}

        {/* Trending searches */}
        {trendingTerms.length > 0 && (
          <section className="mb-10">
            <div className="flex flex-wrap gap-2">
              {trendingTerms.map(t => (
                <Link
                  key={t}
                  href={`/search?q=${encodeURIComponent(t)}`}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 transition hover:border-orange-500/40 hover:text-white"
                >
                  {t}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Popular posts */}
        {topPosts.length > 0 && (
          <section className="mb-10">
            <SectionHead icon="Flame" title="Popular Posts" href="/explore" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {topPosts.map(p => (
                <Link
                  key={p.id}
                  href={`/${p.slug}`}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-orange-500/30 hover:bg-white/[0.07]"
                >
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-orange-400/80">
                    {p.category_name || p.post_type}
                  </p>
                  <p className="mb-2 line-clamp-2 text-sm font-bold leading-snug text-white">{p.title}</p>
                  <p className="flex items-center gap-3 text-xs text-zinc-500">
                    <span className="inline-flex items-center gap-1">
                      <Icon name="Eye" size={13} />
                      {p.view_count}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Icon name="MessageCircle" size={13} />
                      {p.comment_count}
                    </span>
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Niches */}
        {topCats.length > 0 && (
          <section className="mb-10">
            <SectionHead icon="Folder" title="Browse Niches" href="/categories" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {topCats.map(c => (
                <Link
                  key={c.slug}
                  href={`/categories/${c.slug}`}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-orange-500/30 hover:bg-white/[0.07]"
                >
                  <p className="text-sm font-bold text-white">{c.name}</p>
                  <p className="text-xs text-zinc-500">{c.post_count} lists</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Magazine: debates + articles */}
        {(topDebates.length > 0 || topArticles.length > 0) && (
          <section className="mb-10">
            <SectionHead icon="FileText" title="Don't Miss" href="/articles" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {topDebates.map(d => (
                <Link
                  key={d.slug}
                  href={`/${d.slug}`}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-orange-500/30 hover:bg-white/[0.07]"
                >
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-orange-400/80">Debate</p>
                  <p className="mb-2 line-clamp-2 text-sm font-bold leading-snug text-white">{d.title}</p>
                  <p className="text-xs text-zinc-500">{d.comment_count} comments</p>
                </Link>
              ))}
              {topArticles.map(a => (
                <Link
                  key={a.slug}
                  href={`/articles/${a.slug}`}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-orange-500/30 hover:bg-white/[0.07]"
                >
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-orange-400/80">Article</p>
                  <p className="mb-2 line-clamp-2 text-sm font-bold leading-snug text-white">{a.title}</p>
                  <p className="text-xs text-zinc-500">
                    {[a.author_display_name, a.reading_time ? `${a.reading_time} min read` : null].filter(Boolean).join(' · ') || 'Article'}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Hall of fame strip */}
        {hofEntries.length > 0 && (
          <section className="mb-10">
            <SectionHead icon="Crown" title="Hall of Fame" href="/hall-of-fame" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {hofEntries.map(e => (
                <Link
                  key={e.id}
                  href={`/${e.post.slug}`}
                  className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4 transition hover:border-orange-500/40"
                >
                  <p className="mb-2 line-clamp-2 text-sm font-bold leading-snug text-white">{e.post.title}</p>
                  <p className="text-xs text-zinc-500">by {e.post.author_display_name || e.post.author_username}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <DesktopCta className="col-span-1" />
      </div>
    </div>
  );
}
