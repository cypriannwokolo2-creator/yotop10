'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { API, Post } from '@/lib/api';
import { 
  CheckCircle, 
  XCircle, 
  ExternalLink, 
  Pencil, 
  Loader2, 
  ShieldAlert,
  ArrowRight,
  LayoutGrid,
  ChevronRight,
  ListRestart
} from 'lucide-react';
import { ConfirmationModal, PromptModal, StatusModal } from '@/components/ui';
import { cn } from '@/lib/utils';

export default function PendingPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [quickReplies, setQuickReplies] = useState<{label: string, message: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingOn, setActingOn] = useState<string | null>(null);
  
  // Modal states
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, postId: string, type: 'approve' | 'delete'}>({
    isOpen: false,
    postId: '',
    type: 'approve'
  });
  const [promptModal, setPromptModal] = useState<{isOpen: boolean, postId: string}>({
    isOpen: false,
    postId: ''
  });
  const [statusMsg, setStatusMsg] = useState<{isOpen: boolean, type: 'success' | 'error', title: string, message: string}>({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  const loadData = async () => {
    try {
      const [pRes, qRes] = await Promise.all([
        API.adminGetPendingPosts(),
        API.adminGetQuickReplies()
      ]);
      setPosts(pRes.posts || []);
      setQuickReplies(qRes || []);
    } catch (err) {
      console.error('Failed to load queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Grouping logic
  const groupedPosts = useMemo(() => {
    const groups: Record<string, { category: any, items: Post[] }> = {};
    
    posts.forEach(post => {
      const catName = post.category?.name || 'Uncategorized';
      if (!groups[catName]) {
        groups[catName] = { category: post.category, items: [] };
      }
      groups[catName].items.push(post);
    });

    // Sort by count descending
    return Object.entries(groups)
      .sort((a, b) => b[1].items.length - a[1].items.length)
      .map(([name, data]) => ({ name, ...data }));
  }, [posts]);

  const handleApprove = async () => {
    const { postId } = confirmModal;
    setActingOn(postId);
    setConfirmModal({ ...confirmModal, isOpen: false });

    try {
      await API.adminApprovePost(postId, 'approve');
      setStatusMsg({
        isOpen: true,
        type: 'success',
        title: 'Post Approved',
        message: 'The list has been published and the author has been notified.'
      });
      loadData();
    } catch (err: any) {
      setStatusMsg({
        isOpen: true,
        type: 'error',
        title: 'Action Failed',
        message: err.message || 'Approval transmission failed.'
      });
    } finally {
      setActingOn(null);
    }
  };

  const handleReject = async (reason: string) => {
    const { postId } = promptModal;
    setActingOn(postId);
    setPromptModal({ ...promptModal, isOpen: false });

    try {
      await API.adminApprovePost(postId, 'reject', reason);
      setStatusMsg({
        isOpen: true,
        type: 'success',
        title: 'Post Rejected',
        message: 'List data cleared. The author was notified of the rejection reason.'
      });
      loadData();
    } catch (err: any) {
      setStatusMsg({
        isOpen: true,
        type: 'error',
        title: 'Rejection Failed',
        message: err.message || 'Operation failed.'
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
        <div>
          <h1 className="text-4xl font-black tracking-tight flex items-center gap-3 text-orange-600">
            <ShieldAlert size={36} />
            Editorial Gatekeeper
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl leading-relaxed">
            Verify, refine, or terminate pending submissions. Lists are grouped by category for efficient processing.
          </p>
        </div>
        
        <div className="flex items-center gap-4 bg-card/50 backdrop-blur-sm px-6 py-4 rounded-3xl border border-border shadow-sm">
          <div className="text-center border-r border-border pr-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Total Pending</p>
            <p className="text-2xl font-black text-orange-600 font-mono tracking-tighter">{posts.length}</p>
          </div>
          <div className="text-center pl-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Categories</p>
            <p className="text-2xl font-black text-primary font-mono tracking-tighter">{groupedPosts.length}</p>
          </div>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="relative overflow-hidden group py-32 bg-card rounded-[3rem] border border-border flex flex-col items-center justify-center text-center px-6">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-24 h-24 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mb-6">
            <CheckCircle size={48} />
          </div>
          <h2 className="text-3xl font-black mb-3">Omniscience Achieved</h2>
          <p className="text-muted-foreground text-lg max-w-md">Every submission has been processed. The ecosystem is in balance.</p>
        </div>
      ) : (
        <div className="space-y-16">
          {groupedPosts.map((group) => (
            <div key={group.name} className="space-y-6">
              {/* Category Header */}
              <div className="flex items-center gap-4 px-2">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-inner">
                  <LayoutGrid size={24} />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-black tracking-tight">{group.name}</h2>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    {group.items.length} {group.items.length === 1 ? 'Submission' : 'Submissions'} Awaiting Review
                  </p>
                </div>
                <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
              </div>

              <div className="grid grid-cols-1 gap-6">
                {group.items.map((post) => {
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
                          {post.min_items_required && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-muted/50 rounded-full border border-border/50 text-xs font-bold">
                              Target: {post.min_items_required} items
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-stretch gap-3 min-w-[340px]">
                        <div className="grid grid-cols-2 lg:grid-cols-1 w-full gap-3">
                          <button
                            onClick={() => setConfirmModal({ isOpen: true, postId: id, type: 'approve' })}
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
                            onClick={() => setPromptModal({ isOpen: true, postId: id })}
                            disabled={actingOn === id}
                            className="h-full min-h-[56px] bg-red-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-red-700 transition-all active:scale-95 shadow-lg shadow-red-600/30 lg:col-span-1 col-span-2"
                          >
                            <XCircle size={18} /> Reject & Purge
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Decision Modals */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen && confirmModal.type === 'approve'}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={handleApprove}
        title="Sanction Publication?"
        message="This will instantly publish the list to the platform. The author will be notified that their research has been verified."
        confirmLabel="Verify & Publish"
        variant="info"
        isLoading={!!actingOn}
      />

      <PromptModal
        isOpen={promptModal.isOpen}
        onClose={() => setPromptModal({ ...promptModal, isOpen: false })}
        onConfirm={handleReject}
        title="Rejection Reason"
        message="Provide critical feedback. Rejection triggers identity alerts AND permanent list destruction from the database."
        confirmLabel="Confirm Rejection"
        quickReplies={quickReplies}
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
