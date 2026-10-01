import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

vi.mock('../models/Post', () => ({
  Post: { find: vi.fn(), findOne: vi.fn(), findById: vi.fn(), findByIdAndUpdate: vi.fn(), create: vi.fn() },
  generateUniqueSlug: vi.fn(() => 'test-slug-abc123'),
}));

vi.mock('../models/ListItem', () => ({
  ListItem: { create: vi.fn() },
}));

vi.mock('../models/Category', () => ({
  Category: { findById: vi.fn(), findByIdAndUpdate: vi.fn(), findOne: vi.fn(() => ({ _id: 'cat123', slug: 'tech' })) },
}));

vi.mock('../models/Comment', () => ({}));

vi.mock('../lib/redis', () => ({
  atomicCheckRateLimit: vi.fn(),
}));

vi.mock('../lib/ladderSystem', () => ({
  getActiveBoost: vi.fn(() => null),
}));

vi.mock('../lib/titleSimilarityV2', () => ({
  findSimilarTitles: vi.fn(() => Promise.resolve([])),
}));

import { atomicCheckRateLimit } from '../lib/redis';
import postsRouter from '../routes/posts';

const SESSION_USER = {
  user_id: 'user-test-1',
  username: 'tester',
  custom_display_name: 'Tester',
  trust_score: 1.0,
  trust_locked: false,
  is_admin: false,
  restricted_until: null,
  rate_limit_override: null,
};

function createApp(session = false) {
  const app = express();
  app.use(express.json());

  app.use((req, _res, next) => {
    if (session) {
      req.user = SESSION_USER;
    }
    next();
  });

  app.use('/api/posts', postsRouter);
  return app;
}

const SUBMISSION_BODY = {
  title: 'Top 10 Test Post Title',
  post_type: 'top_list',
  intro: 'Test intro',
  category_slug: 'tech',
  items: [
    { rank: 1, title: 'Item 1', justification: 'Justification' },
    { rank: 2, title: 'Item 2', justification: 'Justification 2' },
    { rank: 3, title: 'Item 3', justification: 'Justification 3' },
  ],
};

describe('POST /api/posts — rate limit integrity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(atomicCheckRateLimit).mockResolvedValue({ allowed: true, remaining: 10 });
  });

  it('returns 401 when no session user is present', async () => {
    const res = await request(createApp(false))
      .post('/api/posts')
      .send(SUBMISSION_BODY);

    expect(res.status).toBe(401);
    expect(res.body.error).toContain('Sign in required');
  });

  it('rejects when rate limit exceeded', async () => {
    vi.mocked(atomicCheckRateLimit).mockResolvedValue({ allowed: false, remaining: 0 });

    const res = await request(createApp(true))
      .post('/api/posts')
      .send(SUBMISSION_BODY);

    expect(res.status).toBe(429);
    expect(res.body.error).toContain('Rate limit exceeded');
    expect(res.body.error).not.toContain('NaN');
  });
});
