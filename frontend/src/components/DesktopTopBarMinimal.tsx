'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import HeaderBells from './HeaderBells';
import { useSidebarStore } from '@/stores/sidebar';
import { Logo } from './Logo';
import { Icon } from './icons/Icon';

// Reference-look primary nav (ref-yotop10/index.html .nav-menu), remapped to
// real routes: Membership/Tags/Authors dropped (no route / no fit at h-14).
const NICHE_LINKS = [
  { label: 'Technology', href: '/categories/technology' },
  { label: 'Entertainment', href: '/categories/creative' },
  { label: 'Sports', href: '/categories/sports' },
  { label: 'Lifestyle', href: '/categories/lifestyle' },
] as const;

const MORE_LINKS = [
  { label: 'About', href: '/docs' },
  { label: 'Privacy Policy', href: '/docs/privacy' },
  { label: 'Terms of Use', href: '/docs/terms' },
] as const;

const LINK_BASE =
  'rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500';

const DROPDOWN_PANEL =
  'invisible absolute left-0 top-full z-50 min-w-44 translate-y-1 rounded-xl border border-white/10 bg-[#141419] p-1.5 opacity-0 shadow-xl shadow-black/50 transition-all duration-150 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100';

const DROPDOWN_ITEM =
  'block rounded-lg px-3 py-2 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500';

export default function DesktopTopBarMinimal() {
  const router = useRouter();
  const pathname = usePathname() ?? '';
  const [query, setQuery] = useState('');
  const open = useSidebarStore(s => s.open);
  // SSR + first render use the closed (72px) offset; store hydrates after mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const pushed = mounted && open;

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const active = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const linkCls = (href: string) =>
    `${LINK_BASE}${active(href) ? ' bg-white/5 text-white' : ''}`;

  return (
    <header className={`fixed top-0 left-0 right-0 z-30 h-14 bg-[var(--color-bg)]/95 border-b border-white/5 ${pushed ? 'md:left-60' : 'md:left-[72px]'}`}>
      <div className="flex h-full items-center gap-4 px-4 lg:px-6">
        {/* Brand — wordmark only; the bars mark lives in the nav rail */}
        <Link href="/" aria-label="YoTop10 home" className="shrink-0">
          <Logo showMark={false} textSize="text-[22px]" />
        </Link>
        {/* Primary nav — reference look, xl+ only (sidebar rail covers <xl) */}
        <nav aria-label="Primary" className="hidden shrink-0 items-center gap-0.5 xl:flex">
          <Link href="/explore" className={linkCls('/explore')} aria-current={active('/explore') ? 'page' : undefined}>
            Explore
          </Link>
          <div className="group relative">
            <Link
              href="/categories"
              className={`${linkCls('/categories')} inline-flex items-center gap-1`}
              aria-current={active('/categories') ? 'page' : undefined}
              aria-haspopup="true"
            >
              Niches
              <Icon name="ChevronDown" size={14} className="text-zinc-500" />
            </Link>
            <div className={DROPDOWN_PANEL}>
              {NICHE_LINKS.map(n => (
                <Link key={n.href} href={n.href} className={DROPDOWN_ITEM}>
                  {n.label}
                </Link>
              ))}
            </div>
          </div>
          <Link href="/arguments" className={linkCls('/arguments')} aria-current={active('/arguments') ? 'page' : undefined}>
            Arguments
          </Link>
          <Link href="/articles" className={linkCls('/articles')} aria-current={active('/articles') ? 'page' : undefined}>
            Articles
          </Link>
          <div className="group relative">
            <button
              type="button"
              className={`${LINK_BASE} inline-flex cursor-pointer items-center gap-1`}
              aria-haspopup="true"
            >
              More
              <Icon name="ChevronDown" size={14} className="text-zinc-500" />
            </button>
            <div className={DROPDOWN_PANEL}>
              {MORE_LINKS.map(n => (
                <Link key={n.href} href={n.href} className={DROPDOWN_ITEM}>
                  {n.label}
                </Link>
              ))}
            </div>
          </div>
        </nav>
        <div className="relative flex-1 max-w-2xl">
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
