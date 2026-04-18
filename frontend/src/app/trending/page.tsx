'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { API, type Post } from '@/lib/api';
import PostCard from '@/components/ui/PostCard';
import { TrendingUp } from 'lucide-react';

export default function TrendingPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.getTrendingPosts(1, 20)
      .then((data) => setPosts(data.posts || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-primary/10 rounded-xl">
          <TrendingUp size={28} className="text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Trending Lists</h1>
          <p className="text-muted-foreground text-sm mt-1">
            The most active debates and highest-viewed rankings across the platform.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : posts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <PostCard 
              key={post.id} 
              id={post.id}
              slug={post.slug}
              title={post.title}
              description={post.intro}
              createdAt={post.created_at}
              author={{
                username: post.author_username,
                displayName: post.author_display_name,
                verified: false,
              }}
              commentCount={post.comment_count}
              reactionCount={post.view_count} // Map view_count to reaction temporarily or keep it separate
              items={[]} 
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-muted/30 rounded-2xl border border-border">
          <TrendingUp size={48} className="mx-auto mb-4 text-muted-foreground/30" />
          <h2 className="text-xl font-bold mb-2">No trending posts right now.</h2>
          <p className="text-muted-foreground mb-6">Create a post and spark a debate to see it here!</p>
          <Link href="/submit" className="px-6 py-2.5 rounded-lg bg-primary text-white font-semibold hover:bg-primary-dark transition-colors inline-flex">
            Create a List
          </Link>
        </div>
      )}
    </div>
  );
}
