'use client';

import { useEffect } from 'react';
import { Icon } from '@/components/icons/Icon';
import { useThemeStore } from '@/stores/theme';

export function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme);
  const hydrate = useThemeStore((s) => s.hydrate);
  const toggle = useThemeStore((s) => s.toggle);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const dark = theme === 'dark';

  return (
    <button
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 cursor-pointer leading-none flex items-center min-h-11 hover:bg-white/10 transition"
    >
      <Icon name={dark ? 'Sun' : 'Moon'} size={18} color={dark ? '#fbbf24' : '#6366f1'} />
    </button>
  );
}
