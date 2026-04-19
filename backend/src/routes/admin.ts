import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { AdminUser } from '../models/AdminUser';
import { SetupToken } from '../models/SetupToken';
import { adminAuthMiddleware, generateAdminToken, generateSetupToken, AdminAuthRequest } from '../lib/adminAuth';
import { Post } from '../models/Post';
import { User } from '../models/User';
import { Comment } from '../models/Comment';
import { Category } from '../models/Category';
import { ListItem } from '../models/ListItem';
import { GlobalSettings, getSettings } from '../models/GlobalSettings';
import { QuickReply } from '../models/QuickReply';
import { UserNotification } from '../models/UserNotification';

const router: Router = Router();

/**
 * POST /api/admin/login
 * Admin login
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    const admin = await AdminUser.findOne({ username });
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const passwordValid = await bcrypt.compare(password, admin.password_hash);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateAdminToken(admin._id.toString(), admin.username);

    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    res.json({
      success: true,
      admin: {
        id: admin._id,
        username: admin.username,
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * POST /api/admin/setup
 * Complete initial admin setup with one-time token
 */
router.post('/setup', async (req: Request, res: Response) => {
  try {
    const { token, username, password } = req.body;

    // Validate token
    const setupToken = await SetupToken.findOne({
      token,
      expires_at: { $gt: new Date() },
      used: false,
    });

    if (!setupToken) {
      return res.status(400).json({ error: 'Invalid or expired setup token' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Delete all existing admins
    await AdminUser.deleteMany({});

    // Create new admin
    const admin = await AdminUser.create({
      username,
      password_hash: passwordHash,
    });

    // Mark token as used
    await SetupToken.findByIdAndUpdate(setupToken._id, { used: true });

    // Generate session token
    const authToken = generateAdminToken(admin._id.toString(), admin.username);

    res.cookie('admin_token', authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    res.json({
      success: true,
      admin: {
        id: admin._id,
        username: admin.username,
      },
    });
  } catch (error) {
    console.error('Admin setup error:', error);
    res.status(500).json({ error: 'Setup failed' });
  }
});

/**
 * GET /api/admin/me
 * Get current admin user
 */
router.get('/me', adminAuthMiddleware, async (req: AdminAuthRequest, res: Response) => {
  res.json({
    id: req.admin!.id,
    username: req.admin!.username,
  });
});

/**
 * POST /api/admin/logout
 * Invalidate admin session
 */
router.post('/logout', adminAuthMiddleware, async (req: AdminAuthRequest, res: Response) => {
  res.clearCookie('admin_token');
  res.json({ success: true });
});

/**
 * GET /api/admin/setup/validate
 * Validate setup token
 */
router.get('/setup/validate', async (req: Request, res: Response) => {
  const { token } = req.query;

  const setupToken = await SetupToken.findOne({
    token,
    expires_at: { $gt: new Date() },
    used: false,
  });

  res.json({
    valid: !!setupToken,
  });
});

/**
 * GET /api/admin/test
 * Debug route to verify admin mounting
 */
router.get('/test', (req: Request, res: Response) => {
  res.json({ ok: true, message: 'Admin routes are alive' });
});

/**
 * GET /api/admin/stats
 * Platform overview statistics
 */
router.get('/stats', adminAuthMiddleware, async (req: AdminAuthRequest, res: Response) => {
  try {
    const [totalUsers, totalPosts, pendingPosts, totalComments] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments({ status: 'approved' }),
      Post.countDocuments({ status: 'pending_review' }),
      Comment.countDocuments()
    ]);
    res.json({ totalUsers, totalPosts, pendingPosts, totalComments });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

/**
 * GET /api/admin/posts/pending
 * List pending posts
 */
router.get('/posts/pending', adminAuthMiddleware, async (req: AdminAuthRequest, res: Response) => {
  try {
    const posts = await Post.find({ status: 'pending_review' })
      .sort({ is_priority: -1, created_at: -1 })
      .populate('category_id', 'name icon slug')
      .lean();
    // Map category_id to category for frontend consistency
    const formattedPosts = posts.map(post => ({
      ...post,
      id: post._id,
      category: post.category_id ? {
        id: (post.category_id as any)._id,
        name: (post.category_id as any).name,
        slug: (post.category_id as any).slug,
        icon: (post.category_id as any).icon
      } : null
    }));
    
    res.json({ posts: formattedPosts });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pending posts' });
  }
});

/**
 * GET /api/admin/posts/pending/summary
 * Get count of pending posts per category
 */
router.get('/posts/pending/summary', adminAuthMiddleware, async (req: AdminAuthRequest, res: Response) => {
  try {
    const summary = await Post.aggregate([
      { $match: { status: 'pending_review' } },
      { $group: { _id: '$category_id', count: { $sum: 1 } } },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
      { $unwind: '$category' },
      { $project: { _id: 0, categoryId: '$_id', name: '$category.name', icon: '$category.icon', slug: '$category.slug', count: 1 } },
      { $sort: { count: -1 } }
    ]);
    res.json({ summary });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pending summary' });
  }
});

/**
 * GET /api/admin/posts/pending/category/:id
 * List pending posts for a specific category
 */
router.get('/posts/pending/category/:id', adminAuthMiddleware, async (req: AdminAuthRequest, res: Response) => {
  try {
    const posts = await Post.find({ 
      status: 'pending_review',
      category_id: req.params.id 
    })
      .sort({ is_priority: -1, created_at: -1 })
      .populate('category_id', 'name icon slug')
      .lean();
    // Map category_id to category for frontend consistency
    const formattedPosts = posts.map(post => ({
      ...post,
      id: post._id,
      category: post.category_id ? {
        id: (post.category_id as any)._id,
        name: (post.category_id as any).name,
        slug: (post.category_id as any).slug,
        icon: (post.category_id as any).icon
      } : null
    }));
    
    res.json({ posts: formattedPosts });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch category pending posts' });
  }
});

/**
 * PATCH /api/admin/posts/:id
 * Edit any post details
 */
router.patch('/posts/:id', adminAuthMiddleware, async (req: AdminAuthRequest, res: Response) => {
  try {
    const { title, intro, items, status, category_id, min_items_required, cover_image, reason } = req.body;
    const postId = req.params.id;

    // 1. Update Post Metadata
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (intro !== undefined) updateData.intro = intro;
    if (category_id !== undefined) updateData.category_id = category_id;
    if (min_items_required !== undefined) updateData.min_items_required = min_items_required;
    if (cover_image !== undefined) updateData.cover_image = cover_image;
    
    // Auto-approve administrative edits
    updateData.status = 'approved';
    updateData.published_at = new Date();

    const post = await Post.findByIdAndUpdate(postId, updateData, { new: true });
    if (!post) return res.status(404).json({ error: 'Post not found' });

    // 2. Sync Items if provided
    if (items && Array.isArray(items)) {
      // Clear existing
      await ListItem.deleteMany({ post_id: postId });
      
      // Re-create
      await Promise.all(
        items.map((item: any) => 
          ListItem.create({
            post_id: postId,
            rank: item.rank,
            title: item.title,
            justification: item.justification,
            image_url: item.image_url,
            source_url: item.source_url,
          })
        )
      );
    }

    // 3. Notify User
    await UserNotification.create({
      author_id: post.author_id,
      type: 'approved',
      post_title: post.title,
      message: 'Your list is live! Moderators have refined your list for better platform compatibility.',
      reason: reason || 'Editorial Adjustment',
    });

    res.json({ success: true, post });
  } catch (error) {
    console.error('Admin edit error:', error);
    res.status(500).json({ error: 'Failed to edit post' });
  }
});

/**
 * GET /api/admin/posts/:id
 * Fetch full post details regardless of status (for vetting)
 */
router.get('/posts/:id', adminAuthMiddleware, async (req: AdminAuthRequest, res: Response) => {
  try {
    const post = await Post.findById(req.params.id).populate('category_id', 'name slug icon');
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const items = await ListItem.find({ post_id: post._id }).sort({ rank: 1 });
    
    // Map category_id to category for frontend consistency
    const formattedPost = {
      ...post.toObject(),
      id: post._id,
      category: post.category_id ? {
        id: (post.category_id as any)._id,
        name: (post.category_id as any).name,
        slug: (post.category_id as any).slug,
        icon: (post.category_id as any).icon
      } : null
    };

    res.json({ post: formattedPost, items });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch post details' });
  }
});

/**
 * POST /api/admin/posts/:id/approve
 * Approve or reject a post (Rejection triggers permanent deletion)
 */
router.post('/posts/:id/approve', adminAuthMiddleware, async (req: AdminAuthRequest, res: Response) => {
  try {
    const { action, reason } = req.body; // 'approve' or 'reject'
    const postId = req.params.id;
    
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    if (action === 'approve') {
      post.status = 'approved';
      post.published_at = new Date();
      await post.save();

      // Notify User
      await UserNotification.create({
        author_id: post.author_id,
        type: 'approved',
        post_title: post.title,
        message: 'Your list is live! Your list has been verified and published.',
        reason: reason || 'Authorized by Moderator',
      });

      return res.json({ 
        success: true, 
        post: {
          ...post.toObject(),
          id: post._id,
          category: post.category_id ? {
            id: (post.category_id as any)._id || post.category_id,
            name: (post.category_id as any).name,
            slug: (post.category_id as any).slug,
            icon: (post.category_id as any).icon
          } : null
        } 
      });
    } else {
      // REJECT = DELETE
      // 1. Create Notification for the author before destruction
      await UserNotification.create({
        author_id: post.author_id,
        type: 'rejected',
        post_title: post.title,
        message: 'Your list submission was unfortunately rejected and removed.',
        reason: reason || 'Does not meet community guidelines.',
      });

      // 2. Cascading Deletion
      await Promise.all([
        Post.findByIdAndDelete(postId),
        ListItem.deleteMany({ post_id: postId }),
        Comment.deleteMany({ post_id: postId }),
        // Decrement category count if it was somehow approved before
        post.status === 'approved' ? Category.findByIdAndUpdate(post.category_id, { $inc: { post_count: -1 } }) : Promise.resolve()
      ]);

      return res.json({ success: true, message: 'Post rejected and data wiped.' });
    }
  } catch (error) {
    console.error('Moderation error:', error);
    res.status(500).json({ error: 'Failed to process moderation action' });
  }
});

/**
 * DELETE /api/admin/posts/:id
 * Permanently delete a post and associated data
 */
router.delete('/posts/:id', adminAuthMiddleware, async (req: AdminAuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    // Cascading deletion
    await Promise.all([
      Post.findByIdAndDelete(id),
      ListItem.deleteMany({ post_id: id }),
      Comment.deleteMany({ post_id: id }),
      // Decrement category count if post was approved
      post.status === 'approved' ? Category.findByIdAndUpdate(post.category_id, { $inc: { post_count: -1 } }) : Promise.resolve()
    ]);

    res.json({ success: true, message: 'Post and associated data destroyed.' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

/**
 * GET /api/admin/settings
 * Fetch global platform settings
 */
router.get('/settings', adminAuthMiddleware, async (req: AdminAuthRequest, res: Response) => {
  try {
    const settings = await getSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

/**
 * PATCH /api/admin/settings
 * Update global platform settings
 */
router.patch('/settings', adminAuthMiddleware, async (req: AdminAuthRequest, res: Response) => {
  try {
    const settings = await GlobalSettings.findOneAndUpdate({}, req.body, { new: true, upsert: true });
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

/**
 * GET /api/admin/quick-replies
 */
router.get('/quick-replies', adminAuthMiddleware, async (req: AdminAuthRequest, res: Response) => {
  try {
    const replies = await QuickReply.find();
    res.json(replies);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch quick replies' });
  }
});

/**
 * POST /api/admin/quick-replies
 */
router.post('/quick-replies', adminAuthMiddleware, async (req: AdminAuthRequest, res: Response) => {
  try {
    const reply = await QuickReply.create(req.body);
    res.json(reply);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create quick reply' });
  }
});

/**
 * DELETE /api/admin/quick-replies/:id
 */
router.delete('/quick-replies/:id', adminAuthMiddleware, async (req: AdminAuthRequest, res: Response) => {
  try {
    await QuickReply.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete quick reply' });
  }
});

/**
 * POST /api/admin/quick-replies/seed
 */
router.post('/quick-replies/seed', adminAuthMiddleware, async (req: AdminAuthRequest, res: Response) => {
  try {
    const defaults = [
      // Rejection Templates
      { label: 'Low Detail', type: 'reject', message: 'Your list lacks necessary editorial depth. Please provide more substantial justifications for each placement.' },
      { label: 'Wrong Domain', type: 'reject', message: 'This content belongs in a different category. Please re-submit under the correct domain.' },
      { label: 'Policy Breach', type: 'reject', message: 'This content violates community publishing standards. Please review the rules.' },
      
      // Approval Templates
      { label: 'Crystal Clear', type: 'approve', message: 'Your list is exceptionally well-researched. Published immediately!' },
      { label: 'Verified', type: 'approve', message: 'Content verified. Your list is now live on the platform.' },
      
      // Edit Templates
      { label: 'Grammar Fix', type: 'edit', message: 'I corrected some minor spelling and grammar issues to improve readability.' },
      { label: 'Icon Alignment', type: 'edit', message: 'Updated your list categories for better visibility.' }
    ];

    await QuickReply.deleteMany({});
    await QuickReply.insertMany(defaults);
    res.json({ success: true, count: defaults.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to seed replies' });
  }
});

export default router;
