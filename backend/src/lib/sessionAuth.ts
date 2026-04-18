import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Session } from '../models/Session';
import { User } from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'default-dev-secret-change-me-in-production';
const SESSION_EXPIRY_DAYS = 30;

export interface SessionPayload {
  session_id: string;
  user_id: string;
}

/**
 * Create a new session for a user and return a signed JWT.
 */
export async function createSession(userId: string, deviceLabel: string): Promise<{
  token: string;
  session_id: string;
  expires_at: string;
}> {
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  const token = jwt.sign(
    { session_id: sessionId, user_id: userId } as SessionPayload,
    JWT_SECRET,
    { expiresIn: `${SESSION_EXPIRY_DAYS}d` }
  );

  // Store a hash of the token (never store raw JWT in DB)
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  await Session.create({
    session_id: sessionId,
    user_id: userId,
    token_hash: tokenHash,
    device_label: deviceLabel,
    expires_at: expiresAt,
  });

  return {
    token,
    session_id: sessionId,
    expires_at: expiresAt.toISOString(),
  };
}

/**
 * Verify a session JWT and return the payload + user.
 * Returns null if token is invalid, expired, or session revoked.
 */
export async function verifySession(token: string): Promise<{
  payload: SessionPayload;
  user: InstanceType<typeof User>;
} | null> {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as SessionPayload;

    // Check session still exists (not revoked)
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const session = await Session.findOne({
      session_id: payload.session_id,
      token_hash: tokenHash,
    });

    if (!session) return null; // Session was revoked

    // Check not expired (belt-and-suspenders with JWT expiry)
    if (session.expires_at < new Date()) return null;

    // Update last_active
    session.last_active = new Date();
    await session.save();

    // Load user
    const user = await User.findOne({ user_id: payload.user_id });
    if (!user) return null;

    return { payload, user };
  } catch {
    return null;
  }
}

/**
 * Revoke a specific session.
 */
export async function revokeSession(sessionId: string): Promise<boolean> {
  const result = await Session.deleteOne({ session_id: sessionId });
  return result.deletedCount > 0;
}

/**
 * Revoke all sessions for a user EXCEPT the given session.
 */
export async function revokeAllOtherSessions(userId: string, currentSessionId: string): Promise<number> {
  const result = await Session.deleteMany({
    user_id: userId,
    session_id: { $ne: currentSessionId },
  });
  return result.deletedCount;
}

/**
 * Get all active sessions for a user.
 */
export async function getUserSessions(userId: string, currentSessionId?: string) {
  const sessions = await Session.find({ user_id: userId })
    .sort({ last_active: -1 })
    .lean();

  return sessions.map((s) => ({
    session_id: s.session_id,
    device_label: s.device_label,
    last_active: s.last_active.toISOString(),
    is_current: s.session_id === currentSessionId,
    created_at: s.created_at.toISOString(),
  }));
}
