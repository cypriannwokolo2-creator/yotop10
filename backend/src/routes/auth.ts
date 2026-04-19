import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import crypto from 'crypto';
import { User } from '../models/User';
import { Session } from '../models/Session';
import {
  createSession,
  revokeSession,
  revokeAllOtherSessions,
  getUserSessions,
} from '../lib/sessionAuth';
import { getRedisClient } from '../lib/redis';

// Helper to check if user is a guest (auto-generated username)
// Guest users have low trust_score and are not admins
const isGuestUser = (user: any): boolean => {
  // Fallback pattern check for legacy user creation
  const usernamePattern = /^a_[0-9a-f]{4}$/;
  if (!usernamePattern.test(user.username)) {
    return false;
  }
  // Additional safeguard: guest accounts should have trust_score < 1.8 and not be admins
  return user.trust_score < 1.8 && !user.is_admin;
};

const router: Router = Router();

// ---------------------------------------------------------------------------
// 1. POST /auth/session — Exchange fingerprint for session token
//    Called on first user action (lazy identity)
// ---------------------------------------------------------------------------
router.post(
  '/session',
  body('device_fingerprint').isString().notEmpty(),
  body('device_label').optional().isString(),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { device_fingerprint, device_label = 'Unknown Device' } = req.body;

      // Find or create user by fingerprint
      let user = await User.findOne({ device_fingerprint });

      if (!user) {
        const userId = crypto.randomBytes(4).toString('hex');
        const username = `a_${userId.slice(-4)}`;
        user = await User.create({
          user_id: userId,
          username,
          device_fingerprint,
          trust_score: 1.0,
          is_admin: false,
        });
        console.log(`[Auth] New user created: ${username}`);
      }

      const { token, expires_at } = await createSession(user.user_id, device_label);

      res.json({
        token,
        expires_at,
        username: user.custom_display_name || user.username,
      });
    } catch (error) {
      console.error('POST /auth/session error:', error);
      res.status(500).json({ error: 'Failed to create session' });
    }
  }
);

// ---------------------------------------------------------------------------
// 2. POST /auth/session/refresh — Refresh session token
//    Requires existing valid session (Bearer token)
// ---------------------------------------------------------------------------
router.post('/session/refresh', async (req: Request, res: Response) => {
  if (!req.user || !req.session_payload) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    // Get current session's device label before revoking
    const currentSession = await Session.findOne({
      session_id: req.session_payload.session_id,
    });
    const deviceLabel = currentSession?.device_label || 'Unknown Device';

    // Revoke old session
    await revokeSession(req.session_payload.session_id);

    // Issue new session
    const { token, expires_at } = await createSession(req.user.user_id, deviceLabel);

    res.json({
      token,
      expires_at,
      username: req.user.username,
    });
  } catch (error) {
    console.error('POST /auth/session/refresh error:', error);
    res.status(500).json({ error: 'Failed to refresh session' });
  }
});


