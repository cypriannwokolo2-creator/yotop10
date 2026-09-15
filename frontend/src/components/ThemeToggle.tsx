'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@/components/icons/Icon';
import { getPreferredTheme, applyTheme, persistTheme, type ThemeName } from '@/lib/theme';

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeName>('dark');

  useEffect(() => {
    setTheme(getPreferredTheme());
    applyTheme(getPreferredTheme());
  }, []);

  const toggle = () => {
    const next: ThemeName = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    persistTheme(next);
    applyTheme(next);
  };

  const dark = theme === 'dark';

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 cursor-pointer text-base2 leading-none flex items-center min-h-11 hover:bg-white/10 transition"
    >
      <Icon name={dark ? 'Sun' : 'Moon'} size={18} color={dark ? '#fbbf24' : '#6366f1'} />
    </button>
  );
}
