import { describe, it, expect, beforeEach, vi } from 'vitest';

// SecretsManager falls back to env vars (min 64 chars for JWT_SECRET).
process.env.JWT_SECRET =
  'm41-unit-test-jwt-secret-0123456789abcdefghijklmnopqrstuvwxyz000';

const { redisStore } = vi.hoisted(() => {
  const redisStore = new Map<string, string>();
  return { redisStore };
});

vi.mock('./redis', () => ({
  redis: {
    get: vi.fn(async (k: string) => redisStore.get(k) ?? null),
    set: vi.fn(async (k: string, v: string) => {
      redisStore.set(k, v);
    }),
    del: vi.fn(async (...keys: string[]) => {
      for (const k of keys) redisStore.delete(k);
    }),
    incr: vi.fn(async (k: string) => {
      const n = Number(redisStore.get(k) ?? 0) + 1;
      redisStore.set(k, String(n));
      return n;
    }),
    expire: vi.fn(async () => true),
  },
}));

const { usersById, userCreated, updateOneCalls } = vi.hoisted(() => {
  const usersById = new Map<string, Record<string, unknown>>();
  const userCreated: Array<Record<string, unknown>> = [];
  const updateOneCalls: Array<{ filter: unknown; update: unknown }> = [];
  return { usersById, userCreated, updateOneCalls };
});

function makeQuery(doc: Record<string, unknown> | null) {
  const builder = {
    select: () => builder,
    lean: () => Promise.resolve(doc ? { ...doc } : null),
    then: (
      onFulfilled: (v: unknown) => unknown,
      onRejected: (e: unknown) => unknown,
    ) => Promise.resolve(doc ? { ...doc } : null).then(onFulfilled, onRejected),
  };
  return builder;
}

vi.mock('../models/User', () => ({
  User: {
    findOne: vi.fn((query: Record<string, unknown>) => {
      if (query.user_id) {
        return makeQuery(usersById.get(String(query.user_id)) ?? null);
      }
      // Support $or lookups (e.g. short-username collision guards).
      if (Array.isArray(query.$or)) {
        const conds = query.$or as Array<Record<string, unknown>>;
        const match = [...usersById.values()].find((doc) =>
          conds.some((cond) =>
            Object.entries(cond).every(([key, value]) => doc[key] === value),
          ),
        );
        return makeQuery(match ?? null);
      }
      return makeQuery(null);
    }),
    create: vi.fn(async (data: Record<string, unknown>) => {
      userCreated.push(data);
      const doc = { ...data };
      usersById.set(String(doc.user_id), doc);
      return doc;
    }),
    updateOne: vi.fn(async (filter: unknown, update: unknown) => {
      updateOneCalls.push({ filter, update });
      return { modifiedCount: 1 };
    }),
  },
}));

vi.mock('../models/Post', () => ({
  Post: {
    aggregate: vi.fn(async () => [
      { _id: 'approved', count: 3 },
      { _id: 'rejected', count: 1 },
      { _id: 'pending_review', count: 2 },
    ]),
  },
}));

vi.mock('../models/Comment', () => ({
  Comment: { countDocuments: vi.fn(async () => 7) },
}));

vi.mock('./trustScore', () => ({
  checkAndPromoteUser: vi.fn(async () => {}),
}));

import {
  toSessionUser,
  issueSessionToken,
  verifySessionToken,
  setSessionCookie,
  clearSessionCookie,
  generateDeviceKey,
  hashDeviceKey,
  findTrustedDevice,
  getLoginLockStatus,
  recordLoginFailure,
  clearLoginFailures,
  createAuthUser,
  buildMeResponse,
} from './userAuth';

const BASE_USER = {
  user_id: 'u1',
  username: 'alice',
  custom_display_name: null,
  email: 'alice@example.com',
  trust_score: 2.5,
  trust_locked: false,
  is_admin: false,
  token_version: 3,
  two_factor: { enabled: true },
};

function captureRes() {
  const cookies: Array<{ name: string; value: string; opts: unknown }> = [];
  const cleared: Array<{ name: string; opts: unknown }> = [];
  return {
    cookies,
    cleared,
    cookie: (name: string, value: string, opts: unknown) => {
      cookies.push({ name, value, opts });
    },
    clearCookie: (name: string, opts: unknown) => {
      cleared.push({ name, opts });
    },
  };
}

