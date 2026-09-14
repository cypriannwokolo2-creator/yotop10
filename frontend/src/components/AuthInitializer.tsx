'use client';

import { useEffect } from 'react';
import { getFingerprint } from '@/lib/fingerprint';
import { useAuthStore } from '@/stores/auth';

export default function AuthInitializer() {
  const fetchUser = useAuthStore((s) => s.fetchUser);
  const initialized = useAuthStore((s) => s.initialized);

  useEffect(() => {
    // Single-flight boot: exactly one identity resolution per mount.
    // fetchUser is single-flight in the store — concurrent calls share it.
    // No polling: recovery happens explicitly (init-on-425) or on focus.
    fetchUser().catch(() => {});

    // Warm the header fingerprint in the background (recovery hint only —
    // the cookie is the authoritative identity).
    getFingerprint().catch(() => {});

    // Retry only when the user returns to a still-guest tab.
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
