'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { API } from '@/lib/api';
import { 
  Loader2, 
  ShieldAlert,
  LayoutGrid,
  ChevronRight,
  RotateCw,
  FolderOpen,
  Zap,
  User,
  Users
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SummaryItem {
  categoryId: string;
  name: string;
  icon: string;
  slug: string;
  count: number;
}

interface PendingCounts {
  priority: number;
  guest: number;
  scholar: number;
  total: number;
}

type SubmissionType = 'priority' | 'scholar' | 'guest';

export default function PendingDashboardPage() {
  const [summary, setSummary] = useState<SummaryItem[]>([]);
  const [counts, setCounts] = useState<PendingCounts>({ priority: 0, guest: 0, scholar: 0, total: 0 });
  const [activeTab, setActiveTab] = useState<SubmissionType>('priority');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const [sRes, cRes] = await Promise.all([
        API.adminGetPendingSummary(),
        API.adminGetPendingCounts()
      ]);
      setSummary(sRes.summary || []);
      setCounts(cRes || { priority: 0, guest: 0, scholar: 0, total: 0 });
      
      // Auto-switch to next available if current tab is empty
      if (cRes.priority === 0) {
        if (cRes.scholar > 0) setActiveTab('scholar');
        else if (cRes.guest > 0) setActiveTab('guest');
      }
    } catch (err) {
      setError('System communication failure. Verify admin credentials.');
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return (
    <div className="min-h-[400px] flex items-center justify-center">
      <Loader2 className="animate-spin text-primary" size={32} />
    </div>
  );

  const tabs = [
    { id: 'priority', label: 'Priority', icon: Zap, count: counts.priority, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { id: 'scholar', label: 'Scholars', icon: User, count: counts.scholar, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { id: 'guest', label: 'Guests', icon: Users, count: counts.guest, color: 'text-gray-500', bg: 'bg-gray-500/10' },
  ];

  return (
    <div className="pb-20">
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="relative">
            <h1 className="text-4xl font-black tracking-tight flex items-center gap-3 text-orange-600">
              <ShieldAlert size={36} />
              Editorial Command
            </h1>
            <p className="text-muted-foreground mt-2 max-w-2xl leading-relaxed font-medium">
              Vetting console engaged. Process submissions across three distinct priority layers.
            </p>
          </div>
          <button 
            onClick={() => loadData(false)}
            className="p-3 bg-card hover:bg-muted rounded-2xl border border-border transition-all active:rotate-180 duration-500 hover:text-primary shadow-sm"
          >
            <RotateCw size={24} />
          </button>
        </div>
      </div>

      {/* Submission Type Tabs */}
      <div className="flex flex-wrap gap-3 mb-10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as SubmissionType)}
            className={cn(
              "flex items-center gap-3 px-6 py-4 rounded-3xl border-2 transition-all active:scale-95",
              activeTab === tab.id 
                ? cn("border-primary bg-primary text-white shadow-xl shadow-primary/20", tab.id === 'priority' && "border-orange-500 bg-orange-500 shadow-orange-500/20")
                : "border-border bg-card text-muted-foreground hover:bg-muted hover:border-border/80"
            )}
          >
            <tab.icon size={20} strokeWidth={2.5} />
            <span className="font-black uppercase tracking-widest text-sm">{tab.label}</span>
            <span className={cn(
              "ml-2 px-2.5 py-0.5 rounded-full text-xs font-black ring-1 ring-white/20",
              activeTab === tab.id ? "bg-white/20 text-white" : cn(tab.bg, tab.color)
            )}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {error && (
        <div className="p-6 bg-red-500/10 border border-red-500/20 text-red-500 rounded-3xl mb-8 font-bold flex items-center gap-3">
          <ShieldAlert size={20} /> {error}
        </div>
      )}

      {counts[activeTab] === 0 ? (
        <div className="py-32 bg-card rounded-[3rem] border border-border flex flex-col items-center justify-center text-center px-10">
          <div className="w-24 h-24 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mb-6 border border-green-500/20">
            <LayoutGrid size={48} />
          </div>
          <h2 className="text-3xl font-black mb-3 text-foreground">Queue Cleared</h2>
          <p className="text-muted-foreground text-lg max-w-md font-medium leading-relaxed">No pending {activeTab} submissions. This dimension is in equilibrium.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {summary.map((group, index) => (
            // We'll only show categories that HAVE submissions for the active tab if possible
            // But summary currently returns total counts. For now we show all categories
            // that have AT LEAST ONE total count.
            <motion.div
              key={group.categoryId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                href={`/admin/posts/pending/category/${group.categoryId}?type=${activeTab}`}
                className="group block relative h-full bg-card hover:bg-muted/50 border border-border hover:border-primary/40 rounded-[2.5rem] p-8 transition-all duration-300 shadow-sm hover:shadow-2xl hover:shadow-primary/10"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-125" />
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 text-4xl flex items-center justify-center border border-primary/20 shadow-inner group-hover:scale-110 transition-transform">
                      {group.icon || '📌'}
                    </div>
                    <div className="px-5 py-2.5 bg-muted border border-border text-foreground rounded-2xl font-black font-mono text-xl group-hover:text-primary group-hover:border-primary/40 transition-colors">
                      {group.count}
                    </div>
                  </div>

                  <h3 className="text-2xl font-black tracking-tight mb-2 flex items-center justify-between group-hover:text-primary transition-colors">
                    {group.name}
                    <ChevronRight className="opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all" size={24} />
                  </h3>
                  
                  <p className="text-muted-foreground text-sm font-bold uppercase tracking-[0.2em] mb-6">
                    {group.slug}
                  </p>

                  <div className="flex items-center gap-2 pt-6 border-t border-border mt-auto">
                    <FolderOpen size={16} className="text-primary/40" />
                    <span className="text-xs font-black text-primary/60 uppercase tracking-widest">
                       Enter Queue
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
