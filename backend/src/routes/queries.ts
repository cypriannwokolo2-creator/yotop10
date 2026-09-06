import { Router } from 'express';
import { Query } from '../models/Query';

const router: Router = Router();

// POST /api/queries — submit a query (public, rate-limited by IP)
router.post('/', async (req, res) => {
  try {
    const { type, message } = req.body;
    if (!type || !['feature', 'bug'].includes(type)) {
      return res.status(400).json({ error: 'Type must be "feature" or "bug"' });
    }
    if (!message || typeof message !== 'string' || message.trim().length < 5) {
      return res.status(400).json({ error: 'Message must be at least 5 characters' });
    }
    if (message.length > 2000) {
      return res.status(400).json({ error: 'Message must be under 2000 characters' });
    }

    const userId = req.user?.user_id || 'anonymous';
    const username = req.user?.username || 'anonymous';

    const query = await Query.create({
      user_id: userId,
      username,
      type,
      message: message.trim(),
      status: 'new',
    });

    res.json({ success: true, id: query._id });
  } catch (error) {
    console.error('[Query] Submit error:', error);
    res.status(500).json({ error: 'Failed to submit' });
  }
});

export default router;
