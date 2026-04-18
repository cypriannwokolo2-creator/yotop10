'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { API, Post } from '@/lib/api';
import { CheckCircle, XCircle, ExternalLink, Pencil } from 'lucide-react';

export default function PendingPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingOn, setActingOn] = useState<string | null>(null);

  const loadPending = () => {
    API.adminGetPendingPosts()
      .then((data: any) => setPosts(data.posts || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPending();
  }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setActingOn(id);
    try {
      await API.adminApprovePost(id, action);
      loadPending(); // refresh queue
    } catch {
      alert(`Failed to ${action} post`);
    } finally {
      setActingOn(null);
    }
  };

  if (loading) return <div>Loading queue...</div>;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Approval Queue</h1>
        <p className="text-muted-foreground mt-1">
          Review posts submitted by users. You can approve, reject, or edit them.
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-border">
          <CheckCircle size={48} className="mx-auto mb-4 text-green-500/50" />
          <h2 className="text-xl font-bold mb-2">You're all caught up!</h2>
          <p className="text-muted-foreground">There are no pending posts left to review.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-bold rounded uppercase tracking-wider">
                    {post.post_type.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">ID: {post.id}</span>
                </div>
                <h3 className="text-xl font-bold hover:underline mb-1">
                  <Link href={`/${post.slug || post.id}`} target="_blank" className="flex items-center gap-2">
                    {post.title} <ExternalLink size={14} className="text-muted-foreground" />
                  </Link>
                </h3>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{post.intro}</p>
                <div className="flex items-center gap-4 text-xs font-medium">
                  {post.category && (
                    <span className="flex items-center gap-1.5">
                      <span className="text-muted-foreground">Category:</span> {post.category.name}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">Author:</span> {post.author_display_name}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 md:flex-col md:w-32 shrink-0">
                <button
                  onClick={() => handleAction(post.id, 'approve')}
                  disabled={actingOn === post.id}
                  className="w-full flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  <CheckCircle size={18} /> Approve
                </button>
                <Link
                  href={`/admin/posts/edit/${post.id}`}
                  className="w-full flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-muted text-foreground rounded-xl font-bold hover:bg-muted/80 transition-colors border border-border"
                >
                  <Pencil size={18} /> Edit
                </Link> 
                <button
                  onClick={() => handleAction(post.id, 'reject')}
                  disabled={actingOn === post.id}
                  className="w-full flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  <XCircle size={18} /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