// ---------------------------------------------------------------------------
// 6. POST /auth/transfer/initiate — Generate QR transfer session
//    Source device calls this. Creates a transfer session in Redis.
// ---------------------------------------------------------------------------
router.post('/transfer/initiate', async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  // Prevent guest users from initiating transfers
  if (isGuestUser(req.user)) {
    return res.status(403).json({ error: 'Guest users cannot link devices' });
  }

  try {
    const sessionId = crypto.randomUUID();
    const redis = await getRedisClient();

    // QR data encodes the session ID (the receiving device sends this back)
    const qrData = JSON.stringify({
      type: 'yotop10_transfer',
      session_id: sessionId,
    });

    // Store transfer session in Redis (5 min TTL)
    await redis.setEx(
      `transfer:${sessionId}`,
      300,
      JSON.stringify({
        source_user_id: req.user.user_id,
        status: 'pending',         // pending → awaiting_approval → confirmed
        created_at: Date.now(),
      })
    );

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    res.json({
      session_id: sessionId,
      qr_data: qrData,
      expires_at: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('POST /auth/transfer/initiate error:', error);
    res.status(500).json({ error: 'Failed to initiate transfer' });
  }
});

// ---------------------------------------------------------------------------
// 7. POST /auth/transfer/approve — Source device approves the transfer
//    Called by the SOURCE device after receiving device scans QR
// ---------------------------------------------------------------------------
router.post(
  '/transfer/approve',
  body('session_id').isString().notEmpty(),
  async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    try {
      const { session_id } = req.body;
      const redis = await getRedisClient();
      const raw = await redis.get(`transfer:${session_id}`);

      if (!raw) {
        return res.status(404).json({ success: false, message: 'Transfer session expired or not found' });
      }

      const data = JSON.parse(raw);

      // Only the source user can approve
      if (data.source_user_id !== req.user.user_id) {
        return res.status(403).json({ success: false, message: 'Not authorized to approve this transfer' });
      }

      if (data.status !== 'awaiting_approval') {
        return res.status(400).json({ success: false, message: `Cannot approve — current status: ${data.status}` });
      }

      // Update status to confirmed
      data.status = 'confirmed';
      const ttl = await redis.ttl(`transfer:${session_id}`);
      await redis.setEx(`transfer:${session_id}`, ttl > 0 ? ttl : 60, JSON.stringify(data));

      res.json({ success: true, message: 'Transfer approved' });
    } catch (error) {
      console.error('POST /auth/transfer/approve error:', error);
      res.status(500).json({ success: false, message: 'Failed to approve transfer' });
    }
  }
);

// ---------------------------------------------------------------------------
// 8. POST /auth/transfer/confirm — Receiving device confirms transfer
//    After scanning QR, the receiving device sends the session_id here.
//    This sets status to awaiting_approval (source device must approve).
//    If already confirmed, issues a session token.
// ---------------------------------------------------------------------------
router.post(
  '/transfer/confirm',
  body('session_id').isString().notEmpty(),
  async (req: Request, res: Response) => {
    try {
      const { session_id } = req.body;
      const redis = await getRedisClient();
      const raw = await redis.get(`transfer:${session_id}`);

      if (!raw) {
        return res.status(404).json({ success: false, message: 'Transfer session expired or not found' });
      }

      const data = JSON.parse(raw);

      // If pending → move to awaiting_approval (source must approve)
      if (data.status === 'pending') {
        data.status = 'awaiting_approval';
        const ttl = await redis.ttl(`transfer:${session_id}`);
        await redis.setEx(`transfer:${session_id}`, ttl > 0 ? ttl : 60, JSON.stringify(data));

        return res.json({
          success: false,
          message: 'Waiting for approval on source device',
          token: '',
          expires_at: '',
          username: '',
        });
      }

      // If confirmed → issue session token to receiving device
      if (data.status === 'confirmed') {
        const user = await User.findOne({ user_id: data.source_user_id });
        if (!user) {
          return res.status(400).json({ success: false, message: 'Source user not found' });
        }

        const deviceLabel = req.headers['user-agent']?.slice(0, 50) || 'Transferred Device';
        const { token, expires_at } = await createSession(user.user_id, deviceLabel);

        // Clean up transfer session
        await redis.del(`transfer:${session_id}`);

        return res.json({
          success: true,
          token,
          expires_at,
          username: user.custom_display_name || user.username,
        });
      }

      // Still awaiting_approval — tell receiver to keep polling
      return res.json({
        success: false,
        message: 'Still waiting for approval',
        token: '',
        expires_at: '',
        username: '',
      });
    } catch (error) {
      console.error('POST /auth/transfer/confirm error:', error);
      res.status(500).json({ success: false, message: 'Transfer failed' });
    }
  }
);

// ---------------------------------------------------------------------------
// 9. GET /auth/transfer/status/:id — Poll transfer session status
// ---------------------------------------------------------------------------
router.get('/transfer/status/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const redis = await getRedisClient();
    const raw = await redis.get(`transfer:${id}`);

    if (!raw) {
      return res.json({ status: 'expired' });
    }

    const data = JSON.parse(raw);
    res.json({ status: data.status });
  } catch (error) {
    console.error('GET /auth/transfer/status error:', error);
    res.status(500).json({ error: 'Failed to check transfer status' });
  }
});

