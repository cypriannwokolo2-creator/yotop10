import { Router, Request, Response } from 'express';
import { Review } from '../models/Review';
import { Post } from '../models/Post';

const router: Router = Router();

// GET /api/reviews/:postId — Get average review and count for a post
router.get('/:postId', async (req: Request, res: Response) => {
  try {
    const reviews = await Review.find({ post_id: req.params.postId }).lean();
    if (reviews.length === 0) {
      return res.json({ average: 0, count: 0 });
    }
    
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const avg = sum / reviews.length;
    res.json({ average: Math.round(avg * 10) / 10, count: reviews.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// POST /api/reviews/:postId — Submit or update a review
router.post('/:postId', async (req: Request, res: Response) => {
  try {
    const { device_fingerprint, rating } = req.body;
    
    if (!device_fingerprint) return res.status(400).json({ error: 'Device fingerprint required' });
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'Invalid rating (1-5)' });

    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    // Upsert review based on device fingerprint
    const review = await Review.findOneAndUpdate(
      { post_id: post._id, author_fingerprint: device_fingerprint },
      { rating },
      { new: true, upsert: true }
    );

    res.status(201).json({ message: 'Review saved', review });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

export default router;
