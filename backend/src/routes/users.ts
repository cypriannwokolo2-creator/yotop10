/* eslint-disable no-restricted-syntax, @typescript-eslint/no-explicit-any -- Express middleware type chains */
import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { Post } from '../models/Post';
import { Article } from '../models/Article';
import { Comment } from '../models/Comment';
import { User } from '../models/User';
import { Notification } from '../models/Notification';
import { AdminMessage } from '../models/AdminMessage';
import { isUsernameAvailable, recordUsernameChange } from '../lib/usernameService';
import { calculateEffectivePostLimit, calculateEffectiveCommentLimit, RateLimitStatus, getRateLimitKey } from '../lib/rateLimit';
import { getCategoryNameMap } from '../lib/categoryCache';
import { checkAndPromoteUser } from '../lib/trustScore';
import { redis, atomicCheckRateLimit } from '../lib/redis';
import { findUserByFingerprint, createUserForFingerprint, getClientIp, isLowEntropyFingerprint, isCookieBound, isDeniedFingerprint } from '../middleware/fingerprint';
import { issueChallenge, verifyChallenge } from '../lib/botChallenge';
import { initIdentitySchema } from '../schemas/identity';
import { toShortUsername, toCustomShort, toDefaultShort, isDefaultFormat } from '../lib/username';

const router: Router = Router();

/**
 * M11.A: GET /api/users/me
 * Returns current user context for authenticated fingerprint
 */
