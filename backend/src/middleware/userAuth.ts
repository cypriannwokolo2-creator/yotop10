import { Request, Response, NextFunction } from 'express';
import { verifySessionToken } from '../lib/userAuth';

const SESSION_COOKIE = 'session_token';

/**
 * M41.1 session middleware (docs/plans-auth-m41.md §4).
 *
 * Verifies the httpOnly session_token cookie against the user store
 * (JWT signature + token_version check) and exposes the verified
 * identity as `req.session`.
 *
 * Deliberately does NOT touch `req.user`: the legacy fingerprint
 * identity keeps flowing through the fingerprint middleware untouched
 * until M41.2 retires it. No session cookie → request proceeds
 * anonymously (handlers decide whether to 401).
 */
export async function userAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = req.cookies?.[SESSION_COOKIE];
    if (typeof token === 'string' && token.length > 0) {
      const session = await verifySessionToken(token);
      if (session) {
        req.session = session;
      }
    }
    next();
  } catch (err) {
    next(err);
  }
}
