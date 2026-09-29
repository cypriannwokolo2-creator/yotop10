'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from './Logo';
import { Icon } from './icons/Icon';
import { useSlideMenu } from '@/stores/slideMenu';

export default function DesktopTopBar() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const setMenuOpen = useSlideMenu(s => s.setOpen);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-[var(--color-bg)]/95 border-b border-white/5">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-3 sm:px-6">
        {/* Brand wordmark only — no mark, no bell, no profile on small screens */}
        <Logo markHeight={26} textSize="text-xl" showMark={false} />

        <div className="show-from-sm flex-1 mx-4 justify-center">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleSearch}
            placeholder="Fact mine. Debate ground. Search rankings..."
            className="w-full max-w-xl bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-orange-500/50 focus:outline-none backdrop-blur-md transition"
          />
        </div>

        {/* Menu icon lives at the far right on small screens */}
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Menu"
          className="flex items-center justify-center min-w-11 min-h-11 text-zinc-500 hover:text-orange-500 transition rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
        >
          <Icon name="Menu" size={22} />
        </button>
      </div>
    </header>
  );
}
