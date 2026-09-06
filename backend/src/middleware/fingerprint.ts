import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { UserDevice } from '../models/UserDevice';
import { SystemConfig } from '../models/SystemConfig';
import crypto from 'crypto';
import { redis } from '../lib/redis';
import { findMatchingUser } from '../lib/fingerprintMatching';
import { toShortUsername } from '../lib/username';

declare module 'express' {
  interface Request {
    user?: {
      user_id: string;
      username: string;
      custom_display_name?: string | null;
      device_fingerprint: string;
      trust_score: number;
      trust_locked: boolean;
      rate_limit_override?: {
        posts_per_hour?: number | null;
        comments_per_hour?: number | null;
      };
      is_admin: boolean;
      restricted_until: Date | null;
      created_at?: Date;
    };
    fingerprint?: string;
  }
}

const GRACE_PERIOD_MS = 3500;
const MAX_GRACE_REQUESTS = 10;

export const getClientIp = (req: { headers: Record<string, string | string[] | undefined>; ip?: string; socket?: { remoteAddress?: string } }): string => {
  if (req.ip && req.ip !== '::1' && req.ip !== '127.0.0.1') return req.ip;
  const xForwardedFor = req.headers['x-forwarded-for'] as string;
  if (xForwardedFor) {
    const ips = xForwardedFor.split(',').map(ip => ip.trim());
    return ips[0];
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
};

const generateFingerprint = (): string => crypto.randomBytes(16).toString('hex');

// Cache config in Redis to avoid DB hit on every request
const CONFIG_CACHE_KEY = 'config:fingerprint_enabled';
const CONFIG_CACHE_TTL = 60; // 1 minute

async function isFingerprintEnabled(): Promise<boolean> {
  try {
    const cached = await redis.get(CONFIG_CACHE_KEY);
    if (cached !== null) return cached === '1';
    const config = await SystemConfig.findOne({ key: 'global' }).select('fingerprint_enabled').lean();
    const enabled = (config as any)?.fingerprint_enabled === true;
    await redis.setEx(CONFIG_CACHE_KEY, CONFIG_CACHE_TTL, enabled ? '1' : '0');
    return enabled;
  } catch {
    return false; // Default to disabled on error
  }
}

export const fingerprintMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const headerFingerprint = req.headers['x-device-fingerprint'] as string;
  const existingCookie = req.cookies?.device_fingerprint;
  const fingerprintEnabled = await isFingerprintEnabled();

  if (fingerprintEnabled) {
    // ── DEVICE FINGERPRINT MODE ──
    // Use the real device fingerprint from the header as primary identity.
    // The cookie is just a session marker, not the identity.
    const fingerprint = headerFingerprint || existingCookie;

    if (fingerprint) {
      req.fingerprint = fingerprint;

      // If header fingerprint differs from cookie, update cookie to real fingerprint
      if (headerFingerprint && existingCookie !== headerFingerprint) {
        res.cookie('device_fingerprint', headerFingerprint, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 365 * 24 * 60 * 60 * 1000,
        });
      } else if (!existingCookie && headerFingerprint) {
        res.cookie('device_fingerprint', headerFingerprint, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 365 * 24 * 60 * 60 * 1000,
        });
      }

      // Parse Tier 0 signals from header for cross-browser matching
      let tier0: Record<string, string | number | boolean> = {};
      try { const t0 = req.headers['x-tier0'] as string; if (t0) tier0 = JSON.parse(t0); } catch { /* bad header — ignore */ }

      try {
        let user = await User.findOne({ device_fingerprint: fingerprint });

        if (!user) {
          const deviceLink = await UserDevice.findOne({ device_fingerprint: fingerprint });
          if (deviceLink) {
            user = await User.findOne({ user_id: deviceLink.user_id });
          }
        }

        if (!user) {
          let userId = crypto.randomBytes(8).toString('hex');

          let matchedUserId: string | null = null;
          if (Object.keys(tier0).length > 0) {
            matchedUserId = await findMatchingUser(tier0, {}, {});
          }

          if (matchedUserId) {
            const mergeToken = crypto.randomBytes(16).toString('hex');
            const mergeRequest = {
              from_fingerprint: fingerprint,
              to_user_id: matchedUserId,
              created_at: Date.now(),
              confirmed: false,
            };
            await redis.setEx(`fingerprint:merge:${mergeToken}`, 900, JSON.stringify(mergeRequest));
            res.setHeader('x-merge-token', mergeToken);
            console.log(`[Fingerprint] Cross-browser merge pending for user ${matchedUserId}. Token: ${mergeToken.substring(0, 8)}...`);
          }

          let username = `a_${userId.substring(0, 4)}_${userId.substring(4, 8)}`;
          let shortUsername = toShortUsername(username);
          for (let attempt = 0; attempt < 5; attempt++) {
            const existingShort = await User.findOne({ short_username: shortUsername }).select('_id').lean();
            if (!existingShort) break;
            const newId = crypto.randomBytes(8).toString('hex');
            username = `a_${newId.substring(0, 4)}_${newId.substring(4, 8)}`;
            shortUsername = toShortUsername(username);
            userId = newId;
          }
          user = await User.create({ user_id: userId, username, short_username: shortUsername, device_fingerprint: fingerprint, trust_score: 1.0, is_admin: false });
        }

        req.user = {
          user_id: user.user_id,
          username: user.username,
          custom_display_name: user.custom_display_name,
          device_fingerprint: user.device_fingerprint,
          trust_score: user.trust_score,
          trust_locked: user.trust_locked,
          rate_limit_override: user.rate_limit_override,
          is_admin: user.is_admin,
          restricted_until: user.restricted_until || null,
          created_at: user.created_at,
        };

        return next();
      } catch (error) {
        console.error('[Fingerprint] Middleware error:', error);
        return res.status(500).json({ error: 'Failed to process user identity' });
      }
    }

    // No fingerprint at all — grace period (set cookie, no user created)
    const clientIp = getClientIp(req);
    const graceKey = `grace:${clientIp}`;

    try {
      const currentCount = await redis.incr(graceKey);
      if (currentCount === 1) await redis.expire(graceKey, Math.ceil(GRACE_PERIOD_MS / 1000));

      if (currentCount <= MAX_GRACE_REQUESTS) {
        const newFingerprint = generateFingerprint();
        res.cookie('device_fingerprint', newFingerprint, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 365 * 24 * 60 * 60 * 1000,
        });
        req.fingerprint = newFingerprint;
        return next();
      }

      return res.status(425).json({ error: 'Fingerprint not initialized. Please retry.', retry_after: 1 });
    } catch (error) {
      console.error('[Fingerprint] Grace period Redis error:', error);
      return res.status(503).json({ error: 'Identity service temporarily unavailable' });
    }
  } else {
    // ── COOKIE MODE (fingerprint disabled) ──
    // Use cookie as identity. No device fingerprinting.
    const fingerprint = existingCookie || headerFingerprint;

    if (fingerprint) {
      req.fingerprint = fingerprint;

      try {
        let user = await User.findOne({ device_fingerprint: fingerprint });

        if (!user) {
          const deviceLink = await UserDevice.findOne({ device_fingerprint: fingerprint });
          if (deviceLink) {
            user = await User.findOne({ user_id: deviceLink.user_id });
          }
        }

        if (!user) {
          // Create user with this cookie fingerprint
          const userId = crypto.randomBytes(8).toString('hex');
          let username = `a_${userId.substring(0, 4)}_${userId.substring(4, 8)}`;
          let shortUsername = toShortUsername(username);
          for (let attempt = 0; attempt < 5; attempt++) {
            const existingShort = await User.findOne({ short_username: shortUsername }).select('_id').lean();
            if (!existingShort) break;
            const newId = crypto.randomBytes(8).toString('hex');
            username = `a_${newId.substring(0, 4)}_${newId.substring(4, 8)}`;
            shortUsername = toShortUsername(username);
          }
          user = await User.create({ user_id: userId, username, short_username: shortUsername, device_fingerprint: fingerprint, trust_score: 1.0, is_admin: false });
        }

        req.user = {
          user_id: user.user_id,
          username: user.username,
          custom_display_name: user.custom_display_name,
          device_fingerprint: user.device_fingerprint,
          trust_score: user.trust_score,
          trust_locked: user.trust_locked,
          rate_limit_override: user.rate_limit_override,
          is_admin: user.is_admin,
          restricted_until: user.restricted_until || null,
          created_at: user.created_at,
        };

        if (!existingCookie) {
          res.cookie('device_fingerprint', fingerprint, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 365 * 24 * 60 * 60 * 1000,
          });
        }

        return next();
      } catch (error) {
        console.error('[Fingerprint] Cookie mode error:', error);
        return res.status(500).json({ error: 'Failed to process user identity' });
      }
    }

    // No cookie — grace period
    const clientIp = getClientIp(req);
    const graceKey = `grace:${clientIp}`;

    try {
      const currentCount = await redis.incr(graceKey);
      if (currentCount === 1) await redis.expire(graceKey, Math.ceil(GRACE_PERIOD_MS / 1000));

      if (currentCount <= MAX_GRACE_REQUESTS) {
        const newFingerprint = generateFingerprint();
        res.cookie('device_fingerprint', newFingerprint, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 365 * 24 * 60 * 60 * 1000,
        });
        req.fingerprint = newFingerprint;
        return next();
      }

      return res.status(425).json({ error: 'Fingerprint not initialized. Please retry.', retry_after: 1 });
    } catch (error) {
      console.error('[Fingerprint] Grace period Redis error:', error);
      return res.status(503).json({ error: 'Identity service temporarily unavailable' });
    }
  }
};
