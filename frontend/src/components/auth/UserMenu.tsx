'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { 
  User, 
  QrCode, 
  ChevronDown, 
  Monitor, 
  ShieldCheck,
  CheckCircle2,
  ShieldAlert,
  Zap,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/PublicAuthContext';
import { signOutThisDevice } from '@/lib/auth';
import { motion, AnimatePresence } from 'framer-motion';
import DeviceManager from './DeviceManager';
import AuthModal from './AuthModal';

export default function UserMenu() {
  const { user, status } = useAuth();
  const username = status === 'scholar' ? (user?.username || 'Scholar') : 'Guest';
  const [open, setOpen] = useState(false);
  const [showDevices, setShowDevices] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [initialAuthTab, setInitialAuthTab] = useState<'backup' | 'link' | 'status' | 'restore'>('backup');
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <>
      <div ref={menuRef} className="relative">
        {/* Trigger */}
        <button
          onClick={() => setOpen(!open)}
          className={cn(
            "flex items-center gap-2.5 pl-2.5 pr-3.5 py-1.5 rounded-full border border-border/60 transition-all active:scale-95 bg-background/50 backdrop-blur-sm",
            open ? "ring-2 ring-primary/20 bg-muted/30" : "hover:bg-muted/50 hover:border-border"
          )}
        >
          <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shadow-inner">
            <User size={14} className="text-primary" />
          </div>
          <div className="flex flex-col items-start leading-none">
            <span className="text-xs font-bold tracking-tight max-w-[100px] truncate">
              {status === 'scholar' ? username : 'Guest'}
            </span>
            <span className="text-[9px] font-black uppercase tracking-widest text-primary/70 mt-0.5">
              {status === 'scholar' ? 'Scholar' : 'Guest'}
            </span>
          </div>
          <ChevronDown size={14} className={cn('text-muted-foreground transition-transform duration-300 ml-1', open && 'rotate-180')} />
        </button>

        {/* Dropdown */}
        <AnimatePresence>
          {open && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute right-0 top-full mt-2 w-64 bg-card/95 backdrop-blur-xl border border-border shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] rounded-2xl py-2 z-50 overflow-hidden ring-1 ring-white/10"
            >
              <div className="px-4 py-3 border-b border-border/50 bg-muted/30">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Current Identity</p>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm truncate">{username}</span>
                  {status === 'scholar' ? (
                    <CheckCircle2 size={12} className="text-primary" />
                  ) : (
                    <ShieldAlert size={12} className="text-amber-500" />
                  )}
                </div>
              </div>

              {/* Identity Hub Trigger */}
              <div className="p-1.5">
                <button
                  onClick={() => { setShowAuthModal(true); setOpen(false); }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all group relative overflow-hidden",
                    status === 'scholar' 
                      ? "hover:bg-primary/5 text-foreground border border-transparent hover:border-primary/20" 
                      : "bg-primary text-white shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                    status === 'scholar' ? "bg-primary/10 text-primary" : "bg-white/20 text-white"
                  )}>
                    {status === 'scholar' ? <ShieldCheck size={18} /> : <Zap size={18} />}
                  </div>
                  <div className="text-left leading-tight">
                    <span className="block text-xs font-black uppercase tracking-tight">
                      {status === 'scholar' ? 'Identity Hub' : 'Become a Scholar'}
                    </span>
                    <p className={cn(
                      "text-[9px] font-medium",
                      status === 'scholar' ? "text-muted-foreground" : "text-white/80"
                    )}>
                      {status === 'scholar' ? 'Sync & Backup Identity' : 'Secure your account now'}
                    </p>
                  </div>
                </button>
              </div>

              <div className="p-1.5">
                {/* Profile link — scholars only */}
                {status === 'scholar' && (
                  <Link
                    href={`/a/${username.replace(/^a_/, '')}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl hover:bg-muted transition-colors group"
                  >
                    <User size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                    <span>Public Profile</span>
                  </Link>
                )}
              </div>

              <div className="h-px bg-border/50 mx-3 my-1" />

              <div className="p-1.5">
                {/* Transfer Identity - only for scholars */}
                {status === 'scholar' && (
                  <button
                    onClick={() => { setInitialAuthTab('link'); setShowAuthModal(true); setOpen(false); }}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl hover:bg-muted transition-colors w-full text-left group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center border border-primary/10 group-hover:bg-primary group-hover:text-white transition-all">
                      <QrCode size={16} />
                    </div>
                    <div className="flex-1">
                      <span className="block">Link New Device</span>
                      <p className="text-[10px] text-muted-foreground group-hover:text-muted-foreground/80">Connect browser or phone</p>
                    </div>
                  </button>
                )}

                {/* Manage Devices - only for scholars */}
                {status === 'scholar' && (
                  <button
                    onClick={() => { setShowDevices(true); setOpen(false); }}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl hover:bg-muted transition-colors w-full text-left group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center border border-border/50 group-hover:bg-foreground group-hover:text-background transition-all">
                      <Monitor size={16} />
                    </div>
                    <div className="flex-1">
                      <span className="block">Active Sessions</span>
                      <p className="text-[10px] text-muted-foreground group-hover:text-muted-foreground/80">Sign out remotely</p>
                    </div>
                  </button>
                )}
              </div>

              <div className="h-px bg-border/50 mx-3 my-1" />

              <div className="p-1.5">
                {/* Backup Identity - only for scholars */}
                {status === 'scholar' && (
                  <button
                    onClick={() => { setInitialAuthTab('backup'); setShowAuthModal(true); setOpen(false); }}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold rounded-xl hover:bg-primary/10 text-primary transition-all w-full text-left group"
                  >
                    <ShieldCheck size={18} />
                    <span>Backup Identity</span>
                  </button>
                )}
              </div>

              <div className="h-px bg-border/50 mx-3 my-1" />

              <div className="p-1.5">
                <button
                  onClick={() => { signOutThisDevice().then(() => setOpen(false)); }}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl hover:bg-red-500/10 text-red-500 transition-all w-full text-left group"
                >
                  <LogOut size={16} />
                  <span>Sign Out This Device</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      {showDevices && <DeviceManager onClose={() => setShowDevices(false)} />}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} initialTab={initialAuthTab} />}
    </>
  );
}
