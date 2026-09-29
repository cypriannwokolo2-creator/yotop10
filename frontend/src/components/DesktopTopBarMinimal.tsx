'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import HeaderBells from './HeaderBells';
import { Icon } from './icons/Icon';

export default function DesktopTopBarMinimal() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-30 h-14 bg-[var(--color-bg)]/70 backdrop-blur-xl border-b border-white/5 md:left-[72px]">
      <div className="flex h-full items-center gap-4 px-4 lg:px-6">
        {/* Brand lives in the sidebar rail — no logo here (avoids the duplicate) */}
        <div className="relative flex-1 max-w-xl">
          <Icon
            name="Search"
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
          />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleSearch}
            placeholder="Fact mine. Debate ground. Search rankings..."
            className="w-full rounded-full bg-white/5 border border-white/10 pl-10 pr-4 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-orange-500/40 focus:ring-2 focus:ring-orange-500/10 focus:outline-none transition"
          />
        </div>
        <div className="ml-auto flex items-center gap-2 shrink-0">
          <HeaderBells />
        </div>
      </div>
    </header>
  );
}
