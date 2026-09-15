'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { toast } from '@/lib/toast';
import { ImageUploader } from '@/components/ImageUploader';

interface EditArticle { _id: string; title: string; body: string; category_slug: string; status: string; cover_image?: string | null; sources: Array<{ url: string; title: string }> }

const EDIT_REASON_PRESETS = [
  'Fixed factual error',
  'Corrected title clarity',
  'Replaced broken or missing image',
  'Added missing sources',
  'Corrected ranking order',
  'Removed policy-violating content',
];
const CUSTOM_REASON = 'Custom reason…';

export default function EditArticleClient() {
  const router = useRouter(); const params = useParams()!; const articleId = params.id as string;
  const [article, setArticle] = useState<EditArticle | null>(null);
  const [title, setTitle] = useState(''); const [body, setBody] = useState('');
  const [categorySlug, setCategorySlug] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [sources, setSources] = useState<Array<{ url: string; title: string }>>([]);
  const [reasonPreset, setReasonPreset] = useState('');
  const [reasonCustom, setReasonCustom] = useState('');
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch<{ article: EditArticle }>(`/admin/articles/${articleId}`);
        const a = data.article; setArticle(a); setTitle(a.title); setBody(a.body || '');
        setCategorySlug(a.category_slug || ''); setCoverImage(a.cover_image || '');
        setSources((a.sources || []).map(s => ({ url: s.url, title: s.title || '' })));
      } catch { setError('Failed to load article.'); }
      finally { setLoading(false); }
    })();
  }, [articleId]);

  const addSource = () => setSources(prev => [...prev, { url: '', title: '' }]);
  const removeSource = (idx: number) => setSources(prev => prev.filter((_, i) => i !== idx));

  const editReason = reasonPreset === CUSTOM_REASON ? reasonCustom.trim() : reasonPreset;

  const handleSave = async () => {
    if (!title.trim()) { setError('Title is required.'); return; }
    if (!editReason) { setError('An edit reason is required — pick a preset or write a custom reason. The author will be notified with it.'); return; }
    setSaving(true); setError('');
    try {
      await apiFetch(`/admin/articles/${articleId}`, {
        method: 'PATCH',
        body: JSON.stringify({ title, body, category_slug: categorySlug, cover_image: coverImage || null, sources, edit_reason: editReason }),
      });
      toast.success('Article updated. Author notified.');
      router.push('/admin/articles');
    } catch {
      setError('Save failed.');
    } finally { setSaving(false); }
  };

  if (loading) return <div>Loading...</div>;
  if (!article) return <div>{error || 'Article not found'}</div>;

  return (<div style={{ maxWidth: '800px' }}>
    <h2>Edit Article</h2>
    {error && <div style={{ background: '#ffebee', padding: '8px', borderRadius: '4px', marginBottom: '12px', color: '#c62828' }}>{error}</div>}
    <div style={{ marginBottom: '12px' }}>
      <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Title</label>
      <input value={title} onChange={e => setTitle(e.target.value)} style={{ width: '100%', padding: '8px', fontSize: '14px' }} />
    </div>
    <div style={{ marginBottom: '12px' }}>
      <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Category Slug</label>
      <input value={categorySlug} onChange={e => setCategorySlug(e.target.value)} style={{ width: '100%', padding: '8px' }} />
    </div>
    <div style={{ marginBottom: '12px' }}>
      <ImageUploader currentUrl={coverImage || null} onUpload={(url) => setCoverImage(url)} label="Cover Image" />
    </div>
    <div style={{ marginBottom: '12px' }}>
      <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Body (markdown)</label>
      <textarea value={body} onChange={e => setBody(e.target.value)} rows={14} style={{ width: '100%', padding: '8px', fontFamily: 'monospace', fontSize: '13px' }} />
    </div>
    <div style={{ marginBottom: '12px' }}>
      <h4>Sources ({sources.length})</h4>
      {sources.map((s, idx) => (<div key={idx} style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '8px', marginBottom: '6px' }}>
        <input value={s.url} onChange={e => setSources(prev => prev.map((x, j) => j === idx ? { ...x, url: e.target.value } : x))} placeholder="Source URL (required)" style={{ width: '100%', padding: '6px', marginBottom: '4px' }} />
        <input value={s.title} onChange={e => setSources(prev => prev.map((x, j) => j === idx ? { ...x, title: e.target.value } : x))} placeholder="Source title (optional)" style={{ width: '100%', padding: '6px' }} />
        <button onClick={() => removeSource(idx)} style={{ fontSize: '11px', color: '#c62828', background: 'none', border: 'none', cursor: 'pointer', marginTop: '4px' }}>Remove</button>
      </div>))}
      <button onClick={addSource} style={{ padding: '6px 14px', cursor: 'pointer' }}>+ Add Source</button>
    </div>
    <div style={{ marginBottom: '12px', border: '1px solid #e0a800', borderRadius: '4px', padding: '10px', background: '#fffbe6' }}>
      <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Edit reason (required — sent to the author)</label>
      <select value={reasonPreset} onChange={e => setReasonPreset(e.target.value)} style={{ width: '100%', padding: '8px', marginBottom: reasonPreset === CUSTOM_REASON ? '8px' : '0' }}>
        <option value="">— Select a reason —</option>
        {EDIT_REASON_PRESETS.map(r => (<option key={r} value={r}>{r}</option>))}
        <option value={CUSTOM_REASON}>{CUSTOM_REASON}</option>
      </select>
      {reasonPreset === CUSTOM_REASON && (
        <textarea value={reasonCustom} onChange={e => setReasonCustom(e.target.value)} placeholder="Write the reason the author will see (max 500 chars)" rows={3} maxLength={500} style={{ width: '100%', padding: '8px' }} />
      )}
    </div>
    <div style={{ display: 'flex', gap: '10px' }}>
      <button onClick={handleSave} disabled={saving} style={{ padding: '10px 24px', fontSize: '14px', cursor: 'pointer' }}>{saving ? 'Saving...' : 'Save Changes'}</button>
      <button onClick={() => router.push('/admin/articles')} style={{ padding: '10px 24px', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
    </div>
  </div>);
}
