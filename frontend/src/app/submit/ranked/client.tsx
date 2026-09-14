'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { API, PostSubmission, TitleCheckResponse } from '@/lib/api';
import { Icon } from '@/components/icons/Icon';
import { ImageUploader } from '@/components/ImageUploader';
import CategoryPickerModal from '@/components/CategoryPickerModal';
import { getCategoryPath } from '@/lib/categories';

const DRAFT_KEY = 'yotop10_submit_draft';
const DEBOUNCE_MS = 500;
const DRAFT_EXPIRY_MS = 3600000;
const MIN_ITEMS = 3;
const MAX_ITEMS = 100;

const RANKING_KEYWORDS = /\b(top|best|worst|greatest|most|least|finest|favorite|iconic|legendary|essential|influential|underrated|overrated|controversial|important|hidden|all.time|must.know|must.see|must.read|must.watch)\b/i;

function validateListTitle(title: string): { valid: boolean; code?: string; error?: string; number?: number } {
  if (!title) return { valid: false, code: 'NO_NUMBER', error: 'Title must specify a list size like "Top 10" or "Best 5"' };
  const numberMatch = title.match(/\b(\d{1,3})\b/);
  if (!numberMatch) return { valid: false, code: 'NO_NUMBER', error: 'Title must specify a list size like "Top 10" or "Best 5"' };
  const listNumber = parseInt(numberMatch[1], 10);
  if (listNumber < 3) return { valid: false, code: 'NUMBER_TOO_SMALL', error: 'Minimum list size is 3. Use 3-100.', number: listNumber };
  if (listNumber > 100) return { valid: false, code: 'NUMBER_TOO_LARGE', error: 'Maximum list size is 100. Use 3-100.', number: listNumber };
  const numberIndex = title.search(/\b\d{1,3}\b/);
  const searchStart = Math.max(0, numberIndex - 20);
  const searchEnd = Math.min(title.length, numberIndex + 20);
  const contextWindow = title.substring(searchStart, searchEnd);
  if (!RANKING_KEYWORDS.test(contextWindow)) return { valid: false, code: 'NO_RANKING_KEYWORD', error: 'Title must indicate a ranked list (e.g., Top 10, Best 5, 10 Greatest)', number: listNumber };
  return { valid: true, number: listNumber };
}

interface ListItem {
  id: string;
  rank: number;
  title: string;
  justification: string;
  source_url: string;
  image_url: string;
}

interface FormErrors {
  category?: string;
  title?: string;
  intro?: string;
  items?: string;
  titleSimilarity?: string;
}

interface DraftData {
  post_type?: string;
  category_slug?: string;
  title?: string;
  intro?: string;
  items?: Array<{ title: string; justification: string; source_url: string; image_url: string }>;
  savedAt: number;
}

const debounce = <T extends unknown[]>(fn: (...args: T) => void, ms: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: T) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  };
};

