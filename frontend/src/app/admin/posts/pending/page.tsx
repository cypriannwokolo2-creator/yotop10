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
  FolderOpen
} from 'lucide-react';
import { motion } from 'framer-motion';

interface SummaryItem {
  categoryId: string;
  name: string;
  icon: string;
  slug: string;
  count: number;
}

export default function PendingDashboardPage() {
  const [summary, setSummary] = useState<SummaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSummary = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const res = await API.adminGetPendingSummary();
      setSummary(res.summary || []);
    } catch (err) {
      setError('System communication failure. Verify admin credentials.');
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  if (loading) return (
    <div className="min-h-[400px] flex items-center justify-center">
      <Loader2 className="animate-spin text-primary" size={32} />
    </div>
  );

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
              Categorical focus mode engaged. Process submissions one universe at a time for higher editorial precision.
            </p>
          </div>
          <button 
            onClick={() => loadSummary(false)}
            className="p-3 bg-card hover:bg-muted rounded-2xl border border-border transition-all active:rotate-180 duration-500 hover:text-primary shadow-sm"
          >
            <RotateCw size={24} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-6 bg-red-500/10 border border-red-500/20 text-red-500 rounded-3xl mb-8 font-bold flex items-center gap-3">
          <ShieldAlert size={20} /> {error}
        </div>
      )}

      {summary.length === 0 ? (
        <div className="py-32 bg-card rounded-[3rem] border border-border flex flex-col items-center justify-center text-center px-10">
          <div className="w-24 h-24 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mb-6 border border-green-500/20">
            <LayoutGrid size={48} />
          </div>
          <h2 className="text-3xl font-black mb-3 text-foreground">Station Cleared</h2>
          <p className="text-muted-foreground text-lg max-w-md font-medium leading-relaxed">No pending submissions found in any dimension. The archives are balanced.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {summary.map((group, index) => (
            <motion.div
              key={group.categoryId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                href={`/admin/posts/pending/category/${group.categoryId}`}
                className="group block relative h-full bg-card hover:bg-muted/50 border border-border hover:border-primary/40 rounded-[2.5rem] p-8 transition-all duration-300 shadow-sm hover:shadow-2xl hover:shadow-primary/10"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-125" />
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 text-4xl flex items-center justify-center border border-primary/20 shadow-inner group-hover:scale-110 transition-transform">
                      {group.icon || '📌'}
                    </div>
                    <div className="px-5 py-2.5 bg-orange-500 text-white rounded-2xl font-black font-mono text-xl shadow-lg shadow-orange-500/20 group-hover:animate-pulse">
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
