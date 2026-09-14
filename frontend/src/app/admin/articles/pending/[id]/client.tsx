'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { Icon } from '@/components/icons/Icon';

interface PendingArticle {
  _id: string;
  title: string;
  author_username: string;
  body: string;
  slug?: string;
  status?: string;
  category_slug?: string;
  cover_image?: string | null;
  reading_time?: number;
  sources?: Array<{ url: string; title: string }>;
  created_at: string;
}

export default function PendingArticleDetailClient() {
  const router = useRouter();
  const params = useParams()!;
  const articleId = params.id as string;

  const [article, setArticle] = useState<PendingArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    if (!articleId) return;
    let cancelled = false;

    const fetchArticle = async () => {
      try {
        const data = await apiFetch<{ article: PendingArticle }>(`/admin/articles/pending/${articleId}`);
        if (!cancelled) {
          setArticle(data.article);
          setLoadError(null);
        }
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : '';
        const status = parseInt(msg.match(/API Error: (\d+)/)?.[1] || '0', 10);
        let body: { code?: string; error?: string } | null = null;
        try { const j = msg.lastIndexOf('{'); if (j !== -1) body = JSON.parse(msg.slice(j)); } catch { /* not json */ }
        if (status === 404) {
          setLoadError('Article not found. It may have been permanently deleted.');
        } else if (status === 400 && body?.code === 'INVALID_STATUS') {
          setLoadError('This article is no longer pending review.');
        } else {
          setLoadError('Failed to load article. Please retry.');
        }
        console.warn('Pending article load failed:', status, body?.code || msg.slice(0, 120));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchArticle();
    return () => { cancelled = true; };
  }, [articleId]);

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await apiFetch(`/admin/articles/${articleId}/approve`, {
        method: 'PATCH'
      });
      router.push('/admin/articles/pending');
    } catch (error) {
      console.error('Failed to approve article:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) return;

    setActionLoading(true);
    try {
      await apiFetch(`/admin/articles/${articleId}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ reason: rejectionReason })
      });
      router.push('/admin/articles/pending');
    } catch (error) {
      console.error('Failed to reject article:', error);
    } finally {
      setActionLoading(false);
      setShowRejectModal(false);
    }
  };

  const btnPrimaryClass = 'inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 sm:py-3 text-sm font-bold text-white rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-h-11';
  const btnSecondaryClass = 'inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 sm:py-3 text-sm font-bold text-white rounded-xl bg-white/5 border border-white/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-h-11';

  if (loading) return <div className="p-5 text-white/40">Loading article...</div>;
  if (!articleId) return <div className="p-5 text-white/40">Invalid article ID</div>;
  if (!article) return <div className="p-5 text-white/40">{loadError || 'Article not found'}</div>;

  return (
    <div className="space-y-3 sm:space-y-4">
      <button onClick={() => router.push('/admin/articles/pending')} className="bg-transparent border-none text-orange-400 cursor-pointer text-sm p-0 hover:text-orange-300">
        Back to pending articles
      </button>

      <div className="text-2xs font-mono text-zinc-600">
        DOUBLE-BLIND REVIEW — Decisions based on content, not author reputation
      </div>

      <div className="space-y-4 sm:space-y-6 mt-5">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <h3 className="text-white font-semibold mb-3 text-sm">Details</h3>
          <dl className="space-y-2 text-sm2">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-white/40">Status</dt>
              <dd>
                <span className={`rounded-full px-2.5 py-0.5 text-3xs font-semibold uppercase tracking-wider ${article.status === 'approved' ? 'bg-green-500/15 text-green-400' : article.status === 'rejected' ? 'bg-red-500/15 text-red-400' : 'bg-orange-500/15 text-orange-400'}`}>
                  {(article.status || 'pending_review').replace(/_/g, ' ')}
                </span>
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-white/40">Category</dt>
              <dd className="text-white truncate max-w-[60%]">{article.category_slug || '—'}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-white/40">Author</dt>
              <dd className="text-white">{article.author_username}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-white/40">Reading time</dt>
              <dd className="text-white/70">{article.reading_time ?? 1} min</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-white/40">Created</dt>
              <dd className="text-white/70">{new Date(article.created_at).toLocaleString()}</dd>
            </div>
          </dl>
        </div>

        <div>
          <h1 className="text-white text-xl sm:text-2xl font-bold">{article.title}</h1>
          <p className="text-white/50 text-sm2 mt-1">
            By {article.author_username} | {new Date(article.created_at).toLocaleString()}
          </p>
        </div>

        {article.cover_image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={article.cover_image} alt="" className="w-full max-h-[420px] object-cover rounded-xl border border-white/10" />
        )}

        <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-5">
          <h3 className="text-white font-semibold mb-2">Body</h3>
          <p className="text-white/60 leading-relaxed whitespace-pre-wrap">{article.body}</p>
        </div>

        {article.sources && article.sources.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-5">
            <h3 className="text-white font-semibold mb-2">Sources ({article.sources.length})</h3>
            <ul className="space-y-1.5">
              {article.sources.map((s, i) => (
                <li key={i} className="text-sm2 text-white/60">
                  <span className="text-white">{s.title}</span>{' '}
                  <span className="text-white/40 break-all">{s.url}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-3 flex-wrap mt-8">
          <button onClick={handleApprove} disabled={actionLoading} className={btnPrimaryClass}>
            <Icon name="Check" size={16} color="#fff" /> Approve Article
          </button>
          <button onClick={() => setShowRejectModal(true)} disabled={actionLoading} className={btnSecondaryClass}>
            <Icon name="X" size={16} color="#ef4444" /> Reject Article
          </button>
        </div>

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4" onClick={() => setShowRejectModal(false)}>
            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-white font-semibold mb-1">Reject Article</h3>
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
