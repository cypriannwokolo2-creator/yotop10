/* eslint-disable no-restricted-syntax, @typescript-eslint/no-explicit-any -- Express middleware type chains */
import { Router } from 'express';
import { findMatchingUser, storeFingerprintObservation } from '../lib/fingerprintMatching';
import { User } from '../models/User';
import { logAudit } from '../lib/auditWriter';
import { getClientIp } from '../middleware/fingerprint';

const router: Router = Router();

/**
 * POST /api/fingerprint/submit
 * Submit full fingerprint data for matching
 * 
 * Auth: Public
 * Request body: { tier1, tier2, hash }
 * Response: { match_found: boolean, trust_score?: number }
 */
router.post('/submit', async (req, res) => {
  try {
    const { tier0, tier1, tier2, hash } = req.body;

    if (!tier1 || !tier2 || !hash) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const matchedUserId = await findMatchingUser(tier0 || {}, tier1, tier2);

    if (matchedUserId && req.user) {
      await storeFingerprintObservation(req.user.user_id, hash, tier0 || {}, tier1, tier2);

      // Demote only on a CROSS-user match (this device looks like a DIFFERENT
      // known account — the bot-cluster signal), never on a self-match, and
      // always leave an audit receipt so demotions are explainable.
      const crossUser = matchedUserId !== req.user.user_id;
      if (crossUser && req.user.trust_score === 1.0) {
        await User.findOneAndUpdate({ user_id: req.user.user_id }, { trust_score: 0.7 });
        logAudit({
          admin_id: null,
          action: 'auto_demote_cross_device',
          ip: getClientIp(req),
          metadata: { user_id: req.user.user_id, matched_user: 'different', old_score: 1.0, new_score: 0.7 },
          user_agent: req.headers['user-agent'] || '',
        });
      }

      return res.json({ match_found: true, matched_user: crossUser ? 'different' : 'same' });
    }

    if (req.user) {
      await storeFingerprintObservation(req.user.user_id, hash, tier0 || {}, tier1, tier2);
    }

    res.json({ match_found: false });
  } catch (error) { res.status(500).json({ error: 'Failed to process fingerprint' }); }
});

export default router;
