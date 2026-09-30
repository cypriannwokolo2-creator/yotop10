import { create } from 'zustand';

// Shared desktop sidebar state. The rail (72px) expands to 240px on hover,
// on click/tap of the collapsed rail, and collapses on pointer leave or an
// outside click. ContentShell and DesktopTopBarMinimal read this store so
// the site body is PUSHED left in sync (not overlaid).
interface SidebarState {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
