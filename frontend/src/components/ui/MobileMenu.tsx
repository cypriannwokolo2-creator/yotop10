'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, TrendingUp, Star, Settings, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    const mediaQuery = window.matchMedia('(min-width: 768px)');

    const syncMenuStateWithViewport = () => {
      if (mediaQuery.matches) {
        document.body.style.overflow = '';
        if (isOpen) onClose();
      } else {
        document.body.style.overflow = isOpen ? 'hidden' : '';
      }
    };

    syncMenuStateWithViewport();
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
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/75 z-[60] transition-opacity md:hidden',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          'fixed inset-0 w-screen bg-background border-l border-border z-[70] shadow-2xl',
          'transform transition-transform duration-300 ease-out md:hidden',
          'flex flex-col',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <span className="font-bold text-xl">Menu</span>
          <button
            onClick={onClose}
            className="p-2.5 rounded-full hover:bg-muted transition-colors"
            aria-label="Close menu"
          >
            <X size={22} />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 py-5 px-2">
          {menuItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={onClose}
              className="flex items-center gap-4 px-4 py-3.5 text-base font-semibold rounded-xl hover:bg-muted transition-colors"
            >
              <item.icon size={20} className="text-muted-foreground" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-5 border-t border-border space-y-5">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-between w-full py-2.5"
          >
            <span className="text-base font-semibold">Dark Mode</span>
            <div
              className={cn(
                'w-12 h-6 rounded-full transition-colors relative',
                darkMode ? 'bg-primary' : 'bg-muted'
              )}
            >
              <div
                className={cn(
                  'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
                  darkMode ? 'left-7' : 'left-1'
                )}
              />
            </div>
          </button>

          <p className="text-xs text-muted-foreground text-center">
            YoTop10 v1.0.0
          </p>
        </div>
      </div>
    </>
  );
}
