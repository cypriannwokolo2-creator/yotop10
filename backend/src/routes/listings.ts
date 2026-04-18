import { Router, Request, Response } from 'express';
import { ListItem } from '../models/ListItem';
import { Post } from '../models/Post';

const router: Router = Router();

// GET /api/listings/:postId — Get list items for a post
router.get('/:postId', async (req: Request, res: Response) => {
  try {
    const items = await ListItem.find({ post_id: req.params.postId })
      .sort({ rank: 1 })
      .lean();
    res.json({ items });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch list items' });
  }
});

// POST /api/listings/:postId — Add a new list item to a post
router.post('/:postId', async (req: Request, res: Response) => {
  try {
    const { title, justification, image_url, source_url } = req.body;
    
    // Check if post exists
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Get highest rank to append to end of list
    const lastItem = await ListItem.findOne({ post_id: post._id }).sort({ rank: -1 });
    const nextRank = lastItem ? lastItem.rank + 1 : 1;

    const newItem = await ListItem.create({
      post_id: post._id,
      rank: nextRank,
      title,
      justification,
      image_url,
      source_url,
    });

    res.status(201).json({ item: newItem });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create list item' });
  }
});

export default router;
