'use client';

import { AppFooter } from '@/components/AppFooter';

// Instagram-exact content offset: 72px icon rail from 768px,
// 240px full sidebar at ≥1264px. Purely viewport-driven.
export function ContentShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex-1 pt-14 flex flex-col transition-[margin] duration-300 ease-out md:ml-[72px] min-[1264px]:ml-60">
      <div className="flex-1">{children}</div>
      <AppFooter />
    </main>
  );
}
