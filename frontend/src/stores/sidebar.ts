import { create } from 'zustand';

const STORAGE_KEY = 'yotop10_sidebar_collapsed';

function readStored(): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function writeStored(value: boolean): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, value ? '1' : '0');
  } catch {
    // Private browsing / storage blocked — preference simply won't persist.
  }
}

interface SidebarState {
  collapsed: boolean;
  toggle: () => void;
  hydrate: () => void;
}

export const useSidebarStore = create<SidebarState>((set, get) => ({
  collapsed: false,
  toggle: () => {
    const next = !get().collapsed;
    writeStored(next);
    set({ collapsed: next });
  },
  hydrate: () => {
    set({ collapsed: readStored() });
  },
}));
