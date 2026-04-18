import { Router, Request, Response } from 'express';
import { UserNotification } from '../models/UserNotification';

const router: Router = Router();

/**
 * GET /api/notifications
 * Fetch notifications for the current scholar
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Identity required to fetch alerts.' });
    }

    const notifications = await UserNotification.find({ author_id: req.user.user_id })
      .sort({ created_at: -1 })
      .limit(20);

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Mark a notification as read
 */
router.patch('/:id/read', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Identity required.' });
    }

    const notification = await UserNotification.findOneAndUpdate(
      { _id: req.params.id, author_id: req.user.user_id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found.' });
    }

    res.json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update alert' });
  }
});

/**
 * DELETE /api/notifications/clear
 * Clear all notifications for the user
 */
router.delete('/clear', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Identity required.' });
    }

    await UserNotification.deleteMany({ author_id: req.user.user_id });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear alerts' });
  }
});

export default router;
