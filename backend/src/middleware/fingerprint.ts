import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { UserDevice } from '../models/UserDevice';
import { SystemConfig } from '../models/SystemConfig';
import crypto from 'crypto';
import { redis, atomicCheckRateLimit } from '../lib/redis';
import { findMatchingUser } from '../lib/fingerprintMatching';
import { toDefaultShort } from '../lib/username';

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

/** Single read of the resolved identity — the "one brain" accessor. */
export const getFingerprintIdentity = (req: Request) => req.user ?? null;

/**
 * Cookie-bound check for identity-critical writes (renames, seed keys, device
 * link/unlink, merge confirm). A session resolved from a bare presented header
 * value has never completed a cookie round-trip — indistinguishable from an
 * impersonator reciting someone else's fingerprint — so it may read and post
 * but may NOT permanently mutate identity. The middleware sets a fresh cookie
 * on such sessions, so a simple reload + retry unblocks legitimate users.
 */
export const isCookieBound = (req: Request): boolean => req.fingerprintSource === 'cookie';

/**
 * Low-entropy fingerprints (long zero runs) come from broken/headless signal
 * environments and collide across unrelated visitors. They are the impersonation
 * vector: never a hard block (real browsers can land here), but always a risk signal.
 */
export const isLowEntropyFingerprint = (fp: string): boolean => /^0{6,}[0-9a-f]*$/i.test(fp);

/**
 * Denied fingerprints: values proven to be hand-set by abuse scripts (wrong
 * format for any generator in this codebase, seen re-minting in a loop).
 * Presented values are ignored entirely — the request falls through to the
 * grace path and receives a fresh cookie, which also heals poisoned browsers.
 */
const DENIED_FINGERPRINTS = new Set([
  '000000000f6f92bf', // bot script static value, loop-minted 2026-09-14
]);

export const isDeniedFingerprint = (fp: string | undefined): boolean =>
  !!fp && DENIED_FINGERPRINTS.has(fp);

const generateFingerprint = (): string => crypto.randomBytes(16).toString('hex');

const setIdentityCookie = (res: Response, fingerprint: string): void => {
  res.cookie('device_fingerprint', fingerprint, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 365 * 24 * 60 * 60 * 1000,
  });
};

// Cache config in Redis to avoid DB hit on every request
const CONFIG_CACHE_KEY = 'config:fingerprint_enabled';
const CONFIG_CACHE_TTL = 60; // 1 minute

async function isFingerprintEnabled(): Promise<boolean> {
  try {
    const cached = await redis.get(CONFIG_CACHE_KEY);
    if (cached !== null) return cached === '1';
    const config = await SystemConfig.findOne({ key: 'global' }).select('fingerprint_enabled').lean();
    const enabled = (config as { fingerprint_enabled?: boolean } | null)?.fingerprint_enabled === true;
    await redis.setEx(CONFIG_CACHE_KEY, CONFIG_CACHE_TTL, enabled ? '1' : '0');
    return enabled;
  } catch {
    return false; // Default to disabled on error
  }
}

type FingerprintUser = {
  user_id: string;
  username: string;
  custom_display_name?: string | null;
  device_fingerprint: string;
  device_fingerprint_aliases?: string[];
  trust_score: number;
  trust_locked: boolean;
  rate_limit_override?: { posts_per_hour?: number | null; comments_per_hour?: number | null } | null;
  is_admin: boolean;
  restricted_until?: Date | null;
  created_at?: Date;
};

/** Resolve a fingerprint to its user: direct match, retired aliases, then linked devices. */
export async function findUserByFingerprint(fingerprint: string): Promise<FingerprintUser | null> {
  const user = await User.findOne({
    $or: [{ device_fingerprint: fingerprint }, { device_fingerprint_aliases: fingerprint }],
  });
  if (user) return user as unknown as FingerprintUser;
  const deviceLink = await UserDevice.findOne({ device_fingerprint: fingerprint });
  if (deviceLink) {
    const linked = await User.findOne({ user_id: deviceLink.user_id });
    if (linked) return linked as unknown as FingerprintUser;
  }
  return null;
}

function buildUniqueUsernameParts(): { userId: string; username: string; shortUsername: string } {
  const userId = crypto.randomBytes(8).toString('hex');
  const username = `a_${userId.substring(0, 4)}_${userId.substring(4, 8)}`;
  return { userId, username, shortUsername: toDefaultShort(username) };
}

/**
 * Mint exactly one identity for a fingerprint. This is the ONLY place users
 * are created — called explicitly from write paths and POST /api/users/init,
 * never from reads.
 */
