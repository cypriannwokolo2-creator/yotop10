'use client';

import { useEffect, useState } from 'react';
import { AppFooter } from '@/components/AppFooter';
import { useSidebarStore } from '@/stores/sidebar';

// Content offset follows the desktop sidebar: 72px icon rail by default,
// pushed to 240px while the sidebar is expanded — the body slides with an
// animation, never overlaid. Margins apply from 768px up (md:), matching the
// rail. Exactly one ml class is rendered per state (two ml-* classes on one
// element resolve by CSS order, not class order).
export function ContentShell({ children }: { children: React.ReactNode }) {
  const open = useSidebarStore(s => s.open);
  // SSR + first client render always render the collapsed offset; the store
  // hydrates after mount, so server HTML and hydration agree.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const pushed = mounted && open;

  return (
    <main
      className={`flex-1 pt-14 flex flex-col transition-[margin] duration-300 ease-out ${pushed ? 'md:ml-60' : 'md:ml-[72px]'}`}
    >
      <div className="flex-1">{children}</div>
      <AppFooter />
    </main>
  );
}
