'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { API, Post } from '@/lib/api';
import { Save, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminEditPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  
  const [title, setTitle] = useState('');
  const [intro, setIntro] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    API.getPost(postId).then((data) => {
      setTitle(data.post.title);
      setIntro(data.post.intro);
    }).catch(err => {
      setError('Failed to fetch post.');
    }).finally(() => {
      setLoading(false);
    });
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await API.adminEditPost(postId, { title, intro } as Partial<Post>);
      // On success, take back to pending queue
      router.push('/admin/posts/pending');
    } catch (err: any) {
      setError(err.message || 'Edit failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div>Loading post details...</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/posts/pending" className="p-2 bg-card border border-border rounded-xl hover:bg-muted transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Edit Post Metadata</h1>
          <p className="text-muted-foreground mt-1 text-sm font-mono tracking-tighter">
            ID: {postId}
          </p>
        </div>
      </div>

      {error && <div className="p-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl mb-6 font-medium">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 border border-border rounded-2xl shadow-sm">
        <div>
          <label className="block text-sm font-semibold mb-2 ml-1">Title Override</label>
          <input 
            type="text" 
            required 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            className="w-full h-12 px-4 rounded-xl border border-border bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/50" 
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold mb-2 ml-1">Introduction Edit</label>
          <textarea 
            required 
            value={intro} 
            onChange={(e) => setIntro(e.target.value)} 
            className="w-full p-4 rounded-xl border border-border bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[150px]"
          ></textarea>
        </div>

        <button type="submit" disabled={submitting} className="w-full flex items-center justify-center gap-2 h-12 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50">
          {submitting ? <Loader2 className="animate-spin" /> : <Save size={18} />}
          {submitting ? 'Saving changes...' : 'Save & Exit'}
        </button>
      </form>
    </div>
  );
}
