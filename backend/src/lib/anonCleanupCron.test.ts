import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockRedisSet = vi.fn();
const mockRedisDel = vi.fn();

vi.mock('./redis', () => ({
  redis: {
    set: (...args: unknown[]) => mockRedisSet(...args),
    del: (...args: unknown[]) => mockRedisDel(...args),
  },
}));

const userFindCalls: unknown[][] = [];
const mockUserFindLean = vi.fn();
vi.mock('../models/User', () => ({
  User: {
    find: (...args: unknown[]) => {
      userFindCalls.push(args);
      return {
        select: () => ({
          lean: mockUserFindLean,
        }),
      };
    },
  },
}));

const postFindCalls: unknown[][] = [];
const postSortCalls: unknown[][] = [];
const postLimitCalls: unknown[][] = [];
const mockPostFindLean = vi.fn();
const mockPostDeleteOne = vi.fn();
const mockPostCountDocuments = vi.fn();
vi.mock('../models/Post', () => ({
  Post: {
    find: (...args: unknown[]) => {
      postFindCalls.push(args);
      return {
        sort: (...sortArgs: unknown[]) => {
          postSortCalls.push(sortArgs);
          return {
            limit: (...limitArgs: unknown[]) => {
              postLimitCalls.push(limitArgs);
              return { lean: mockPostFindLean };
            },
          };
        },
      };
    },
    deleteOne: (...args: unknown[]) => mockPostDeleteOne(...args),
    countDocuments: (...args: unknown[]) => mockPostCountDocuments(...args),
  },
}));

const commentDeleteManyCalls: unknown[][] = [];
const mockCommentDeleteMany = vi.fn();
const commentFindCalls: unknown[][] = [];
const commentSortCalls: unknown[][] = [];
const commentLimitCalls: unknown[][] = [];
const mockCommentFindLean = vi.fn();
vi.mock('../models/Comment', () => ({
  Comment: {
    deleteMany: (...args: unknown[]) => {
      commentDeleteManyCalls.push(args);
      return mockCommentDeleteMany(...args);
    },
    find: (...args: unknown[]) => {
      commentFindCalls.push(args);
      return {
        sort: (...sortArgs: unknown[]) => {
          commentSortCalls.push(sortArgs);
          return {
            limit: (...limitArgs: unknown[]) => {
              commentLimitCalls.push(limitArgs);
              return { lean: mockCommentFindLean };
            },
          };
        },
      };
    },
  },
}));

const mockListItemDeleteMany = vi.fn();
vi.mock('../models/ListItem', () => ({
  ListItem: {
    deleteMany: (...args: unknown[]) => mockListItemDeleteMany(...args),
  },
}));

const mockLogAudit = vi.fn();
vi.mock('./auditWriter', () => ({
  logAudit: (...args: unknown[]) => mockLogAudit(...args),
}));

const mockGetConfig = vi.fn();
vi.mock('./systemConfig', () => ({
  getConfig: () => mockGetConfig(),
}));

const mockRemovePost = vi.fn();
const mockRemoveComment = vi.fn();
vi.mock('../elasticsearch/lib/indexWriter', () => ({
  removePost: (...args: unknown[]) => mockRemovePost(...args),
  removeComment: (...args: unknown[]) => mockRemoveComment(...args),
}));

import { runAnonCleanupCron } from './anonCleanupCron';

function userRow(id: string) {
  return { _id: { toString: () => id } };
}

function postRow(id: string) {
  return { _id: { toString: () => id } };
}

function commentRow(id: string) {
  return { _id: { toString: () => id } };
}

