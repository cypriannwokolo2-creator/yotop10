'use client';

import { useState, useEffect, useCallback } from 'react';
import { Icon } from '@/components/icons/Icon';
import { apiFetch } from '@/lib/api';

interface Query {
  _id: string;
  user_id: string;
  username: string;
  type: 'feature' | 'bug';
  message: string;
  status: 'new' | 'read' | 'archived';
  created_at: string;
}

const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  feature: { label: 'FEATURE', cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  bug: { label: 'BUG', cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
};

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  new: { label: 'New', cls: 'bg-orange-500/10 text-orange-400' },
  read: { label: 'Read', cls: 'bg-white/5 text-zinc-500' },
  archived: { label: 'Archived', cls: 'bg-white/5 text-zinc-600' },
};

function formatDate(ts: string) {
  return new Date(ts).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

export default function AdminQueriesClient() {
  const [queries, setQueries] = useState<Query[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selected, setSelected] = useState<Query | null>(null);

  const fetchQueries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter) params.set('status', statusFilter);
      if (typeFilter) params.set('type', typeFilter);
      const data = await apiFetch<{ queries: Query[]; pagination: { totalPages: number } }>(`/admin/queries?${params}`);
      setQueries(data.queries || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch { /* ignore */ }
    setLoading(false);
  }, [page, statusFilter, typeFilter]);

  useEffect(() => { fetchQueries(); }, [fetchQueries]);

  const handleArchive = async (id: string) => {
    try {
      await apiFetch(`/admin/queries/${id}/archive`, { method: 'PATCH' });
      setQueries((prev) => prev.map((q) => q._id === id ? { ...q, status: 'archived' } : q));
      if (selected?._id === id) setSelected((prev) => prev ? { ...prev, status: 'archived' } : null);
    } catch { /* ignore */ }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/admin/queries/${id}`, { method: 'DELETE' });
      setQueries((prev) => prev.filter((q) => q._id !== id));
      if (selected?._id === id) setSelected(null);
    } catch { /* ignore */ }
  };

  const handleSelect = async (q: Query) => {
    setSelected(q);
    if (q.status === 'new') {
      try {
        await apiFetch(`/admin/queries/${q._id}`, { method: 'GET' });
        setQueries((prev) => prev.map((x) => x._id === q._id ? { ...x, status: 'read' } : x));
        setSelected((prev) => prev ? { ...prev, status: 'read' } : null);
      } catch { /* ignore */ }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Icon name="MessageSquareWarning" size={20} className="text-orange-400" />
          User Queries
        </h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {['', 'new', 'read', 'archived'].map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              statusFilter === s ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30' : 'bg-white/5 text-zinc-500 border border-transparent hover:text-zinc-300'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
        <span className="w-px h-5 bg-white/10 mx-1" />
        {['', 'feature', 'bug'].map((t) => (
          <button
            key={t}
            onClick={() => { setTypeFilter(t); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              typeFilter === t ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30' : 'bg-white/5 text-zinc-500 border border-transparent hover:text-zinc-300'
            }`}
          >
            {t || 'All Types'}
          </button>
        ))}
      </div>

      <div className="flex gap-6">
        {/* List */}
        <div className="flex-1 space-y-2">
          {loading ? (
            <div className="flex justify-center py-12">
              <Icon name="Loader" size={20} className="animate-spin text-zinc-600" />
            </div>
          ) : queries.length === 0 ? (
            <div className="text-center py-12 text-zinc-600 text-sm">No queries found.</div>
          ) : (
            queries.map((q) => {
              const tb = TYPE_BADGE[q.type] || TYPE_BADGE.feature;
              const sb = STATUS_BADGE[q.status] || STATUS_BADGE.new;
              return (
                <div
                  key={q._id}
                  onClick={() => handleSelect(q)}
                  className={`p-4 rounded-xl border cursor-pointer transition ${
                    selected?._id === q._id
                      ? 'border-orange-500/30 bg-orange-500/5'
                      : 'border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]'
                  } ${q.status === 'new' ? 'border-l-2 border-l-orange-500' : ''}`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${tb.cls}`}>{tb.label}</span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${sb.cls}`}>{sb.label}</span>
                    <span className="text-[10px] text-zinc-600 ml-auto font-mono" suppressHydrationWarning>{formatDate(q.created_at)}</span>
                  </div>
                  <p className="text-sm text-white line-clamp-2">{q.message}</p>
                  <p className="text-[10px] text-zinc-600 mt-1">@{q.username}</p>
                </div>
              );
            })
          )}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg text-xs bg-white/5 text-zinc-400 hover:text-white disabled:opacity-30">Prev</button>
              <span className="px-3 py-1.5 text-xs text-zinc-500 font-mono">{page}/{totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-lg text-xs bg-white/5 text-zinc-400 hover:text-white disabled:opacity-30">Next</button>
            </div>
          )}
        </div>

        {/* Detail */}
        {selected && (
          <div className="w-80 shrink-0 hidden lg:block">
            <div className="sticky top-6 rounded-xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">Detail</span>
                <button onClick={() => setSelected(null)} className="text-zinc-600 hover:text-white">
                  <Icon name="X" size={16} />
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${TYPE_BADGE[selected.type]?.cls}`}>
                    {TYPE_BADGE[selected.type]?.label}
                  </span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${STATUS_BADGE[selected.status]?.cls}`}>
                    {STATUS_BADGE[selected.status]?.label}
                  </span>
                </div>
                <p className="text-sm text-white whitespace-pre-wrap">{selected.message}</p>
                <div className="text-[11px] text-zinc-600 space-y-1">
                  <p>From: @{selected.username}</p>
                  <p suppressHydrationWarning>{formatDate(selected.created_at)}</p>
                </div>
              </div>

              <div className="flex gap-2">
                {selected.status !== 'archived' && (
                  <button onClick={() => handleArchive(selected._id)}
                    className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-400 hover:text-white hover:bg-white/10 transition">
                    Archive
                  </button>
                )}
                <button onClick={() => handleDelete(selected._id)}
                  className="flex-1 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400 hover:bg-red-500/15 transition">
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
