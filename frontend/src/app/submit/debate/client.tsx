'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/icons/Icon';
import { API } from '@/lib/api';
import CategoryPickerModal from '@/components/CategoryPickerModal';
import { getCategoryPath } from '@/lib/categories';

const DEBATE_DRAFT_KEY = 'yotop10_debate_draft';

export default function DebateClient() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [categorySlug, setCategorySlug] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [sideA, setSideA] = useState('');
  const [sideAJustification, setSideAJustification] = useState('');
  const [sideASource, setSideASource] = useState('');
  const [sideB, setSideB] = useState('');
  const [sideBJustification, setSideBJustification] = useState('');
  const [sideBSource, setSideBSource] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [categories, setCategories] = useState<Array<{ id: string; name: string; slug: string; icon?: string; post_count: number; children: Array<{ id: string; name: string; slug: string; icon?: string; post_count: number }> }>>([]);

  // Restore draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DEBATE_DRAFT_KEY);
      if (saved) {
        const d = JSON.parse(saved);
        if (Date.now() - d.savedAt < 3600000) {
          if (d.title) setTitle(d.title);
          if (d.categorySlug) setCategorySlug(d.categorySlug);
          if (d.sideA) setSideA(d.sideA);
          if (d.sideAJustification) setSideAJustification(d.sideAJustification);
          if (d.sideASource) setSideASource(d.sideASource);
          if (d.sideB) setSideB(d.sideB);
          if (d.sideBJustification) setSideBJustification(d.sideBJustification);
          if (d.sideBSource) setSideBSource(d.sideBSource);
        } else {
          localStorage.removeItem(DEBATE_DRAFT_KEY);
        }
      }
    } catch { /* ignore */ }
  }, []);

  // Save draft on change
  useEffect(() => {
    const timeout = setTimeout(() => {
      const data = { title, categorySlug, sideA, sideAJustification, sideASource, sideB, sideBJustification, sideBSource, savedAt: Date.now() };
      localStorage.setItem(DEBATE_DRAFT_KEY, JSON.stringify(data));
    }, 800);
    return () => clearTimeout(timeout);
  }, [title, categorySlug, sideA, sideAJustification, sideASource, sideB, sideBJustification, sideBSource]);

  useEffect(() => {
    API.getCategories()
      .then(data => {
        const cats = (data as { categories?: Array<{ id: string; name: string; slug: string; icon?: string; post_count: number; children?: Array<{ id: string; name: string; slug: string; icon?: string; post_count: number }> }> }).categories || [];
        setCategories(cats as never);
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categorySlug || !title || !sideA || !sideB) {
      setError('Title, category, and both sides are required.');
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const response = await API.addPost({
        title,
        post_type: 'this_vs_that',
        intro: `${sideA} vs ${sideB}`,
        category_slug: categorySlug,
        items: [
          { rank: 1, title: sideA, justification: sideAJustification, source_url: sideASource || undefined },
          { rank: 2, title: sideB, justification: sideBJustification, source_url: sideBSource || undefined },
        ],
      });
      const post = (response as { post?: { id?: string; title?: string } }).post;

      localStorage.removeItem(DEBATE_DRAFT_KEY);
      setSubmitting(false);

      const params = new URLSearchParams({ title: post?.title || title, type: 'this_vs_that' });
      if (post?.id) params.set('id', post.id);
      router.push(`/pending?${params.toString()}`);
    } catch (err) {
      setSubmitting(false);
      const msg = err instanceof Error ? err.message : '';
      try {
        // Try to extract backend error message from the API error string
        const body = JSON.parse(msg.slice(msg.lastIndexOf('{')));
        const errorText = body?.errors?.[0]?.msg || body?.error || body?.message || '';
        if (errorText) { setError(errorText); return; }
      } catch { /* not json */ }
      setError(msg || 'Failed to submit debate.');
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-3 py-6 sm:px-6 sm:py-10 min-h-[calc(100vh-56px)]">
      <header className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Icon name="Swords" size={20} className="text-purple-400" />
          <h1 className="text-xl font-bold text-white sm:text-2xl">Create a Debate</h1>
        </div>
        <p className="text-sm font-medium text-zinc-400 leading-relaxed">Set up two sides for the community to debate and vote on. Exactly two options — no more, no less.</p>
        <nav className="mt-3 flex items-center gap-3 text-xs">
          <Link href="/new" className="text-purple-400 hover:text-purple-300 transition">&larr; Change type</Link>
          <span className="text-zinc-700">|</span>
          <Link href="/" className="text-zinc-500 hover:text-purple-400 transition">Home</Link>
        </nav>
      </header>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* Title */}
        <div>
          <label htmlFor="debate-title" className="mb-1 block text-xs font-medium text-zinc-400">Debate Title <span className="text-purple-400">*</span></label>
          <input id="debate-title" type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Ronaldo vs Messi — Who Is The Better Footballer?"
            maxLength={300} className="w-full rounded-xl bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none border border-white/10 focus:border-purple-500/50"
          />
        </div>

        {/* Category */}
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-400">Category <span className="text-purple-400">*</span></label>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={pickerOpen}
            className="w-full rounded-xl bg-white/5 px-3 py-2.5 text-left text-sm flex items-center justify-between border border-white/10 hover:border-white/20 focus:outline-none transition"
          >
            <span className={`truncate ${categorySlug ? 'text-white' : 'text-zinc-600'}`}>
              {(() => {
                if (!categorySlug) return 'Select a category';
                const path = getCategoryPath(categorySlug, categories as never);
                return path ? path.join(' › ') : categorySlug;
              })()}
            </span>
            <Icon name="ChevronDown" size={14} className="shrink-0 text-zinc-600" />
          </button>
          <p className="mt-1 text-2xs text-zinc-600">Choose a subcategory — parents are for browsing</p>
        </div>
        <CategoryPickerModal
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          value={categorySlug || null}
          categories={categories as never}
          onSelect={(slug) => setCategorySlug(slug)}
        />

        {/* Side A */}
        <div className="rounded-xl border border-orange-500/20 bg-orange-500/[0.02] p-4">
          <h2 className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-3">Side A</h2>
          <div className="space-y-3">
            <input type="text" value={sideA} onChange={e => setSideA(e.target.value)}
              placeholder="Option name (e.g. Ronaldo)" maxLength={200}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/50"
            />
            <textarea value={sideAJustification} onChange={e => setSideAJustification(e.target.value)}
              placeholder="Why this side wins? (optional)" maxLength={2000} rows={2}
              className="w-full resize-y rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/50"
            />
            <input type="url" value={sideASource} onChange={e => setSideASource(e.target.value)}
              placeholder="Source URL (optional)" aria-label="Source URL for side A"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-zinc-400 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/50"
            />
          </div>
        </div>

        {/* VS divider */}
        <div className="flex items-center justify-center -my-1">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold text-xs shadow-lg">VS</span>
        </div>

        {/* Side B */}
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/[0.02] p-4">
          <h2 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-3">Side B</h2>
          <div className="space-y-3">
            <input type="text" value={sideB} onChange={e => setSideB(e.target.value)}
              placeholder="Option name (e.g. Messi)" maxLength={200}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50"
            />
            <textarea value={sideBJustification} onChange={e => setSideBJustification(e.target.value)}
              placeholder="Why this side wins? (optional)" maxLength={2000} rows={2}
              className="w-full resize-y rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50"
            />
            <input type="url" value={sideBSource} onChange={e => setSideBSource(e.target.value)}
              placeholder="Source URL (optional)" aria-label="Source URL for side B"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-zinc-400 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50"
            />
          </div>
        </div>

        {/* Error */}
        {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">{error}</div>}

        {/* Submit */}
        <button type="submit" disabled={submitting || !categorySlug || !title || !sideA || !sideB}
          className="w-full rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-500/25 transition hover:shadow-xl active:scale-[0.98] disabled:opacity-60"
        >
          {submitting ? 'Submitting...' : 'Submit Debate for Review'}
        </button>
      </form>
    </div>
  );
}
