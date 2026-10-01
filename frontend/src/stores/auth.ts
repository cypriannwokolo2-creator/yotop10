import { create } from 'zustand';
import { API } from '@/lib/api';
import type { AuthUser } from '@/lib/api/endpoints/auth';

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  initialized: boolean;
  fetchUser: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
  logout: () => Promise<void>;
}

const CLEAR_KEYS = [
  'yotop10_recent_searches',
  'yotop10_submit_draft',
  'yotop10_guest_name',
];

export const useAuthStore = create<AuthState>((set) => {
  // Single-flight: every caller shares one in-flight /auth/me request.
  let inFlight: Promise<void> | null = null;

  const resolveUser = async () => {
    try {
      const data = await API.getMe() as AuthUser;
      set({ user: data, loading: false, initialized: true });
    } catch {
      // No session (or expired) — anonymous guest. Never throws upward.
      set({ user: null, loading: false, initialized: true });
    }
  };

  return {
    user: null,
    loading: true,
    initialized: false,

    fetchUser: () => {
      if (!inFlight) {
        inFlight = resolveUser().finally(() => { inFlight = null; });
      }
      return inFlight;
    },

    setUser: (user) => set({ user }),

    logout: async () => {
      try {
        await API.logout();
      } catch {
        // Cookie is cleared server-side regardless; proceed locally.
      }
      for (const key of CLEAR_KEYS) {
        try { localStorage.removeItem(key); } catch { /* ignore */ }
      }
      set({ user: null, loading: false, initialized: true });
    },
  };
});
