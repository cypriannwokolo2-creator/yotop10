import { create } from 'zustand';

export type AuthModalMode = 'login' | 'register' | 'forgot';

export interface AuthModalOptions {
  guest?: boolean;
}

interface AuthModalState {
  open: boolean;
  mode: AuthModalMode;
  guestAllowed: boolean;
  pendingAction: (() => void) | null;
  openModal: (mode: AuthModalMode, action?: () => void, options?: AuthModalOptions) => void;
  closeModal: () => void;
}

export const useAuthModalStore = create<AuthModalState>((set) => ({
  open: false,
  mode: 'login',
  guestAllowed: false,
  pendingAction: null,

  openModal: (mode, action, options) =>
    set({
      open: true,
      mode,
      guestAllowed: options?.guest ?? false,
      pendingAction: action ?? null,
    }),

  closeModal: () =>
    set({ open: false, pendingAction: null, guestAllowed: false }),
}));