export async function createUserForFingerprint(
  req: Request,
  res: Response,
  fingerprint: string,
): Promise<FingerprintUser> {
  const fingerprintEnabled = await isFingerprintEnabled();

  // Parse Tier 0 signals from header for cross-browser matching
  let tier0: Record<string, string | number | boolean> = {};
  try {
    const t0 = req.headers['x-tier0'] as string;
    if (t0) tier0 = JSON.parse(t0);
  } catch { /* bad header — ignore */ }

  if (fingerprintEnabled && Object.keys(tier0).length > 0) {
    const matchedUserId = await findMatchingUser(tier0, {}, {});
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
    }
  }

  let { userId, username, shortUsername } = buildUniqueUsernameParts();
  let defaultUsername = username;
  let defaultShort = shortUsername;
  for (let attempt = 0; attempt < 5; attempt++) {
    const existingShort = await User.findOne({ $or: [{ short_username: shortUsername }, { default_short: shortUsername }] }).select('_id').lean();
    if (!existingShort) break;
    ({ userId, username, shortUsername } = buildUniqueUsernameParts());
    defaultUsername = username;
    defaultShort = shortUsername;
  }
  const created = await User.create({
    user_id: userId,
    username,
    short_username: shortUsername,
    default_username: defaultUsername,
    default_short: defaultShort,
    device_fingerprint: fingerprint,
    trust_score: 1.0,
    is_admin: false,
  });
  return created as unknown as FingerprintUser;
}

/**
 * ONE-BRAIN IDENTITY
 * The cookie is the single authoritative identity. The `X-Device-Fingerprint`
 * header is only a recovery hint, consulted when the cookie names nobody
 * (cookie was cleared) but the header names a known user — in which case the
 * header identity is adopted and the cookie re-set. Reads NEVER mint users;
 * anonymous requests flow through without `req.user`.
 */
export const fingerprintMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const rawHeader = req.headers['x-device-fingerprint'] as string | undefined;
  const rawCookie = req.cookies?.device_fingerprint as string | undefined;
  // Denied values are dropped before anything else: neither resolved nor minted.
  const headerFingerprint = isDeniedFingerprint(rawHeader) ? undefined : rawHeader;
  const cookieFingerprint = isDeniedFingerprint(rawCookie) ? undefined : rawCookie;

  // Bootstrap endpoints own their minting (bot challenge lives in the route).
  // The middleware MUST stay read-only here, or it would mint before the
  // route's challenge check ever runs.
  const pathname = (req.originalUrl || req.url || '').split('?')[0];
  const isBootstrap = pathname === '/api/users/init' || pathname === '/api/users/challenge';

  const fingerprint = cookieFingerprint || headerFingerprint;

  if (fingerprint) {
    req.fingerprint = fingerprint;
    req.fingerprintSource = cookieFingerprint ? 'cookie' : 'header';

    try {
      let user = await findUserByFingerprint(fingerprint);
      let recovered = false;

      if (!user && headerFingerprint && headerFingerprint !== fingerprint) {
        const headerUser = await findUserByFingerprint(headerFingerprint);
        if (headerUser) {
          user = headerUser;
          req.fingerprint = headerFingerprint;
          recovered = true;
        }
      }

      // Canonicalize: an alias or linked fingerprint always rebinds to the
      // stored identity, and the cookie is re-set so the next request is
      // cookie-bound. A bare presented value never sticks on its own.
      if (user && user.device_fingerprint !== req.fingerprint) {
        req.fingerprint = user.device_fingerprint;
        recovered = true;
      }

      if (!cookieFingerprint || recovered) {
        setIdentityCookie(res, req.fingerprint as string);
      }

      if (!user) {
        // Anonymous unless this request carries the cookie we issued: minting
        // requires proof of an ongoing visit, which one-shot scripts lack.
        // Bootstrap, reads, and cookie-less writes all flow through anonymous;
        // writes then fail closed downstream (401/425) until identity exists.
        if (isBootstrap || req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS' || !cookieFingerprint) {
          return next();
        }
        // Write-path minting is rate-limited per IP: one device needs one
        // identity; scripts needing hundreds get throttled here.
        const mintRl = await atomicCheckRateLimit(`rl:write-mint:${getClientIp(req)}`, 3600000, 5);
        if (!mintRl.allowed) {
          return res.status(429).json({ error: 'Too many new identities from this address.' });
        }
        user = await createUserForFingerprint(req, res, req.fingerprint as string);
      }

      req.user = {
        user_id: user.user_id,
        username: user.username,
        custom_display_name: user.custom_display_name,
        device_fingerprint: user.device_fingerprint,
        trust_score: user.trust_score,
        trust_locked: user.trust_locked,
        rate_limit_override: user.rate_limit_override ?? undefined,
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

  // No identity at all — grace period (set cookie, stay anonymous, no user created)
  const clientIp = getClientIp(req);
  const graceKey = `grace:${clientIp}`;

  try {
    const currentCount = await redis.incr(graceKey);
    if (currentCount === 1) await redis.expire(graceKey, Math.ceil(GRACE_PERIOD_MS / 1000));

    if (currentCount <= MAX_GRACE_REQUESTS) {
      const newFingerprint = generateFingerprint();
      setIdentityCookie(res, newFingerprint);
      req.fingerprint = newFingerprint;
      req.fingerprintSource = 'grace';
      return next();
    }

    return res.status(425).json({ error: 'Fingerprint not initialized. Please retry.', retry_after: 1 });
  } catch (error) {
    console.error('[Fingerprint] Grace period Redis error:', error);
    return res.status(503).json({ error: 'Identity service temporarily unavailable' });
  }
};
