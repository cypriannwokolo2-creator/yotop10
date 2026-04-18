'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { API, Post } from '@/lib/api';
import { 
  CheckCircle, 
  XCircle, 
  ExternalLink, 
  Pencil, 
  Loader2, 
  ShieldAlert,
  RotateCw,
  ArrowLeft,
  LayoutGrid
} from 'lucide-react';
import { ConfirmationModal, PromptModal, StatusModal } from '@/components/ui';

export default function CategoryPendingQueuePage() {
  const { id: categoryId } = useParams();
  const router = useRouter();
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [quickReplies, setQuickReplies] = useState<{label: string, message: string, type: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState('');
  
  // Modal states
  const [promptModal, setPromptModal] = useState<{
    isOpen: boolean, 
    postId: string, 
    type: 'approve' | 'reject' | 'edit',
    title: string,
    message: string,
    variant: 'success' | 'danger' | 'info'
  }>({
    isOpen: false,
    postId: '',
    type: 'reject',
    title: '',
    message: '',
    variant: 'danger'
  });

  const [statusMsg, setStatusMsg] = useState<{isOpen: boolean, type: 'success' | 'error', title: string, message: string}>({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  const loadData = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const [pRes, qRes] = await Promise.all([
        API.adminGetPendingByCategory(categoryId as string),
        API.adminGetQuickReplies()
      ]);
      setPosts(pRes.posts || []);
      setQuickReplies(qRes || []);
      
      if (pRes.posts?.length > 0) {
        setCategoryName(pRes.posts[0].category_id?.name || pRes.posts[0].category?.name || 'Category Queue');
      }
    } catch (err) {
      console.error('Failed to load category queue:', err);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [categoryId]);

  const handleAction = async (reason: string) => {
    const { postId, type } = promptModal;
    setActingOn(postId);
    setPromptModal({ ...promptModal, isOpen: false });

    try {
      if (type === 'approve' || type === 'reject') {
        const action = type === 'approve' ? 'approve' : 'reject';
        await API.adminApprovePost(postId, action, reason);
        setStatusMsg({
          isOpen: true,
          type: 'success',
          title: type === 'approve' ? 'Submission Published' : 'Submission Purged',
          message: type === 'approve' 
            ? 'The list is now live. Scholar has been notified.' 
            : 'Data wiped. Scholar was notified of the rejection reasoning.'
        });
      }
      loadData(false);
    } catch (err: any) {
      setStatusMsg({
        isOpen: true,
        type: 'error',
        title: 'Operation Failed',
        message: err.message || 'Transmission error.'
      });
    } finally {
      setActingOn(null);
    }
  };

  if (loading) return (
    <div className="min-h-[400px] flex items-center justify-center">
      <Loader2 className="animate-spin text-primary" size={32} />
    </div>
  );

  return (
    <div className="pb-20">
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-center gap-6">
          <Link 
            href="/admin/posts/pending"
            className="p-4 bg-card hover:bg-muted border border-border rounded-2xl transition-all shadow-sm group"
          >
            <ArrowLeft className="text-muted-foreground group-hover:text-primary transition-colors" />
          </Link>
          <div className="relative">
            <h1 className="text-4xl font-black tracking-tight flex items-center gap-3 text-orange-600">
              {categoryName} Queue
            </h1>
            <p className="text-muted-foreground mt-2 max-w-2xl leading-relaxed">
              Verify, refine, or terminate pending submissions for this universe.
            </p>
          </div>
          <button 
            onClick={() => loadData(false)}
            className="p-3 bg-muted/50 hover:bg-muted rounded-2xl border border-border transition-all active:rotate-180 duration-500 hover:text-primary"
            title="Refresh Queue"
          >
            <RotateCw size={24} />
          </button>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="py-32 bg-card rounded-[3rem] border border-border flex flex-col items-center justify-center text-center px-6">
          <div className="w-24 h-24 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mb-6">
            <CheckCircle size={48} />
          </div>
          <h2 className="text-3xl font-black mb-3">Dimension Neutralized</h2>
          <p className="text-muted-foreground text-lg max-w-md">Every submission in this category has been processed.</p>
          <Link 
            href="/admin/posts/pending"
            className="mt-8 px-8 py-4 bg-primary text-white rounded-2xl font-black flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
          >
            <LayoutGrid size={20} /> Back to Dashboard
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {posts.map((post) => {
            const id = post._id || post.id;
            return (
              <div key={id} className="group relative bg-card/60 backdrop-blur-sm p-8 rounded-[2.5rem] border border-border shadow-sm hover:shadow-xl transition-all hover:border-primary/20 flex flex-col xl:flex-row gap-8">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 bg-primary text-white text-[10px] font-black rounded-full uppercase tracking-widest shadow-lg shadow-primary/20">
                      {post.post_type.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono opacity-50"># {id}</span>
                  </div>
                  
                  <h3 className="text-2xl font-black mb-4 group-hover:text-primary transition-colors leading-tight">
                    <Link href={`/${post.slug || id}`} target="_blank" className="flex items-center gap-3">
                      {post.title} 
                      <ExternalLink size={18} className="text-muted-foreground opacity-30 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </h3>
                  
                  <p className="text-muted-foreground leading-relaxed mb-6 line-clamp-2 italic font-medium">
                    "{post.intro}"
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                       <span className="text-muted-foreground">Author:</span>
                       <span className="font-black underline decoration-primary/30 underline-offset-4">{post.author_display_name}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-stretch gap-3 min-w-[340px]">
                  <div className="grid grid-cols-2 lg:grid-cols-1 w-full gap-3">
                    <button
                      onClick={() => setPromptModal({ 
                        isOpen: true, 
                        postId: id, 
                        type: 'approve',
                        variant: 'success',
                        title: 'Approve Submission',
                        message: 'Verify content. Selecting a message will notify the author of their success.'
                      })}
                      disabled={actingOn === id}
                      className="h-full min-h-[56px] bg-green-500 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-green-600 transition-all active:scale-95 shadow-lg shadow-green-500/20"
                    >
                      <CheckCircle size={18} /> Approve
                    </button>
                    
                    <Link
                      href={`/admin/posts/edit/${id}`}
                      className="h-full min-h-[56px] bg-muted/50 text-foreground rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-muted transition-all active:scale-95 border border-border"
                    >
                      <Pencil size={18} /> Vette List
                    </Link>

                    <button
                      onClick={() => setPromptModal({ 
                        isOpen: true, 
                        postId: id, 
                        type: 'reject',
                        variant: 'danger',
                        title: 'Reject & Purge',
                        message: 'Pick a reason for deletion. This action is permanent and clears all data.'
                      })}
                      disabled={actingOn === id}
                      className="h-full min-h-[56px] bg-red-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-red-700 transition-all active:scale-95 shadow-lg shadow-red-600/30 lg:col-span-1 col-span-2"
                    >
                      <XCircle size={18} /> Reject
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dynamic Moderation Modal */}
      <PromptModal
        isOpen={promptModal.isOpen}
        onClose={() => setPromptModal({ ...promptModal, isOpen: false })}
        onConfirm={handleAction}
        title={promptModal.title}
        message={promptModal.message}
        variant={promptModal.variant}
        confirmLabel={promptModal.type === 'approve' ? 'Publish Now' : 'Purge Data'}
        quickReplies={quickReplies.filter(r => r.type === promptModal.type)}
        isLoading={!!actingOn}
      />

      <StatusModal
        isOpen={statusMsg.isOpen}
        onClose={() => setStatusMsg({ ...statusMsg, isOpen: false })}
        type={statusMsg.type}
        title={statusMsg.title}
        message={statusMsg.message}
      />
    </div>
  );
}
