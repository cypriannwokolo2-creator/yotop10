'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { apiFetch } from '@/lib/api';
import { toast } from '@/lib/toast';
import { Icon } from '@/components/icons/Icon';
import { relativeTime } from '@/lib/dates';
import { CustomDropdown } from '@/components/CustomDropdown';

interface PendingArticle { _id: string; title: string; author_username: string; created_at: string; category_slug: string; category_name?: string; body?: string; cover_image?: string | null; reading_time?: number; sources?: Array<{ url: string; title: string }> }
interface CategoryOption { slug: string; name: string; children?: Array<{ slug: string; name: string }> }

export default function PendingArticlesClient() {
  const articlesRef = useRef<PendingArticle[]>([]);
  const [articles, setArticles] = useState<PendingArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 0 });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({ category_slug: '', sort: 'oldest', author: '' });
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [previewCache, setPreviewCache] = useState<Record<string, { body: string; sources: Array<{ url: string; title: string }> }>>({});
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [mobileDropdownId, setMobileDropdownId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const fetchArticles = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: '20', sort: filters.sort });
      if (filters.category_slug) params.set('category_slug', filters.category_slug);
      if (filters.author) params.set('author', filters.author);
      if (dateFrom) params.set('date_from', dateFrom);
      if (dateTo) params.set('date_to', dateTo);
      const data = await apiFetch<{ articles: PendingArticle[]; pagination: { total: number; pages: number } }>(`/admin/articles/pending?${params}`);
      setArticles(data.articles); articlesRef.current = data.articles; setPagination(data.pagination); setFetchError(null);
    } catch { setFetchError('Failed to load pending articles.'); } finally { setLoading(false); }
  }, [filters, dateFrom, dateTo]);

  useEffect(() => { fetchArticles(page); }, [page, fetchArticles]);

  useEffect(() => { apiFetch<{ categories: CategoryOption[] }>('/categories').then(d => setCategories(d.categories || [])).catch(() => {}); }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMobileDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleSelect = (id: string) => setSelected(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const selectAll = () => { if (selected.size === articles.length) setSelected(new Set()); else setSelected(new Set(articles.map(a => a._id))); };

  const toggleExpand = async (id: string) => {
    const next = new Set(expanded);
    if (next.has(id)) { next.delete(id); setExpanded(next); return; }
    next.add(id); setExpanded(next);
    if (!previewCache[id]) {
      try {
        const data = await apiFetch<{ article: PendingArticle & { body: string; sources: Array<{ url: string; title: string }> } }>(`/admin/articles/pending/${id}`);
        setPreviewCache(prev => ({ ...prev, [id]: { body: data.article.body || '', sources: data.article.sources || [] } }));
      } catch {}
    }
  };

  const bulkAction = async (action: string) => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    setActionLoading(true);
    try {
      if (action === 'approve') {
        const res = await apiFetch<{ approved: number }>('/admin/articles/bulk/approve', { method: 'POST', body: JSON.stringify({ ids }) });
        toast.success(`${res.approved} article(s) approved.`);
      } else if (action === 'reject') {
        await apiFetch('/admin/articles/bulk/reject', { method: 'POST', body: JSON.stringify({ ids, reason: rejectReason }) });
        toast.success('Articles rejected.');
        setRejectReason(''); setShowRejectModal(false);
      }
      setSelected(new Set()); fetchArticles(page);
    } catch {} finally { setActionLoading(false); }
  };

  const singleAction = useCallback(async (id: string, action: string) => {
    setActionLoading(true);
    setMobileDropdownId(null);
    try {
      if (action === 'approve') await apiFetch(`/admin/articles/${id}/approve`, { method: 'PATCH' });
      else if (action === 'reject') await apiFetch(`/admin/articles/${id}/reject`, { method: 'PATCH', body: JSON.stringify({ reason: rejectReason || 'Rejected' }) });
      else if (action === 'cancel') await apiFetch(`/admin/articles/${id}/cancel`, { method: 'DELETE' });
      toast.success(`${action === 'approve' ? 'Approved.' : action === 'reject' ? 'Rejected.' : 'Cancelled.'}`);
      if (action !== 'cancel') { setRejectReason(''); setShowRejectModal(false); }
      fetchArticles(page);
    } catch {} finally { setActionLoading(false); }
  }, [rejectReason, fetchArticles, page]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      const list = articlesRef.current;
      if (e.key === 'a' || e.key === 'A') { e.preventDefault(); if (list.length > 0) singleAction(list[0]._id, 'approve'); }
      else if (e.key === 'r' || e.key === 'R') { e.preventDefault(); setSelected(new Set([list[0]?._id].filter(Boolean) as string[])); setShowRejectModal(true); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [singleAction]);

  const ageColor = (d: string) => { const h = Math.round((Date.now() - new Date(d).getTime()) / 3600000); return h > 168 ? 'text-red-700' : h > 48 ? 'text-orange-600' : 'text-white/40'; };

  const filterSelectClass = 'bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-white text-xs outline-none min-h-11 w-full sm:w-auto';
  const filterInputClass = 'bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-white text-xs outline-none min-h-11 w-full sm:w-auto';
  const btnSmClass = 'text-3xs px-2 py-0.5 cursor-pointer bg-white/5 border border-white/10 rounded-lg text-white min-h-7';
  const dropdownItemClass = 'w-full text-left px-4 py-2.5 text-sm2 text-white hover:bg-white/10 flex items-center gap-2 min-h-11';

  return (
    <div className="space-y-3 sm:space-y-4 px-3 sm:px-6">
      <h2 className="text-white text-lg font-bold">Article Review Queue ({pagination.total} pending)</h2>

      <div className="text-2xs font-mono text-zinc-600">
        DOUBLE-BLIND REVIEW — Decisions based on content, not author reputation
      </div>

      <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
        <CustomDropdown
          value={filters.sort}
          onChange={v => { setFilters(f => ({ ...f, sort: v })); setPage(1); }}
          options={[{ value: 'oldest', label: 'Oldest First' }, { value: 'newest', label: 'Newest First' }]}
          placeholder="Sort"
          className={filterSelectClass}
        />
        <input placeholder="Author username" value={filters.author} onChange={e => { setFilters(f => ({ ...f, author: e.target.value })); setPage(1); }} className={`${filterInputClass} sm:w-[140px]`} />
        <CustomDropdown
          value={filters.category_slug}
          onChange={v => { setFilters(f => ({ ...f, category_slug: v })); setPage(1); }}
          options={[{ value: '', label: 'All Categories' }, ...categories.flatMap(c => [{ value: c.slug, label: c.name }, ...(c.children?.map(ch => ({ value: ch.slug, label: `\u00a0\u00a0${ch.name}` })) || [])])]}
          placeholder="All Categories"
          className={`${filterSelectClass} sm:max-w-[180px]`}
        />
        <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} className={`${filterInputClass} sm:w-[130px]`} title="From date" />
        <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} className={`${filterInputClass} sm:w-[130px]`} title="To date" />
      </div>

      {selected.size > 0 && (
        <div className="bg-white/5 rounded-lg px-3 py-2.5 flex flex-col sm:flex-row gap-2 items-start sm:items-center border border-white/10">
          <span className="text-white text-sm font-semibold">{selected.size} selected</span>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => bulkAction('approve')} disabled={actionLoading} className={`${btnSmClass} min-h-11 sm:min-h-7`}><Icon name="Check" size={14} color="#2e7d32" /> Approve</button>
            <button onClick={() => setShowRejectModal(true)} disabled={actionLoading} className={`${btnSmClass} min-h-11 sm:min-h-7`}><Icon name="X" size={14} color="#c62828" /> Reject</button>
          </div>
        </div>
      )}

      {fetchError && !loading && <div className="mb-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">{fetchError}</div>}
      {loading ? <div className="animate-pulse space-y-3">{Array.from({length:5}).map((_,i) => <div key={i} className="h-20 rounded-xl bg-white/5" />)}</div> : articles.length === 0 ? <p className="text-white/40">No pending articles.</p> : (
        <div className="space-y-3 sm:space-y-4">
          {/* Desktop header */}
          <div className="hidden sm:flex border-b-2 border-white/10 pb-2 text-xs text-white/40 text-left">
            <span className="w-[30px]"><input type="checkbox" checked={selected.size === articles.length && articles.length > 0} onChange={selectAll} /></span>
            <span className="flex-1">Title</span><span className="w-[90px]">Author</span><span className="w-[50px]">Age</span><span className="w-[140px]">Actions</span>
          </div>
          {/* Mobile + Desktop rows */}
          <div className="flex flex-col gap-2">
            {articles.map(a => (
              <div key={a._id} className="bg-white/5 border border-white/5 rounded-2xl sm:rounded-none sm:border-0 sm:bg-transparent">
                {/* Card row (visible on all screens) */}
                <div className="flex items-center py-2 gap-1 sm:border-b sm:border-white/5 cursor-pointer flex-wrap">
                  {/* Mobile card layout */}
                  <div className="sm:hidden flex flex-col gap-1 w-full px-3">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={selected.has(a._id)} onChange={() => toggleSelect(a._id)} onClick={e => e.stopPropagation()} className="min-h-11 min-w-11" />
                      <span className="font-bold text-sm2 text-white flex-1 min-h-11 flex items-center" onClick={() => toggleExpand(a._id)}>
                        {a.title}
                      </span>
                      {/* Mobile dropdown trigger */}
                      <div className="relative" ref={mobileDropdownId === a._id ? dropdownRef : null}>
                        <button
                          onClick={e => { e.stopPropagation(); setMobileDropdownId(prev => prev === a._id ? null : a._id); }}
                          className="min-h-11 min-w-11 flex items-center justify-center bg-white/5 border border-white/10 rounded-lg"
                        >
                          <Icon name="Ellipsis" size={18} />
                        </button>
                        {mobileDropdownId === a._id && (
                          <div className="absolute right-0 top-full mt-1 z-50 bg-zinc-800 border border-white/10 rounded-xl py-1 min-w-[180px] shadow-2xl">
                            <button onClick={e => { e.stopPropagation(); singleAction(a._id, 'approve'); }} disabled={actionLoading} className={dropdownItemClass}><Icon name="Check" size={14} color="#2e7d32" /> Approve</button>
                            <button onClick={e => { e.stopPropagation(); singleAction(a._id, 'cancel'); }} disabled={actionLoading} className={dropdownItemClass}><Icon name="Trash2" size={14} color="#c62828" /> Cancel Article</button>
                            <button onClick={e => { e.stopPropagation(); setMobileDropdownId(null); setShowRejectModal(true); setSelected(new Set([a._id])); }} disabled={actionLoading} className={dropdownItemClass}><Icon name="X" size={14} color="#c62828" /> Reject</button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-3 text-3xs text-white/50 pl-11 items-center">
                      <span>{a.author_username}</span>
                      <span className={ageColor(a.created_at)} suppressHydrationWarning>{relativeTime(a.created_at)}</span>
                    </div>
                  </div>
                  {/* Desktop row */}
                  <span className="hidden sm:block w-[30px]"><input type="checkbox" checked={selected.has(a._id)} onChange={() => toggleSelect(a._id)} onClick={e => e.stopPropagation()} /></span>
                  <span className="hidden sm:block flex-1 font-bold text-sm2 text-white cursor-pointer" onClick={() => toggleExpand(a._id)}>
                    {a.title}
                  </span>
                  <span className="hidden sm:block w-[90px] text-3xs text-white/60">{a.author_username}</span>
                  <span className={`hidden sm:block w-[50px] text-3xs ${ageColor(a.created_at)}`} suppressHydrationWarning>{relativeTime(a.created_at)}</span>
                  <span className="hidden sm:flex w-[140px] gap-1">
                    <button aria-label="Approve" onClick={e => { e.stopPropagation(); singleAction(a._id, 'approve'); }} disabled={actionLoading} className={btnSmClass}><Icon name="Check" size={14} color="#2e7d32" /></button>
                    <button aria-label="Cancel article" onClick={e => { e.stopPropagation(); singleAction(a._id, 'cancel'); }} disabled={actionLoading} className={btnSmClass}><Icon name="Trash2" size={14} color="#c62828" /></button>
                    <button aria-label="Reject" onClick={e => { e.stopPropagation(); setShowRejectModal(true); setSelected(new Set([a._id])); }} disabled={actionLoading} className={btnSmClass}><Icon name="X" size={14} color="#c62828" /></button>
                  </span>
                </div>
                {expanded.has(a._id) && (
                  <div className="px-3 py-2.5 sm:pl-10 bg-white/5 border-b border-white/5 text-xs text-white/60">
                    <p className="mb-1">Category: <strong className="text-white">{a.category_name || a.category_slug}</strong></p>
                    {previewCache[a._id] ? <div>
                      <p className="mb-1"><strong className="text-white">Body:</strong> {previewCache[a._id].body.substring(0, 200)}{(previewCache[a._id].body?.length || 0) > 200 ? '...' : ''}</p>
                      {previewCache[a._id].sources.length > 0 && <p className="mb-1"><strong className="text-white">Sources:</strong> {previewCache[a._id].sources.length}</p>}
                      <div className="mt-2 flex gap-1.5 flex-wrap">
                        <button onClick={() => singleAction(a._id, 'approve')} disabled={actionLoading} className="text-xs px-3 py-1.5 cursor-pointer bg-white/5 border border-white/10 rounded-lg text-white min-h-11 sm:min-h-0"><Icon name="Check" size={14} color="#2e7d32" /> Approve</button>
                        <button onClick={() => { setSelected(new Set([a._id])); setShowRejectModal(true); }} disabled={actionLoading} className="text-xs px-3 py-1.5 cursor-pointer bg-white/5 border border-white/10 rounded-lg text-white min-h-11 sm:min-h-0"><Icon name="X" size={14} color="#c62828" /> Reject</button>
                      </div>
                    </div> : <p className="text-white/40">Loading preview...</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 items-center justify-center sm:justify-start">
        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className={`px-3 py-1.5 rounded-lg border border-white/10 text-white text-sm min-h-11 ${page <= 1 ? 'opacity-40 cursor-not-allowed bg-white/5' : 'cursor-pointer bg-white/5 hover:bg-white/10'}`}>Prev</button>
        <span className="text-white/60 text-sm2">Page {page} of {pagination.pages}</span>
        <button disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)} className={`px-3 py-1.5 rounded-lg border border-white/10 text-white text-sm min-h-11 ${page >= pagination.pages ? 'opacity-40 cursor-not-allowed bg-white/5' : 'cursor-pointer bg-white/5 hover:bg-white/10'}`}>Next</button>
      </div>

      <p className="text-3xs text-white/30 mt-3"><Icon name="Keyboard" size={12} /> Shortcuts: <strong className="text-white/50">A</strong>=Approve first · <strong className="text-white/50">R</strong>=Reject first</p>

      {/* Reject Modal — full-screen on mobile */}
      {showRejectModal && (
        <div className="fixed inset-0 z-[200] flex sm:items-center sm:justify-center bg-black/40 p-0 sm:p-4" onClick={() => setShowRejectModal(false)}>
          <div className="bg-zinc-900 border border-white/10 sm:rounded-2xl p-6 w-full sm:max-w-md shadow-xl h-full sm:h-auto flex flex-col" onClick={e => e.stopPropagation()}>
            <h3 className="text-white text-lg font-semibold mb-3">Reject {selected.size > 1 ? `${selected.size} articles` : 'Article'}</h3>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Rejection reason..." rows={3} className="w-full mb-3 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm2 resize-y outline-none placeholder:text-white/30 flex-1 sm:flex-none" />
            <div className="flex gap-2 justify-end mt-auto sm:mt-0">
              <button onClick={() => setShowRejectModal(false)} className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm2 cursor-pointer min-h-11">Cancel</button>
              <button onClick={() => selected.size > 1 ? bulkAction('reject') : singleAction(Array.from(selected)[0], 'reject')} disabled={!rejectReason.trim() || actionLoading} className={`px-5 py-2.5 text-white rounded-xl text-sm2 font-bold min-h-11 ${!rejectReason.trim() || actionLoading ? 'bg-white/10 cursor-not-allowed' : 'bg-red-700 cursor-pointer hover:bg-red-600'}`}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
