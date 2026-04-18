import { Router, Request, Response } from 'express';
import { Post } from '../models/Post';

const router: Router = Router();

// GET /api/search — Search posts by title or intro
router.get('/', async (req: Request, res: Response) => {
  try {
    const { q = '', page = '1', limit = '20' } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.json({ posts: [], pagination: { total: 0 } });
    }

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    // Use MongoDB text search
    const query = {
      $text: { $search: q },
      status: 'approved'
    };

    const [posts, total] = await Promise.all([
      Post.find(query)
        .populate('category_id', 'name slug icon')
        .sort({ score: { $meta: 'textScore' } })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Post.countDocuments(query),
    ]);

    const formattedPosts = posts.map((post: any) => ({
      id: post._id,
      slug: post.slug,
      title: post.title,
      post_type: post.post_type,
      intro: post.intro,
      comment_count: post.comment_count,
      view_count: post.view_count,
      author_username: post.author_username,
      author_display_name: post.author_display_name,
      created_at: post.created_at,
      published_at: post.published_at,
      category: post.category_id
        ? {
            id: post.category_id._id,
            name: post.category_id.name,
            slug: post.category_id.slug,
            icon: post.category_id.icon,
          }
        : null,
    }));

    res.json({
      posts: formattedPosts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error in search:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// GET /api/search/suggestions — Get autocomplete suggestions
router.get('/suggestions', async (req: Request, res: Response) => {
  try {
    const { q = '' } = req.query;
    if (!q || typeof q !== 'string' || q.length < 2) {
      return res.json({ suggestions: [] });
    }

    const posts = await Post.find({
      title: { $regex: q, $options: 'i' },
      status: 'approved'
    })
      .select('title slug')
      .limit(5)
      .lean();

    res.json({ suggestions: posts });
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});

export default router;
