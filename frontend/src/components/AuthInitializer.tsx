'use client';

import { useEffect } from 'react';
import { getFingerprint } from '@/lib/fingerprint';
import { useAuthStore } from '@/stores/auth';

export default function AuthInitializer() {
  const fetchUser = useAuthStore((s) => s.fetchUser);
  const initialized = useAuthStore((s) => s.initialized);

  useEffect(() => {
    if (initialized) return;

    // Option A: backend now creates user even without fingerprint, so fetch immediately
    // Do not gate on fingerprint — run in parallel and ensure fetchUser always runs even if fingerprint fails
    fetchUser().catch(() => {});

    const initFingerprint = () => {
      getFingerprint()
        .then(() => {
          // Refresh user after fingerprint is known (ensures X-Device-Fingerprint header on next fetch)
          // Only refetch if still not initialized with a real user (avoid double fetch if already succeeded)
          const state = useAuthStore.getState();
          if (!state.user) fetchUser().catch(() => {});
        })
        .catch(() => {
          // Fingerprint blocked (private mode / AudioContext) — still ensure user is fetched
          const state = useAuthStore.getState();
          if (!state.user && !state.initialized) fetchUser().catch(() => {});
        });
    };

    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(initFingerprint, { timeout: 2000 });
    } else {
      setTimeout(initFingerprint, 300);
    }
  }, [initialized, fetchUser]);

  return null;
}
