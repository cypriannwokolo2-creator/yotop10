import { describe, it, expect } from 'vitest';
import { Types } from 'mongoose';
import {
  MIGRATION_ID,
  TARGET_USERNAME,
  AUTHORED_COLLECTIONS,
  SECONDARY_USER_COLLECTIONS,
  asBackedUpDocs,
  backupDir,
  fromStorage,
  parseBackup,
  stringifyBackup,
  toStorage,
  type ConsolidationBackup,
} from './userConsolidationShared';

describe('userConsolidationShared', () => {
  describe('toStorage / fromStorage', () => {
    it('round-trips primitives', () => {
      for (const value of [null, '', 'cyprianzube', 0, -12.5, true, false]) {
        expect(fromStorage(toStorage(value))).toEqual(value);
      }
    });

    it('round-trips nested objects and arrays', () => {
      const doc = {
        tier0: { screenResolution: '1440x900', hardwareConcurrency: 8 },
        tags: ['a', 'b'],
        nested: { deep: { list: [1, 2, { ok: true }] } },
      };
      expect(fromStorage(toStorage(doc))).toEqual(doc);
    });

    it('round-trips ObjectId as {$oid}', () => {
      const _id = new Types.ObjectId();
      const stored = toStorage({ _id });
      expect(stored).toEqual({ _id: { $oid: _id.toHexString() } });
      const restored = fromStorage(stored) as { _id: Types.ObjectId };
      expect(restored._id.toHexString()).toBe(_id.toHexString());
      expect(restored._id).toBeInstanceOf(Types.ObjectId);
    });

    it('round-trips Date as {$date}', () => {
      const at = new Date('2026-10-01T12:34:56.789Z');
      const stored = toStorage({ created_at: at });
      expect(stored).toEqual({ created_at: { $date: '2026-10-01T12:34:56.789Z' } });
      const restored = fromStorage(stored) as { created_at: Date };
      expect(restored.created_at).toBeInstanceOf(Date);
      expect(restored.created_at.getTime()).toBe(at.getTime());
    });

    it('refuses to silently drop a value it cannot represent', () => {
      expect(() => toStorage({ tier1: new Map([['k', 'v']]) })).toThrow(/Cannot back up BSON value of type: Map/);
      expect(() => toStorage({ n: Number.NaN })).toThrow(/non-finite number/);
      expect(() => toStorage({ u: undefined })).toThrow(/undefined/);
      expect(() => toStorage({ b: 1n })).toThrow(/bigint/);
    });

    it('does not confuse a literal {$oid}/{$date} key with an encoded value', () => {
      const literalOid = { $oid: 'not-an-encoding' };
      const literalDate = { $date: 'yesterday' };
      expect(fromStorage(literalOid)).toEqual(literalOid);
      expect(fromStorage(literalDate)).toEqual(literalDate);
    });
  });

  describe('backup file round-trip', () => {
    const backup: ConsolidationBackup = {
      migration: MIGRATION_ID,
      createdAt: '2026-10-01T00:00:00.000Z',
      target: { user_id: 'deadbeefcafe0001', username: TARGET_USERNAME },
      users: asBackedUpDocs([
        {
          _id: new Types.ObjectId(),
          user_id: '54f39ac86e1f07ab',
          username: 'a_54f3_9ac8',
          device_fingerprint: 'adf1533a371b7c528b031e79ce61e812',
          trust_score: 1.4,
          created_at: new Date('2026-01-02T03:04:05.000Z'),
          links: { x: null },
        },
      ]),
      authored: {
        posts: [
          {
            _id: new Types.ObjectId(),
            author_id: '54f39ac86e1f07ab',
            author_username: 'a_cutiee',
            author_display_name: 'a_cutiee',
          },
        ],
        articles: [],
        comments: [],
      },
      secondary: {
        userdevices: asBackedUpDocs([{ _id: new Types.ObjectId(), user_id: '54f39ac86e1f07ab' }]),
        fingerprintobservations: [],
        usernamehistories: [],
        trustscorelogs: [],
        savedposts: [],
        notifications: [],
      },
      adminmessages: [],
    };

    it('survives stringify → parse with BSON values intact', () => {
      const restored = parseBackup(stringifyBackup(backup));

      expect(restored.migration).toBe(MIGRATION_ID);
      expect(restored.target.username).toBe(TARGET_USERNAME);
      expect(restored.users[0]._id.toHexString()).toBe(backup.users[0]._id.toHexString());
      expect(restored.users[0].created_at).toBeInstanceOf(Date);
      expect((restored.users[0].created_at as Date).toISOString()).toBe('2026-01-02T03:04:05.000Z');
      expect(restored.authored.posts[0]._id.toHexString()).toBe(backup.authored.posts[0]._id.toHexString());
      expect(restored.secondary.userdevices[0]._id.toHexString()).toBe(
        backup.secondary.userdevices[0]._id.toHexString(),
      );
    });

    it('keeps both scripts on the same collection lists', () => {
      expect([...AUTHORED_COLLECTIONS]).toEqual(['posts', 'articles', 'comments']);
      expect([...SECONDARY_USER_COLLECTIONS]).toEqual([
        'fingerprintobservations',
        'usernamehistories',
        'trustscorelogs',
        'savedposts',
        'notifications',
        'userdevices',
      ]);
    });
  });

  describe('backupDir', () => {
    it('resolves under backend/uploads so the host can reach it', () => {
      expect(backupDir()).toMatch(/[\\/]uploads[\\/]migrations-backups$/);
    });
  });
});