describe('toSessionUser', () => {
  it('maps the user document to a session shape', () => {
    const session = toSessionUser(BASE_USER);
    expect(session.user_id).toBe('u1');
    expect(session.username).toBe('alice');
    expect(session.email).toBe('alice@example.com');
    expect(session.trust_score).toBe(2.5);
    expect(session.token_version).toBe(3);
    expect(session.two_factor_enabled).toBe(true);
    expect(session.trust_locked).toBe(false);
    expect(session.is_admin).toBe(false);
  });

  it('defaults optional fields to null/undefined', () => {
    const session = toSessionUser({
      user_id: 'u2',
      username: 'bob',
      trust_score: 0,
      trust_locked: false,
      is_admin: false,
      token_version: 0,
    });
    expect(session.custom_display_name).toBeNull();
    expect(session.email).toBeNull();
    expect(session.two_factor_enabled).toBe(false);
    expect(session.restricted_until).toBeNull();
    expect(session.rate_limit_override).toBeUndefined();
  });
});

describe('session token', () => {
  beforeEach(() => {
    usersById.clear();
  });

  it('round-trips a token to the session user', async () => {
    usersById.set('u1', { ...BASE_USER });
    const token = await issueSessionToken({
      user_id: 'u1',
      username: 'alice',
      token_version: 3,
    });
    const session = await verifySessionToken(token);
    expect(session).not.toBeNull();
    expect(session?.user_id).toBe('u1');
    expect(session?.username).toBe('alice');
    expect(session?.token_version).toBe(3);
    expect(session?.two_factor_enabled).toBe(true);
  });

  it('returns null for a garbage token', async () => {
    expect(await verifySessionToken('not-a-jwt')).toBeNull();
  });

  it('returns null for an unknown user', async () => {
    const token = await issueSessionToken({
      user_id: 'missing',
      username: 'ghost',
      token_version: 0,
    });
    expect(await verifySessionToken(token)).toBeNull();
  });

  it('returns null when token_version changed (logout / password reset)', async () => {
    usersById.set('u1', { ...BASE_USER, token_version: 4 });
    const token = await issueSessionToken({
      user_id: 'u1',
      username: 'alice',
      token_version: 3,
    });
    expect(await verifySessionToken(token)).toBeNull();
  });
});

