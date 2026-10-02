import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import type { Response } from 'express';
import { SecretsManager } from './secrets';
import { redis } from './redis';
import { User, type IUser } from '../models/User';
import { Post } from '../models/Post';
import { Comment } from '../models/Comment';
import { toDefaultShort } from './username';
import { checkAndPromoteUser } from './trustScore';

/* ------------------------------------------------------------------ */
/* Session JWT (httpOnly cookie, 7 days — mirrors admin_token)         */
/* ------------------------------------------------------------------ */

const SESSION_TTL = '7d';
const SESSION_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

export interface SessionUser {
  user_id: string;
  username: string;
  custom_display_name?: string | null;
  email?: string | null;
  trust_score: number;
  trust_locked: boolean;
  is_admin: boolean;
  token_version: number;
  two_factor_enabled: boolean;
  restricted_until?: Date | null;
  rate_limit_override?: {
    posts_per_hour?: number | null;
    comments_per_hour?: number | null;
  };
  created_at?: Date;
}

/** Structural source — satisfied by both Mongoose documents and .lean() rows. */
interface SessionUserSource {
  user_id: string;
  username: string;
  custom_display_name?: string | null;
  email?: string | null;
  trust_score: number;
  trust_locked: boolean;
  is_admin: boolean;
  token_version: number;
  two_factor?: { enabled?: boolean } | null;
  restricted_until?: Date | null;
  rate_limit_override?: {
    posts_per_hour?: number | null;
    comments_per_hour?: number | null;
  } | null;
  created_at?: Date;
}

export function toSessionUser(user: SessionUserSource): SessionUser {
  return {
    user_id: user.user_id,
    username: user.username,
    custom_display_name: user.custom_display_name ?? null,
    email: user.email ?? null,
    trust_score: user.trust_score,
    trust_locked: user.trust_locked,
    is_admin: user.is_admin,
    token_version: user.token_version,
    two_factor_enabled: user.two_factor?.enabled === true,
    restricted_until: user.restricted_until ?? null,
    rate_limit_override: user.rate_limit_override ?? undefined,
    created_at: user.created_at,
  };
}

let jwtSecretPromise: Promise<string> | null = null;

async function getJwtSecret(): Promise<string> {
  if (!jwtSecretPromise) {
    jwtSecretPromise = SecretsManager.getSecret('JWT_SECRET');
  }
  return jwtSecretPromise;
}

export async function issueSessionToken(user: {
  user_id: string;
  username: string;
  token_version: number;
}): Promise<string> {
  const secret = await getJwtSecret();
  return jwt.sign(
    { id: user.user_id, username: user.username, token_version: user.token_version },
    secret,
    { expiresIn: SESSION_TTL },
  );
}

/**
 * Verify a session token and resolve it to the current user.
 * Returns null for malformed/expired tokens, unknown users, and
 * token_version mismatches (password change, logout-everywhere).
 */
export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  let decoded: jwt.JwtPayload;
  try {
    const secret = await getJwtSecret();
    decoded = jwt.verify(token, secret) as jwt.JwtPayload;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError || err instanceof jwt.JsonWebTokenError) {
      return null;
    }
    throw err;
  }

  const user = await User.findOne({ user_id: decoded.id }).lean();
  if (!user) return null;
  if ((user.token_version ?? 0) !== (decoded.token_version ?? 0)) return null;
  return toSessionUser(user);
}

