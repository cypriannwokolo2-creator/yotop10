'use client';

import { useState, useEffect } from 'react';
import PostCard from '@/components/ui/PostCard';
import ArticleCard from '@/components/ui/ArticleCard';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { TrendingUp, FileText } from 'lucide-react';

// Mock data for demonstration
const mockPosts = [
  {
    id: '1',
    slug: 'best-programming-languages-2024',
    author: {
      username: 'a_techguru',
      displayName: 'Tech Guru',
      verified: true,
    },
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    title: 'Best Programming Languages 2024 💻',
    description: 'Based on job demand, community growth, and future potential. Disagree? Let\'s discuss!',
    items: [
      { rank: 1, title: 'Python' },
      { rank: 2, title: 'JavaScript' },
      { rank: 3, title: 'Rust' },
      { rank: 4, title: 'Go' },
      { rank: 5, title: 'TypeScript' },
    ],
    image: '/images/code-laptop.jpg',
    engagementScore: 82,
    commentCount: 47,
    reactionCount: 156,
  },
  {
    id: '2',
    slug: 'top-streaming-platforms-2024',
    author: {
      username: 'a_entertainment',
      displayName: 'Entertainment Weekly',
      verified: false,
    },
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    title: 'Which streaming platform offers the best value in 2024?',
    description: 'Comparing Netflix, Disney+, Max, and more based on content library, pricing, and user experience.',
    items: [
      { rank: 1, title: 'Netflix' },
      { rank: 2, title: 'Disney+' },
      { rank: 3, title: 'Max' },
    ],
    image: '/images/streaming.jpg',
    engagementScore: 75,
    commentCount: 89,
    reactionCount: 234,
  },
];

const mockArticles = [
  {
    id: '1',
    slug: 'how-to-create-engaging-rankings',
    title: 'How to Create Engaging Rankings That Go Viral',
    excerpt: 'Learn the secrets behind creating rankings that capture attention and spark massive discussions.',
    author: { name: 'Content Expert' },
    publishedAt: '2 days ago',
    readTime: 5,
    tags: [
      { label: 'Tutorial', variant: 'default' as const },
      { label: 'Featured', variant: 'featured' as const },
    ],
    thumbnail: '/images/article-1.jpg',
    viewCount: '12.4K views',
  },
  {
    id: '2',
    slug: 'psychology-behind-viral-debates',
    title: 'The Psychology Behind Viral Debates',
    excerpt: 'Understanding why certain topics spark massive discussions and how to leverage this knowledge.',
    author: { name: 'Mind Analyst' },
    publishedAt: '3 days ago',
    readTime: 7,
    tags: [
      { label: 'Psychology', variant: 'default' as const },
    ],
    thumbnail: '/images/article-2.jpg',
    viewCount: '8.7K views',
  },
  {
    id: '3',
    slug: 'building-personal-brand-rankings',
    title: 'Building Your Personal Brand Through Rankings',
    excerpt: 'Transform your online presence by creating thoughtful rankings that showcase your expertise.',
    author: { name: 'Brand Builder' },
    publishedAt: '1 day ago',
    readTime: 6,
    tags: [
      { label: 'Branding', variant: 'default' as const },
      { label: 'Featured', variant: 'featured' as const },
    ],
    thumbnail: '/images/article-3.jpg',
    viewCount: '15.2K views',
  },
  {
    id: '4',
    slug: 'top-tools-content-creators-2024',
    title: 'Top 10 Tools for Content Creators in 2024',
    excerpt: 'Essential tools and platforms that every content creator should be using to grow their audience.',
    author: { name: 'Tech Guru' },
    publishedAt: '4 days ago',
    readTime: 8,
    tags: [
      { label: 'Tools', variant: 'default' as const },
    ],
    thumbnail: '/images/article-4.jpg',
    viewCount: '21.8K views',
  },
];

export default function FeedPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'rankings' | 'articles'>('rankings');

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Discover</h1>
          <p className="text-sm text-muted-foreground">
            Explore top rankings and curated articles from the community
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-xl mb-6">
          <button
            onClick={() => setActiveTab('rankings')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'rankings'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <TrendingUp size={16} />
            Rankings
          </button>
          <button
            onClick={() => setActiveTab('articles')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'articles'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileText size={16} />
            Articles
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : activeTab === 'rankings' ? (
          <div className="space-y-4">
            {mockPosts.map((post) => (
              <PostCard key={post.id} {...post} />
            ))}
            <EmptyState
              icon={<TrendingUp size={48} className="text-muted-foreground/30" />}
              title="No more rankings"
              description="You've reached the end of the feed. Create your own ranking to get started!"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {mockArticles.map((article) => (
              <ArticleCard key={article.id} {...article} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
