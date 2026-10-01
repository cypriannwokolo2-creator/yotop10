'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth';

export default function AuthInitializer() {
  const fetchUser = useAuthStore((s) => s.fetchUser);
  const initialized = useAuthStore((s) => s.initialized);

  useEffect(() => {
    // Single-flight boot: exactly one /auth/me resolution per mount.
    // fetchUser is single-flight in the store — concurrent calls share it.
    fetchUser().catch(() => {});

    // Retry only when the user returns to a still-anonymous tab
    // (e.g. they just logged in on another tab and came back).
    const onFocus = () => {
      const s = useAuthStore.getState();
      if (!s.user) fetchUser().catch(() => {});
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [initialized, fetchUser]);

  return null;
}
