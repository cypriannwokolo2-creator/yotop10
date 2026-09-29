import { create } from 'zustand';
import { getPreferredTheme, applyTheme, persistTheme, type ThemeName } from '@/lib/theme';

interface ThemeState {
  theme: ThemeName;
  hydrate: () => void;
  setTheme: (theme: ThemeName) => void;
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'light',
  hydrate: () => {
    const stored = getPreferredTheme();
    applyTheme(stored);
    set({ theme: stored });
  },
  setTheme: (theme) => {
    persistTheme(theme);
    applyTheme(theme);
    set({ theme });
  },
  toggle: () => {
    get().setTheme(get().theme === 'dark' ? 'light' : 'dark');
  },
}));