describe('session cookies', () => {
  it('sets an httpOnly strict session cookie with 7-day maxAge', async () => {
    const res = captureRes();
    setSessionCookie(res as unknown as import('express').Response, 'tok');
    expect(res.cookies).toHaveLength(1);
    expect(res.cookies[0].name).toBe('session_token');
    expect(res.cookies[0].value).toBe('tok');
    const opts = res.cookies[0].opts as Record<string, unknown>;
    expect(opts.httpOnly).toBe(true);
    expect(opts.sameSite).toBe('strict');
    expect(opts.maxAge).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it('clears the session cookie', () => {
    const res = captureRes();
    clearSessionCookie(res as unknown as import('express').Response);
    expect(res.cleared).toHaveLength(1);
    expect(res.cleared[0].name).toBe('session_token');
  });
});

describe('trusted devices', () => {
  it('generates a 64-char hex device key', () => {
    expect(generateDeviceKey()).toMatch(/^[0-9a-f]{64}$/);
  });

  it('hashes device keys with SHA-256', () => {
    expect(hashDeviceKey('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });

  it('finds a trusted device by key', () => {
    const devices = [{ id_hash: hashDeviceKey('key1') }];
    expect(findTrustedDevice(devices, 'key1')).toBe(true);
    expect(findTrustedDevice(devices, 'key2')).toBe(false);
  });

  it('returns false for missing inputs', () => {
    expect(findTrustedDevice(null, 'key1')).toBe(false);
    expect(findTrustedDevice([], 'key1')).toBe(false);
    expect(findTrustedDevice([{ id_hash: 'x' }], null)).toBe(false);
    expect(findTrustedDevice([{ id_hash: 'x' }], undefined)).toBe(false);
  });

  it('trustDevice pulls duplicates and pushes to the front with a 10-device cap', async () => {
    updateOneCalls.length = 0;
    await (
      await import('./userAuth')
    ).trustDevice('u1', 'key1');
    expect(updateOneCalls).toHaveLength(2);
    expect(updateOneCalls[0]).toEqual({
      filter: { user_id: 'u1' },
      update: { $pull: { trusted_devices: { id_hash: hashDeviceKey('key1') } } },
    });
    const push = updateOneCalls[1].update as {
      $push: {
        trusted_devices: {
          $each: Array<{ id_hash: string }>;
          $position: number;
          $slice: number;
        };
      };
    };
    expect(push.$push.trusted_devices.$each[0].id_hash).toBe(
      hashDeviceKey('key1'),
    );
    expect(push.$push.trusted_devices.$position).toBe(0);
    expect(push.$push.trusted_devices.$slice).toBe(10);
  });
});

describe('login lockout', () => {
  beforeEach(() => {
    redisStore.clear();
  });

  it('is unlocked initially', async () => {
    expect(await getLoginLockStatus('a@b.co')).toEqual({
      locked: false,
      retryAfterSeconds: null,
    });
  });

  it('does not lock before 5 failures', async () => {
    for (let i = 0; i < 4; i += 1) {
      expect(await recordLoginFailure('a@b.co')).toBe(false);
    }
    expect(await getLoginLockStatus('a@b.co')).toEqual({
      locked: false,
      retryAfterSeconds: null,
    });
  });

  it('locks after 5 failures and reports a retry window', async () => {
    for (let i = 0; i < 5; i += 1) {
      await recordLoginFailure('a@b.co');
    }
    const status = await getLoginLockStatus('a@b.co');
    expect(status.locked).toBe(true);
    expect(status.retryAfterSeconds).not.toBeNull();
    expect(status.retryAfterSeconds).toBeGreaterThan(0);
    expect(status.retryAfterSeconds).toBeLessThanOrEqual(15 * 60);
  });

  it('clears failures and lock', async () => {
    for (let i = 0; i < 5; i += 1) {
      await recordLoginFailure('a@b.co');
    }
    await clearLoginFailures('a@b.co');
    expect(await getLoginLockStatus('a@b.co')).toEqual({
      locked: false,
      retryAfterSeconds: null,
    });
    // Failure counter restarted from zero.
    expect(await recordLoginFailure('a@b.co')).toBe(false);
  });
});

describe('createAuthUser', () => {
  beforeEach(() => {
    usersById.clear();
    userCreated.length = 0;
    updateOneCalls.length = 0;
  });

  it('creates a verified, non-anonymous user with auth defaults', async () => {
    const user = await createAuthUser({
      username: 'alice',
      email: 'Alice@Example.com',
      password_hash: 'hash',
    });
    expect(user.user_id).toMatch(/^[0-9a-f]{16}$/);
    expect(user.username).toBe('alice');
    expect(user.email).toBe('alice@example.com');
    expect(user.password_hash).toBe('hash');
    expect(user.email_verified_at).toBeInstanceOf(Date);
    expect(user.token_version).toBe(0);
    expect(user.trusted_devices).toEqual([]);
    expect(user.two_factor).toEqual({ enabled: false, recovery_codes_hash: [] });
    expect(user.trust_score).toBe(1.0);
    expect(user.is_admin).toBe(false);
    expect(user.legacy_anonymous).toBe(false);
    expect(userCreated).toHaveLength(1);
  });

  it('appends a random suffix when the short username collides', async () => {
    // Custom usernames keep their full lowercase name as the short
    // slot (lib/username.ts) — seed a collision on both slots.
    usersById.set('existing', {
      user_id: 'existing',
      short_username: 'alice',
      default_short: 'alice',
    });
    const user = await createAuthUser({
      username: 'alice',
      email: 'a@b.co',
      password_hash: 'hash',
    });
    expect(user.short_username).not.toBe('alice');
    expect(user.short_username).toMatch(/^alice[0-9a-f]{4}$/);
  });
});

describe('buildMeResponse', () => {
  beforeEach(() => {
    usersById.clear();
  });

  it('returns the /me shape with aggregated counts', async () => {
    usersById.set('u1', {
      user_id: 'u1',
      username: 'alice',
      custom_display_name: 'Alice B.',
      profile_image_url: 'https://img.example/a.png',
      bio: 'hello',
      links: { github: 'github.com/alice' },
      trust_level: 'scholar',
    });
    const me = await buildMeResponse({
      user_id: 'u1',
      username: 'alice',
      custom_display_name: 'Alice B.',
      trust_score: 9.5,
      created_at: new Date('2026-01-01T00:00:00Z'),
    });
    expect(me.username).toBe('Alice B.');
    expect(me.custom_display_name).toBe('Alice B.');
    expect(me.profile_image_url).toBe('https://img.example/a.png');
    expect(me.bio).toBe('hello');
    expect(me.links).toEqual({ github: 'github.com/alice' });
    expect(me.trust_score).toBe(9.5);
    expect(me.trust_level).toBe('scholar');
    expect(me.post_count).toBe(6);
    expect(me.posts_approved).toBe(3);
    expect(me.posts_rejected).toBe(1);
    expect(me.comment_count).toBe(7);
    expect(me.first_seen_at).toEqual(new Date('2026-01-01T00:00:00Z'));
  });

  it('falls back to the username and newbie tier', async () => {
    const me = await buildMeResponse({
      user_id: 'u9',
      username: 'bob',
      trust_score: 0,
    });
    expect(me.username).toBe('bob');
    expect(me.custom_display_name).toBeNull();
    expect(me.profile_image_url).toBeNull();
    expect(me.bio).toBe('');
    expect(me.links).toEqual({});
    expect(me.trust_level).toBe('newbie');
  });
});