export default function RankedSubmitClient({ initialType, parentSlug }: { initialType?: 'top_list' | 'best_of' | 'worst_of' | 'counter_list'; parentSlug?: string }) {
  const router = useRouter();
  const idCounter = useRef(0);
  const generateId = () => `item-${++idCounter.current}`;

  const getDefaultTitle = (t: string) => {
    if (t === 'best_of') return 'Best of ';
    if (t === 'worst_of') return 'Worst of ';
    if (t === 'top_list') return 'Top 10 ';
    return '';
  };
  const [postType] = useState<'top_list' | 'best_of' | 'worst_of' | 'counter_list'>(initialType || 'top_list');
  const [categorySlug, setCategorySlug] = useState('');
  const [title, setTitle] = useState(getDefaultTitle(initialType || 'top_list'));
  const [intro, setIntro] = useState('');
  const [items, setItems] = useState<ListItem[]>([
    { id: generateId(), rank: 1, title: '', justification: '', source_url: '', image_url: '' },
    { id: generateId(), rank: 2, title: '', justification: '', source_url: '', image_url: '' },
    { id: generateId(), rank: 3, title: '', justification: '', source_url: '', image_url: '' },
  ]);
  const formDataRef = useRef({ postType, categorySlug, title, intro, items });
  formDataRef.current = { postType, categorySlug, title, intro, items };

  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const [categories, setCategories] = useState<Array<{ id: string; name: string; slug: string; icon?: string; post_count: number; children: Array<{ id: string; name: string; slug: string; icon?: string; post_count: number }> }>>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [titleCheck, setTitleCheck] = useState<{
    checking: boolean;
    allowed: boolean;
    blocked: boolean;
    warning: boolean;
    matches: Array<{ title: string; slug: string }>;
    pendingConflicts: Array<{ title: string; submitted_at: string }>;
    suggestion?: string;
  } | null>(null);

  const [heroImageUrl, setHeroImageUrl] = useState('');

  useEffect(() => {
    API.getCategories()
      .then(data => {
        const cats = (data as { categories?: Array<{ id: string; name: string; slug: string; icon?: string; post_count: number; children?: Array<{ id: string; name: string; slug: string; icon?: string; post_count: number }> }> }).categories || [];
        setCategories(cats as never);
      })
      .catch(err => console.error('Failed to load categories:', err));
  }, []);

  useEffect(() => {
    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        const data: DraftData = JSON.parse(draft);
          if (Date.now() - data.savedAt < DRAFT_EXPIRY_MS) {
          if (data.category_slug) { setCategorySlug(data.category_slug); }
          if (data.title) setTitle(data.title);
          if (data.intro) setIntro(data.intro);
          if (data.items && data.items.length > 0) {
            const restored = data.items.map((item, idx) => ({
              id: generateId(), rank: idx + 1, title: item.title || '', justification: item.justification || '',
              source_url: item.source_url || '', image_url: item.image_url || '',
            }));
            while (restored.length < MIN_ITEMS) restored.push({ id: generateId(), rank: restored.length + 1, title: '', justification: '', source_url: '', image_url: '' });
            setItems(restored);
          }
        } else {
          localStorage.removeItem(DRAFT_KEY);
        }
      }
    } catch (e) {
      console.error('Failed to restore draft:', e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveDraft = useCallback(() => {
    clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      const { categorySlug: cat, title: t, intro: i, items: it } = formDataRef.current;
      if (!t && !i && !it.some(item => item.title || item.justification)) return;
      const draft: DraftData = {
        category_slug: cat || undefined, title: t || undefined, intro: i || undefined,
        items: it.map(({ title, justification, source_url, image_url }) => ({ title, justification, source_url, image_url })),
        savedAt: Date.now(),
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    }, 1000);
  }, []);

  useEffect(() => { saveDraft(); }, [categorySlug, title, intro, items, saveDraft]);

  useEffect(() => {
    const flush = () => {
      const { categorySlug: cat, title: t, intro: i, items: it } = formDataRef.current;
      if (!t && !i && !it.some(item => item.title || item.justification)) return;
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        category_slug: cat || undefined, title: t || undefined, intro: i || undefined,
        items: it.map(({ title, justification, source_url, image_url }) => ({ title, justification, source_url, image_url })),
        savedAt: Date.now(),
      }));
    };
    window.addEventListener('beforeunload', flush);
    return () => window.removeEventListener('beforeunload', flush);
  }, []);

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      const first = document.querySelector('[aria-invalid="true"]') as HTMLElement;
      if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [errors]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const checkTitleSimilarity = useCallback(
    debounce(async (titleValue: string, catId: string) => {
      if (titleValue.length < 8 || !catId) { setTitleCheck(null); return; }
      setTitleCheck(prev => prev ? { ...prev, checking: true } : { checking: true, allowed: true, blocked: false, warning: false, matches: [], pendingConflicts: [] });
      try {
        const response = await API.checkTitle(titleValue, catId) as TitleCheckResponse;
        setTitleCheck({ checking: false, allowed: response.allowed, blocked: response.blocked, warning: response.warning, matches: response.matches || [], pendingConflicts: response.pending_conflicts || [], suggestion: response.suggestion });
      } catch { setTitleCheck(null); }
    }, DEBOUNCE_MS), []
  );

  const validateField = (field: string, value: string): string | undefined => {
    switch (field) {
      case 'category': return postType === 'counter_list' ? undefined : (!value ? 'Please select a category' : undefined);
      case 'title':
        if (!value) return 'Title is required';
        if (value.length < 4) return 'Title must be at least 4 characters';
        if (value.length > 300) return 'Title must be less than 300 characters';
        if (postType === 'top_list' || postType === 'counter_list') { const f = validateListTitle(value); if (!f.valid) return f.error; }
        return undefined;
      case 'intro': return postType === 'counter_list' ? undefined : (!value ? 'Introduction is required' : value.length > 2000 ? 'Introduction must be less than 2000 characters' : undefined);
      default: return undefined;
    }
  };

  const validateItems = (): string | undefined => {
    if (items.length < MIN_ITEMS) return `At least ${MIN_ITEMS} items are required`;
    for (let i = 0; i < items.length; i++) {
      if (!items[i].title.trim()) return `Item #${i + 1}: Title is required`;
      if (items[i].title.length > 200) return `Item #${i + 1}: Title must be less than 200 characters`;
      if (!items[i].justification.trim()) return `Item #${i + 1}: Justification is required`;
      if (items[i].justification.length > 2000) return `Item #${i + 1}: Justification must be less than 2000 characters`;
      if (items[i].source_url) { try { new URL(items[i].source_url); } catch { return `Item #${i + 1}: Please enter a valid URL`; } }
    }
    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    const ce = validateField('category', categorySlug); if (ce) newErrors.category = ce;
    const te = validateField('title', title); if (te) newErrors.title = te;
    const ie = validateField('intro', intro); if (ie) newErrors.intro = ie;
    const ve = validateItems(); if (ve) newErrors.items = ve;
    if (titleCheck?.blocked) newErrors.titleSimilarity = 'This list already exists. Please choose a different title.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const clearError = (key: keyof FormErrors) => setErrors(prev => {
    const next = { ...prev };
    delete next[key];
    return next;
  });
  const clearErrors = (...keys: (keyof FormErrors)[]) => setErrors(prev => {
    const next = { ...prev };
    keys.forEach(k => delete next[k]);
    return next;
  });

  const handleCategoryChange = (slug: string, _name: string) => {
    setCategorySlug(slug);
    clearError('category');
    if (title.length >= 8 && slug) checkTitleSimilarity(title, slug);
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    clearErrors('title', 'titleSimilarity');
    if (value.length >= 8 && categorySlug) checkTitleSimilarity(value, categorySlug);
    else setTitleCheck(null);
  };

  const addItem = () => {
    if (items.length >= MAX_ITEMS) return;
    setItems(prev => [...prev, { id: generateId(), rank: prev.length + 1, title: '', justification: '', source_url: '', image_url: '' }]);
  };

  const removeItem = (id: string) => {
    if (items.length <= MIN_ITEMS) return;
    if (!confirm('Remove this item?')) return;
    setItems(prev => prev.filter(item => item.id !== id).map((item, idx) => ({ ...item, rank: idx + 1 })));
  };

  const updateItem = (id: string, field: string, value: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    if (field === 'title' || field === 'justification') clearError('items');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    setErrors({});

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let response: any;

      if (postType === 'counter_list' && parentSlug) {
        const { apiFetch } = await import('@/lib/api/client');
        response = await apiFetch(`/posts/${parentSlug}/counter`, {
          method: 'POST',
          body: JSON.stringify({ title, intro, items: items.map((item, idx) => ({ rank: idx + 1, title: item.title, justification: item.justification })) }),
        });
      } else {
        const submission: PostSubmission = {
          title, post_type: postType, intro, category_slug: categorySlug, hero_image_url: heroImageUrl || undefined, format: heroImageUrl ? 'hero_list' as const : undefined,
          items: items.map((item, idx) => ({ rank: idx + 1, title: item.title, justification: item.justification, image_url: item.image_url || undefined, source_url: item.source_url || undefined })),
        };
        response = await API.addPost(submission);
      }

      localStorage.removeItem(DRAFT_KEY);
      const p = response.post as Record<string, string> | undefined;
      const pendingId = p?.id || '';
      const params = new URLSearchParams({ title: p?.title || title, type: postType });
      if (pendingId) params.set('id', pendingId);
      router.push(`/pending?${params.toString()}`);
    } catch (err: unknown) {
      console.error('Submit failed:', err);
      const msg = err instanceof Error ? err.message : '';
      const s = parseInt(msg.match(/API Error: (\d+)/)?.[1] || '0', 10);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let body: any = null;
      try { const j = msg.lastIndexOf('{'); if (j !== -1) body = JSON.parse(msg.slice(j)); } catch { /* not json */ }
      if (body?.errors?.[0]?.msg) setErrors({ title: body.errors[0].msg });
      else if (s === 400 && body?.format_code) setErrors({ title: (body.error as string) || 'Invalid title format.' });
      else if (s === 400 && body?.error) setErrors({ title: body.error as string });
      else if (s === 409) setErrors({ title: (body?.error as string) || 'This list already exists. Choose a different title.' });
      else if (s === 429) setErrors({ title: (body?.error as string) || 'Rate limit exceeded.' });
      else if (body?.error) setErrors({ title: body.error as string });
      else setErrors({ title: msg || 'Failed to submit post.' });
    } finally { setSubmitting(false); }
  };

  const typeHelp: Record<string, { title: string; tip: string; color: string }> = {
    top_list: { title: 'Submit a Ranked List', tip: 'Rank items from best to worst. Title must contain a number and ranking keyword (e.g. "Top 10", "Best 5").', color: 'border-orange-500/20 bg-orange-500/5 text-orange-400' },
    best_of: { title: 'Submit a Best Of', tip: 'Curate the best picks. Title must start with "Best" and contain "of" (e.g. "Best of 90s Hip Hop").', color: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400' },
    worst_of: { title: 'Submit a Worst Of', tip: 'Call out the worst offenders. Title must start with "Worst" and contain "of" (e.g. "Worst of Fast Food").', color: 'border-red-500/20 bg-red-500/5 text-red-400' },
    counter_list: { title: 'Submit a Counter List', tip: `Challenge an existing list with your own ranking.${parentSlug ? ` Rebutting: ${parentSlug}.` : ''}`, color: 'border-purple-500/20 bg-purple-500/5 text-purple-400' },
  };
  const help = typeHelp[postType] || typeHelp.top_list;

  const titleBorder = (() => {
    if (errors.title || errors.titleSimilarity) return 'border-red-400 border-2';
    if (titleCheck?.blocked) return 'border-red-400 border-2';
    if (titleCheck?.warning) return 'border-orange-400 border-2';
    if (titleCheck?.allowed) return 'border-green-400 border-2';
    return 'border-white/10 focus:border-orange-500/50';
  })();

  return (
    <div className="mx-auto max-w-3xl px-3 py-6 sm:px-6 sm:py-10 min-h-[calc(100vh-56px)]">
      <header className="mb-6">
        <h1 className="text-xl font-bold text-white sm:text-2xl">{help.title}</h1>
        <div className={`mt-2 rounded-xl border ${help.color} px-3 py-3 text-sm font-medium leading-relaxed`}>{help.tip}</div>
        <nav className="mt-3 flex items-center gap-3 text-xs">
          <Link href="/new" className="text-orange-400 hover:text-orange-300 transition">&larr; Change type</Link>
          <span className="text-zinc-700">|</span>
          <Link href="/" className="text-zinc-500 hover:text-orange-400 transition">Home</Link>
        </nav>
      </header>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-400">Category <span className="text-orange-400">*</span></label>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={pickerOpen}
            aria-describedby={errors.category ? 'category-error' : undefined}
            className={`w-full rounded-xl bg-white/5 px-3 py-2.5 text-left text-sm flex items-center justify-between transition focus:outline-none ${
              errors.category ? 'border-2 border-red-400' : 'border border-white/10 hover:border-white/20'
            }`}
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
          {errors.category && <div id="category-error" className="mt-1 text-xs text-red-400">{errors.category}</div>}
          <p className="mt-1 text-2xs text-zinc-600">Choose a subcategory — parents are for browsing, leaves are selectable</p>
        </div>
        <CategoryPickerModal
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          value={categorySlug || null}
          categories={categories as never}
          onSelect={(slug) => handleCategoryChange(slug, slug)}
        />

        <div>
          <label htmlFor="title" className="mb-1 block text-xs font-medium text-zinc-400">Title <span className="text-orange-400">*</span></label>
          <input id="title" type="text" value={title} onChange={e => handleTitleChange(e.target.value)}
            maxLength={300} aria-required="true" aria-invalid={!!errors.title || !!errors.titleSimilarity}
            className={`w-full rounded-xl bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none ${titleBorder}`}
          />
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-3xs text-zinc-600">
            <span>{titleCheck?.checking ? <>Checking...</> : title.length < 8 ? 'Type at least 8 chars' : titleCheck?.allowed ? <span className="text-green-400">Title available</span> : titleCheck?.warning ? <span className="text-orange-400">Similar titles exist</span> : titleCheck?.blocked ? <span className="text-red-400">Blocked</span> : ''}</span>
            <span className="ml-auto">{title.length}/300</span>
          </div>
          {(errors.title || errors.titleSimilarity) && (
            <div className="mt-1 text-xs text-red-400">
              {errors.title || errors.titleSimilarity}
              {titleCheck?.suggestion && <p className="mt-0.5 text-zinc-400">Try: <strong className="text-white">{titleCheck.suggestion}</strong></p>}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="intro" className="mb-1 block text-xs font-medium text-zinc-400">Intro <span className="text-orange-400">*</span></label>
          <textarea id="intro" value={intro} onChange={e => { setIntro(e.target.value); clearError('intro'); }}
            maxLength={2000} rows={3} placeholder="Briefly explain what this list is about"
            aria-required="true" aria-invalid={!!errors.intro}
            className={`w-full resize-y rounded-xl bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none ${errors.intro ? 'border-2 border-red-400' : 'border border-white/10 focus:border-orange-500/50'}`}
          />
          <div className="mt-0.5 text-right text-3xs text-zinc-600">{intro.length}/2000</div>
          {errors.intro && <div className="mt-1 text-xs text-red-400">{errors.intro}</div>}
        </div>

        <div>
          <h2 className="mb-3 text-xs font-bold text-white uppercase tracking-wider">Items ({items.length}/{MAX_ITEMS})</h2>
          <div className="space-y-2">
            {items.map(item => (
              <div key={item.id} className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
                <div className="flex items-start gap-2">
                  <span className={`mt-1.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-2xs font-bold font-mono ${
                    postType === 'best_of' ? 'bg-emerald-500/20 text-emerald-400' :
                    postType === 'worst_of' ? 'bg-red-500/20 text-red-400' :
                    'bg-orange-500/15 text-orange-400'
                  }`}>
                    {postType === 'best_of' ? `B${item.rank}` : postType === 'worst_of' ? `W${item.rank}` : item.rank}
                  </span>
                  <div className="flex-1 min-w-0">
                    <input type="text" value={item.title} onChange={e => updateItem(item.id, 'title', e.target.value)}
                      placeholder="Item title" maxLength={200} aria-label={`Item ${item.rank} title`}
                      className="mb-1.5 w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-sm text-white placeholder:text-zinc-600 focus:border-orange-500/50 focus:outline-none"
                    />
                    <textarea value={item.justification} onChange={e => updateItem(item.id, 'justification', e.target.value)}
                      placeholder="Why this rank?" maxLength={2000} rows={2} aria-label={`Item ${item.rank} justification`}
                      className="w-full resize-y rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-zinc-300 placeholder:text-zinc-600 focus:border-orange-500/50 focus:outline-none"
                    />
                    {(item.source_url) ? (
                      <div className="mt-1.5 flex items-center gap-2">
                        <input type="url" value={item.source_url} onChange={e => updateItem(item.id, 'source_url', e.target.value)}
                          placeholder="Source URL" aria-label="Source URL"
                          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white placeholder:text-zinc-600 focus:border-orange-500/50 focus:outline-none"
                        />
                      </div>
                    ) : (
                      <button type="button" onClick={() => updateItem(item.id, 'source_url', ' ')}
                        className="mt-1 text-2xs text-zinc-600 hover:text-orange-400 transition"
                      >+ Add source link</button>
                    )}
                  </div>
                  {items.length > MIN_ITEMS && (
                    <button type="button" onClick={() => removeItem(item.id)} aria-label="Remove item"
                      className="mt-1 shrink-0 rounded-lg p-1 text-zinc-600 hover:text-red-400 transition"
                    ><Icon name="X" size={14} /></button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {errors.items && <div className="mt-2 text-xs text-red-400">{errors.items}</div>}
          <button type="button" onClick={addItem} disabled={items.length >= MAX_ITEMS}
            className="mt-3 inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-zinc-400 transition hover:border-white/20 hover:text-zinc-200 disabled:opacity-40"
          ><Icon name="Plus" size={12} /> Add item</button>
        </div>

        <ImageUploader currentUrl={heroImageUrl} onUpload={setHeroImageUrl} label="Cover Image (optional)" />

        {(() => {
          const entries = Object.entries(errors).filter(([, v]) => Boolean(v) && String(v).trim().length > 0) as Array<[string, string]>;
          if (entries.length === 0) return null;
          return (
            <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-3">
              <strong className="text-xs text-red-400">Please fix:</strong>
              <ul className="ml-4 mt-1 list-disc text-xs text-white space-y-0.5">
                {entries.map(([k, v]) => (
                  <li key={k}>
                    <span className="font-medium text-red-300">{k}:</span> {String(v).trim()}
                  </li>
                ))}
              </ul>
            </div>
          );
        })()}

        <button type="submit" disabled={submitting || !categorySlug || !title || !intro || items.some(i => !i.title || !i.justification)}
          className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition hover:shadow-xl active:scale-[0.98] disabled:opacity-60"
        >
          {submitting ? 'Submitting...' : 'Submit for Review'}
        </button>
      </form>
    </div>
  );
}
