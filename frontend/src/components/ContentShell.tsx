'use client';

import { AppFooter } from '@/components/AppFooter';

// Content offset for the 72px icon rail from 768px up. The expanded
// sidebar (hover) overlays content instead of pushing it.
export function ContentShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex-1 pt-14 flex flex-col transition-[margin] duration-300 ease-out md:ml-[72px]">
      <div className="flex-1">{children}</div>
      <AppFooter />
    </main>
  );
}
