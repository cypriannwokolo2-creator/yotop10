import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { verifySessionToken, type SessionUser } from '../lib/userAuth';

const SESSION_COOKIE = 'session_token';
const GUEST_COOKIE = 'guest_id';

/**
 * Client IP — moved here from the retired fingerprint middleware
 * (M41.2). Shared by rate limiting, audit logs, and analytics.
 */
export const getClientIp = (req: {
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
  socket?: { remoteAddress?: string };
}): string => {
  if (req.ip && req.ip !== '::1' && req.ip !== '127.0.0.1') return req.ip;
  const xForwardedFor = req.headers['x-forwarded-for'] as string;
  if (xForwardedFor) {
    const ips = xForwardedFor.split(',').map(ip => ip.trim());
    return ips[0];
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
};

/** 32-byte random guest id (hex) — never mints a user record. */
export function generateGuestId(): string {
  return crypto.randomBytes(32).toString('hex');
}

function setGuestCookie(res: Response, guestId: string): void {
  res.cookie(GUEST_COOKIE, guestId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 365 * 24 * 60 * 60 * 1000,
  });
}

/**
 * M41.2 global identity middleware (docs/plans-auth-m41.md §2/§7).
 *
 * Replaces the anonymous fingerprint-identity middleware. Every
 * request resolves to one of:
 *
 *   1. A verified session — `session_token` cookie maps to a real
 *      user. Exposed as BOTH `req.session` (SessionUser) and
 *      `req.user` (same shape, for downstream compatibility with
 *      routes written against the legacy middleware).
 *   2. An anonymous visitor — no valid session. A `guest_id` cookie
 *      (32-byte random, 1-year, httpOnly, sameSite=strict) is set
 *      when absent and exposed as `req.guest_id`. Guests may comment
 *      and fire within tight rate limits; everything else fails
 *      closed at the route (401).
 *
 * No user records are ever created here. Invalid/expired session
 * cookies are ignored (request proceeds anonymously).
 */
export async function userAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // 1. Session identity
    const token = req.cookies?.[SESSION_COOKIE];
    if (typeof token === 'string' && token.length > 0) {
      try {
        const session: SessionUser | null = await verifySessionToken(token);
        if (session) {
          req.session = session;
          req.user = {
            user_id: session.user_id,
            username: session.username,
            custom_display_name: session.custom_display_name,
            trust_score: session.trust_score,
            trust_locked: session.trust_locked,
            is_admin: session.is_admin,
            created_at: session.created_at,
            restricted_until: session.restricted_until,
            rate_limit_override: session.rate_limit_override,
          };
        }
      } catch (err) {
        // Malformed cookie payloads must not break the request —
        // treat as anonymous; write paths fail closed downstream.
        console.warn('[Auth] Session verification error:', (err as Error).message);
      }
    }

    // 2. Guest identity (never mints a user)
    const guestId = req.cookies?.[GUEST_COOKIE];
    if (typeof guestId === 'string' && guestId.length > 0) {
      req.guest_id = guestId;
    } else {
      const newGuestId = generateGuestId();
      setGuestCookie(res, newGuestId);
      req.guest_id = newGuestId;
    }

    next();
  } catch (err) {
    next(err);
  }
}
