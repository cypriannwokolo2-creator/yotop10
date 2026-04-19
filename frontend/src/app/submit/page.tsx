'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API, Category } from '@/lib/api';
import { Save, Loader2, ArrowLeft, PenTool, LayoutList, ShieldAlert, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { StatusModal, CategorySelect, ImageUpload, ConfirmationModal } from '@/components/ui';
import { useAuth } from '@/context/PublicAuthContext';
import { cn } from '@/lib/utils';

export default function SubmitListPublicPage() {
  const router = useRouter();
  const { user, status } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [title, setTitle] = useState('');
  const [intro, setIntro] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [coverImage, setCoverImage] = useState('');
  
  const [items, setItems] = useState([
    { rank: 1, title: '', justification: '', image_url: '' },
    { rank: 2, title: '', justification: '', image_url: '' },
    { rank: 3, title: '', justification: '', image_url: '' }
  ]);
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [guestConfirmOpen, setGuestConfirmOpen] = useState(false);
  const [globalConstraints, setGlobalConstraints] = useState({ min: 3, max: 20 });

  useEffect(() => {
    API.getCategories()
      .then((data) => {
        setCategories(data.categories || []);
        if (data.categories?.length > 0) {
          setCategoryId(data.categories[0].id);
        }
      })
      .catch(() => setError('Could not engage platform services.'));

    API.adminGetSettings() // We should probably make a public settings endpoint, but for now we follow admin
      .then((settings) => {
        setGlobalConstraints({
          min: settings.min_ranking_items,
          max: settings.max_ranking_items
        });
        // Adjust default items if min is higher
        if (items.length < settings.min_ranking_items) {
          const needed = settings.min_ranking_items - items.length;
          const extra = Array.from({ length: needed }).map((_, i) => ({
             rank: items.length + i + 1,
             title: '',
             justification: '',
             image_url: ''
          }));
          setItems([...items, ...extra]);
        }
      })
      .catch(() => {}); // Fallback to defaults
  }, []);

  const handleAddItem = () => {
    setItems([...items, { rank: items.length + 1, title: '', justification: '', image_url: '' }]);
  };

  const handleUpdateItem = (index: number, field: string, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (items.length < globalConstraints.min) {
      setError(`Platform policy requires at least ${globalConstraints.min} items for a list. Please add more placements.`);
      setErrorModalOpen(true);
      return;
    }
    if (items.length > globalConstraints.max) {
      setError(`This list exceeds the platform maximum of ${globalConstraints.max} items. Please trim it down.`);
      setErrorModalOpen(true);
      return;
    }
    if (items.some(i => !i.title || !i.justification)) {
      setError('Rankings are missing titles or justifications. Every placement must be defended.');
      setErrorModalOpen(true);
      return;
    }

    // Check if user is a scholar. If not, ask for confirmation.
    if (status !== 'scholar' && !guestConfirmOpen) {
      setGuestConfirmOpen(true);
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
        cover_image: coverImage,
        items,
        min_items_required: globalConstraints.min,
      });

      // Show success modal
      setModalOpen(true);
    } catch (err: any) {
      setError(err.message || 'Transmission failed.');
      setErrorModalOpen(true);
    } finally {
      setSubmitting(false);
      setGuestConfirmOpen(false);
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

      {status !== 'scholar' && (
        <div className="mb-10 p-6 rounded-3xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-4 animate-in fade-in slide-in-from-top-2 duration-700">
           <ShieldAlert size={24} className="text-amber-500 shrink-0 mt-1" />
           <div>
              <p className="font-bold text-amber-700 text-sm mb-1">Unsecured Submission Flow</p>
              <p className="text-xs text-amber-600/80 leading-relaxed font-medium">
                You are submitting as a <strong>Guest</strong>. You will NOT receive notifications if your list is approved or rejected, and this submission will not contribute to your Scholar Trust Score.
                <button 
                  onClick={() => router.push('/settings')} 
                  className="ml-1.5 text-primary font-bold hover:underline"
                >
                  Backup your identity to become a Scholar &rarr;
                </button>
              </p>
           </div>
        </div>
      )}

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
              <CategorySelect 
                categories={categories}
                value={categoryId}
                onChange={setCategoryId}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="md:col-span-1">
              <label className="block text-sm font-semibold mb-2 ml-1 text-muted-foreground uppercase tracking-wider text-[10px]">Prime Cover Image</label>
              <ImageUpload
                value={coverImage}
                onChange={setCoverImage}
                aspectRatio="video"
              />
            </div>
            <div className="space-y-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-2 ml-1 text-muted-foreground uppercase tracking-wider text-[10px]">Contextual Preface <span className="text-red-500">*</span></label>
                <textarea required value={intro} onChange={(e) => setIntro(e.target.value)} className="w-full p-5 rounded-2xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 min-h-[140px] text-base" placeholder="Who are you and why is this strictly your opinion on the criteria? Set the stage before throwing the ranks out..."></textarea>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 ml-1 text-muted-foreground uppercase tracking-wider text-[10px]">Display Name</label>
                <input type="text" value={authorName} onChange={(e) => setAuthorName(e.target.value)} className="w-full h-14 px-5 rounded-2xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="Anonymous Scholar" />
              </div>
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
                
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-2">
                  <div className="md:col-span-4">
                    <label className="block text-xs font-bold mb-1.5 text-muted-foreground uppercase tracking-[0.2em] pl-1">Visual Evidence</label>
                    <ImageUpload
                      value={item.image_url}
                      onChange={(url) => handleUpdateItem(index, 'image_url', url)}
                      aspectRatio="square"
                    />
                  </div>
                  <div className="md:col-span-8 space-y-4">
                    <div>
                      <label className="block text-xs font-bold mb-1.5 text-muted-foreground uppercase tracking-[0.2em] pl-1">Placement Subject</label>
                      <input type="text" required value={item.title} onChange={(e) => handleUpdateItem(index, 'title', e.target.value)} className="w-full h-12 px-4 rounded-xl border border-border bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 font-semibold" placeholder="Item Name..." />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1.5 text-muted-foreground uppercase tracking-[0.2em] pl-1">Vindication</label>
                      <textarea required value={item.justification} onChange={(e) => handleUpdateItem(index, 'justification', e.target.value)} className="w-full p-4 rounded-xl border border-border bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[100px] text-sm" placeholder="Defend this rank against the mob..."></textarea>
                    </div>
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

        <button type="submit" disabled={submitting} className="w-full flex items-center justify-center gap-2 h-16 bg-primary text-white text-xl font-black rounded-3xl hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0 shadow-lg shadow-primary/20">
          {submitting ? (
            <>
              <Loader2 className="animate-spin" />
              <span>Transmitting Dossier...</span>
            </>
          ) : (
            <>
              <Save size={20} />
              <span>Submit for Vetting</span>
            </>
          )}
        </button>
      </form>
      
      {/* Confirmation for Guest Submissions */}
      <ConfirmationModal
        isOpen={guestConfirmOpen}
        onClose={() => setGuestConfirmOpen(false)}
        onConfirm={() => handleSubmit()}
        title="Continue as Guest?"
        message="Your account is not backed up. Guest submissions are processed with lower priority, do not earn Trust Points, and you will not be notified of the result. Do you wish to proceed anyway?"
        confirmLabel="Proceed as Guest"
        variant="danger"
      />

      <StatusModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          router.push('/explore');
        }}
        type="success"
        title="Submission Transmitted"
        message="Your list has been queued for verification. It will appear on the main feeds once a moderator validates the placements."
        actionLabel="Back to Explore"
      />

      <StatusModal
        isOpen={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
        type="error"
        title="Transmission Error"
        message={error}
        actionLabel="Review Form"
      />
    </div>
  );
}
