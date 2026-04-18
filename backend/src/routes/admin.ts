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
      .sort({ created_at: -1 })
      .populate('category_id', 'name')
      .lean();
    res.json({ posts });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pending posts' });
  }
});

/**
 * PATCH /api/admin/posts/:id
 * Edit any post details
 */
router.patch('/posts/:id', adminAuthMiddleware, async (req: AdminAuthRequest, res: Response) => {
  try {
    const { title, intro, items, status, category_id, min_items_required } = req.body;
    const postId = req.params.id;

    // 1. Update Post Metadata
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (intro !== undefined) updateData.intro = intro;
    if (status !== undefined) updateData.status = status;
    if (category_id !== undefined) updateData.category_id = category_id;
    if (min_items_required !== undefined) updateData.min_items_required = min_items_required;

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

    res.json({ success: true, post });
  } catch (error) {
    console.error('Admin edit error:', error);
    res.status(500).json({ error: 'Failed to edit post' });
  }
});

/**
 * POST /api/admin/posts/:id/approve
 * Approve or reject a post
 */
router.post('/posts/:id/approve', adminAuthMiddleware, async (req: AdminAuthRequest, res: Response) => {
  try {
    const { action } = req.body; // 'approve' or 'reject'
    const status = action === 'approve' ? 'approved' : 'rejected';
    
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { status, published_at: status === 'approved' ? new Date() : undefined },
      { new: true }
    );
    
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json({ success: true, post });
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve post' });
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

export default router;
