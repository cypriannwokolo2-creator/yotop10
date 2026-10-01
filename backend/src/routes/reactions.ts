/* eslint-disable no-restricted-syntax, @typescript-eslint/no-explicit-any -- Express middleware type chains */
/**
 * Fire reaction engine (M40.1) — generalized to comment | post | list_item.
 *
 * Invariants:
 * - One reaction per (identity, target_type, target_id) — enforced by the
 *   Reaction compound unique index; toggle is delete-first to avoid TOCTOU.
 *   Identity = session user_id, or guest_id for anonymous visitors (M41.2).
 * - fire_count on the target model is the single source of truth for counts;
 *   it is updated atomically with $inc in the same flow as the Reaction doc.
 * - Side effects per target type:
 *     comment   → spark score recompute + ancestor propagation + ES reindex
 *                 + boost grant at exactly 3 fires (legacy behavior preserved)
 *     post      → last_engaged_at + ES reindex
 *     list_item → fire counter only (list items are not ES-indexed)
 * - Rate limited per identity (lib/fireRateLimit) before any DB work;
 *   guests get a tight 20/hour budget, signed users the default limits.
 * - All Mongoose calls run through per-type switches so every call site is on
 *   a concrete model — union-of-models method calls do not typecheck.
 */
import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Reaction } from '../models/Reaction';
import { Comment } from '../models/Comment';
import { Post } from '../models/Post';
import { ListItem } from '../models/ListItem';
import { grantBoost, BoostType } from '../lib/ladderSystem';
import { getThresholds, computeSparkScore, computeParentSparkScore } from '../lib/sparkScore';
import { indexComment, indexPost } from '../elasticsearch/lib/indexWriter';
import { consumeFire } from '../lib/fireRateLimit';
import {
  reactionToggleSchema,
  reactionStateQuerySchema,
  reactionTargetParamsSchema,
} from '../schemas/reactions';

const router: Router = Router();

type TargetType = 'comment' | 'post' | 'list_item';

/** Reaction identity: session user_id, or the guest_id cookie for anonymous visitors. */
const getReactionIdentity = (req: Request): string | undefined => {
  const id = req.user?.user_id || req.guest_id;
  if (!id || id === 'unknown') return undefined;
  return id;
};

/** Guests get a 20/hour fire budget; signed-in users keep the default limits. */
const fireBudget = (req: Request): { limit?: number; windowMs?: number } =>
  req.user ? {} : { limit: 20, windowMs: 60 * 60 * 1000 };

/** Atomically bump fire_count (+ side-effect fields) on the concrete model. */
async function bumpFireCount(
  targetType: TargetType,
  targetId: string,
  delta: 1 | -1
): Promise<{ fire_count: number } | null> {
  const now = new Date();
  switch (targetType) {
    case 'comment': {
      const updated = await Comment.findByIdAndUpdate(
        targetId,
        { $inc: { fire_count: delta }, last_engaged_at: now },
        { new: true }
      );
      return updated ? { fire_count: updated.fire_count } : null;
    }
    case 'post': {
      const updated = await Post.findByIdAndUpdate(
        targetId,
        { $inc: { fire_count: delta }, last_engaged_at: now },
        { new: true }
      );
      return updated ? { fire_count: updated.fire_count } : null;
    }
    case 'list_item': {
      const updated = await ListItem.findByIdAndUpdate(
        targetId,
        { $inc: { fire_count: delta } },
        { new: true }
      );
      return updated ? { fire_count: updated.fire_count } : null;
    }
  }
}

/** Existence + current count lookup on the concrete model (null = missing). */
async function getFireCount(targetType: TargetType, targetId: string): Promise<number | null> {
  switch (targetType) {
    case 'comment': {
      const doc = await Comment.findById(targetId).select('fire_count').lean();
      return doc ? (doc.fire_count || 0) : null;
    }
    case 'post': {
      const doc = await Post.findById(targetId).select('fire_count').lean();
      return doc ? (doc.fire_count || 0) : null;
    }
    case 'list_item': {
      const doc = await ListItem.findById(targetId).select('fire_count').lean();
      return doc ? (doc.fire_count || 0) : null;
    }
  }
}

/**
 * Comment-only side effects: boost at exactly 3 fires, spark score recompute,
 * ancestor propagation, ES reindex. Legacy behavior from the comment-only era.
 */
async function applyCommentSideEffects(targetId: string, action: 'added' | 'removed', newCount: number): Promise<number> {
  const comment = await Comment.findById(targetId);
  if (!comment) return newCount;

  const thresholds = await getThresholds();

  if (comment.fire_count === 3 && action === 'added' && comment.author_id) {
    await grantBoost(comment.author_id.toString(), BoostType.COMMENT_THREE_FIRES);
  }

  const sparkScore = computeSparkScore(
    { fireCount: comment.fire_count, replyCount: comment.reply_count, createdAt: comment.created_at },
    thresholds
  );
  await Comment.findByIdAndUpdate(targetId, { spark_score: sparkScore });

  if (comment.parent_comment_id) {
    let currentParentId = comment.parent_comment_id.toString();
    const visited = new Set<string>();
    const now = new Date();
    while (currentParentId && !visited.has(currentParentId)) {
      visited.add(currentParentId);
      const parent = await Comment.findById(currentParentId);
      if (!parent) break;

      const children = await Comment.find({ parent_comment_id: currentParentId })
        .select('fire_count reply_count')
        .lean();
      let childFires = 0;
      let childReplies = 0;
      for (const child of children) {
        childFires += (child as { fire_count?: number }).fire_count || 0;
        childReplies += (child as { reply_count?: number }).reply_count || 0;
      }
      const parentSparkScore = computeParentSparkScore(
        {
          fireCount: parent.fire_count,
          replyCount: parent.reply_count,
          createdAt: parent.created_at,
          childFires,
          childReplies,
        },
        thresholds
      );
      await Comment.findByIdAndUpdate(currentParentId, {
        spark_score: parentSparkScore,
        last_engaged_at: now,
      });
      if (!parent.parent_comment_id) break;
      currentParentId = parent.parent_comment_id.toString();
    }
  }

  const fresh = await Comment.findById(targetId).lean();
  if (fresh) indexComment(fresh as unknown as Record<string, unknown>);
  return sparkScore;
}

