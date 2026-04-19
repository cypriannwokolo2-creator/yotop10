import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { verifySession, type SessionPayload } from '../lib/sessionAuth';
import crypto from 'crypto';

// Extend Express Request type
declare module 'express' {
  interface Request {
    user?: {
      user_id: string;
      username: string;
      device_fingerprint: string;
      trust_score: number;
      trust_locked: boolean;
      rate_limit_override?: {
        posts_per_hour?: number | null;
        comments_per_hour?: number | null;
      };
      is_admin: boolean;
    };
    /** Set when auth was via Bearer session token */
    session_payload?: SessionPayload;
  }
}

/**
 * Identity middleware — runs on ALL /api routes.
 * Auth priority:
 *   1. Authorization: Bearer <session_token>  (preferred — revocable, expiring)
 *   2. X-Device-Fingerprint header             (legacy / first-time auth exchange)
 *   3. Anonymous — no user context attached
 *
 * If a Bearer token is present but invalid (revoked/expired), returns 401.
 * This ensures that signout actually invalidates the session on the client.
 */
export const fingerprintMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  // --- 1. Try Bearer session token first ---
  const authHeader = req.headers['authorization'] as string | undefined;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const result = await verifySession(token);
      if (result) {
        const { payload, user } = result;
        req.user = {
          user_id: user.user_id,
          username: user.username,
          device_fingerprint: user.device_fingerprint,
          trust_score: user.trust_score,
          trust_locked: user.trust_locked,
          rate_limit_override: user.rate_limit_override,
          is_admin: user.is_admin,
        };
        req.session_payload = payload;
        return next();
      }
    } catch (err) {
      console.error('[Auth] Bearer token verification error:', err);
    }
    // Bearer token was provided but session is revoked/expired — return 401
    // so the frontend knows to clear the stale session and prompt for re-auth
    return res.status(401).json({ error: 'Session revoked or expired' });
  }

  // --- 2. Try fingerprint header ---
  const deviceFingerprint = req.headers['x-device-fingerprint'] as string;

  if (!deviceFingerprint) {
    return next(); // Anonymous — no user context
  }

  try {
    let user = await User.findOne({ device_fingerprint: deviceFingerprint });

    if (!user) {
      // Create new user on first action with fingerprint
      const userId = crypto.randomBytes(4).toString('hex');
      const username = `a_${userId.slice(-4)}`;

      user = await User.create({
        user_id: userId,
        username,
        device_fingerprint: deviceFingerprint,
        trust_score: 1.0,
        is_admin: false,
      });

      console.log(`[Auth] Created new user: ${username} for fingerprint ${deviceFingerprint.slice(0, 8)}...`);
    }

    req.user = {
      user_id: user.user_id,
      username: user.username,
      device_fingerprint: user.device_fingerprint,
      trust_score: (user as any).trust_score,
      trust_locked: (user as any).trust_locked,
      rate_limit_override: (user as any).rate_limit_override,
      is_admin: user.is_admin,
    };

    next();
  } catch (error) {
    console.error('[Auth] Middleware error:', error);
    res.status(500).json({ error: 'Failed to process user identity' });
  }
};