describe('anonCleanupCron', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userFindCalls.length = 0;
    postFindCalls.length = 0;
    postSortCalls.length = 0;
    postLimitCalls.length = 0;
    commentDeleteManyCalls.length = 0;
    commentFindCalls.length = 0;
    commentSortCalls.length = 0;
    commentLimitCalls.length = 0;
    mockGetConfig.mockReturnValue({ anon_cleanup_batch_size: 10 });
    mockRedisSet.mockResolvedValue('OK');
    mockRedisDel.mockResolvedValue(1);
  });

  it('deletes the oldest approved legacy posts with a full cascade', async () => {
    mockUserFindLean.mockResolvedValue([userRow('u1'), userRow('u2')]);
    mockPostFindLean.mockResolvedValue([postRow('p1'), postRow('p2')]);
    mockCommentDeleteMany.mockResolvedValue({ deletedCount: 3 });
    mockListItemDeleteMany.mockResolvedValue({ deletedCount: 5 });
    mockPostDeleteOne.mockResolvedValue({ deletedCount: 1 });
    mockCommentFindLean.mockResolvedValue([]);
    mockPostCountDocuments.mockResolvedValue(1);

    await runAnonCleanupCron();

    expect(postFindCalls[0][0]).toEqual({
      author_id: { $in: ['u1', 'u2'] },
      status: 'approved',
      deleted: { $ne: true },
    });
    expect(postSortCalls[0][0]).toEqual({ created_at: 1 });
    expect(postLimitCalls[0][0]).toBe(10);
    expect(mockPostDeleteOne).toHaveBeenCalledTimes(2);
    expect(mockListItemDeleteMany).toHaveBeenCalledTimes(2);
    // 2 cascade deletes (one per post) + 0 orphan pass
    expect(commentDeleteManyCalls).toHaveLength(2);
    expect(mockRemovePost).toHaveBeenCalledWith('p1');
    expect(mockRemovePost).toHaveBeenCalledWith('p2');
    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        admin_id: 'system',
        action: 'anon_cleanup',
        metadata: expect.objectContaining({ posts_removed: 2, comments_removed: 6 }),
      }),
    );
  });

  it('deletes up to 100 orphaned legacy-anon comments on surviving posts', async () => {
    mockUserFindLean.mockResolvedValue([userRow('u1')]);
    mockPostFindLean.mockResolvedValue([]);
    mockCommentFindLean.mockResolvedValue([commentRow('c1'), commentRow('c2')]);
    mockCommentDeleteMany.mockResolvedValue({ deletedCount: 0 });
    mockPostCountDocuments.mockResolvedValue(0);

    await runAnonCleanupCron();

    expect(commentFindCalls[0][0]).toEqual({
      author_id: { $in: ['u1'] },
      deleted: { $ne: true },
    });
    expect(commentSortCalls[0][0]).toEqual({ created_at: 1 });
    expect(commentLimitCalls[0][0]).toBe(100);
    expect(mockCommentDeleteMany).toHaveBeenCalledWith({ _id: { $in: ['c1', 'c2'] } });
    expect(mockRemoveComment).toHaveBeenCalledWith('c1');
    expect(mockRemoveComment).toHaveBeenCalledWith('c2');
    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({ posts_removed: 0, comments_removed: 2 }),
      }),
    );
  });

  it('skips the run when another server holds the Redis lock', async () => {
    mockRedisSet.mockResolvedValue(null);
    mockUserFindLean.mockResolvedValue([userRow('u1')]);

    await runAnonCleanupCron();

    expect(userFindCalls).toHaveLength(0);
    expect(mockLogAudit).not.toHaveBeenCalled();
  });

  it('skips the run (and does not throw) when Redis is unavailable', async () => {
    mockRedisSet.mockRejectedValue(new Error('redis down'));

    await expect(runAnonCleanupCron()).resolves.toBeUndefined();
    expect(userFindCalls).toHaveLength(0);
  });

  it('releases the lock even when the cleanup fails', async () => {
    mockUserFindLean.mockRejectedValue(new Error('db down'));

    await expect(runAnonCleanupCron()).rejects.toThrow('db down');
    expect(mockRedisDel).toHaveBeenCalledWith('cron:anon-cleanup');
  });

  it('does not audit a no-op run', async () => {
    mockUserFindLean.mockResolvedValue([userRow('u1')]);
    mockPostFindLean.mockResolvedValue([]);
    mockCommentFindLean.mockResolvedValue([]);
    mockPostCountDocuments.mockResolvedValue(0);

    await runAnonCleanupCron();

    expect(mockLogAudit).not.toHaveBeenCalled();
  });

  it('honours a custom batch size from SystemConfig', async () => {
    mockGetConfig.mockReturnValue({ anon_cleanup_batch_size: 3 });
    mockUserFindLean.mockResolvedValue([userRow('u1')]);
    mockPostFindLean.mockResolvedValue([]);
    mockCommentFindLean.mockResolvedValue([]);
    mockPostCountDocuments.mockResolvedValue(0);

    await runAnonCleanupCron();

    expect(postLimitCalls[0][0]).toBe(3);
  });
});
