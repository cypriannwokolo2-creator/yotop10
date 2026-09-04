'use client';

import { useEffect } from 'react';
import { getFingerprint } from '@/lib/fingerprint';
import { useAuthStore } from '@/stores/auth';

export default function AuthInitializer() {
  const fetchUser = useAuthStore((s) => s.fetchUser);
  const initialized = useAuthStore((s) => s.initialized);

  useEffect(() => {
    const state = useAuthStore.getState();
    if (state.initialized && state.user) return;

    // Option A: backend now creates user even without fingerprint, so fetch immediately
    // Do not gate on fingerprint — run in parallel and ensure fetchUser always runs even if fingerprint fails
    if (!state.initialized) {
      fetchUser().catch(() => {});
    } else if (!state.user) {
      // Already initialized but still no user (previous 425/500) — retry immediately
      fetchUser().catch(() => {});
    }

    const initFingerprint = () => {
      getFingerprint()
        .then(() => {
          const s = useAuthStore.getState();
          if (!s.user) fetchUser().catch(() => {});
        })
        .catch(() => {
          const s = useAuthStore.getState();
          if (!s.user) fetchUser().catch(() => {});
        });
    };

    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(initFingerprint, { timeout: 2000 });
    } else {
      setTimeout(initFingerprint, 300);
    }

    // Poll while still guest: retry on focus/visibility and every 4s (covers grace 425 race)
    const onFocus = () => {
      const s = useAuthStore.getState();
      if (!s.user) fetchUser().catch(() => {});
    };
    const interval = setInterval(() => {
      const s = useAuthStore.getState();
      if (!s.user) fetchUser().catch(() => {});
      else clearInterval(interval);
    }, 4000);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
      clearInterval(interval);
    };
  }, [initialized, fetchUser]);

  return null;
}
