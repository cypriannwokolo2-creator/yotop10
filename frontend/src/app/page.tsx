'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendingUp, ArrowRight, Sparkles, MessageCircle, Flame, ChevronRight } from 'lucide-react';
import { API, type Category, type Post } from '@/lib/api';
import { cn } from '@/lib/utils';

const TRENDING_SEARCHES = [
  'Top 10 Movies 2024',
  'Best Smartphones',
  'Video Games Ranking',
  'Anime Series',
  'NBA Players',
  'TV Shows',
];

const CATEGORY_ICONS: Record<string, string> = {
  movies: '🎬',
  tech: '💻',
  music: '🎵',
  sports: '⚽',
  gaming: '🎮',
  food: '🍕',
  travel: '✈️',
  books: '📚',
  science: '🔬',
  fashion: '👗',
};

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // No fingerprint on page load — lazy identity (only when user takes action)
    Promise.all([
      API.getCategories().catch(() => ({ categories: [] })),
      API.getPosts({ page: 1, limit: 6 }).catch(() => ({ posts: [] })),
    ]).then(([catData, postsData]) => {
      setCategories(catData.categories || []);
      setRecentPosts(postsData.posts || []);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col">
      {/* ===== HERO SECTION ===== */}
      <section className="relative px-4 pt-20 pb-16 md:pt-32 md:pb-24 overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background -z-10" />
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -z-10" />

        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Sparkles size={14} className="text-primary" />
            <span className="text-sm font-medium text-primary">No account required</span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight mb-6">
            <span className="text-primary">YO!</span>Welcome to{' '}
            <span className="text-primary">YO!</span>Top10
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Explore any Top 10 list and join the{' '}
            <span className="underline underline-offset-4 decoration-primary font-semibold text-foreground">
              wildest Arguments
            </span>{' '}
            online!
          </p>

          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto mb-8">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={'"Top 10 sneakers of 2025?"'}
className={cn(
                'w-full h-14 pl-5 pr-14 rounded-xl border bg-card text-base md:text-lg shadow-lg transition-all duration-300',
                'focus:outline-none focus:ring-2',
                searchQuery.trim()
                  ? 'border-primary shadow-xl shadow-primary/30 focus:ring-primary/30'
                  : 'border-border focus:ring-ring/30',
                'placeholder:text-muted-foreground/60'
              )}
            />
            <button
className={cn(
                'absolute right-2 top-2 w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300',
                searchQuery.trim()
                  ? 'bg-primary text-white scale-110'
                  : 'bg-muted hover:bg-border text-muted-foreground'
              )}
            >
              {/* Gemini-style sparkle icon */}
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-6 h-6"
              >
                <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" />
                <path d="M18 14L18.75 16.25L21 17L18.75 17.75L18 20L17.25 17.75L15 17L17.25 16.25L18 14Z" opacity="0.6" />
              </svg>
            </button>
          </div>

          {/* Trending Searches */}
          <div className="max-w-2xl mx-auto bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-center gap-2 mb-4">
              <TrendingUp size={18} className="text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Trending Searches
              </span>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {TRENDING_SEARCHES.map((term) => (
                <Link
                  key={term}
                  href={`/search?q=${encodeURIComponent(term)}`}
className="px-4 py-2 rounded-xl border border-border bg-background text-sm font-medium hover:border-primary hover:text-primary transition-colors"
                >
                  {term}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== STATS SECTION ===== */}
      <section className="px-4 py-16 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '10K+', label: 'Lists Created' },
              { value: '50K+', label: 'Active Users' },
              { value: '200K+', label: 'Comments' },
              { value: '1M+', label: 'Views' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA BUTTON ===== */}
      <section className="px-4 py-12 text-center">
        <Link
          href="/feed"
className="inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-primary text-white font-bold text-base hover:bg-primary-dark transition-colors shadow-xl shadow-primary/30"
        >
          Discover Lists <ArrowRight size={18} />
        </Link>
      </section>

      {/* ===== BROWSE CATEGORIES ===== */}
      <section className="px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Browse Popular Categories
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Find rankings across every topic imaginable — from movies and tech to sports and beyond.
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-28 rounded-2xl bg-border/50 animate-pulse" />
              ))}
            </div>
          ) : categories.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.slice(0, 8).map((cat) => (
                <Link
                  key={cat.id}
                  href={`/c/${cat.slug}`}
                  className="group flex flex-col items-center justify-center gap-2 p-5 rounded-xl bg-card border border-border hover:border-primary/50 hover:shadow-md transition-all relative overflow-hidden"
                >
                  {cat.image_url && (
                    <img 
                      src={cat.image_url} 
                      alt={cat.name} 
                      className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity" 
                    />
                  )}
                  <span className="text-3xl relative z-10">
                    {cat.icon || CATEGORY_ICONS[cat.slug.toLowerCase()] || '📋'}
                  </span>
                  <span className="text-sm font-semibold group-hover:text-primary transition-colors relative z-10">
                    {cat.name}
                  </span>
                  {cat.post_count > 0 && (
                    <span className="text-xs text-muted-foreground relative z-10">
                      {cat.post_count} lists
                    </span>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">No categories yet.</p>
          )}

          {categories.length > 8 && (
            <div className="text-center mt-6">
              <Link
                href="/categories"
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-dark transition-colors"
              >
                View All Categories <ChevronRight size={14} />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ===== RECENT POSTS ===== */}
      <section className="px-4 py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2">Recent Lists</h2>
              <p className="text-muted-foreground">Fresh rankings from the community</p>
            </div>
            <Link
              href="/categories"
              className="text-sm font-semibold text-primary hover:text-primary-dark transition-colors flex items-center gap-1"
            >
              See all <ChevronRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : recentPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {recentPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/${post.slug}`}
className="group block p-5 rounded-xl bg-card border border-border hover:border-primary/40 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className={cn(
                      'text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full',
                      'bg-primary/10 text-primary'
                    )}>
                      {post.post_type.replace(/_/g, ' ')}
                    </span>
                    {post.category && (
                      <span className="text-[10px] font-medium text-muted-foreground px-2.5 py-0.5 rounded-full bg-muted">
                        {post.category.name}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-base mb-2 group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {post.intro}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MessageCircle size={12} /> {post.comment_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <Flame size={12} /> {post.view_count}
                    </span>
                    <span className="ml-auto">
                      by {post.author_display_name}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Sparkles size={40} className="mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground mb-4">No lists yet. Be the first!</p>
              <Link
                href="/submit"
className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-white font-semibold text-sm hover:bg-primary-dark transition-colors"
              >
                Create a List <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="px-4 py-20">
        <div className="max-w-5xl mx-auto text-center">
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to join the debate and make your voice heard.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: '📝', title: 'Create a List', desc: 'Submit your top 10 ranking on any topic. No account needed.' },
              { icon: '💬', title: 'Join the Debate', desc: 'Comment on items, reply to others, and fire up hot takes.' },
              { icon: '🔥', title: 'Rise to the Top', desc: 'The best comments earn Spark Scores and climb the rankings.' },
            ].map((step, i) => (
              <div key={i} className="p-8 rounded-xl bg-card border border-border hover:shadow-lg transition-shadow">
                <span className="text-5xl mb-4 block">{step.icon}</span>
                <h3 className="font-bold text-xl mb-3">{step.title}</h3>
                <p className="text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="px-4 py-20 bg-gradient-to-b from-muted/30 to-background">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start Debating?</h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of users creating rankings and engaging in lively discussions.
          </p>
          <Link
            href="/feed"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-lg bg-primary text-white font-bold text-base hover:bg-primary-dark transition-colors shadow-xl shadow-primary/30"
          >
            Explore Now <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}