// ---------------------------------------------------------------------------
// 10. GET /auth/sessions — List all active sessions for current user
// ---------------------------------------------------------------------------
router.get('/sessions', async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const currentSessionId = req.session_payload?.session_id;
    const sessions = await getUserSessions(req.user.user_id, currentSessionId);
    res.json({ sessions });
  } catch (error) {
    console.error('GET /auth/sessions error:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// ---------------------------------------------------------------------------
// 11. DELETE /auth/sessions/:id — Revoke a specific session
// ---------------------------------------------------------------------------
router.delete('/sessions/:id', async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  try {
    const { id } = req.params;

    // Verify session belongs to this user
    const session = await Session.findOne({ session_id: id, user_id: req.user.user_id });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    // Don't allow revoking current session via this endpoint
    if (req.session_payload?.session_id === id) {
      return res.status(400).json({ success: false, message: 'Cannot revoke your current session here. Use sign out.' });
    }

    await revokeSession(id);
    res.json({ success: true, message: 'Session revoked' });
  } catch (error) {
    console.error('DELETE /auth/sessions/:id error:', error);
    res.status(500).json({ success: false, message: 'Failed to revoke session' });
  }
});

// ---------------------------------------------------------------------------
// 12. POST /auth/sessions/signout — Sign out current device (revoke own session)
// ---------------------------------------------------------------------------
router.post('/sessions/signout', async (req: Request, res: Response) => {
  if (!req.user || !req.session_payload) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  try {
    await revokeSession(req.session_payload.session_id);
    res.json({ success: true, message: 'Signed out' });
  } catch (error) {
    console.error('POST /auth/sessions/signout error:', error);
    res.status(500).json({ success: false, message: 'Failed to sign out' });
  }
});

// ---------------------------------------------------------------------------
// 13. POST /auth/sessions/revoke-others — Sign out all other devices
// ---------------------------------------------------------------------------
router.post('/sessions/revoke-others', async (req: Request, res: Response) => {
  if (!req.user || !req.session_payload) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  try {
    const count = await revokeAllOtherSessions(
      req.user.user_id,
      req.session_payload.session_id
    );
    res.json({ success: true, message: `Signed out ${count} other device(s)` });
  } catch (error) {
    console.error('POST /auth/sessions/revoke-others error:', error);
    res.status(500).json({ success: false, message: 'Failed to revoke sessions' });
  }
});

// ---------------------------------------------------------------------------
// 13. POST /auth/recovery/generate — Generate/retrieve recovery key
// ---------------------------------------------------------------------------
router.post('/recovery/generate', async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const user = await User.findOne({ user_id: req.user.user_id });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Generate if it doesn't exist
    if (!user.recovery_key) {
      user.recovery_key = crypto.randomUUID();
      
      // M11.C: Elevate to Scholar status immediately upon backing up identity
      // This allows them to choose a custom username without the a_ prefix
      if (user.trust_score < 1.8) {
        user.trust_score = 1.8;
      }
      
      await user.save();
    }

    res.json({ recovery_key: user.recovery_key });
  } catch (error) {
    console.error('POST /auth/recovery/generate error:', error);
    res.status(500).json({ error: 'Failed to generate recovery key' });
  }
});

// ---------------------------------------------------------------------------
// 14. POST /auth/recovery/claim — Reclaim account via secret key
// ---------------------------------------------------------------------------
router.post('/recovery/claim', async (req: Request, res: Response) => {
  try {
    const { recovery_key } = req.body;
    if (!recovery_key) return res.status(400).json({ error: 'Recovery key required' });

    const user = await User.findOne({ recovery_key });
    if (!user) return res.status(401).json({ error: 'Invalid recovery key' });

    const deviceLabel = req.headers['user-agent']?.slice(0, 50) || 'Recovered Device';
    const { token, expires_at } = await createSession(user.user_id, deviceLabel);

    res.json({
      success: true,
      token,
      expires_at,
      username: user.custom_display_name || user.username,
    });
  } catch (error) {
    console.error('POST /auth/recovery/claim error:', error);
    res.status(500).json({ error: 'Recovery failed' });
  }
});

export default router;