function zodMessage(err: { issues: Array<{ message: string }> }): string {
  return err.issues.map((i) => i.message).join('; ');
}

// POST /api/reactions - Toggle fire reaction on comment | post | list_item
router.post('/', async (req: Request, res: Response) => {
  try {
    const identity = getReactionIdentity(req);
    if (!identity) {
      return res.status(401).json({ error: 'Identity required for reactions' });
    }

    const rate = consumeFire(identity, fireBudget(req));
    if (!rate.allowed) {
      res.setHeader('Retry-After', Math.ceil(rate.retryAfterMs / 1000).toString());
      return res.status(429).json({ error: 'Too many reactions, slow down', retry_after_ms: rate.retryAfterMs });
    }

    const parsed = reactionToggleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: zodMessage(parsed.error) });
    }
    const targetType = parsed.data.target_type;
    const target_id = parsed.data.target_id;

    const existing = await getFireCount(targetType, target_id);
    if (existing === null) {
      return res.status(404).json({ error: `${targetType} not found` });
    }

    // Atomic delete-first toggle: prevents TOCTOU race via unique compound index.
    const removed = await Reaction.findOneAndDelete({
      user_device_fingerprint: identity,
      target_type: targetType,
      target_id,
    });

    let action: 'added' | 'removed';
    if (removed) {
      action = 'removed';
    } else {
      try {
        await Reaction.create({
          user_device_fingerprint: identity,
          target_type: targetType,
          target_id,
          reaction_type: 'fire',
        });
        action = 'added';
      } catch (err: unknown) {
        if (err instanceof Error && err.message.includes('duplicate key')) {
          return res.status(409).json({ error: 'Already reacted' });
        }
        throw err;
      }
    }

    const bumped = await bumpFireCount(targetType, target_id, action === 'added' ? 1 : -1);
    if (!bumped) {
      return res.status(404).json({ error: `${targetType} not found` });
    }

    let count = bumped.fire_count;
    if (targetType === 'comment') {
      count = await applyCommentSideEffects(target_id, action, count);
    } else if (targetType === 'post') {
      const fresh = await Post.findById(target_id).lean();
      if (fresh) indexPost(fresh as unknown as Record<string, unknown>);
    }

    return res.json({
      success: true,
      action,
      target_type: targetType,
      target_id,
      fire_count: count,
      count,
      user_reacted: action === 'added',
    });
  } catch (error) {
    console.error('Toggle reaction error:', error);
    return res.status(500).json({ error: 'Failed to toggle reaction' });
  }
});

// GET /api/reactions/state - Check reaction status for multiple targets
router.get('/state', async (req: Request, res: Response) => {
  try {
    const identity = getReactionIdentity(req);
    if (!identity) {
      return res.status(401).json({ error: 'Identity required' });
    }

    const parsed = reactionStateQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: zodMessage(parsed.error) });
    }

    const parsedTargets = JSON.parse(parsed.data.targets) as Array<{ type: TargetType; id: string }>;
    if (parsedTargets.length === 0) {
      return res.json({ targets: [] });
    }

    const targetIds = parsedTargets.map((t) => new mongoose.Types.ObjectId(t.id));
    const userReactions = await Reaction.find({
      user_device_fingerprint: identity,
      target_id: { $in: targetIds },
    }).lean();

    const reactedMap = new Map<string, boolean>();
    userReactions.forEach((r) => reactedMap.set((r.target_id as mongoose.Types.ObjectId).toString(), true));

    const results = parsedTargets.map((t) => ({
      type: t.type,
      id: t.id,
      user_reacted: reactedMap.has(t.id) || false,
    }));

    return res.json({ targets: results });
  } catch (error) {
    console.error('Get reaction state error:', error);
    return res.status(500).json({ error: 'Failed to get reaction state' });
  }
});

// GET /api/reactions/:targetType/:targetId - Get reaction count and user status
router.get('/:targetType/:targetId', async (req: Request, res: Response) => {
  try {
    const parsed = reactionTargetParamsSchema.safeParse(req.params);
    if (!parsed.success) {
      return res.status(400).json({ error: zodMessage(parsed.error) });
    }
    const targetType = parsed.data.targetType;
    const targetId = parsed.data.targetId;
    const identity = getReactionIdentity(req);

    const count = await getFireCount(targetType, targetId);
    if (count === null) {
      return res.status(404).json({ error: 'Target not found' });
    }

    let user_reacted = false;
    if (identity) {
      const userReaction = await Reaction.findOne({
        user_device_fingerprint: identity,
        target_type: targetType,
        target_id: targetId,
      }).lean();
      user_reacted = !!userReaction;
    }

    return res.json({
      target_type: targetType,
      target_id: targetId,
      fire_count: count,
      user_reacted,
    });
  } catch (error) {
    console.error('Get reaction error:', error);
    return res.status(500).json({ error: 'Failed to get reaction' });
  }
});

export default router;
