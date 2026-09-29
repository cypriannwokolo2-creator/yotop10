'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { Icon } from './icons/Icon';
import { Logo } from './Logo';
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

// Instagram-exact navigation: icon rail (72px) on tablet widths,
// full labeled sidebar (240px) at ≥1264px, bottom tab bar below 768px.
// Rail state is purely viewport-driven — no manual toggle.
// NOTE: breakpoint classes are written out literally (never built by
// string interpolation) so Tailwind's scanner generates them.

export function DesktopSidebar() {
  const pathname = usePathname()!;
  const user = useAuthStore(s => s.user);
  const initialized = useAuthStore(s => s.initialized);
  const displayName = user?.custom_display_name || user?.username || 'User';
  const rawUsername = user?.username || 'unknown';
  const cleanUsername = toPublicSlug(rawUsername);

  return (
    <aside className="fixed top-0 left-0 z-50 h-full w-[72px] min-[1264px]:w-60 bg-[var(--color-bg)]/95 backdrop-blur-2xl border-r border-white/5 hidden md:flex flex-col overflow-y-auto transition-all duration-300 ease-out">
      {/* Brand — full lockup at ≥1264px, mark-only rail below */}
      <div className={`hidden min-[1264px]:block flex-col px-6 pt-6 pb-4 shrink-0`}>
        <Logo markHeight={32} textSize="text-[26px]" />
        <p className="text-2xs text-zinc-600 mt-1.5 leading-relaxed tracking-wide">Fact Mine. Debate Ground.</p>
      </div>
      <div className="flex min-[1264px]:hidden items-center justify-center pt-6 pb-4 shrink-0">
        <Logo markHeight={30} showWordmark={false} />
      </div>

      <hr className="border-white/5 mx-4 mb-3" />

      {/* Navigation */}
      <p className={`hidden min-[1264px]:block px-7 pb-1.5 text-3xs font-mono uppercase tracking-[0.22em] text-zinc-600`}>Menu</p>
      <nav className="flex-1 px-3 space-y-1">
        {NAV_ITEMS.map(item => {
          const isActive = item.href === '/'
            ? pathname === '/'
            : pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.label}
              href={item.href}
              title={item.label}
              className={`relative flex items-center gap-3 py-2.5 rounded-xl transition-all duration-200 text-sm active:scale-[0.98] justify-center px-0 min-[1264px]:justify-start min-[1264px]:px-4 ${
                isActive
                  ? 'text-orange-400 bg-orange-500/10 font-semibold ring-1 ring-inset ring-orange-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {isActive && (
                <span aria-hidden className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-full bg-gradient-to-b from-orange-400 to-red-600" />
              )}
              <Icon name={item.icon} size={18} />
              <span className={`hidden min-[1264px]:inline`}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="mt-auto pt-4 pb-4 px-3 space-y-3 shrink-0">
        <hr className="border-white/5 mx-1" />

        {/* User section */}
        {!initialized ? (
          <div className="flex items-center justify-center min-[1264px]:justify-start gap-3 min-[1264px]:px-4 py-2.5 rounded-xl animate-pulse">
            <span className="w-8 h-8 rounded-full bg-white/10 shrink-0" />
            <div className={`hidden min-[1264px]:block min-w-0 flex-1 space-y-1.5`}>
              <span className="block h-3 w-20 rounded bg-white/10" />
              <span className="block h-2 w-16 rounded bg-white/5" />
            </div>
          </div>
        ) : user ? (
          <Link
            href={`/a/${cleanUsername}`}
            title={`@${cleanUsername}`}
            className="flex items-center justify-center min-[1264px]:justify-start gap-3 min-[1264px]:px-4 py-2.5 rounded-xl transition-all duration-200 text-sm text-zinc-400 bg-white/[0.03] border border-white/5 hover:text-white hover:bg-white/5 hover:border-white/10 active:scale-[0.98]"
          >
            {user.profile_image_url ? (
              <Image src={user.profile_image_url} alt="" width={32} height={32} className="w-8 h-8 rounded-full object-cover shrink-0" unoptimized />
            ) : (
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold text-xs shrink-0">
                {displayName[0].toUpperCase()}
              </span>
            )}
            <div className={`hidden min-[1264px]:block min-w-0 flex-1`}>
              <div className="flex items-center gap-1">
                <span className="text-sm font-semibold text-zinc-300 truncate">{displayName}</span>
                {user.posts_approved >= 3 && <Icon name="BadgeCheck" size={12} className="text-orange-400 shrink-0" />}
              </div>
              <p className="text-3xs text-zinc-600 font-mono truncate">@{cleanUsername}</p>
            </div>
          </Link>
        ) : (
          <button
            onClick={() => useAuthStore.getState().fetchUser()}
            className="flex w-full items-center justify-center min-[1264px]:justify-start gap-3 min-[1264px]:px-4 py-2.5 rounded-xl text-sm text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition"
            title="Tap to retry — profile not loaded"
          >
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 shrink-0">
              <Icon name="User" size={16} />
            </span>
            <div className={`hidden min-[1264px]:block min-w-0 flex-1 text-left`}>
              <p className="text-sm font-semibold">Tap to retry</p>
              <p className="text-3xs text-amber-300/70 font-mono truncate">profile failed to load</p>
            </div>
          </button>
        )}

        {/* Settings + Theme */}
        <div className="flex flex-col items-center gap-2 px-0 py-1 min-[1264px]:flex-row min-[1264px]:justify-between min-[1264px]:px-4">
          <Link
            href="/settings"
            title="Settings"
            className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition"
          >
            <Icon name="Settings" size={16} />
            <span className={`hidden min-[1264px]:inline`}>Settings</span>
          </Link>
          <ThemeToggle />
        </div>

        {/* Submit CTA — icon button in rail, full button at ≥1264px */}
        <Link
          href="/new"
          title="Submit a List"
          aria-label="Submit a List"
          className="block text-sm font-bold text-white text-center shadow-lg transition hover:shadow-xl hover:scale-[1.02] bg-gradient-to-r from-orange-500 to-pink-500 mx-auto rounded-full p-3 min-[1264px]:mx-1 min-[1264px]:rounded-xl min-[1264px]:px-4 min-[1264px]:py-2.5"
        >
          <Icon name="Plus" size={14} className="block min-[1264px]:inline min-[1264px]:mr-1.5" />
          <span className={`hidden min-[1264px]:inline`}>Submit a List</span>
        </Link>
      </div>
    </aside>
  );
}
