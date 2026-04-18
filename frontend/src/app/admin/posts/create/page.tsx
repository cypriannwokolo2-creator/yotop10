'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API, Category, Post } from '@/lib/api';
import { Save, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminCreatePostPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [title, setTitle] = useState('');
  const [intro, setIntro] = useState('');
  const [postType, setPostType] = useState('top_list');
  const [categoryId, setCategoryId] = useState('');
  const [authorName, setAuthorName] = useState('Admin');
  
  // Minimal requirement: At least 1 item
  const [items, setItems] = useState([{ rank: 1, title: '', justification: '' }]);
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    API.getCategories().then((data) => {
      setCategories(data.categories || []);
      if (data.categories?.length > 0) {
        setCategoryId(data.categories[0].id);
      }
    });
  }, []);

  const handleAddItem = () => {
    setItems([...items, { rank: items.length + 1, title: '', justification: '' }]);
  };

  const handleUpdateItem = (index: number, field: string, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const payload = {
        title,
        post_type: postType,
        intro,
        category_id: categoryId,
        author_display_name: authorName,
        device_fingerprint: 'admin_override_fp', // dummy fallback
        items,
      };

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || data.errors?.[0]?.msg || 'Submission failed');
      }

      // Auto-approve it if we want, or just redirect to queue
      // Let's explicitly auto approve it since admin created it
      if (data.post?.id) {
        await API.adminApprovePost(data.post.id, 'approve');
      }
      
      router.push('/admin');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin" className="p-2 bg-card border border-border rounded-xl hover:bg-muted transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Create Publisher List</h1>
          <p className="text-muted-foreground mt-1">
            Bypass rate limits to instantly publish an authoritative list platform-wide.
          </p>
        </div>
      </div>

      {error && <div className="p-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl mb-6 font-medium">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Post Metadata Pane */}
        <div className="p-6 bg-card border border-border rounded-2xl shadow-sm space-y-5">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
            <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">1</span> 
            List Details
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold mb-2 ml-1">List Title</label>
              <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full h-12 px-4 rounded-xl border border-border bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="Top 10 Action Movies" />
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-2 ml-1">Category</label>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full h-12 px-4 rounded-xl border border-border bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/50">
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold mb-2 ml-1">Introduction / Hook</label>
            <textarea required value={intro} onChange={(e) => setIntro(e.target.value)} className="w-full p-4 rounded-xl border border-border bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[100px]" placeholder="Explain why this list was made..."></textarea>
          </div>
        </div>

        {/* List Items Pane */}
        <div className="p-6 bg-card border border-border rounded-2xl shadow-sm space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
            <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">2</span> 
            Rankings
          </h2>
          
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="p-5 border border-border rounded-xl bg-muted/10 relative">
                <div className="absolute -left-3 -top-3 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold shadow-sm">
                  #{item.rank}
                </div>
                <div className="space-y-4 mt-2">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 text-muted-foreground uppercase tracking-wider">Item Title</label>
                    <input type="text" required value={item.title} onChange={(e) => handleUpdateItem(index, 'title', e.target.value)} className="w-full h-10 px-3 rounded-lg border border-border bg-background" placeholder="e.g. Die Hard" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 text-muted-foreground uppercase tracking-wider">Justification</label>
                    <textarea required value={item.justification} onChange={(e) => handleUpdateItem(index, 'justification', e.target.value)} className="w-full p-3 rounded-lg border border-border bg-background min-h-[80px]" placeholder="Why does this deserve this rank?"></textarea>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button type="button" onClick={handleAddItem} className="w-full border-2 border-dashed border-border text-muted-foreground font-semibold py-4 rounded-xl hover:bg-muted/50 hover:text-foreground transition-colors">
            + Add Next Rank (#{items.length + 1})
          </button>
        </div>

        <button type="submit" disabled={submitting} className="w-full flex items-center justify-center gap-2 h-14 bg-primary text-white text-lg font-bold rounded-2xl hover:bg-primary-dark transition-colors disabled:opacity-50">
          {submitting ? <Loader2 className="animate-spin" /> : <Save />}
          {submitting ? 'Publishing...' : 'Instantly Publish List'}
        </button>
      </form>
    </div>
  );
}
