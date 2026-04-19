'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, TrendingUp, Star, Settings, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('yotop10_theme');
    if (saved === 'dark') setDarkMode(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const syncMenuStateWithViewport = () => {
      if (mediaQuery.matches && isOpen) {
        onClose();
      }
    };

    mediaQuery.addEventListener('change', syncMenuStateWithViewport);

    return () => {
      document.body.style.overflow = '';
      mediaQuery.removeEventListener('change', syncMenuStateWithViewport);
    };
  }, [isOpen, onClose]);

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('yotop10_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('yotop10_theme', 'light');
    }
  };

  const menuItems = [
    { icon: TrendingUp, label: 'Trending', href: '/trending' },
    { icon: Star, label: 'Featured', href: '/featured' },
    { icon: Settings, label: 'Settings', href: '/settings' },
    { icon: Info, label: 'About', href: '/about' },
  ];

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
              'fixed top-0 right-0 bottom-0 w-[50vw] bg-background border-l border-border z-[110] shadow-2xl md:hidden',
              'flex flex-col overflow-hidden'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 h-16 border-b border-border">
              <span className="font-bold text-lg">Menu</span>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-muted transition-colors"
                aria-label="Close menu"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            {/* Menu Items */}
            <nav className="flex-1 py-6 px-4 space-y-2">
              {menuItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={onClose}
                  className="flex items-center gap-4 px-4 py-4 text-base font-semibold rounded-2xl hover:bg-muted transition-all active:scale-[0.97]"
                >
                  <item.icon size={22} className="text-primary" />
                  <span className="text-foreground">{item.label}</span>
                </Link>
              ))}
            </nav>

            {/* Footer */}
            <div className="p-6 border-t border-border space-y-6">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleTheme}
                className="flex items-center justify-between w-full py-1"
              >
                <span className="text-base font-semibold">Dark Mode</span>
                <div
                  className={cn(
                    'w-12 h-6 rounded-full transition-colors relative flex items-center',
                    darkMode ? 'bg-primary' : 'bg-muted'
                  )}
                >
                  <div
                    className={cn(
                      'absolute w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-transform',
                      darkMode ? 'translate-x-6.5' : 'translate-x-1'
                    )}
                  />
                </div>
              </button>

              <div className="text-center">
                <p className="text-xs text-muted-foreground font-medium">
                  YoTop10 v1.0.0
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
