'use client';

import { useState, useEffect } from 'react';
import { API } from '@/lib/api';
import { Settings, Save, Loader2, ShieldCheck, ListOrdered, UserCheck, ShieldAlert } from 'lucide-react';
import { StatusModal } from '@/components/ui';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  
  const [settings, setSettings] = useState({
    min_ranking_items: 3,
    max_ranking_items: 20,
    allow_guest_submissions: true,
    auto_approve_scholars: false,
  });

  useEffect(() => {
    API.adminGetSettings()
      .then((data) => {
        setSettings({
          min_ranking_items: data.min_ranking_items,
          max_ranking_items: data.max_ranking_items,
          allow_guest_submissions: data.allow_guest_submissions,
          auto_approve_scholars: data.auto_approve_scholars,
        });
      })
      .catch(() => setError('Failed to load portal configuration.'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
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

  if (loading) return (
    <div className="min-h-[400px] flex items-center justify-center">
      <Loader2 className="animate-spin text-primary" size={32} />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
          <Settings size={32} className="text-primary" />
          Platform Governance
        </h1>
        <p className="text-muted-foreground mt-2">
          Configure global constraints and moderation mechanics for the YoTop10 ecosystem.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl mb-8 font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* Content Constraints */}
        <div className="bg-card border border-border rounded-[2rem] p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <ListOrdered size={20} className="text-primary" />
            </div>
            <h2 className="text-xl font-bold">List Constraints</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Universal Minimum Placements</label>
              <input 
                type="number" 
                value={settings.min_ranking_items} 
                onChange={(e) => setSettings({ ...settings, min_ranking_items: parseInt(e.target.value) || 1 })}
                className="w-full h-14 px-5 rounded-2xl border border-border bg-background focus:outline-none focus:ring-4 focus:ring-primary/10 font-mono font-bold text-xl" 
              />
              <p className="text-[10px] text-muted-foreground ml-1">Requires guests and scholars to provide at least this many items.</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Platform Maximum Limit</label>
              <input 
                type="number" 
                value={settings.max_ranking_items} 
                onChange={(e) => setSettings({ ...settings, max_ranking_items: parseInt(e.target.value) || 1 })}
                className="w-full h-14 px-5 rounded-2xl border border-border bg-background focus:outline-none focus:ring-4 focus:ring-primary/10 font-mono font-bold text-xl" 
              />
              <p className="text-[10px] text-muted-foreground ml-1">The upper bound for list length to prevent database bloat.</p>
            </div>
          </div>
        </div>

        {/* Access & Moderation */}
        <div className="bg-card border border-border rounded-[2rem] p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <ShieldCheck size={20} className="text-primary" />
            </div>
            <h2 className="text-xl font-bold">Identity & Moderation</h2>
          </div>

          <div className="space-y-6">
            <label className="flex items-center justify-between p-5 border border-border rounded-2xl hover:bg-muted/30 transition-colors cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-background rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UserCheck size={20} className="text-primary" />
                </div>
                <div>
                  <p className="font-bold">Allow Guest Submissions</p>
                  <p className="text-xs text-muted-foreground">Enable anonymous users to draft lists (highly recommended for variety).</p>
                </div>
              </div>
              <input 
                type="checkbox" 
                checked={settings.allow_guest_submissions} 
                onChange={(e) => setSettings({ ...settings, allow_guest_submissions: e.target.checked })}
                className="w-6 h-6 rounded-lg text-primary border-border focus:ring-primary"
              />
            </label>

            <label className="flex items-center justify-between p-5 border border-border rounded-2xl hover:bg-muted/30 transition-colors cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-background rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ShieldAlert size={20} className="text-amber-500" />
                </div>
                <div>
                  <p className="font-bold text-amber-600">Auto-Approve Scholars</p>
                  <p className="text-xs text-muted-foreground">Bypass moderation queue for trusted scholar-level accounts.</p>
                </div>
              </div>
              <input 
                type="checkbox" 
                checked={settings.auto_approve_scholars} 
                onChange={(e) => setSettings({ ...settings, auto_approve_scholars: e.target.checked })}
                className="w-6 h-6 rounded-lg text-primary border-border focus:ring-primary"
              />
            </label>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={submitting}
          className="w-full h-16 bg-primary text-white rounded-[2rem] font-bold text-lg shadow-xl shadow-primary/20 hover:scale-[1.01] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {submitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          {submitting ? 'Applying Changes...' : 'Synchronize Config'}
        </button>
      </form>

      <StatusModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        type="success"
        title="Configuration Applied"
        message="Global platform governance settings have been successfully synchronized with the core server."
        actionLabel="Excellent"
      />
    </div>
  );
}
