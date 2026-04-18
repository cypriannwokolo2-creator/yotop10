'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API, Category } from '@/lib/api';
import { Save, Loader2, ArrowLeft, PenTool, LayoutList } from 'lucide-react';
import Link from 'next/link';

export default function SubmitListPublicPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [title, setTitle] = useState('');
  const [intro, setIntro] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [authorName, setAuthorName] = useState('');
  
  const [items, setItems] = useState([
    { rank: 1, title: '', justification: '' },
    { rank: 2, title: '', justification: '' },
    { rank: 3, title: '', justification: '' }
  ]);
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    API.getCategories()
      .then((data) => {
        setCategories(data.categories || []);
        if (data.categories?.length > 0) {
          setCategoryId(data.categories[0].id);
        }
      })
      .catch(() => setError('Could not engage platform services.'));
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
    if (items.some(i => !i.title || !i.justification)) {
      setError('Rankings are missing titles or justifications.');
      return;
    }
    
    setSubmitting(true);
    setError('');

    try {
      // Secure device fingerprints used across platform 
      let fp = localStorage.getItem('yotop10_fp');
      if (!fp) {
        fp = Math.random().toString(36).substring(2, 15);
        localStorage.setItem('yotop10_fp', fp);
      }

      await API.submitPost({
        title,
        post_type: 'top_list',
        intro,
        category_id: categoryId,
        author_display_name: authorName || 'Anonymous Scholar',
        device_fingerprint: fp,
        items,
      });

      // Show success modal or route away
      alert('List submitted! It is now pending moderator approval block.');
      router.push('/explore');
    } catch (err: any) {
      setError(err.message || 'Transmission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="p-2.5 bg-primary/10 rounded-xl">
              <PenTool size={24} className="text-primary" />
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight">Draft a List</h1>
          </div>
          <p className="text-muted-foreground text-sm max-w-2xl">
            You hold the pen. Write authoritative rankings on topics you deeply understand. Once submitted, it enters our moderation queue before officially hitting the YoTop10 main feeds.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl mb-8 font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Base Metadata */}
        <div className="p-6 md:p-8 bg-card border border-border rounded-[2rem] shadow-sm space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold font-mono border border-primary/20">1</div> 
            <h2 className="text-xl font-bold tracking-tight">Debate Mechanics</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-2 ml-1 text-muted-foreground">Catchy List Title <span className="text-red-500">*</span></label>
              <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full h-14 px-5 rounded-2xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium text-lg placeholder:font-normal placeholder:opacity-50" placeholder="e.g., Top 10 Heaviest Bands in Metal" />
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-2 ml-1 text-muted-foreground">Select Domain</label>
              <select required value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full h-14 px-5 rounded-2xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 text-base font-medium">
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2 ml-1 text-muted-foreground">Contextual Preface <span className="text-red-500">*</span></label>
              <textarea required value={intro} onChange={(e) => setIntro(e.target.value)} className="w-full p-5 rounded-2xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 min-h-[140px] text-base" placeholder="Who are you and why is this strictly your opinion on the criteria? Set the stage before throwing the ranks out..."></textarea>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 ml-1 text-muted-foreground">Display Name</label>
              <input type="text" value={authorName} onChange={(e) => setAuthorName(e.target.value)} className="w-full h-14 px-5 rounded-2xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="Anonymous Scholar" />
            </div>
          </div>
        </div>

        {/* Step 2: The Ranks */}
        <div className="p-6 md:p-8 bg-card border border-border rounded-[2rem] shadow-sm space-y-6">
           <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold font-mono border border-primary/20">2</div> 
              <h2 className="text-xl font-bold tracking-tight">The Placements</h2>
            </div>
          </div>
          
          <div className="space-y-6">
            {items.map((item, index) => (
              <div key={index} className="p-5 md:p-6 border border-border rounded-3xl bg-muted/20 relative group hover:border-primary/30 transition-colors">
                <div className="absolute -left-4 -top-4 w-12 h-12 bg-background border-4 border-card rounded-full flex items-center justify-center font-bold text-lg shadow-sm text-primary">
                  #{item.rank}
                </div>
                
                <div className="space-y-4 mt-2">
                  <div>
                    <label className="block text-xs font-bold mb-1.5 text-muted-foreground uppercase tracking-widest pl-1">Placement Subject</label>
                    <input type="text" required value={item.title} onChange={(e) => handleUpdateItem(index, 'title', e.target.value)} className="w-full h-12 px-4 rounded-xl border border-border bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 font-semibold" placeholder="Item Name..." />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1.5 text-muted-foreground uppercase tracking-widest pl-1">Vindication</label>
                    <textarea required value={item.justification} onChange={(e) => handleUpdateItem(index, 'justification', e.target.value)} className="w-full p-4 rounded-xl border border-border bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[100px] text-sm" placeholder="Defend this rank against the mob..."></textarea>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-border flex justify-center">
             <button type="button" onClick={handleAddItem} className="px-8 py-3.5 bg-muted text-foreground border border-border rounded-xl font-bold shadow-sm hover:bg-muted/80 transition-colors flex items-center gap-2">
               <LayoutList size={20} className="text-muted-foreground" /> Add Placement #{items.length + 1}
             </button>
          </div>
        </div>

        <button type="submit" disabled={submitting} className="w-full flex items-center justify-center gap-2 h-16 bg-primary text-white text-xl font-black rounded-3xl hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0">
          {submitting ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
          {submitting ? 'Transmitting to Server...' : 'Submit to Moderation'}
        </button>
      </form>
    </div>
  );
}
