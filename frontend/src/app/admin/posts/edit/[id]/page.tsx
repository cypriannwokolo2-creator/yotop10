'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { API, Post, Category } from '@/lib/api';
import { Save, Loader2, ArrowLeft, Plus, Trash2, LayoutList, MessageSquareQuote } from 'lucide-react';
import Link from 'next/link';
import { StatusModal, ImageUpload } from '@/components/ui';

export default function AdminEditPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState('');
  const [intro, setIntro] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [minItemsRequired, setMinItemsRequired] = useState(3);
  const [coverImage, setCoverImage] = useState('');
  const [reason, setReason] = useState('');
  const [items, setItems] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [globalMax, setGlobalMax] = useState(20);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [postRes, catsRes, settings] = await Promise.all([
          API.adminGetPostDetails(postId),
          API.getCategories(),
          API.adminGetSettings()
        ]);
        
        setTitle(postRes.post.title);
        setIntro(postRes.post.intro);
        setCategoryId(postRes.post.category?.id || postRes.post.category_id || '');
        setCoverImage(postRes.post.cover_image || '');
        setMinItemsRequired(postRes.post.min_items_required || 3);
        setItems(postRes.items || []);
        setCategories(catsRes.categories || []);
        setGlobalMax(settings.max_ranking_items);
      } catch (err) {
        setError('Failed to load list details.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [postId]);

  const handleAddItem = () => {
    const newRank = items.length + 1;
    setItems([...items, { rank: newRank, title: '', justification: '', image_url: '' }]);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index).map((item, i) => ({
      ...item,
      rank: i + 1
    }));
    setItems(newItems);
  };

  const handleUpdateItem = (index: number, field: string, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length < minItemsRequired) {
      setError(`Editorial Requirement: This list is configured to require ${minItemsRequired} placements. You currently have ${items.length}.`);
      setErrorModalOpen(true);
      return;
    }
    if (items.length > globalMax) {
      setError(`Governance Violation: This list exceeds the platform maximum of ${globalMax} items. Please trim the rankings.`);
      setErrorModalOpen(true);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await API.adminEditPost(postId, {
        title,
        intro,
        category_id: categoryId,
        min_items_required: minItemsRequired,
        cover_image: coverImage,
        items,
        reason
      } as any);
      
      setModalOpen(true);
    } catch (err: any) {
      setError(err.message || 'Transmission failed.');
      setErrorModalOpen(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-[400px] flex items-center justify-center">
      <Loader2 className="animate-spin text-primary" size={32} />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="flex items-center gap-4 mb-10">
        <Link href="/admin/posts/pending" className="p-2.5 bg-card border border-border rounded-xl hover:bg-muted transition-all hover:scale-105 active:scale-95">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-black tracking-tight">Vetting & Refinement</h1>
          <p className="text-muted-foreground text-sm font-mono opacity-60">ADMIN EDIT MODE • ID: {postId}</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl mb-8 font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-10">
        {/* Section 1: Core Content */}
        <div className="bg-card border border-border rounded-[2rem] p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold font-mono border border-primary/20">1</div>
            <h2 className="text-xl font-bold">List Vitals</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Title Override</label>
              <input 
                type="text" 
                required 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                className="w-full h-14 px-5 rounded-2xl border border-border bg-background focus:outline-none focus:ring-4 focus:ring-primary/10 font-bold text-lg" 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Category Domain</label>
              <select 
                value={categoryId} 
                onChange={(e) => setCategoryId(e.target.value)} 
                className="w-full h-14 px-5 rounded-2xl border border-border bg-background focus:outline-none focus:ring-4 focus:ring-primary/10 font-medium"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 border-t border-border/50 pt-8 mt-4">
             <div className="md:col-span-1">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Hero Cover Image</label>
              <ImageUpload
                value={coverImage}
                onChange={setCoverImage}
                aspectRatio="video"
                className="mt-2"
              />
            </div>
            <div className="md:col-span-2 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Editorial Status (One-Liner / Reason for edit)</label>
                <input 
                  type="text" 
                  value={reason} 
                  onChange={(e) => setReason(e.target.value)} 
                  placeholder="e.g., Grammar cleanup and icon alignment..."
                  className="w-full h-14 px-5 rounded-2xl border border-border bg-background focus:outline-none focus:ring-4 focus:ring-primary/10 font-medium"
                />
                <p className="text-[10px] text-muted-foreground ml-2 italic">This message is dispatched to the author upon saving.</p>
              </div>
            </div>
          </div>

          <div className="space-y-2 mb-8">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Editorial Preface (Introduction)</label>
            <textarea 
              required 
              value={intro} 
              onChange={(e) => setIntro(e.target.value)} 
              className="w-full p-5 rounded-2xl border border-border bg-background focus:outline-none focus:ring-4 focus:ring-primary/10 min-h-[160px] leading-relaxed"
            ></textarea>
          </div>

          <div className="p-4 bg-muted/30 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LayoutList size={20} className="text-primary" />
              <span className="text-sm font-bold">Setting: Minimum Placements</span>
            </div>
            <input 
              type="number" 
              value={minItemsRequired} 
              onChange={(e) => setMinItemsRequired(parseInt(e.target.value) || 1)}
              className="w-20 h-10 px-3 bg-card border border-border rounded-xl font-mono font-bold text-center"
            />
          </div>
        </div>

        {/* Section 2: Rankings Management */}
        <div className="bg-card border border-border rounded-[2rem] p-8 shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold font-mono border border-primary/20">2</div>
              <h2 className="text-xl font-bold">The Placements</h2>
            </div>
            <button 
              type="button" 
              onClick={handleAddItem}
              className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-primary-dark transition-all hover:scale-105"
            >
              <Plus size={18} /> Add Placement
            </button>
          </div>

          <div className="space-y-6">
            {items.map((item, index) => (
              <div key={index} className="group relative p-6 border border-border rounded-[1.5rem] bg-muted/10 hover:bg-muted/20 transition-all">
                <div className="absolute -left-3 -top-3 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-black shadow-lg shadow-primary/20">
                  #{item.rank}
                </div>
                
                <button
                  type="button"
                  onClick={() => handleRemoveItem(index)}
                  className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={18} />
                </button>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-4">
                  <div className="md:col-span-3">
                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Visual Evidence</label>
                    <ImageUpload
                      value={item.image_url}
                      onChange={(url) => handleUpdateItem(index, 'image_url', url)}
                      aspectRatio="square"
                      className="mt-1"
                    />
                  </div>
                  <div className="md:col-span-9 space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Placement Name</label>
                      <input 
                        type="text" 
                        required 
                        value={item.title} 
                        onChange={(e) => handleUpdateItem(index, 'title', e.target.value)}
                        className="w-full h-11 px-4 rounded-xl border border-border bg-background font-bold text-sm shadow-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 flex items-center gap-1">
                        <MessageSquareQuote size={10} /> Editorial Justification
                      </label>
                      <textarea 
                        required 
                        value={item.justification} 
                        onChange={(e) => handleUpdateItem(index, 'justification', e.target.value)}
                        className="w-full p-4 rounded-xl border border-border bg-background min-h-[100px] text-sm leading-relaxed shadow-sm"
                      ></textarea>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button 
          type="submit" 
          disabled={submitting}
          className="w-full h-20 bg-primary text-white rounded-[2rem] font-black text-2xl shadow-xl shadow-primary/20 hover:scale-[1.01] hover:shadow-2xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
        >
          {submitting ? <Loader2 className="animate-spin" size={28} /> : <Save size={28} />}
          {submitting ? 'Applying Vetting Changes...' : 'Approve & Save Refinements'}
        </button>
      </form>

      <StatusModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          router.push('/admin/posts/pending');
        }}
        type="success"
        title="Vetting Complete"
        message="The list has been successfully updated with your editorial refinements and saved to the live platform."
        actionLabel="Back to Queue"
      />

      <StatusModal
        isOpen={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
        type="error"
        title="Vetting Conflict"
        message={error}
        actionLabel="Continue Vetting"
      />
    </div>
  );
}
