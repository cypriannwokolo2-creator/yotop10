'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { Icon } from '@/components/icons/Icon';
import { toast } from '@/lib/toast';

interface PendingPost {
  _id: string;
  title: string;
  author_username: string;
  post_type: string;
  intro: string;
  slug?: string;
  status?: string;
  category_slug?: string;
  view_count?: number;
  comment_count?: number;
  fire_count?: number;
  votes_a?: number;
  votes_b?: number;
  featured?: boolean;
  comments_locked?: boolean;
  published_at?: string | null;
  items: Array<{
    id: string;
    rank: number;
    title: string;
    justification: string;
  }>;
  created_at: string;
}

export default function PendingPostDetailClient() {
  const router = useRouter();
  const params = useParams()!;
  const postId = params.id as string;

  const [post, setPost] = useState<PendingPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isNonPending, setIsNonPending] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [retryGuidance, setRetryGuidance] = useState('');
  const [showRetryModal, setShowRetryModal] = useState(false);

  useEffect(() => {
    if (!postId) return;
    let cancelled = false;

    const fetchPost = async () => {
      try {
        const data = await apiFetch<{ post: PendingPost }>(`/admin/posts/pending/${postId}`);
        if (!cancelled) {
          setPost(data.post);
          setLoadError(null);
          setIsNonPending(false);
        }
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : '';
        const status = parseInt(msg.match(/API Error: (\d+)/)?.[1] || '0', 10);
        let body: { code?: string; error?: string } | null = null;
        try { const j = msg.lastIndexOf('{'); if (j !== -1) body = JSON.parse(msg.slice(j)); } catch { /* not json */ }
        if (status === 400 && body?.code === 'INVALID_STATUS') {
          // Expected when opening an approved/rejected post via a stale
          // pending URL (history, bookmark, or pre-fix View button).
          // Fall back to the status-agnostic admin endpoint instead of erroring.
          try {
            const fallback = await apiFetch<{ post: PendingPost }>(`/admin/posts/${postId}`);
            if (cancelled) return;
            setPost(fallback.post);
            setIsNonPending(true);
            setLoadError(null);
          } catch (fallbackErr) {
            if (cancelled) return;
            setLoadError('This post is no longer pending review. Open it from All Posts → View to see the live post.');
            console.warn('Pending fallback fetch failed:', fallbackErr);
          }
        } else if (status === 404) {
          setLoadError('Post not found. It may have been permanently deleted.');
          console.warn('Pending post not found:', postId);
        } else {
          setLoadError('Failed to load post. Please retry.');
          console.warn('Pending post load failed:', status, body?.code || msg.slice(0, 120));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchPost();
    return () => { cancelled = true; };
  }, [postId]);

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await apiFetch(`/admin/posts/${postId}/approve`, {
        method: 'PATCH'
      });
      router.push('/admin/posts/pending');
    } catch (error) {
      console.error('Failed to approve post:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) return;

    setActionLoading(true);
    try {
      await apiFetch(`/admin/posts/${postId}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ reason: rejectionReason })
      });
      router.push('/admin/posts/pending');
    } catch (error) {
      console.error('Failed to reject post:', error);
    } finally {
      setActionLoading(false);
      setShowRejectModal(false);
    }
  };

  const handleRetry = async () => {
    if (!retryGuidance.trim()) return;

    setActionLoading(true);
    try {
      await apiFetch(`/admin/posts/${postId}/retry`, {
        method: 'POST',
        body: JSON.stringify({ guidance: retryGuidance })
      });
      toast.success('Guidance sent. Post remains in queue.');
      setRetryGuidance('');
      setShowRetryModal(false);
    } catch (error) {
      console.error('Failed to request revision:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const btnPrimaryClass = 'inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 sm:py-3 text-sm font-bold text-white rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-h-11';
  const btnSecondaryClass = 'inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 sm:py-3 text-sm font-bold text-white rounded-xl bg-white/5 border border-white/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-h-11';

  if (loading) return <div className="p-5 text-white/40">Loading post...</div>;
  if (!postId) return <div className="p-5 text-white/40">Invalid post ID</div>;
  if (!post) return <div className="p-5 text-white/40">{loadError || 'Post not found'}</div>;

  return (
    <div className="space-y-3 sm:space-y-4">
      <button onClick={() => router.push('/admin/posts/pending')} className="bg-transparent border-none text-orange-400 cursor-pointer text-sm p-0 hover:text-orange-300">
        Back to pending posts
      </button>

      {isNonPending && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
          This post is {post.status || 'no longer pending review'} — showing a read-only preview.
          {post.slug && (
            <> Open the <button onClick={() => window.open(`/${post.slug}`, '_blank')} className="underline hover:text-amber-100">live post</button> or use All Posts → View.</>
          )}
        </div>
      )}

      {!isNonPending && (
        <div className="text-2xs font-mono text-zinc-600">
          DOUBLE-BLIND REVIEW — Decisions based on content, not author reputation
        </div>
      )}

      <div className="space-y-4 sm:space-y-6 mt-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <h3 className="text-white font-semibold mb-3 text-sm">Details</h3>
            <dl className="space-y-2 text-sm2">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-white/40">Status</dt>
                <dd>
                  <span className={`rounded-full px-2.5 py-0.5 text-3xs font-semibold uppercase tracking-wider ${post.status === 'approved' ? 'bg-green-500/15 text-green-400' : post.status === 'rejected' ? 'bg-red-500/15 text-red-400' : 'bg-orange-500/15 text-orange-400'}`}>
                    {(post.status || 'pending_review').replace(/_/g, ' ')}
                  </span>
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-white/40">Type</dt>
                <dd className="text-white">{post.post_type}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-white/40">Category</dt>
                <dd className="text-white truncate max-w-[60%]">{post.category_slug || '—'}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-white/40">Author</dt>
                <dd className="text-white">{post.author_username}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-white/40">Created</dt>
                <dd className="text-white/70">{new Date(post.created_at).toLocaleString()}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-white/40">Published</dt>
                <dd className="text-white/70">{post.published_at ? new Date(post.published_at).toLocaleString() : '—'}</dd>
              </div>
              {(post.featured || post.comments_locked) && (
                <div className="flex items-center gap-2 pt-1">
                  {post.featured && <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-3xs font-semibold text-amber-400">FEATURED</span>}
                  {post.comments_locked && <span className="rounded-md bg-white/10 px-2 py-0.5 text-3xs font-semibold text-white/60">LOCKED</span>}
                </div>
              )}
            </dl>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <h3 className="text-white font-semibold mb-3 text-sm">Stats</h3>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-white/5 px-2 py-3">
                <p className="text-lg font-bold text-white">{post.view_count ?? 0}</p>
                <p className="text-3xs text-white/40 uppercase tracking-wider mt-0.5">Views</p>
              </div>
              <div className="rounded-lg bg-white/5 px-2 py-3">
                <p className="text-lg font-bold text-white">{post.comment_count ?? 0}</p>
                <p className="text-3xs text-white/40 uppercase tracking-wider mt-0.5">Comments</p>
              </div>
              <div className="rounded-lg bg-white/5 px-2 py-3">
                <p className="text-lg font-bold text-white">{post.fire_count ?? 0}</p>
                <p className="text-3xs text-white/40 uppercase tracking-wider mt-0.5">Fire</p>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-white/5 px-2 py-2.5">
                <p className="text-base font-bold text-white">{post.items.length}</p>
                <p className="text-3xs text-white/40 uppercase tracking-wider mt-0.5">Items</p>
              </div>
              <div className="rounded-lg bg-white/5 px-2 py-2.5">
                <p className="text-base font-bold text-white">{post.votes_a ?? 0}</p>
                <p className="text-3xs text-white/40 uppercase tracking-wider mt-0.5">Votes A</p>
              </div>
              <div className="rounded-lg bg-white/5 px-2 py-2.5">
                <p className="text-base font-bold text-white">{post.votes_b ?? 0}</p>
                <p className="text-3xs text-white/40 uppercase tracking-wider mt-0.5">Votes B</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h1 className="text-white text-xl sm:text-2xl font-bold">{post.title}</h1>
          <p className="text-white/50 text-sm2 mt-1">
            By {post.author_username} | {new Date(post.created_at).toLocaleString()} | {post.post_type}
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-5">
          <h3 className="text-white font-semibold mb-2">Introduction</h3>
          <p className="text-white/60 leading-relaxed">{post.intro}</p>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <h3 className="text-white font-semibold">List Items</h3>
          {post.items.map(item => (
            <div key={item.id} className="bg-white/5 border border-white/10 rounded-xl p-3 sm:p-4">
              <h4 className="text-white font-semibold mb-1.5">#{item.rank} {item.title}</h4>
              <p className="text-white/60 leading-relaxed">{item.justification}</p>
            </div>
          ))}
        </div>

        {!isNonPending ? (
          <div className="flex gap-3 flex-wrap mt-8">
            <button onClick={handleApprove} disabled={actionLoading} className={btnPrimaryClass}>
              <Icon name="Check" size={16} color="#fff" /> Approve Post
            </button>
            <button onClick={() => setShowRetryModal(true)} disabled={actionLoading} className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 sm:py-3 text-sm font-bold text-white rounded-xl bg-orange-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-h-11 hover:bg-orange-500">
              <Icon name="RefreshCw" size={16} color="#fff" /> Request Revision
            </button>
            <button onClick={() => setShowRejectModal(true)} disabled={actionLoading} className={btnSecondaryClass}>
              <Icon name="X" size={16} color="#ef4444" /> Reject Post
            </button>
          </div>
        ) : (
          <div className="flex gap-3 flex-wrap mt-8">
            <button onClick={() => router.push(`/admin/posts/${postId}/edit`)} className={btnPrimaryClass}>
              <Icon name="Pencil" size={16} color="#fff" /> Edit in admin
            </button>
            {post.slug && (
              <button onClick={() => window.open(`/${post.slug}`, '_blank')} className={btnSecondaryClass}>
                <Icon name="ExternalLink" size={16} color="#fff" /> Open live post
              </button>
            )}
            <button onClick={() => router.push('/admin/posts')} className={btnSecondaryClass}>
              Back to All Posts
            </button>
          </div>
        )}

        {/* Retry Modal */}
        {showRetryModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4" onClick={() => { setShowRetryModal(false); setRetryGuidance(''); }}>
            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-white font-semibold mb-1">Request Revision</h3>
              <p className="text-white/50 text-sm2 mb-3">Send guidance to the author. No trust score penalty.</p>
              <textarea
                value={retryGuidance}
                onChange={(e) => setRetryGuidance(e.target.value)}
                placeholder="Enter guidance for the author (e.g., 'Add more detail to item #3' or 'Fix spelling in the intro')"
                rows={5}
                maxLength={2000}
                className="w-full mb-2.5 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm2 resize-y outline-none placeholder:text-white/30"
              />
              <div className="flex gap-2.5 justify-between items-center">
                <span className="text-xs text-white/30">{retryGuidance.length}/2000</span>
                <div className="flex gap-2.5">
                  <button onClick={() => { setShowRetryModal(false); setRetryGuidance(''); }} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm2 cursor-pointer">Cancel</button>
                  <button onClick={handleRetry} disabled={!retryGuidance.trim() || actionLoading} className={`px-5 py-2 text-white rounded-xl text-sm2 font-bold ${!retryGuidance.trim() || actionLoading ? 'bg-white/10 cursor-not-allowed' : 'bg-orange-600 cursor-pointer hover:bg-orange-500'}`}>
                    Send Guidance
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4" onClick={() => setShowRejectModal(false)}>
            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-white font-semibold mb-1">Reject Post</h3>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason..."
                rows={4}
                className="w-full my-3 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm2 resize-y outline-none placeholder:text-white/30"
              />
              <div className="flex gap-2.5 justify-end">
                <button onClick={() => setShowRejectModal(false)} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm2 cursor-pointer">Cancel</button>
                <button onClick={handleReject} disabled={!rejectionReason.trim() || actionLoading} className={`px-5 py-2 text-white rounded-xl text-sm2 font-bold ${!rejectionReason.trim() || actionLoading ? 'bg-white/10 cursor-not-allowed' : 'bg-red-700 cursor-pointer hover:bg-red-600'}`}>
                  Confirm Reject
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
