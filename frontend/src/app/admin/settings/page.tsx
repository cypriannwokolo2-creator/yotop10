'use client';

import { useState, useEffect } from 'react';
import { API } from '@/lib/api';
import { 
  Settings, 
  Save, 
  Loader2, 
  ShieldCheck, 
  ListOrdered, 
  UserCheck, 
  ShieldAlert, 
  Plus, 
  Trash2, 
  MessageSquare, 
  Zap,
  RotateCcw
} from 'lucide-react';
import { StatusModal, ConfirmationModal } from '@/components/ui';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  
  // Platform Settings State
  const [settings, setSettings] = useState({
    min_ranking_items: 3,
    max_ranking_items: 20,
    allow_guest_submissions: true,
    auto_approve_scholars: false,
  });

  // Quick Replies State
  const [replies, setReplies] = useState<{id?: string, label: string, message: string}[]>([]);
  const [newReply, setNewReply] = useState({ label: '', message: '' });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadAll = async () => {
    try {
      const [sRes, rRes] = await Promise.all([
        API.adminGetSettings(),
        API.adminGetQuickReplies()
      ]);
      setSettings({
        min_ranking_items: sRes.min_ranking_items,
        max_ranking_items: sRes.max_ranking_items,
        allow_guest_submissions: sRes.allow_guest_submissions,
        auto_approve_scholars: sRes.auto_approve_scholars,
      });
      setReplies(rRes || []);
    } catch (err) {
      setError('Failed to load portal configuration.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await API.adminUpdateSettings(settings);
      setModalOpen(true);
    } catch {
      setError('Update failed. Check platform logs.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddReply = async () => {
    if (!newReply.label || !newReply.message) return;
    try {
      await API.adminCreateQuickReply(newReply);
      setNewReply({ label: '', message: '' });
      loadAll();
    } catch {
      setError('Failed to save reason template.');
    }
  };

  const handleDeleteReply = async () => {
    if (!deleteId) return;
    try {
      await API.adminDeleteQuickReply(deleteId);
      setDeleteId(null);
      loadAll();
    } catch {
      setError('Deletion failed.');
    }
  };

  const handleSeedReplies = async () => {
    try {
      await API.adminSeedQuickReplies();
      loadAll();
    } catch {
      setError('Seeding failed.');
    }
  };

  if (loading) return (
    <div className="min-h-[400px] flex items-center justify-center">
      <Loader2 className="animate-spin text-primary" size={32} />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="mb-12">
        <h1 className="text-4xl font-black tracking-tight flex items-center gap-4">
          <div className="p-3 bg-primary rounded-2xl text-white shadow-xl shadow-primary/20">
            <Settings size={32} />
          </div>
          System Architecture
        </h1>
        <p className="text-muted-foreground mt-3 text-lg max-w-2xl leading-relaxed">
          The central nervous system for YoTop10. Modify global state, moderation intelligence, and identity rules.
        </p>
      </div>

      {error && (
        <div className="p-5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-3xl mb-10 font-bold flex items-center gap-3">
          <ShieldAlert size={20} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column: Form Settings */}
        <div className="lg:col-span-2 space-y-10">
          <form onSubmit={handleSaveSettings} className="space-y-10">
            {/* List Constraints */}
            <div className="bg-card border border-border rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
              
              <div className="flex items-center gap-4 mb-10">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary font-black">
                  <ListOrdered size={24} />
                </div>
                <h2 className="text-2xl font-black">List Orchestration</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Platform Minimum</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={settings.min_ranking_items} 
                      onChange={(e) => setSettings({ ...settings, min_ranking_items: parseInt(e.target.value) || 1 })}
                      className="w-full h-16 px-6 rounded-2xl border border-border bg-background focus:outline-none focus:ring-4 focus:ring-primary/10 font-mono font-bold text-2xl" 
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-primary/30 font-black italic">MIN</div>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed px-1">Enforced across all community and scholar submissions.</p>
                </div>
                
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Universal Capacity</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={settings.max_ranking_items} 
                      onChange={(e) => setSettings({ ...settings, max_ranking_items: parseInt(e.target.value) || 1 })}
                      className="w-full h-16 px-6 rounded-2xl border border-border bg-background focus:outline-none focus:ring-4 focus:ring-primary/10 font-mono font-bold text-2xl" 
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-primary/30 font-black italic">MAX</div>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed px-1">Hard limit to preserve platform performance and visual hierarchy.</p>
                </div>
              </div>
            </div>

            {/* Moderation Policies */}
            <div className="bg-card border border-border rounded-[2.5rem] p-10 shadow-sm">
              <div className="flex items-center gap-4 mb-10">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary font-black">
                  <ShieldCheck size={24} />
                </div>
                <h2 className="text-2xl font-black">Moderation Protocol</h2>
              </div>

              <div className="space-y-6">
                <label className="flex items-center justify-between p-6 border border-border rounded-3xl hover:bg-muted/50 transition-all cursor-pointer group">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-background border border-border rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform text-primary shadow-sm">
                      <UserCheck size={24} />
                    </div>
                    <div>
                      <p className="font-black text-lg leading-tight">Anonymous Submissions</p>
                      <p className="text-xs text-muted-foreground mt-1">Allow unauthenticated guests to draft rankings.</p>
                    </div>
                  </div>
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={settings.allow_guest_submissions} 
                      onChange={(e) => setSettings({ ...settings, allow_guest_submissions: e.target.checked })}
                    />
                    <div className="w-14 h-8 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary shadow-inner"></div>
                  </div>
                </label>

                <label className="flex items-center justify-between p-6 border border-border rounded-3xl hover:bg-muted/50 transition-all cursor-pointer group">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-background border border-border rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform text-amber-500 shadow-sm">
                      <Zap size={24} />
                    </div>
                    <div>
                      <p className="font-black text-lg leading-tight">Scholar Auto-Approval</p>
                      <p className="text-xs text-muted-foreground mt-1">Bypass the vetting queue for verified Scholar accounts.</p>
                    </div>
                  </div>
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={settings.auto_approve_scholars} 
                      onChange={(e) => setSettings({ ...settings, auto_approve_scholars: e.target.checked })}
                    />
                    <div className="w-14 h-8 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-amber-500 shadow-inner"></div>
                  </div>
                </label>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={submitting}
              className="w-full h-20 bg-primary text-white rounded-[2.5rem] font-black text-xl shadow-2xl shadow-primary/30 hover:scale-[1.01] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="animate-spin" size={28} /> : <Save size={28} />}
              {submitting ? 'Applying Vitals...' : 'Commit Platform Config'}
            </button>
          </form>
        </div>

        {/* Right Column: Quick Replies */}
        <div className="space-y-8">
          <div className="bg-card border border-border rounded-[2.5rem] p-8 shadow-sm h-fit">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <MessageSquare size={20} className="text-primary" />
                <h2 className="text-xl font-bold">Quick Replies</h2>
              </div>
              <button 
                onClick={handleSeedReplies}
                className="p-2 text-muted-foreground hover:text-primary transition-colors"
                title="Restore Default Templates"
              >
                <RotateCcw size={18} />
              </button>
            </div>

            <div className="space-y-4 mb-8 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {replies.map((reply) => (
                <div key={reply.id} className="group p-4 bg-muted/30 border border-border rounded-2xl relative hover:bg-muted/50 transition-colors">
                  <button 
                    onClick={() => setDeleteId(reply.id || null)}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                  <p className="text-xs font-black uppercase text-primary mb-1">{reply.label}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{reply.message}</p>
                </div>
              ))}
              {replies.length === 0 && (
                <p className="text-center py-10 text-xs text-muted-foreground italic">No templates defined yet.</p>
              )}
            </div>

            <div className="space-y-4 pt-4 border-t border-border">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">New Template</p>
              <input 
                type="text" 
                placeholder="Button Label"
                value={newReply.label}
                onChange={(e) => setNewReply({ ...newReply, label: e.target.value })}
                className="w-full h-11 px-4 rounded-xl border border-border bg-background text-sm font-bold"
              />
              <textarea 
                placeholder="Message Template"
                value={newReply.message}
                onChange={(e) => setNewReply({ ...newReply, message: e.target.value })}
                className="w-full p-4 rounded-xl border border-border bg-background text-xs min-h-[100px]"
              />
              <button 
                onClick={handleAddReply}
                disabled={!newReply.label || !newReply.message}
                className="w-full h-12 bg-primary text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
              >
                <Plus size={16} /> Save Template
              </button>
            </div>
          </div>
        </div>
      </div>

      <StatusModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        type="success"
        title="Sync Successful"
        message="The YO!Top10 global state has been updated. All platform constraints are now active."
        actionLabel="Confirmed"
      />

      <ConfirmationModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteReply}
        title="Delete Template?"
        message="This moderation reason will be removed from your quick-reply library."
        confirmLabel="Remove Template"
      />
    </div>
  );
}
