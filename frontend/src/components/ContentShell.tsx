'use client';

import { useEffect } from 'react';
import { useSidebarStore } from '@/stores/sidebar';
import { AppFooter } from '@/components/AppFooter';

export function ContentShell({ children }: { children: React.ReactNode }) {
  const collapsed = useSidebarStore((s) => s.collapsed);
  const hydrate = useSidebarStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <main
      className={`flex-1 pt-14 flex flex-col transition-[margin] duration-300 ease-out ${
        collapsed ? 'min-[980px]:ml-20' : 'min-[980px]:ml-64 xl:ml-72'
      }`}
    >
      <div className="flex-1">{children}</div>
      <AppFooter />
    </main>
  );
}