export function setSessionCookie(res: Response, token: string): void {
  res.cookie('session_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_COOKIE_MAX_AGE,
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie('session_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
}

/* ------------------------------------------------------------------ */
/* Trusted devices (device_key cookie, SHA-256 hash stored on user)    */
/* ------------------------------------------------------------------ */

const MAX_TRUSTED_DEVICES = 10;

export function generateDeviceKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashDeviceKey(deviceKey: string): string {
  return crypto.createHash('sha256').update(deviceKey).digest('hex');
}

export function setDeviceKeyCookie(res: Response, deviceKey: string): void {
  res.cookie('device_key', deviceKey, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 365 * 24 * 60 * 60 * 1000,
  });
}

export function findTrustedDevice(
  trustedDevices: Array<{ id_hash: string }> | null | undefined,
  deviceKey: string | null | undefined,
): boolean {
  if (!deviceKey || !trustedDevices || trustedDevices.length === 0) return false;
  const idHash = hashDeviceKey(deviceKey);
  return trustedDevices.some((device) => device.id_hash === idHash);
}

/** Trust a device: dedupe by hash, insert at front, cap the list. */
export async function trustDevice(userId: string, deviceKey: string): Promise<void> {
  const idHash = hashDeviceKey(deviceKey);
  const now = new Date();
  await User.updateOne({ user_id: userId }, { $pull: { trusted_devices: { id_hash: idHash } } });
  await User.updateOne(
    { user_id: userId },
    {
      $push: {
        trusted_devices: {
          $each: [{ id_hash: idHash, created_at: now, last_seen_at: now }],
          $position: 0,
          $slice: MAX_TRUSTED_DEVICES,
        },
      },
    },
  );
}

export async function touchTrustedDevice(userId: string, deviceKey: string): Promise<void> {
  const idHash = hashDeviceKey(deviceKey);
  await User.updateOne(
    { user_id: userId, 'trusted_devices.id_hash': idHash },
    { $set: { 'trusted_devices.$.last_seen_at': new Date() } },
  );
}

/* ------------------------------------------------------------------ */
/* Login lockout — 5 failed attempts / 15 minutes (mirrors admin)      */
/* ------------------------------------------------------------------ */

const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_LOCK_MS = 15 * 60 * 1000;

const loginFailKey = (email: string): string => `auth:login_fail:${email}`;
const loginLockKey = (email: string): string => `auth:login_lock:${email}`;

export interface LoginLockStatus {
  locked: boolean;
  retryAfterSeconds: number | null;
}

export async function getLoginLockStatus(email: string): Promise<LoginLockStatus> {
  const raw = await redis.get(loginLockKey(email));
  if (!raw) return { locked: false, retryAfterSeconds: null };
  const unlockAt = parseInt(raw, 10);
  if (!Number.isFinite(unlockAt) || unlockAt <= Date.now()) {
    return { locked: false, retryAfterSeconds: null };
  }
  return { locked: true, retryAfterSeconds: Math.ceil((unlockAt - Date.now()) / 1000) };
}

/** Record a failed login attempt; returns true when it triggers the lockout. */
export async function recordLoginFailure(email: string): Promise<boolean> {
  const attempts = await redis.incr(loginFailKey(email));
  if (attempts === 1) {
    await redis.expire(loginFailKey(email), Math.ceil(LOGIN_LOCK_MS / 1000));
  }
  if (attempts >= LOGIN_MAX_ATTEMPTS) {
    await redis.set(loginLockKey(email), String(Date.now() + LOGIN_LOCK_MS), {
      EX: Math.ceil(LOGIN_LOCK_MS / 1000),
    });
    return true;
  }
  return false;
}

export async function clearLoginFailures(email: string): Promise<void> {
  await redis.del(loginFailKey(email));
  await redis.del(loginLockKey(email));
}

/* ------------------------------------------------------------------ */
/* User creation for the email/password flow                           */
/* ------------------------------------------------------------------ */

/**
 * Create a verified user from a completed registration. Auth users
 * have no device_fingerprint — they are NOT legacy_anonymous.
 */
export async function createAuthUser(input: {
  username: string;
  email: string;
  password_hash: string;
}): Promise<IUser> {
  const user_id = crypto.randomBytes(8).toString('hex');
  const email = input.email.trim().toLowerCase();

  // Custom usernames shorten to themselves; default-format names
  // shorten to their 4-char prefix. Guard the short slots against
  // collisions the same way the fingerprint minter does.
  let shortUsername = toDefaultShort(input.username);
  let defaultShort = shortUsername;
  let lastError: unknown;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const collision = await User.findOne({
      $or: [{ short_username: shortUsername }, { default_short: defaultShort }],
    }).select('_id').lean();
    if (!collision) {
      try {
        return await User.create({
          user_id,
          username: input.username,
          short_username: shortUsername,
          default_username: input.username,
          default_short: defaultShort,
          email,
          email_verified_at: new Date(),
          password_hash: input.password_hash,
          token_version: 0,
          trusted_devices: [],
          two_factor: { enabled: false, recovery_codes_hash: [] },
          trust_score: 1.0,
          is_admin: false,
          legacy_anonymous: false,
        });
      } catch (err) {
        lastError = err;
        // ROM 2.8: short_username is uniquely indexed, so a
        // racing registration can claim the short name between
        // the check above and this insert. Retry with a fresh
        // suffix; anything else is a real failure.
        if (!(err instanceof Error && 'code' in err && err.code === 11000)) {
          throw err;
        }
      }
    }
    const suffix = crypto.randomBytes(2).toString('hex');
    shortUsername = `${toDefaultShort(input.username)}${suffix}`;
    defaultShort = shortUsername;
  }
  throw lastError instanceof Error
    ? lastError
    : new Error('Failed to allocate a unique short username');
}

/* ------------------------------------------------------------------ */
/* GET /me response — same shape as the legacy GET /api/users/me       */
/* ------------------------------------------------------------------ */

export interface UserMeContext {
  user_id: string;
  username: string;
  custom_display_name: string | null;
  profile_image_url: string | null;
  bio: string;
  links: { medium?: string; x?: string; github?: string };
  trust_score: number;
  trust_level: 'newbie' | 'ghost' | 'troll' | 'neutral' | 'scholar';
  post_count: number;
  comment_count: number;
  posts_approved: number;
  posts_rejected: number;
  created_at?: Date;
  first_seen_at?: Date;
}

export async function buildMeResponse(user: {
  user_id: string;
  username: string;
  custom_display_name?: string | null;
  trust_score: number;
  created_at?: Date;
}): Promise<UserMeContext> {
  // Keep the trust tier fresh — same fire-and-forget pattern as
  // the legacy GET /api/users/me handler.
  checkAndPromoteUser(user.user_id).catch(() => {});

  const userDoc = await User.findOne({ user_id: user.user_id })
    .select('profile_image_url bio links trust_level')
    .lean();

  const userPosts = await Post.aggregate<{ _id: string; count: number }>([
    { $match: { author_id: user.user_id } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const commentCount = await Comment.countDocuments({ author_id: user.user_id });

  const postCounts: Record<string, number> = {};
  for (const item of userPosts) {
    postCounts[item._id] = item.count;
  }
  const postsApproved = postCounts.approved || 0;
  const postsRejected = postCounts.rejected || 0;
  const postCount = postsApproved + postsRejected + (postCounts.pending_review || 0);

  return {
    user_id: user.user_id,
    username: user.custom_display_name || user.username,
    custom_display_name: user.custom_display_name || null,
    profile_image_url: userDoc?.profile_image_url || null,
    bio: userDoc?.bio || '',
    links: userDoc?.links || {},
    trust_score: user.trust_score,
    trust_level: userDoc?.trust_level || 'newbie',
    post_count: postCount,
    comment_count: commentCount,
    posts_approved: postsApproved,
    posts_rejected: postsRejected,
    created_at: user.created_at,
    first_seen_at: user.created_at,
  };
}
