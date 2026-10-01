import { Post } from '../models/Post';
import { Comment } from '../models/Comment';
import { ListItem } from '../models/ListItem';
import { User } from '../models/User';
import { redis } from './redis';
import { logAudit } from './auditWriter';
import { getConfig } from './systemConfig';
import { removePost, removeComment } from '../elasticsearch/lib/indexWriter';

/**
 * M41.3 — gradual legacy-anonymous content cleanup.
 *
 * Pre-M41 posts were authored by anonymous fingerprint-identity
 * accounts and are mock data (owner decision: the admin composes
 * real content, so the platform transitions without a big-bang
 * deletion). Each hourly run removes a bounded batch:
 *
 *  1. The oldest approved posts authored by `legacy_anonymous`
 *     users — up to `anon_cleanup_batch_size` (SystemConfig,
 *     default 10) per run. Comments and list items on those posts
 *     cascade via the existing delete path (comments → list items →
 *     post → Elasticsearch removal).
 *  2. Up to 100 remaining comments by legacy-anonymous authors on
 *     posts that survive the batch.
 *
 * Idempotent: re-running with no legacy content is a no-op. The
 * Redis lock ensures only one server executes the batch at a time.
 * The job self-stops (logging "legacy cleanup complete") once zero
 * legacy approved posts remain.
 */

const LOCK_KEY = 'cron:anon-cleanup';
const LOCK_TTL_SECONDS = 600;
const ORPHAN_COMMENT_BATCH = 100;

interface LeanRow {
  _id: { toString(): string };
}

async function acquireLock(): Promise<boolean> {
  try {
    const acquired = await redis.set(LOCK_KEY, '1', { NX: true, EX: LOCK_TTL_SECONDS });
    return acquired !== null;
  } catch (err) {
    // Without the lock we cannot guarantee single-server execution — skip the run.
    console.error('[AnonCleanup] Redis lock unavailable, skipping run:', (err as Error).message);
    return false;
  }
}

async function executeCleanup(): Promise<void> {
  const { anon_cleanup_batch_size: batchSize } = getConfig();

  const legacyUsers = await User.find({ legacy_anonymous: true }).select('_id').lean();
  if (legacyUsers.length === 0) {
    console.log('[AnonCleanup] legacy cleanup complete — no legacy_anonymous accounts remain');
    return;
  }
  const legacyIds = (legacyUsers as LeanRow[]).map((u) => u._id.toString());

  // Phase 1: oldest approved legacy posts (bounded batch).
  const posts = await Post.find({
    author_id: { $in: legacyIds },
    status: 'approved',
    deleted: { $ne: true },
  })
    .sort({ created_at: 1 })
    .limit(batchSize)
    .lean();

  let postsRemoved = 0;
  let commentsRemoved = 0;

  for (const post of posts as LeanRow[]) {
    const postId = post._id.toString();
    const cascade = await Comment.deleteMany({ post_id: post._id });
    commentsRemoved += cascade.deletedCount;
    await ListItem.deleteMany({ post_id: post._id });
    await Post.deleteOne({ _id: post._id });
    removePost(postId);
    postsRemoved += 1;
  }

  // Phase 2: legacy-anon comments on surviving posts (bounded batch).
  const orphans = await Comment.find({
    author_id: { $in: legacyIds },
    deleted: { $ne: true },
  })
    .sort({ created_at: 1 })
    .limit(ORPHAN_COMMENT_BATCH)
    .lean();

  if (orphans.length > 0) {
    const orphanIds = (orphans as LeanRow[]).map((c) => c._id.toString());
    await Comment.deleteMany({ _id: { $in: orphanIds } });
    for (const id of orphanIds) removeComment(id);
    commentsRemoved += orphanIds.length;
  }

  const remaining = await Post.countDocuments({
    author_id: { $in: legacyIds },
    status: 'approved',
    deleted: { $ne: true },
  });
  if (remaining === 0) {
    console.log('[AnonCleanup] legacy cleanup complete — no legacy_anonymous approved posts remain');
  }

  if (postsRemoved > 0 || commentsRemoved > 0) {
    logAudit({
      admin_id: 'system',
      action: 'anon_cleanup',
      ip: 'system',
      metadata: { posts_removed: postsRemoved, comments_removed: commentsRemoved, batch_size: batchSize },
    });
    console.log(`[AnonCleanup] removed ${postsRemoved} posts and ${commentsRemoved} comments (${remaining} legacy posts remain)`);
  }
}

export async function runAnonCleanupCron(): Promise<void> {
  const locked = await acquireLock();
  if (!locked) return;
  try {
    await executeCleanup();
  } finally {
    try {
      await redis.del(LOCK_KEY);
    } catch { /* lock expires on its own TTL */ }
  }
}
