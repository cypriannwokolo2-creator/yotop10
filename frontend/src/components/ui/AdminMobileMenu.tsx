'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, LayoutDashboard, CheckSquare, FolderGit2, Settings, PlusCircle, LogOut, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

interface AdminMobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  admin: any;
  logout: () => void;
  navItems: any[];
}

export default function AdminMobileMenu({ isOpen, onClose, admin, logout, navItems }: AdminMobileMenuProps) {
  const pathname = usePathname();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] md:hidden"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={cn(
              'fixed top-0 right-0 bottom-0 w-[80vw] bg-card border-l border-border z-[110] shadow-2xl md:hidden',
              'flex flex-col overflow-hidden'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 h-16 border-b border-border bg-muted/30">
              <div className="flex flex-col">
                <span className="font-black text-xs uppercase tracking-[0.2em] text-primary">Admin Control</span>
                <span className="font-bold text-sm text-muted-foreground">Panel v1.0</span>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-muted transition-colors border border-border/50"
                aria-label="Close menu"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            {/* Admin Profile Quick View */}
            <div className="px-6 py-8 border-b border-border/50 bg-muted/10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Settings size={22} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-bold truncate leading-tight">{admin?.username}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Superuser</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Nav Items */}
            <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center justify-between px-5 py-4 rounded-2xl transition-all active:scale-[0.97] group',
                      isActive 
                        ? 'bg-primary text-white shadow-lg shadow-primary/20 ring-1 ring-primary/50' 
                        : 'hover:bg-muted text-muted-foreground hover:text-foreground border border-transparent'
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <Icon size={20} className={cn(isActive ? 'text-white' : 'text-primary/70 group-hover:text-primary')} />
                      <span className="text-sm font-bold tracking-tight">{item.name}</span>
                    </div>
                    <ChevronRight size={16} className={cn('opacity-40', isActive && 'opacity-100')} />
                  </Link>
                );
              })}
            </nav>

            {/* Footer / Sign Out */}
            <div className="p-6 border-t border-border bg-muted/20">
              <button
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 text-sm font-bold hover:bg-red-500 hover:text-white transition-all active:scale-[0.98]"
              >
                <LogOut size={18} />
                <span>Terminate Session</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
