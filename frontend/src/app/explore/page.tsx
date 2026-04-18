'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { API, type Post } from '@/lib/api';
import PostCard from '@/components/ui/PostCard';
import { Sparkles, RefreshCw } from 'lucide-react';

export default function ExplorePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadExplorePosts = () => {
    setRefreshing(true);
    API.getExplorePosts(15)
      .then((data) => setPosts(data.posts || []))
      .catch((err) => console.error(err))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    loadExplorePosts();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-500/10 rounded-xl">
            <Sparkles size={28} className="text-purple-500" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Explore</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Discover random lists and undiscovered gems from across the community.
            </p>
          </div>
        </div>
        
        <button 
          onClick={loadExplorePosts}
          disabled={refreshing}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-muted hover:bg-border border border-border rounded-xl transition-colors font-medium text-sm"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          Shuffle Postings
        </button>
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
              reactionCount={post.view_count} 
              items={[]} 
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-muted/30 rounded-2xl border border-border">
          <Sparkles size={48} className="mx-auto mb-4 text-muted-foreground/30" />
          <h2 className="text-xl font-bold mb-2">The void is empty!</h2>
          <p className="text-muted-foreground mb-6">There are no posts available to explore yet.</p>
          <Link href="/submit" className="px-6 py-2.5 rounded-lg bg-primary text-white font-semibold hover:bg-primary-dark transition-colors inline-flex">
            Be the First
          </Link>
        </div>
      )}
    </div>
  );
}
