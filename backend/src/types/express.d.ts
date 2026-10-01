// Express Request type extensions
// Imported automatically by TypeScript — no explicit import needed in route files

import type { SessionUser } from '../lib/userAuth';

declare global {
  namespace Express {
    interface Request {
      user?: {
        user_id: string;
        username: string;
        custom_display_name?: string | null;
        // Optional since M41.1: email/password auth users have no
        // device fingerprint (the fingerprint system is removed in M41.2).
        device_fingerprint?: string;
        trust_score: number;
        trust_locked: boolean;
        is_admin: boolean;
        created_at?: Date;
        restricted_until?: Date | null;
        rate_limit_override?: {
          posts_per_hour?: number | null;
          comments_per_hour?: number | null;
        };
      };
      admin?: {
        id: string;
        username: string;
        role: 'super_admin' | 'mod';
        permissions: string[];
        permissions_version: number;
        token_version: number;
      };
      fingerprint?: string;
      // How the identity was presented: cookie (bound browser), header
      // (recovery hint only), or grace (freshly minted, anonymous).
      fingerprintSource?: 'cookie' | 'header' | 'grace';
      // M41.1: verified email/password session identity (set by
      // middleware/userAuth.ts). Absent when logged out.
      session?: SessionUser;
    }
  }
}

export {};
