'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API, Category, Post } from '@/lib/api';
import { Save, Loader2, ArrowLeft, Settings } from 'lucide-react';
import Link from 'next/link';
import { StatusModal } from '@/components/ui';

export default function AdminCreatePostPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [title, setTitle] = useState('');
  const [intro, setIntro] = useState('');
  const [postType, setPostType] = useState('top_list');
  const [categoryId, setCategoryId] = useState('');
  const [authorName, setAuthorName] = useState('Admin');
  const [minItemsRequired, setMinItemsRequired] = useState(3);
  
  // Minimal requirement: At least 1 item
  const [items, setItems] = useState([{ rank: 1, title: '', justification: '' }]);
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [globalMax, setGlobalMax] = useState(20);

  useEffect(() => {
    API.getCategories().then((data) => {
      setCategories(data.categories || []);
      if (data.categories?.length > 0) {
        setCategoryId(data.categories[0].id);
      }
    });
    
    API.adminGetSettings().then(s => setGlobalMax(s.max_ranking_items)).catch(() => {});
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
    if (items.length < minItemsRequired) {
      setError(`Notice: This list is configured to require ${minItemsRequired} placements. You only have ${items.length}.`);
      setErrorModalOpen(true);
      return;
    }

    if (items.length > globalMax) {
      setError(`Exceeds Platform Maximum: The current global limit is ${globalMax} items. Please adjust the list length.`);
      setErrorModalOpen(true);
      return;
    }

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
        min_items_required: minItemsRequired,
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
      
      setModalOpen(true);
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold mb-2 ml-1">Author Display Name</label>
              <input type="text" value={authorName} onChange={(e) => setAuthorName(e.target.value)} className="w-full h-12 px-4 rounded-xl border border-border bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 ml-1 flex items-center gap-2">
                <Settings size={14} className="text-muted-foreground" />
                Minimum Placements Required
              </label>
              <input 
                type="number" 
                min="1" 
                max="50"
                value={minItemsRequired} 
                onChange={(e) => setMinItemsRequired(parseInt(e.target.value) || 1)} 
                className="w-full h-12 px-4 rounded-xl border border-border bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono font-bold" 
              />
              <p className="text-[10px] text-muted-foreground mt-1.5 ml-1">
                Submissions with fewer items will be auto-rejected by the server.
              </p>
            </div>
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

      <StatusModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          router.push('/admin');
        }}
        type="success"
        title="List Published!"
        message="The authoritative list has been created and instantly approved for public viewing across the platform."
        actionLabel="Back to Dashboard"
      />

      <StatusModal
        isOpen={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
        type="error"
        title="Configuration Error"
        message={error}
        actionLabel="Adjust Details"
      />
    </div>
  );
}
