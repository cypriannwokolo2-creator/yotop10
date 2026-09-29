'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { useSidebarStore } from '@/stores/sidebar';
import { Icon } from './icons/Icon';
import { ThemeToggle } from './ThemeToggle';
import { toPublicSlug } from '@/lib/username';

const NAV_ITEMS = [
  { icon: 'Flame' as const, label: 'Home', href: '/' },
  { icon: 'Search' as const, label: 'Explore', href: '/explore' },
  { icon: 'Folder' as const, label: 'Categories', href: '/categories' },
  { icon: 'MessageCircle' as const, label: 'Arguments', href: '/arguments' },
  { icon: 'Bookmark' as const, label: 'Saved', href: '/saved' },
  { icon: 'FileText' as const, label: 'Articles', href: '/articles' },
  { icon: 'Crown' as const, label: 'Hall of Fame', href: '/hall-of-fame' },
];

export function DesktopSidebar() {
  const pathname = usePathname()!;
  const user = useAuthStore(s => s.user);
  const initialized = useAuthStore(s => s.initialized);
  const collapsed = useSidebarStore(s => s.collapsed);
  const toggle = useSidebarStore(s => s.toggle);
  const displayName = user?.custom_display_name || user?.username || 'User';
  const rawUsername = user?.username || 'unknown';
  const cleanUsername = toPublicSlug(rawUsername);

  return (
    <aside className={`fixed top-0 left-0 z-50 h-full bg-[var(--color-bg)]/95 backdrop-blur-2xl border-r border-white/5 flex flex-col overflow-y-auto -translate-x-full min-[980px]:translate-x-0 transition-all duration-300 ease-out ${collapsed ? 'w-20' : 'w-64 xl:w-72'}`}>
      {/* Logo — full brand when expanded, monogram rail mark when collapsed */}
      {collapsed ? (
        <Link href="/" className="flex items-center justify-center pt-6 pb-4 shrink-0" aria-label="YoTop10 home">
          <span className="font-accent gradient-text text-2xl tracking-normal">YO</span>
        </Link>
      ) : (
        <Link href="/" className="flex flex-col px-6 pt-6 pb-4 shrink-0">
          <div className="flex items-baseline gap-0">
            <span className="font-accent gradient-text text-3xl lg:text-4xl tracking-normal">YO</span>
            <span className="font-display text-3xl lg:text-4xl tracking-tight text-white">Top10</span>
          </div>
          <p className="text-2xs text-zinc-600 mt-1 leading-relaxed">Fact Mine. Debate Ground.</p>
        </Link>
      )}

      <hr className="border-white/5 mx-4 mb-4" />

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5">
        {NAV_ITEMS.map(item => {
          const isActive = item.href === '/'
            ? pathname === '/'
            : pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.label}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition text-sm ${
                collapsed ? 'justify-center px-0' : ''
              } ${
                isActive
                  ? 'text-orange-400 bg-orange-500/10 font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon name={item.icon} size={18} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle — Instagram-style rail switch */}
      <div className={`px-3 pb-1 shrink-0 ${collapsed ? 'flex justify-center' : ''}`}>
        <button
          type="button"
          onClick={toggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition text-sm text-zinc-500 hover:text-zinc-200 hover:bg-white/5 ${collapsed ? 'justify-center px-0 w-full' : 'w-full'}`}
        >
          <Icon name={collapsed ? 'PanelLeftOpen' : 'PanelLeftClose'} size={18} />
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>

      {/* Bottom section */}
      <div className="mt-auto pt-4 pb-4 px-3 space-y-3 shrink-0">
        <hr className="border-white/5 mx-1" />

        {/* User section */}
        {!initialized ? (
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl animate-pulse">
            <span className="w-8 h-8 rounded-full bg-white/10 shrink-0" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <span className="block h-3 w-20 rounded bg-white/10" />
              <span className="block h-2 w-16 rounded bg-white/5" />
            </div>
          </div>
        ) : user ? (
          <Link
            href={`/a/${cleanUsername}`}
            title={collapsed ? `@${cleanUsername}` : undefined}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition text-sm text-zinc-400 hover:text-white hover:bg-white/5 ${collapsed ? 'justify-center px-0' : ''}`}
          >
            {user.profile_image_url ? (
              <Image src={user.profile_image_url} alt="" width={32} height={32} className="w-8 h-8 rounded-full object-cover shrink-0" unoptimized />
            ) : (
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold text-xs shrink-0">
                {displayName[0].toUpperCase()}
              </span>
            )}
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-semibold text-zinc-300 truncate">{displayName}</span>
                  {user.posts_approved >= 3 && <Icon name="BadgeCheck" size={12} className="text-orange-400 shrink-0" />}
                </div>
                <p className="text-3xs text-zinc-600 font-mono truncate">@{cleanUsername}</p>
              </div>
            )}
          </Link>
        ) : (
          <button
            onClick={() => useAuthStore.getState().fetchUser()}
            className="flex w-full items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition text-left"
            title="Tap to retry — profile not loaded"
          >
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 shrink-0">
              <Icon name="User" size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Tap to retry</p>
              <p className="text-3xs text-amber-300/70 font-mono truncate">profile failed to load</p>
            </div>
          </button>
        )}

        {/* Settings + Theme */}
        <div className={`flex items-center py-1 ${collapsed ? 'flex-col gap-2 px-0 justify-center' : 'justify-between px-4'}`}>
          <Link
            href="/settings"
            title={collapsed ? 'Settings' : undefined}
            className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition"
          >
            <Icon name="Settings" size={16} />
            {!collapsed && 'Settings'}
          </Link>
          <ThemeToggle />
        </div>

        {/* Submit CTA — full button expanded, icon button in rail mode */}
        <Link
          href="/new"
          title={collapsed ? 'Submit a List' : undefined}
          aria-label="Submit a List"
          className={`block text-sm font-bold text-white text-center shadow-lg transition hover:shadow-xl hover:scale-[1.02] bg-gradient-to-r from-orange-500 to-pink-500 ${
            collapsed ? 'mx-auto rounded-full p-3' : 'mx-1 rounded-xl px-4 py-2.5'
          }`}
        >
          <Icon name="Plus" size={14} className={collapsed ? 'block' : 'inline mr-1.5'} />
          {!collapsed && 'Submit a List'}
        </Link>
      </div>
    </aside>
  );
}
