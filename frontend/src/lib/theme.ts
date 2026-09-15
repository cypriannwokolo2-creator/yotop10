export const THEME_STORAGE_KEY = 'yotop10_theme';
export const LIGHT_CLASS = 'light-mode';
export const DESKTOP_MIN_WIDTH = 980;

export type ThemeName = 'light' | 'dark';

export function isDesktopWidth(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia(`(min-width: ${DESKTOP_MIN_WIDTH}px)`).matches;
}

export function getStoredTheme(): ThemeName | null {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    /* storage unavailable (private mode) — fall through to device default */
  }
  return null;
}

export function getPreferredTheme(): ThemeName {
  return getStoredTheme() ?? (isDesktopWidth() ? 'light' : 'dark');
}

export function applyTheme(theme: ThemeName): void {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle(LIGHT_CLASS, theme === 'light');
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'light' ? '#f8f8fa' : '#05050f');
}

export function persistTheme(theme: ThemeName): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* storage unavailable — theme still applies for this session */
  }
}

export const THEME_INIT_SCRIPT = `(function(){try{var s=null;try{s=localStorage.getItem('${THEME_STORAGE_KEY}');}catch(e){}var t=(s==='light'||s==='dark')?s:(window.matchMedia('(min-width: ${DESKTOP_MIN_WIDTH}px)').matches?'light':'dark');if(t==='light'){document.documentElement.classList.add('${LIGHT_CLASS}');}var m=document.querySelector('meta[name="theme-color"]');if(m){m.setAttribute('content',t==='light'?'#f8f8fa':'#05050f');}}catch(e){}})();`;
