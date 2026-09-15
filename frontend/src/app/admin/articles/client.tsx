'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { Icon } from '@/components/icons/Icon';
import { toast } from '@/lib/toast';
import { formatDate } from '@/lib/dates';
import { CustomDropdown } from '@/components/CustomDropdown';

interface Article { _id: string; title: string; slug: string; author_username: string; status: string; category_slug: string; category_name?: string; view_count: number; comment_count: number; created_at: string }

export default function AdminArticlesClient() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 0 });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState(false);
  const [filters, setFilters] = useState({ status: '', search: '', sort: 'newest' });
  const [stats, setStats] = useState<Record<string, number>>({});

  const fetchArticles = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: '20', sort: filters.sort, stats: 'true' });
      if (filters.status) params.set('status', filters.status);
      if (filters.search) params.set('search', filters.search);
      const data = await apiFetch<{ articles: Article[]; pagination: { total: number; pages: number }; stats: Record<string, number> }>(`/admin/articles?${params}`);
      setArticles(data.articles); setPagination(data.pagination); setStats(data.stats || {});
    } catch {} finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchArticles(page); }, [page, fetchArticles]);

  const toggleSelect = (id: string) => setSelected(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const selectAll = () => selected.size === articles.length ? setSelected(new Set()) : setSelected(new Set(articles.map(a => a._id)));

  const bulkApprove = async () => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    setActionLoading(true);
    try {
      await apiFetch('/admin/articles/bulk/approve', { method: 'POST', body: JSON.stringify({ ids }) });
      toast.success('Approved.');
      setSelected(new Set()); fetchArticles(page);
    } catch {} finally { setActionLoading(false); }
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { pending_review: 'bg-orange-500/15 text-orange-400', approved: 'bg-green-500/15 text-green-400', rejected: 'bg-red-500/15 text-red-400' };
    const cls = map[s] || 'bg-white/10 text-white/60';
    return <span className={`${cls} rounded-full px-2.5 py-0.5 text-3xs font-semibold uppercase tracking-wider`}>{s}</span>;
  };

  const statCards = ['total', 'pending', 'approved', 'rejected'];
  const filterSelectClass = 'bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-white text-xs outline-none min-h-11 w-full sm:w-auto';
  const btnSmClass = 'text-3xs cursor-pointer px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-white';

  return (
    <div className="space-y-3 sm:space-y-4 px-3 sm:px-6">
      <h2 className="text-white text-lg font-bold">All Articles ({pagination.total})</h2>

      <div className="flex gap-2 flex-wrap">
        {statCards.map(k => (
          <div key={k} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white/60 min-h-9 flex items-center">
            <strong className="text-white mr-1">{k}</strong>: {stats[k] ?? 0}
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
        <CustomDropdown
          value={filters.status}
          onChange={v => { setFilters(f => ({ ...f, status: v })); setPage(1); }}
          options={[{ value: '', label: 'All Status' }, { value: 'pending_review', label: 'Pending' }, { value: 'approved', label: 'Approved' }, { value: 'rejected', label: 'Rejected' }]}
          placeholder="All Status"
          className={filterSelectClass}
        />
        <CustomDropdown
          value={filters.sort}
          onChange={v => { setFilters(f => ({ ...f, sort: v })); setPage(1); }}
          options={[{ value: 'newest', label: 'Newest' }, { value: 'oldest', label: 'Oldest' }]}
          placeholder="Sort"
          className={filterSelectClass}
        />
        <input placeholder="Search title/body" value={filters.search} onChange={e => { setFilters(f => ({ ...f, search: e.target.value })); setPage(1); }} className={`${filterSelectClass} sm:w-[180px]`} />
      </div>

      {selected.size > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 flex flex-col sm:flex-row gap-2 items-start sm:items-center text-sm2">
          <strong className="text-white">{selected.size} selected</strong>
          <div className="flex gap-2 flex-wrap">
            <button onClick={bulkApprove} disabled={actionLoading} className={`${btnSmClass} min-h-11 sm:min-h-7`}>Approve</button>
          </div>
        </div>
      )}

      {loading ? <p className="text-white/40">Loading...</p> : (
        <>
          <div className="sm:hidden flex flex-col gap-2">
            {articles.map(a => (
              <div key={a._id} className="bg-white/5 border border-white/5 rounded-2xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <input type="checkbox" checked={selected.has(a._id)} onChange={() => toggleSelect(a._id)} className="min-h-11 min-w-11" />
                  <a href="#" onClick={e => { e.preventDefault(); window.open(`/articles/${a.slug}`, '_blank'); }} className="text-white text-sm font-semibold no-underline truncate flex-1 min-h-11 flex items-center">
                    {a.title?.substring(0, 50)}{(a.title?.length || 0) > 50 ? '...' : ''}
                  </a>
                  <button onClick={() => router.push(`/admin/articles/${a._id}/edit`)} aria-label="Edit article" className="min-h-11 min-w-11 flex items-center justify-center bg-white/5 border border-white/10 rounded-lg">
                    <Icon name="Pencil" size={18} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-3xs text-white/50">
                  <span>{a.author_username}</span>
                  <span>{a.category_slug}</span>
                  <span>{statusBadge(a.status)}</span>
                  <span><Icon name="MessageCircle" size={12} /> {a.comment_count}</span>
                  <span><Icon name="Eye" size={14} /> {a.view_count}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead><tr className="border-b-2 border-white/10 text-left text-white/40">
                <th className="p-1.5 w-[30px]"><input type="checkbox" checked={selected.size === articles.length && articles.length > 0} onChange={selectAll} /></th>
                <th className="p-1.5">Title</th><th className="p-1.5">Author</th><th className="p-1.5">Category</th><th className="p-1.5">Status</th><th className="p-1.5"><Icon name="MessageCircle" size={12} /></th><th className="p-1.5"><Icon name="Eye" size={14} /></th><th className="p-1.5">Created</th><th className="p-1.5">Actions</th>
              </tr></thead>
              <tbody>
                {articles.map(a => (<tr key={a._id} className="border-b border-white/5">
                  <td className="p-1"><input type="checkbox" checked={selected.has(a._id)} onChange={() => toggleSelect(a._id)} /></td>
                  <td className="p-1">
                    <a href="#" onClick={e => { e.preventDefault(); window.open(`/articles/${a.slug}`, '_blank'); }} className="text-white no-underline hover:text-orange-400">{a.title?.substring(0, 50)}{(a.title?.length || 0) > 50 ? '...' : ''}</a>
                  </td>
                  <td className="p-1 text-white/60">{a.author_username}</td>
                  <td className="p-1 text-3xs text-white/40">{a.category_slug}</td>
                  <td className="p-1">{statusBadge(a.status)}</td>
                  <td className="p-1 text-white/60">{a.comment_count}</td>
                  <td className="p-1 text-white/60">{a.view_count}</td>
                  <td className="p-1 text-3xs text-white/40" suppressHydrationWarning>{formatDate(a.created_at)}</td>
                  <td className="p-1">
                    <button onClick={() => router.push(`/admin/articles/${a._id}/edit`)} className={btnSmClass}>Edit</button>
                  </td>
                </tr>))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="flex gap-2 items-center justify-center sm:justify-start">
        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className={`px-3 py-1.5 rounded-lg border border-white/10 text-white text-sm min-h-11 ${page <= 1 ? 'opacity-40 cursor-not-allowed bg-white/5' : 'cursor-pointer bg-white/5 hover:bg-white/10'}`}>Prev</button>
        <span className="text-white/60 text-sm2">Page {page} of {pagination.pages}</span>
        <button disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)} className={`px-3 py-1.5 rounded-lg border border-white/10 text-white text-sm min-h-11 ${page >= pagination.pages ? 'opacity-40 cursor-not-allowed bg-white/5' : 'cursor-pointer bg-white/5 hover:bg-white/10'}`}>Next</button>
      </div>
    </div>
  );
}
