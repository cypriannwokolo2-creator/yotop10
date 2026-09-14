import { create } from 'zustand';
import { API } from '@/lib/api';

interface AuthUser {
  user_id: string;
  username: string;
  custom_display_name?: string | null;
  profile_image_url?: string | null;
  bio?: string;
  links?: { medium?: string; x?: string; github?: string };
  trust_score: number;
  trust_level: 'newbie' | 'ghost' | 'troll' | 'neutral' | 'scholar';
  post_count: number;
  comment_count: number;
  posts_approved: number;
  posts_rejected: number;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  initialized: boolean;
  fetchUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const CLEAR_KEYS = [
  'yotop10_fp',
  'yotop10_identity',
  'yotop10_merge_token',
  'yotop10_recent_searches',
  'yotop10_submit_draft',
];

export const useAuthStore = create<AuthState>((set) => {
  // Single-flight: every caller shares one in-flight identity resolution.
  // No polling, no parallel /me storms — one brain.
  let inFlight: Promise<void> | null = null;

  const resolveUser = async () => {
    try {
      const data = await API.getCurrentUser() as AuthUser;
      set({ user: data, loading: false, initialized: true });
    } catch (err) {
      // 425 = cookie exists but no identity yet — claim it explicitly once,
      // then load. Identity is minted only here, never on reads.
      if (err instanceof Error && err.message.includes('425')) {
        try {
          await API.initIdentity();
          const data = await API.getCurrentUser() as AuthUser;
          set({ user: data, loading: false, initialized: true });
          return;
        } catch { /* fall through to guest */ }
      }
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

    logout: async () => {
      for (const key of CLEAR_KEYS) {
        try { localStorage.removeItem(key); } catch { /* ignore */ }
      }

      // Generate a new fingerprint with random suffix so backend treats it as new device
      try {
        const { getFingerprint } = await import('@/lib/fingerprint');
        const fpHash = await getFingerprint();
        const uniqueFp = fpHash + '-' + Math.random().toString(36).slice(2, 8);
        localStorage.setItem('yotop10_fp', uniqueFp);
      } catch { /* fingerprint failed — try without it */ }

      // Claim the fresh identity explicitly, then load it
      set({ user: null, loading: false, initialized: false });
      try {
        await API.initIdentity();
        const data = await API.getCurrentUser() as AuthUser;
        set({ user: data, initialized: true });
        const { toast } = await import('@/lib/toast');
        toast.success('Logged out. New anonymous identity created.');
      } catch {
        // stay logged out — AuthInitializer will retry on next page load
      }
    },
  };
});
