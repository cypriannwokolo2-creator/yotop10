'use client';

import { useCallback } from 'react';
import { useAuthStore } from '@/stores/auth';
import { useAuthModalStore } from '@/stores/authModal';

interface RequireAuthOptions {
  /** Allow "Continue as guest" in the modal (comments, fire). */
  guest?: boolean;
}

/**
 * Gate an action behind authentication.
 *
 * - Logged in  → runs the action immediately.
 * - Logged out → opens the auth modal (login / register / forgot /
 *   guest). On successful auth the modal re-runs the pending action;
 *   with `guest: true` the user may also continue as a guest, which
 *   runs the action without an account.
 */
export function useRequireAuth() {
  const user = useAuthStore((s) => s.user);
  const openModal = useAuthModalStore((s) => s.openModal);

  const requireAuth = useCallback(
    (action: () => void, options?: RequireAuthOptions) => {
      if (useAuthStore.getState().user) {
        action();
        return;
      }
      openModal('login', action, { guest: options?.guest ?? false });
    },
    [openModal]
  );

  return { requireAuth, user };
}