router.get('/me', async (req, res) => {
  if (!req.user) {
    // Grace path fallback: if fingerprint is present but req.user wasn't set (race / old cookie),
    // try to hydrate from DB before failing. Mirrors fingerprintMiddleware Branch A logic.
    if (req.fingerprint) {
      try {
        const u = await User.findOne({ device_fingerprint: req.fingerprint });
        if (u) {
          (req as any).user = {
            user_id: u.user_id,
            username: u.username,
            custom_display_name: u.custom_display_name,
            device_fingerprint: u.device_fingerprint,
            trust_score: u.trust_score,
            trust_locked: u.trust_locked,
            rate_limit_override: u.rate_limit_override,
            is_admin: u.is_admin,
            restricted_until: u.restricted_until || null,
            created_at: u.created_at,
          };
        }
      } catch { /* fingerprint lookup failed */ }
    }
    if (!req.user) {
      return res.status(425).json({ error: 'User identity still initializing', retry_after: 0.5 });
    }
  }

  try {
    // Check and promote/demote user based on age/activity
    await checkAndPromoteUser(req.user.user_id).catch(() => {});
    // Fetch user for profile_image_url + bio/links
    const userDoc = await User.findOne({ user_id: req.user.user_id }).select('profile_image_url bio links').lean() as unknown as { profile_image_url?: string; bio?: string; links?: { medium?: string; x?: string; github?: string } } | null;

    // Count posts with status breakdown
    const userPosts = await Post.aggregate([
      { $match: { author_id: req.user.user_id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Count total comments
    const commentCount = await Comment.countDocuments({ author_id: req.user.user_id });

    // Process post counts
    const postCounts = userPosts.reduce((acc: Record<string, number>, item: { _id: string; count: number }) => {
      acc[item._id] = item.count;
      return acc;
    }, {} as Record<string, number>);

    const postsApproved = postCounts.approved || 0;
    const postsRejected = postCounts.rejected || 0;
    const postCount = postsApproved + postsRejected + (postCounts.pending_review || 0);

    // Determine trust level (stored on user, computed with hysteresis)
    const trustLevel: 'troll' | 'neutral' | 'scholar' = (req.user as unknown as Record<string, unknown>).trust_level as 'troll' | 'neutral' | 'scholar' || 'neutral';

    // Return full user context
    res.json({
      user_id: req.user.user_id,
      username: req.user.custom_display_name || req.user.username,
      custom_display_name: req.user.custom_display_name || null,
      profile_image_url: userDoc?.profile_image_url || null,
      bio: userDoc?.bio || "",
      links: userDoc?.links || {},
      trust_score: req.user.trust_score,
      trust_level: trustLevel,
      post_count: postCount,
      comment_count: commentCount,
      posts_approved: postsApproved,
      posts_rejected: postsRejected,
      created_at: req.user.created_at,
      first_seen_at: req.user.created_at,
    });

  } catch (error) {
    console.error('GET /users/me error:', error);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

/**
 * M11.A1: GET /api/users/challenge
 * Issues a simple bot challenge ({challenge_id, a, b}) that POST /init must
 * solve (answer a + b). Public. Rate-limited per IP to prevent store flooding.
 */
router.get('/challenge', async (req, res) => {
  try {
    const ip = getClientIp(req);
    const rl = await atomicCheckRateLimit(`rl:challenge:${ip}`, 600000, 30);
    if (!rl.allowed) {
      return res.status(429).json({ error: 'Too many challenges. Slow down.' });
    }
    return res.json(await issueChallenge());
  } catch (error) {
    console.error('GET /users/challenge error:', error);
    return res.status(500).json({ error: 'Failed to issue challenge' });
  }
});

/**
 * M11.A2: POST /api/users/init
 * Explicit identity bootstrap — the ONLY read-safe way to mint an identity.
 * The middleware never creates users on reads, so fresh visitors call this
 * once (single-flight from AuthInitializer) to claim their cookie identity.
 * Requires a solved bot challenge {challenge_id, answer} when minting ONLY
 * when no identity exists yet — recovery of a known identity needs no challenge.
 * Public. Returns the user summary, same shape as GET /me core fields.
 */
router.post('/init', async (req, res) => {
  try {
    // Only a client-presented fingerprint (cookie or header) may mint an
    // identity. req.fingerprint is ignored here on purpose: when the request
    // carries no identity the middleware fills it with a fresh grace value,
    // and that must NEVER be minted — otherwise any anonymous hit could
    // create junk users.
    const fingerprint =
      (req.cookies?.device_fingerprint as string | undefined) ||
      (req.headers['x-device-fingerprint'] as string | undefined);
    if (!fingerprint) {
      return res.status(425).json({ error: 'Fingerprint not initialized. Please retry.', retry_after: 1 });
    }
    if (isDeniedFingerprint(fingerprint)) {
      return res.status(403).json({ error: 'Identity blocked for abuse. Clear site data and retry.' });
    }
    const ip = getClientIp(req);
    const rl = await atomicCheckRateLimit(`rl:init:${ip}`, 3600000, 20);
    if (!rl.allowed) {
      return res.status(429).json({ error: 'Too many identities from this address.' });
    }
    let user = await findUserByFingerprint(fingerprint);
    if (!user) {
      // New identity: prove humanness first.
      const parsed = initIdentitySchema.safeParse(req.body || {});
      if (!parsed.success) {
        return res.status(400).json({ error: 'A solved challenge is required to create an identity.' });
      }
      if (!(await verifyChallenge(parsed.data.challenge_id, parsed.data.answer))) {
        return res.status(403).json({ error: 'Challenge failed. Fetch a new one and retry.' });
      }
      if (isLowEntropyFingerprint(fingerprint)) {
        console.warn(`[Abuse] Low-entropy identity claim from ${ip}`);
      }
      user = await createUserForFingerprint(req, res, fingerprint);
    }
    if (!req.cookies?.device_fingerprint) {
      res.cookie('device_fingerprint', fingerprint, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 365 * 24 * 60 * 60 * 1000,
      });
    }
    return res.json({
      user_id: user.user_id,
      username: user.custom_display_name || user.username,
      custom_display_name: user.custom_display_name || null,
      trust_score: user.trust_score,
      created_at: user.created_at,
    });
  } catch (error) {
    console.error('POST /users/init error:', error);
    return res.status(500).json({ error: 'Failed to initialize identity' });
  }
});

/**
 * M11.B: PATCH /api/users/me
 * Update user display name
 */
const validateDisplayName = [
  body('display_name')
    .trim()
    .notEmpty()
    .withMessage('Display name is required')
    .isLength({ min: 3, max: 32 })
    .withMessage('Display name must be between 3 and 32 characters')
    .matches(/^[a-z0-9_]+$/i)
    .withMessage('Display name may only contain alphanumeric characters and underscores'),
];

router.patch('/me', ...validateDisplayName as any[], async (req, res) => {
  if (!req.user) {
    return res.status(404).json({ error: 'User not found' });
  }

  try {
    // Bio / links update (no display_name validation needed) — optional, 0-500 bio, links handles
    const hasBio = req.body.bio !== undefined;
    const hasLinks = req.body.links !== undefined;
    const hasDisplayName = !!req.body.display_name;
    const hasProfileImage = !!req.body.profile_image_url;

    if ((hasBio || hasLinks) && !hasDisplayName && !hasProfileImage) {
      const updates: Record<string, unknown> = {};
      if (hasBio) {
        const bio = String(req.body.bio || "").trim();
        if (bio.length > 500) return res.status(400).json({ error: 'Bio must be 500 characters or less' });
        updates.bio = bio;
      }
      if (hasLinks) {
        const links = req.body.links || {};
        const clean: Record<string, string> = {};
        if (links.medium !== undefined) {
          const v = String(links.medium || "").trim().toLowerCase().replace(/^@/, "");
          if (v && !/^[a-z0-9_]{1,32}$/i.test(v)) return res.status(400).json({ error: 'Medium handle may only contain letters, numbers, underscores (max 32)' });
          clean.medium = v || "";
        }
        if (links.x !== undefined) {
          const v = String(links.x || "").trim().toLowerCase().replace(/^@/, "");
          if (v && !/^[a-z0-9_]{1,32}$/i.test(v)) return res.status(400).json({ error: 'X handle may only contain letters, numbers, underscores (max 32)' });
          clean.x = v || "";
        }
        if (links.github !== undefined) {
          const v = String(links.github || "").trim().toLowerCase().replace(/^@/, "");
          if (v && !/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(v)) return res.status(400).json({ error: 'GitHub handle is invalid' });
          clean.github = v || "";
        }
        // Only set provided keys, allow clearing with ""
        const linksUpdate: Record<string, unknown> = {};
        if (links.medium !== undefined) linksUpdate['links.medium'] = clean.medium || "";
        if (links.x !== undefined) linksUpdate['links.x'] = clean.x || "";
        if (links.github !== undefined) linksUpdate['links.github'] = clean.github || "";
        // Use dot notation for nested update, but also handle empty strings to unset
        for (const [k, v] of Object.entries(linksUpdate)) {
          (updates as Record<string, unknown>)[k] = v;
        }
        // If all links are empty, we still update to clear
      }
      if (Object.keys(updates).length > 0) {
        const updated = await User.findOneAndUpdate({ user_id: req.user.user_id }, updates, { new: true }).select('bio links').lean() as unknown as { bio?: string; links?: Record<string, string> } | null;
        if (!updated) return res.status(404).json({ error: 'User not found' });
        return res.json({ success: true, bio: updated.bio || "", links: updated.links || {} });
      }
      return res.json({ success: true });
    }

    // Profile image update (no display_name validation needed)
    if (req.body.profile_image_url && !req.body.display_name) {
      const updated = await User.findOneAndUpdate(
        { user_id: req.user.user_id },
        { profile_image_url: req.body.profile_image_url },
        { new: true }
      ).select('profile_image_url user_id').lean();
      if (!updated) return res.status(404).json({ error: 'User not found' });
      return res.json({ success: true, profile_image_url: updated.profile_image_url });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Renames permanently mutate identity: require a cookie-bound session so a
    // bare presented fingerprint cannot squat or steal handles.
    if (!isCookieBound(req)) {
      return res.status(428).json({ error: 'Confirm this device first: reload the page once, then retry.' });
    }

    let displayName = req.body.display_name.trim().toLowerCase();

    // Enforce a_ prefix for non-scholar users
    if (req.user.trust_score < 1.8 && !displayName.startsWith('a_')) {
      displayName = `a_${displayName}`;
    }

    // Check availability (full) and short prefix availability (Option B)
    const availability = await isUsernameAvailable(displayName, req.user.user_id);
    
    if (!availability.available) {
      return res.status(409).json({ error: 'Display name already taken' });
    }

    const isCustom = !isDefaultFormat(displayName);
    const shortForNew = isCustom ? toCustomShort(displayName) : toDefaultShort(displayName);
    // For custom (flexible 3-32), check full custom_short uniqueness, not 4-char prefix
    // For default (a_xxxx_xxxx), check default_short 4-char uniqueness
    if (isCustom) {
      const customOwner = await User.findOne({
        $or: [{ custom_short: shortForNew }, { short_username: shortForNew }],
        user_id: { $ne: req.user.user_id },
      }).select('_id').lean();
      if (customOwner) {
        return res.status(409).json({ error: 'Display name already taken' });
      }
    } else {
      const shortOwner = await User.findOne({
        $or: [{ short_username: shortForNew }, { default_short: shortForNew }],
        user_id: { $ne: req.user.user_id },
      }).select('_id').lean();
      if (shortOwner) {
        return res.status(409).json({ error: 'Display name short prefix already taken — choose another (first 4 chars must be unique)' });
      }
    }

    const oldUsername = req.user.custom_display_name || req.user.username || null;

    const updateFields: Record<string, unknown> = {
      custom_display_name: displayName,
      short_username: shortForNew,
    };
    if (isCustom) {
      (updateFields as Record<string, unknown>).custom_short = shortForNew;
    } else {
      (updateFields as Record<string, unknown>).default_short = shortForNew;
      (updateFields as Record<string, unknown>).default_username = displayName;
    }

    const updatedUser = await User.findOneAndUpdate(
      {
        user_id: req.user.user_id,
        $or: [
          { custom_display_name: oldUsername },
          { custom_display_name: { $exists: false }, username: oldUsername },
        ],
      },
      updateFields,
      { new: true }
    );

    if (!updatedUser) {
      return res.status(409).json({ error: 'Display name was changed by another request. Please try again.' });
    }

    await recordUsernameChange(req.user.user_id, displayName, oldUsername);

    // Backfill old posts/articles/comments so By reflects new name
    try {
      await Post.updateMany({ author_id: req.user.user_id }, { $set: { author_username: displayName, author_display_name: displayName } });
      await Article.updateMany({ author_id: req.user.user_id }, { $set: { author_username: displayName, author_display_name: displayName } });
      await Comment.updateMany({ author_id: req.user.user_id }, { $set: { author_username: displayName, author_display_name: displayName } });
    } catch (e) {
      console.error('Backfill author display name failed:', e);
    }

    // Also handle bio/links if provided alongside display_name
    if (req.body.bio !== undefined || req.body.links !== undefined) {
      const extraUpdates: Record<string, unknown> = {};
      if (req.body.bio !== undefined) {
        const bio = String(req.body.bio || "").trim();
        if (bio.length > 500) return res.status(400).json({ error: 'Bio must be 500 characters or less' });
        extraUpdates.bio = bio;
      }
      if (req.body.links !== undefined) {
        const links = req.body.links || {};
        if (links.medium !== undefined) extraUpdates['links.medium'] = String(links.medium || "").trim().toLowerCase().replace(/^@/, "") || "";
        if (links.x !== undefined) extraUpdates['links.x'] = String(links.x || "").trim().toLowerCase().replace(/^@/, "") || "";
        if (links.github !== undefined) extraUpdates['links.github'] = String(links.github || "").trim().toLowerCase().replace(/^@/, "") || "";
      }
      if (Object.keys(extraUpdates).length > 0) {
        await User.updateOne({ user_id: req.user.user_id }, extraUpdates);
      }
    }

    // Return updated user
    res.json({
      success: true,
      username: displayName,
      message: 'Display name updated successfully'
    });

  } catch (error) {
    console.error('PATCH /users/me error:', error);
    res.status(500).json({ error: 'Failed to update display name' });
  }
});

/**
 * GET /api/users/sitemap
 * Public — for sitemap-profiles.xml
 */
router.get('/sitemap', async (_req, res) => {
  try {
    const users = await User.find({}).select('username custom_display_name updated_at').lean();
    const list = users.map(u => ({
      username: (u.custom_display_name || u.username) as string,
      updated_at: (u as unknown as { updated_at?: Date }).updated_at || (u as unknown as { created_at?: Date }).created_at,
    }));
    res.json({ users: list });
  } catch {
    res.json({ users: [] });
  }
});

/**
 * M11.E: GET /api/users/:username
 * Public user profile endpoint
 */
router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;

    // Check and promote/demote user when viewing own profile
    if (req.user) {
      await checkAndPromoteUser(req.user.user_id).catch(() => {});
    }
    
    console.log(`[USER PROFILE] Requested: ${username} - User from middleware: ${req.user ? req.user.username : 'NO USER'}`);
    
    // Find user by user_id (full or partial), username, or custom_display_name
    // Option B: support short a_e3ga via short_username field
    const cleanUsername = username.replace(/^a_/, '');
    const isShort = cleanUsername.length === 4;
    
    console.log(`[USER PROFILE] Search variations: ${username}, ${cleanUsername}, a_${cleanUsername} (short=${isShort})`);
    
    let user;
    if (isShort) {
      const short = `a_${cleanUsername.toLowerCase()}`;
      user = await User.findOne({
        $or: [
          { short_username: short },
          { short_username: username.toLowerCase() },
          // Also match longer custom names starting with short prefix (e.g. a_cuti -> a_cutie)
          { short_username: { $regex: `^a_${cleanUsername}`, $options: 'i' } },
          { custom_display_name: { $regex: `^a_${cleanUsername}`, $options: 'i' } },
          // Fallback for legacy users without short_username: regex on full
          { username: { $regex: `^a_${cleanUsername}`, $options: 'i' } },
          { custom_display_name: { $regex: `^a_${cleanUsername}`, $options: 'i' } }
        ]
      });
    } else {
      user = await User.findOne({
        $or: [
          { user_id: username },
          { username },
          { username: `a_${cleanUsername}` },
          { custom_display_name: username },
          { custom_display_name: `a_${cleanUsername}` },
          { short_username: username.toLowerCase() },
          { short_username: `a_${cleanUsername.toLowerCase()}` },
          // Also handle truncated 4-char lookup for custom 5-char names (cutie vs cuti)
          { custom_display_name: { $regex: `^a_${cleanUsername}`, $options: 'i' } },
          { short_username: { $regex: `^a_${cleanUsername}`, $options: 'i' } }
        ]
      });
    }


    
    console.log(`[USER PROFILE] Query result: ${user ? 'FOUND' : 'NOT FOUND'} - ${user ? user.username : 'none'}`);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Determine trust level (stored on user, computed with hysteresis)
    const trustLevel: 'troll' | 'neutral' | 'scholar' = (user as unknown as Record<string, unknown>).trust_level as 'troll' | 'neutral' | 'scholar' || 'neutral';

    // Check if this is the user viewing their own profile
    const isOwnProfile = req.user && req.user.user_id === user.user_id;

    // Query posts with privacy rules
    const postQuery: Record<string, unknown> = { author_id: user.user_id };
    
    // Only show pending/rejected posts to user themselves
    if (!isOwnProfile) {
      postQuery.status = 'approved';
    }

    const userPosts = await Post.find(postQuery)
      .sort({ created_at: -1 })
      .select('title slug status post_type view_count comment_count created_at category_slug rejection_reason revision_guidance')
      .lean();

    // Count posts with status breakdown
    const postCounts = await Post.aggregate([
      { $match: { author_id: user.user_id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const countMap = postCounts.reduce((acc: Record<string, number>, item: { _id: string; count: number }) => {
      acc[item._id] = item.count;
      return acc;
    }, {} as Record<string, number>);

    const postsApproved = countMap.approved || 0;
    const postsRejected = countMap.rejected || 0;
    const decidedCount = postsApproved + postsRejected;
    const postCount = decidedCount + (countMap.pending_review || 0);
    const approvalRate = decidedCount > 0 ? postsApproved / decidedCount : -1;

    const currentUsername = user.custom_display_name || user.username;
    const cleanCurrentUsername = toShortUsername(currentUsername).replace(/^a_/, '');

    // Get user comments
    const userComments = await Comment.find({ author_id: user.user_id })
      .sort({ created_at: -1 })
      .limit(100)
      .select('content post_id fire_count reply_count created_at');

    // Aggregate total view_count across all posts and articles
    const [postViewAgg, articleViewAgg] = await Promise.all([
      Post.aggregate([
        { $match: { author_id: user.user_id } },
        { $group: { _id: null, total_views: { $sum: '$view_count' } } },
      ]),
      Article.aggregate([
        { $match: { author_id: user.user_id } },
        { $group: { _id: null, total_views: { $sum: '$view_count' } } },
      ]),
    ]);
    const totalViews = (postViewAgg[0]?.total_views || 0) + (articleViewAgg[0]?.total_views || 0);

    // Category name map for resolving post categories
    const catNameMap = await getCategoryNameMap();

    // Return public profile data
    res.json({
      username: currentUsername,
      canonical_url: `/a/${cleanCurrentUsername}`,
      profile_image_url: user.profile_image_url || null,
      bio: (user as unknown as { bio?: string }).bio || "",
      links: (user as unknown as { links?: Record<string, string> }).links || {},
      trust_score: isOwnProfile ? user.trust_score : undefined,
      trust_level: trustLevel,
      created_at: user.created_at,
      stats: {
        member_since: user.created_at,
        total_posts: isOwnProfile ? postCount : postsApproved,
        total_comments: userComments.length,
        approval_rate: approvalRate >= 0 ? Math.round(approvalRate * 100) : null,
        total_views: totalViews,
        verified: postsApproved >= 3,
      },
      posts: userPosts.map((post: any) => ({
        id: post._id,
        title: post.title,
        slug: post.slug,
        status: isOwnProfile ? post.status : 'approved',
        post_type: post.post_type,
        view_count: post.view_count || 0,
        comment_count: post.comment_count,
        created_at: post.created_at,
        category: post.category_slug ? { slug: post.category_slug, name: catNameMap.get(post.category_slug) || null } : null,
        rejection_reason: isOwnProfile ? post.rejection_reason || undefined : undefined,
        revision_guidance: isOwnProfile ? post.revision_guidance || undefined : undefined,
      })),
      comments: userComments.map((comment) => ({
        id: comment._id,
        content: comment.content,
        post_id: comment.post_id,
        fire_count: comment.fire_count,
        reply_count: comment.reply_count,
        created_at: comment.created_at,
      })),
      is_own_profile: isOwnProfile,
    });

  } catch (error) {
    console.error('GET /users/:username error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

router.get('/', (_req, res) => res.status(501).json({ error: 'Not implemented' }));
router.put('/:id', (_req, res) => res.status(501).json({ error: 'Not implemented' }));
router.delete('/:id', (_req, res) => res.status(501).json({ error: 'Not implemented' }));

/**
 * GET /api/users/me/history
 * Get username history for current user
 */
router.get('/me/history', async (req, res) => {
  if (!req.user) {
    return res.status(404).json({ error: 'User not found' });
  }

  try {
    const { UsernameHistory } = await import('../models/UsernameHistory');
    const history = await UsernameHistory.find({ 
      user_id: req.user.user_id 
    }).sort({ created_at: -1 });

    res.json({ history });
  } catch (error) {
    console.error('GET /users/me/history error:', error);
    res.status(500).json({ error: 'Failed to fetch username history' });
  }
});

/**
 * GET /api/users/me/rate-limits
 * Get current user rate limit status
 */
router.get('/me/rate-limits', async (req, res) => {
  if (!req.user) {
    // Return 425 instead of 404 during initialization
    return res.status(425).json({ 
      error: 'User identity still initializing', 
      retry_after: 0.5 
    });
  }

  try {
    const windowMs = 60 * 60 * 1000;
    const now = Date.now();

    // Calculate total limits
    const theTrustLevel = (req.user as any).trust_level;
    let postLimit = calculateEffectivePostLimit(req.user.trust_score, undefined, theTrustLevel);
    let commentLimit = calculateEffectiveCommentLimit(req.user.trust_score, theTrustLevel);
    
    // Add active boost if available
    const { getActiveBoost } = await import('../lib/ladderSystem');
    const activeBoost = await getActiveBoost(req.user.user_id);
    if (activeBoost) {
      if (Number.isFinite(activeBoost.posts)) postLimit += activeBoost.posts;
      if (Number.isFinite(activeBoost.comments)) commentLimit += activeBoost.comments;
    }

    // Get current counts
    const postKey = getRateLimitKey('posts', req.user.device_fingerprint);
    const commentKey = getRateLimitKey('comments', req.user.device_fingerprint);

    const windowStart = now - windowMs;
    
    const [postEntries, commentEntries] = await Promise.all([
      redis.zRangeByScore(postKey, windowStart.toString(), now.toString()),
      redis.zRangeByScore(commentKey, windowStart.toString(), now.toString()),
    ]);

    // Add null safety for new users with zero history
    const postCount = (postEntries || []).length || 0;
    const commentCount = (commentEntries || []).length || 0;

    // Determine tier
    const tl = (req.user as any).trust_level;
    let currentTier: 'ghost' | 'newbie' | 'troll' | 'neutral' | 'scholar';
    if (tl === 'ghost' || tl === 'newbie') {
      currentTier = tl;
    } else if (req.user.trust_score < 0.5) {
      currentTier = 'troll';
    } else if (req.user.trust_score >= 1.8) {
      currentTier = 'scholar';
    } else {
      currentTier = 'neutral';
    }

    // Calculate reset times (next hour boundary)
    const nextHour = Math.ceil(now / windowMs) * windowMs;
    const resetInSeconds = Math.ceil((nextHour - now) / 1000);

    const result: RateLimitStatus & { server_time: number } = {
      trust_score: req.user.trust_score,
      current_tier: currentTier,
      server_time: now,
      limits: {
        posts: {
          total: postLimit,
          remaining: Math.max(0, postLimit - postCount),
          reset_in_seconds: resetInSeconds,
        },
        comments: {
          total: commentLimit,
          remaining: Math.max(0, commentLimit - commentCount),
          reset_in_seconds: resetInSeconds,
        },
        counter_lists: {
          total: 'Unlimited',
          remaining: 'Unlimited',
          reset_in_seconds: null,
        },
      },
    };

    res.json(result);
  } catch (error) {
    console.error('Error fetching rate limit status:', error);
    res.status(500).json({ error: 'Failed to fetch rate limit status' });
  }
});

// GET /api/users/me/notifications — Get merged feed (system + admin messages)
// Query: ?unread=true returns only unread system notifications (for bell)
router.get('/me/notifications', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  try {
    const uid = req.user.user_id;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const unreadOnly = req.query.unread === 'true';
    const now = new Date();

    const sysQuery: Record<string, unknown> = { user_id: uid };
    if (unreadOnly) sysQuery.read = false;

    // Admin messages: exclude dismissed only for bell modal (?unread=true)
    const adminQuery: Record<string, unknown> = {
      $or: [
        { type: 'individual', recipient_id: uid, expires_at: { $gt: now } },
        { type: 'broadcast', dismissed_by: unreadOnly ? { $nin: [uid] } : { $exists: true }, expires_at: { $gt: now } },
      ],
    };

    const [sysNotifs, adminMsgs] = await Promise.all([
      Notification.find(sysQuery).sort({ created_at: -1 }).limit(limit).lean(),
      AdminMessage.find(adminQuery).sort({ created_at: -1 }).limit(20).lean(),
    ]);

    const unreadCount = await Notification.countDocuments({ user_id: uid, read: false });

    const adminItems = adminMsgs.map((m) => ({
      _id: m._id,
      type: 'admin_message' as const,
      title: m.title,
      body: m.body,
      priority: m.priority,
      created_by: m.created_by,
      message_type: m.type,
      dismissed: m.dismissed_by.includes(uid),
      read: false,
      created_at: m.created_at,
    }));

    const merged = [...sysNotifs.map((n: Record<string, unknown>) => ({ ...n, is_admin: false })), ...adminItems.map((a) => ({ ...a, is_admin: true }))]
      .sort((a, b) => new Date((b as any).created_at as string).getTime() - new Date((a as any).created_at as string).getTime())
      .slice(0, limit);

    res.json({ notifications: merged, unreadCount });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// GET /api/users/me/notifications/unread-count — Quick badge count (system + admin messages)
router.get('/me/notifications/unread-count', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  try {
    const uid = req.user.user_id;
    const now = new Date();
    let sysCount = 0;
    let msgCount = 0;

    try { sysCount = await Notification.countDocuments({ user_id: uid, read: false }); } catch (err) { console.error('[Notifications] Failed to count system notifications:', (err as Error).message); }

    try {
      msgCount = await AdminMessage.countDocuments({
        $or: [
          { type: 'individual', recipient_id: uid, expires_at: { $gt: now } },
          { type: 'broadcast', dismissed_by: { $nin: [uid] }, expires_at: { $gt: now } },
        ],
      });
    } catch (err) { console.error('[Notifications] Failed to count admin messages:', (err as Error).message); }

    res.json({ count: sysCount + msgCount });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// GET /api/users/me/notifications/:id — Single notification (must be after unread-count to avoid route collision)
router.get('/me/notifications/:id', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  try {
    const uid = req.user.user_id;
    let notification: Record<string, unknown> | null = null;

    const sysNotif = await Notification.findOne({ _id: req.params.id, user_id: uid }).lean();
    if (sysNotif) {
      notification = { ...sysNotif, is_admin: false };
    } else {
      const adminMsg = await AdminMessage.findOne({
        _id: req.params.id,
        $or: [
          { type: 'individual', recipient_id: uid },
          { type: 'broadcast' },
        ],
      }).lean();
      if (adminMsg) {
        const dismissed = adminMsg.dismissed_by.includes(uid);
        notification = {
          _id: adminMsg._id,
          type: 'admin_message',
          title: adminMsg.title,
          body: adminMsg.body,
          priority: adminMsg.priority,
          created_by: adminMsg.created_by,
          message_type: adminMsg.type,
          expires_at: adminMsg.expires_at,
          dismissed,
          read: false,
          is_admin: true,
          created_at: adminMsg.created_at,
        };
      }
    }

    if (!notification) return res.status(404).json({ code: 'NOT_FOUND', error: 'Notification not found' });
    res.json({ notification });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

// PATCH /api/users/me/notifications/:id/read — Mark single notification as read
router.patch('/me/notifications/:id/read', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user.user_id },
      { read: true }
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

// PATCH /api/users/me/notifications/read-all — Mark all as read (system + dismiss admin messages)
router.patch('/me/notifications/read-all', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  try {
    const uid = req.user.user_id;
    await Notification.updateMany(
      { user_id: uid, read: false },
      { read: true }
    );
    await AdminMessage.updateMany(
      { type: 'broadcast', dismissed_by: { $nin: [uid] } },
      { $addToSet: { dismissed_by: uid } }
    );
    await AdminMessage.updateMany(
      { type: 'individual', recipient_id: uid, dismissed_by: { $nin: [uid] } },
      { $addToSet: { dismissed_by: uid } }
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

// Get merged feed: personal messages + active broadcasts not dismissed
router.get('/me/messages', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  try {
    const userId = req.user.user_id;
    const now = new Date();

    const [personal, broadcasts] = await Promise.all([
      AdminMessage.find({
        type: 'individual',
        recipient_id: userId,
        expires_at: { $gt: now },
      }).sort({ created_at: -1 }).limit(50).lean(),
      AdminMessage.find({
        type: 'broadcast',
        dismissed_by: { $nin: [userId] },
        expires_at: { $gt: now },
      }).sort({ created_at: -1 }).limit(20).lean(),
    ]);

    const merged = [...personal, ...broadcasts].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    res.json({ messages: merged });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Dismiss a broadcast (add user to dismissed_by)
router.patch('/me/messages/:id/dismiss', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  try {
    await AdminMessage.findByIdAndUpdate(req.params.id, {
      $addToSet: { dismissed_by: req.user.user_id },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to dismiss message' });
  }
});

export default router;
