import { Router, Request, Response } from 'express';
import { Post } from '../models/Post';

const router: Router = Router();

// GET /api/explore — Get random subset of approved posts
router.get('/', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string || '20', 10)));

    // Use MongoDB aggregate $sample to get random documents
    const posts = await Post.aggregate([
      { $match: { status: 'approved' } },
      { $sample: { size: limit } },
      // To reliably populate category, we do a lookup. In older mongoose versions, populate on aggregate requires a separate step
      {
        $lookup: {
          from: 'categories',
          localField: 'category_id',
          foreignField: '_id',
          as: 'category_docs'
        }
      }
    ]);

    const formattedPosts = posts.map((post: any) => {
      const category = post.category_docs && post.category_docs.length > 0 ? post.category_docs[0] : null;

      return {
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
        category: category
          ? {
              id: category._id,
              name: category.name,
              slug: category.slug,
              icon: category.icon,
            }
          : null,
      };
    });

    res.json({ posts: formattedPosts });
  } catch (error) {
    console.error('Error fetching explore posts:', error);
    res.status(500).json({ error: 'Failed to fetch explore posts' });
  }
});

export default router;
