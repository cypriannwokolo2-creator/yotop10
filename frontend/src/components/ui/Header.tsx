'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Moon, Sun, Menu, User, Search, Bell, Plus, TrendingUp, Bookmark, Clock, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { API } from '@/lib/api';
import { getFingerprint } from '@/lib/fingerprint';
import Logo from './Logo';
import UserMenu from '@/components/auth/UserMenu';
import MobileMenu from './MobileMenu';

import { useAuth } from '@/context/PublicAuthContext';

export default function Header() {
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const { user, loading, status } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('yotop10_theme');
    if (saved === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

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

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="w-full px-6 h-16 flex items-center">
        {/* Left: Logo */}
        <Logo size="md" className="flex-shrink-0" />

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-7 flex-1 justify-center mx-8">
          <Link href="/feed" className="nav-link text-base font-semibold text-muted-foreground px-3 py-1" data-text="Explore">
            <span>Explore</span>
          </Link>
          <Link href="/trending" className="text-base font-semibold text-muted-foreground flex items-center gap-1.5 group">
            <TrendingUp size={16} className="group-hover:text-primary transition-colors" />
            <span className="nav-link px-1" data-text="Trending">Trending</span>
          </Link>
          <Link href="/categories" className="nav-link text-base font-semibold text-muted-foreground px-3 py-1" data-text="Categories">
            <span>Categories</span>
          </Link>
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
          {/* Create List button (authenticated only) */}
          {user && (
            <Link
              href="/submit"
              className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors"
            >
              <Plus size={16} />
              <span>Create List</span>
            </Link>
          )}

          {/* Notifications (authenticated only) */}
          {user && (
            <button className="p-2 rounded-full hover:bg-muted transition-colors relative">
              <Bell size={18} className="text-muted-foreground" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
            </button>
          )}

          {/* Quick Actions dropdown (authenticated only) */}
          {user && (
            <div className="relative hidden md:block">
              <button
                onClick={() => setQuickActionsOpen(!quickActionsOpen)}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <ChevronDown size={18} className={cn('text-muted-foreground transition-transform', quickActionsOpen && 'rotate-180')} />
              </button>

              {quickActionsOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-xl shadow-lg py-1.5 z-50">
                  <Link
                    href="/bookmarks"
                    onClick={() => setQuickActionsOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                  >
                    <Bookmark size={15} className="text-muted-foreground" />
                    <span>Bookmarks</span>
                  </Link>
                  <Link
                    href="/history"
                    onClick={() => setQuickActionsOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                  >
                    <Clock size={15} className="text-muted-foreground" />
                    <span>History</span>
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Search icon (hidden on homepage) */}
          {!isHomePage && (
            <button
              onClick={() => setSearchModalOpen(true)}
              className="p-2 rounded-full hover:bg-muted transition-colors"
              aria-label="Search"
            >
              <Search size={18} className="text-muted-foreground" />
            </button>
          )}

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-muted transition-colors"
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* User avatar (everyone) */}
          {user ? (
            <UserMenu username={user.username} />
          ) : (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-muted/50">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                <User size={13} className="text-primary" />
              </div>
              <span className="text-xs text-muted-foreground font-mono">
                {user?.user_id ? `#${user.user_id.slice(-4)}` : 'Guest'}
              </span>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2 rounded-full hover:bg-muted transition-colors"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Search Modal (full-screen, desktop + mobile) */}
      {searchModalOpen && (
        <div className="fixed inset-0 z-[60] bg-background">
          <div className="flex flex-col h-full max-w-4xl mx-auto px-4 py-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => { setSearchModalOpen(false); setSearchQuery(''); }}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <ChevronDown size={24} className="text-muted-foreground" />
              </button>
              <h2 className="font-semibold text-lg">Search</h2>
              <div className="w-10" />
            </div>

            {/* Search Input */}
            <div className="relative mb-6">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search lists, articles, users..."
                className="w-full h-14 pl-5 pr-14 rounded-2xl border border-border bg-card text-lg focus:outline-none focus:ring-2 focus:ring-ring/30"
                autoFocus
              />
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-muted transition-colors"
              >
                <ChevronDown size={20} className="text-muted-foreground" />
              </button>
            </div>

            {/* Content placeholder */}
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Search size={48} className="text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">Start typing to search</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
