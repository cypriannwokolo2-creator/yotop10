import { Router } from 'express';
import { Query } from '../models/Query';
import { getClientIp } from '../middleware/fingerprint';

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

// GET /api/queries — admin: list all queries
router.get('/', async (req: any, res: any) => {
  try {
    if (!req.admin) return res.status(401).json({ error: 'Unauthorized' });

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const status = req.query.status as string || '';
    const type = req.query.type as string || '';

    const filter: Record<string, any> = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    const total = await Query.countDocuments(filter);
    const queries = await Query.find(filter)
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.json({
      queries,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('[Query] List error:', error);
    res.status(500).json({ error: 'Failed to list queries' });
  }
});

// GET /api/queries/:id — admin: get single query
router.get('/:id', async (req: any, res: any) => {
  try {
    if (!req.admin) return res.status(401).json({ error: 'Unauthorized' });

    const query = await Query.findById(req.params.id).lean();
    if (!query) return res.status(404).json({ error: 'Not found' });

    // Mark as read
    if (query.status === 'new') {
      await Query.findByIdAndUpdate(req.params.id, { status: 'read' });
    }

    res.json(query);
  } catch (error) {
    console.error('[Query] Get error:', error);
    res.status(500).json({ error: 'Failed' });
  }
});

// PATCH /api/queries/:id/archive — admin: archive
router.patch('/:id/archive', async (req: any, res: any) => {
  try {
    if (!req.admin) return res.status(401).json({ error: 'Unauthorized' });

    await Query.findByIdAndUpdate(req.params.id, { status: 'archived' });
    res.json({ success: true });
  } catch (error) {
    console.error('[Query] Archive error:', error);
    res.status(500).json({ error: 'Failed' });
  }
});

// DELETE /api/queries/:id — admin: delete
router.delete('/:id', async (req: any, res: any) => {
  try {
    if (!req.admin) return res.status(401).json({ error: 'Unauthorized' });

    await Query.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('[Query] Delete error:', error);
    res.status(500).json({ error: 'Failed' });
  }
});

// GET /api/queries/stats/unread — admin: count new queries
router.get('/stats/unread', async (req: any, res: any) => {
  try {
    if (!req.admin) return res.status(401).json({ error: 'Unauthorized' });

    const count = await Query.countDocuments({ status: 'new' });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

export default router;
